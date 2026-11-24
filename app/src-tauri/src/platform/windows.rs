//! The Windows side of the boundary with the operating system (ADR-0132, `docs/plans/repo-structure-proposal.md`). Every call to Win32 that the
//! rest of the program makes is here; the code was moved from `lib.rs`, `ground.rs` and `picture.rs` **unchanged**. The contract (the names and
//! the meaning of each function) is in `mod.rs`; `macos.rs` has the same names.

use crate::ground::{class_ground, Ground};
use tauri::WebviewWindow;

// ---------------------------------------------------------------- the person: busy, idle, the primary button

/// The system's answer to "is the person in something full-screen, presenting, or away?" (a shell call, about once a second
/// from the hit-test thread, never from `focus_probe`).
pub fn busy_now() -> bool {
    use windows_sys::Win32::UI::Shell::SHQueryUserNotificationState;
    let mut st: i32 = 0;
    let hr = unsafe { SHQueryUserNotificationState(&mut st) };
    // 1 not present, 2 busy (fullscreen), 3 D3D fullscreen, 4 presentation mode
    hr >= 0 && (1..=4).contains(&st)
}

/// The raw state of the primary mouse button, the one the user clicks with (`GetAsyncKeyState`), 0 where it cannot be
/// read. The physical right button when Windows has the buttons swapped (see `layout::primary_button_vk`).
pub fn primary_button_raw() -> i16 {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_SWAPBUTTON};
    // SAFETY: plain queries of one system metric and one virtual-key code; no pointers.
    unsafe { GetAsyncKeyState(crate::layout::primary_button_vk(GetSystemMetrics(SM_SWAPBUTTON) != 0)) }
}

/// Milliseconds since the last user input (Windows: `GetLastInputInfo`). None on failure.
pub fn last_input_idle_ms() -> Option<u32> {
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    let mut li = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
    // SAFETY: `li` is a valid LASTINPUTINFO with its size set, as the call requires.
    if unsafe { GetLastInputInfo(&mut li) } == 0 {
        return None;
    }
    Some(crate::layout::idle_since(unsafe { GetTickCount() }, li.dwTime))
}

// ---------------------------------------------------------------- the program's own windows

/// Ask Windows for a 1 ms system timer while a flight runs (`begin`), and give it back after.
pub fn timer_period(begin: bool) {
    use windows_sys::Win32::Media::{timeBeginPeriod, timeEndPeriod};
    // SAFETY: plain calls with a period in ms; every begin is paired with an end.
    unsafe {
        if begin {
            timeBeginPeriod(1);
        } else {
            timeEndPeriod(1);
        }
    }
}

/// Where the pointer is, in physical pixels of the whole screen (`GetCursorPos`). One position, nothing else; None on failure.
pub fn pointer_pos() -> Option<(i32, i32)> {
    use windows_sys::Win32::Foundation::POINT;
    use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;
    let mut p = POINT { x: 0, y: 0 };
    // SAFETY: `p` is a valid POINT for the call to fill.
    if unsafe { GetCursorPos(&mut p) } == 0 {
        None
    } else {
        Some((p.x, p.y))
    }
}

/// The rectangle of one of the program's own windows (left, top, right, bottom, physical px), `None` when it is hidden or unknown. A cheap
/// call that does not go through the main thread, for the fine sampler of the pointer near Peak.
pub fn window_rect_of(hwnd: isize) -> Option<(i32, i32, i32, i32)> {
    use windows_sys::Win32::Foundation::RECT;
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetWindowRect, IsWindowVisible};
    let mut r = RECT { left: 0, top: 0, right: 0, bottom: 0 };
    // SAFETY: plain calls with the handle of the program's own window and a valid RECT; a stale handle makes them fail, not crash.
    unsafe {
        if IsWindowVisible(hwnd as _) == 0 || GetWindowRect(hwnd as _, &mut r) == 0 {
            return None;
        }
    }
    Some((r.left, r.top, r.right, r.bottom))
}

/// Sleep for `ms` milliseconds with a **high-resolution waitable timer of this thread** (Windows 10 1803 and later), so that a short, regular
/// period (8 ms for the pointer sampler) is kept without asking Windows for a finer system timer for the whole program (`timer_period` does
/// that, and costs more: every wait of the program then ticks faster). Falls back to an ordinary sleep when the timer cannot be made.
pub fn precise_sleep(ms: u64) {
    use std::cell::Cell;
    use windows_sys::Win32::System::Threading::{
        CreateWaitableTimerExW, SetWaitableTimer, WaitForSingleObject, CREATE_WAITABLE_TIMER_HIGH_RESOLUTION, INFINITE, TIMER_ALL_ACCESS,
    };
    thread_local! {
        static TIMER: Cell<isize> = const { Cell::new(0) };
    }
    TIMER.with(|c| {
        if c.get() == 0 {
            // SAFETY: no pointers but two nulls (default security, no name); the handle lives as long as the thread, which is the program.
            let h = unsafe { CreateWaitableTimerExW(std::ptr::null(), std::ptr::null(), CREATE_WAITABLE_TIMER_HIGH_RESOLUTION, TIMER_ALL_ACCESS) };
            c.set(if h.is_null() { -1 } else { h as isize });
        }
        let h = c.get();
        if h > 0 {
            let due: i64 = -((ms as i64) * 10_000); // relative, in 100 ns units
            // SAFETY: `due` outlives the call; no completion routine; the handle is this thread's own timer.
            unsafe {
                if SetWaitableTimer(h as _, &due, 0, None, std::ptr::null(), 0) != 0 {
                    WaitForSingleObject(h as _, INFINITE);
                    return;
                }
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(ms));
    });
}

/// Show a window without making it the active one (`SW_SHOWNOACTIVATE`), so that Peak reappearing by itself never takes
/// the keyboard focus. If the call fails, it is an ordinary `show`.
/// Hide a window with the system call (`SW_HIDE`). A window shown by `show_without_activating` is shown behind the back of the window library, whose own
/// flag still says hidden, so its `hide` does nothing (found in DU-12: Peak was sent in and stayed on the screen). The pair must be the same kind of call.
pub fn hide_window(win: &WebviewWindow) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_HIDE};
    if let Ok(hwnd) = win.hwnd() {
        // SAFETY: a plain call with the window handle of our own window; no pointers are passed.
        unsafe { ShowWindow(hwnd.0 as _, SW_HIDE) };
        return;
    }
    let _ = win.hide();
}

pub fn show_without_activating(win: &WebviewWindow) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
    if let Ok(hwnd) = win.hwnd() {
        // SAFETY: a plain call with the window handle of our own window; no pointers are passed.
        unsafe { ShowWindow(hwnd.0 as _, SW_SHOWNOACTIVATE) };
        return;
    }
    let _ = win.show();
}

// ---------------------------------------------------------------- what is under and over the cat (moved from ground.rs)

/// The topmost visible, enabled, non-click-through window at a physical point, as the system's handle (0: the desktop
/// window itself or none). Windows the system hides ("cloaked", as a suspended Store app) are skipped.
fn hit_window(x: i32, y: i32) -> isize {
    use windows_sys::Win32::Foundation::{HWND, POINT};
    use windows_sys::Win32::Graphics::Dwm::{DWMWA_CLOAKED, DwmGetWindowAttribute};
    use windows_sys::Win32::UI::WindowsAndMessaging::{CWP_SKIPDISABLED, CWP_SKIPINVISIBLE, CWP_SKIPTRANSPARENT, ChildWindowFromPointEx, GW_HWNDNEXT, GetDesktopWindow, GetWindow};
    // SAFETY: plain queries with handles the system gave us.
    unsafe {
        let desktop = GetDesktopWindow();
        let mut hwnd: HWND = ChildWindowFromPointEx(desktop, POINT { x, y }, CWP_SKIPINVISIBLE | CWP_SKIPDISABLED | CWP_SKIPTRANSPARENT);
        let mut guard = 0;
        while !hwnd.is_null() && hwnd != desktop {
            let mut cloaked: u32 = 0;
            let hr = DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED as u32, &mut cloaked as *mut u32 as *mut core::ffi::c_void, 4);
            if hr != 0 || cloaked == 0 {
                break;
            }
            guard += 1;
            hwnd = GetWindow(hwnd, GW_HWNDNEXT);
            if guard > 32 || hwnd.is_null() {
                return 0;
            }
        }
        if hwnd == desktop { 0 } else { hwnd as isize }
    }
}

/// The kind of thing at a physical point of the screen.
pub fn ground_of_point(x: i32, y: i32) -> Ground {
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::System::Threading::GetCurrentProcessId;
    use windows_sys::Win32::UI::WindowsAndMessaging::{GA_ROOT, GetAncestor, GetClassNameW, GetForegroundWindow, GetWindowThreadProcessId};
    let h = hit_window(x, y);
    if h == 0 {
        return Ground::Desktop; // the desktop window itself: nothing in front of the wallpaper
    }
    let hwnd = h as HWND;
    // SAFETY: plain queries with a handle the system gave us; the buffer is valid for the size passed.
    unsafe {
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == GetCurrentProcessId() {
            return Ground::Own;
        }
        let mut buf = [0u16; 64];
        let n = GetClassNameW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
        let class = if n > 0 { String::from_utf16_lossy(&buf[..n as usize]) } else { String::new() };
        if let Some(g) = class_ground(&class) {
            return g; // the class string is dropped here: only the kind is kept
        }
        let front = GetAncestor(GetForegroundWindow(), GA_ROOT);
        if !front.is_null() && GetAncestor(hwnd, GA_ROOT) == front { Ground::Foreground } else { Ground::App }
    }
}

/// An opaque number for the ordinary window at a point (0 when it is the desktop, the taskbar, Peak's own window or
/// nothing). It says only "the same window as before?"; nothing about the window is read, and the page keeps it just to
/// compare it with the next one.
pub fn window_id_at(x: i32, y: i32) -> u64 {
    match ground_of_point(x, y) {
        Ground::App | Ground::Foreground => {
            use windows_sys::Win32::Foundation::HWND;
            use windows_sys::Win32::UI::WindowsAndMessaging::{GA_ROOT, GetAncestor};
            // SAFETY: a plain query with a handle the system gave us.
            unsafe { GetAncestor(hit_window(x, y) as HWND, GA_ROOT) as usize as u64 }
        }
        _ => 0,
    }
}

/// Is that window still there and still under that point: it exists, is shown (not minimized, not hidden by the
/// system) and its rectangle holds the point. A closed, minimized or dragged-away window says no; another window raised
/// over it does not.
pub fn window_holds(id: u64, x: i32, y: i32) -> bool {
    use windows_sys::Win32::Foundation::{HWND, RECT};
    use windows_sys::Win32::Graphics::Dwm::{DWMWA_CLOAKED, DwmGetWindowAttribute};
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetWindowRect, IsIconic, IsWindow, IsWindowVisible};
    let hwnd = id as usize as HWND;
    // SAFETY: plain queries; a stale handle only makes `IsWindow` say no.
    unsafe {
        if IsWindow(hwnd) == 0 || IsWindowVisible(hwnd) == 0 || IsIconic(hwnd) != 0 {
            return false;
        }
        let mut cloaked: u32 = 0;
        if DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED as u32, &mut cloaked as *mut u32 as *mut core::ffi::c_void, 4) == 0 && cloaked != 0 {
            return false;
        }
        let mut r = RECT { left: 0, top: 0, right: 0, bottom: 0 };
        GetWindowRect(hwnd, &mut r) != 0 && x >= r.left && x < r.right && y >= r.top && y < r.bottom
    }
}

/// A window that is in front of Peak at a point and that Peak cannot be raised over: the Start menu, Search and the like sit in
/// a higher layer than an always-on-top window, so they hide the cat. Found by asking what is at the point (the system's answer
/// skips Peak, it is click-through): an always-on-top window that is not ours, not the desktop and not the taskbar, and that is
/// **not** below Peak in the stacking order (the windows of the higher layers do not appear in it at all, a window of the same
/// layer that is below Peak does). Nothing about the window is read but that one is there.
pub fn cover_at(own: isize, x: i32, y: i32) -> bool {
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::System::Threading::GetCurrentProcessId;
    use windows_sys::Win32::UI::WindowsAndMessaging::{GA_ROOT, GW_HWNDNEXT, GWL_EXSTYLE, GetAncestor, GetClassNameW, GetWindow, GetWindowLongW, GetWindowThreadProcessId, WS_EX_TOPMOST};
    let h = hit_window(x, y);
    if h == 0 {
        return false;
    }
    // SAFETY: plain queries with handles the system gave us; the buffer is valid for the size passed.
    unsafe {
        let top = GetAncestor(h as HWND, GA_ROOT);
        if top.is_null() {
            return false;
        }
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(top, &mut pid);
        if pid == GetCurrentProcessId() {
            return false;
        }
        let mut buf = [0u16; 64];
        let n = GetClassNameW(top, buf.as_mut_ptr(), buf.len() as i32);
        let class = if n > 0 { String::from_utf16_lossy(&buf[..n as usize]) } else { String::new() };
        if class_ground(&class).is_some() {
            return false;
        }
        if (GetWindowLongW(top, GWL_EXSTYLE) as u32) & WS_EX_TOPMOST == 0 {
            return false; // an ordinary window cannot be in front of an always-on-top one
        }
        let mut w = GetWindow(own as HWND, GW_HWNDNEXT);
        let mut guard = 0;
        while !w.is_null() && guard < 800 {
            if w == top {
                return false; // below Peak
            }
            w = GetWindow(w, GW_HWNDNEXT);
            guard += 1;
        }
        true
    }
}

/// Raise Peak's window to the top of the always-on-top layer (over a window of its own layer that came later).
pub fn raise_own(own: isize) {
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::UI::WindowsAndMessaging::{HWND_TOPMOST, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SetWindowPos};
    // SAFETY: a plain call with the handle of our own window.
    unsafe {
        SetWindowPos(own as HWND, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
}

// ---------------------------------------------------------------- the picture of the screen (moved from picture.rs)

/// `include_layered`: also take the layered windows (`CAPTUREBLT`). Only the diagnostic test below uses it, to find out whether Peak's own
/// transparent windows are in the picture or not.
#[cfg(windows)]
pub fn capture_gray_with(x: i32, y: i32, w: i32, h: i32, gw: u32, gh: u32, include_layered: bool) -> Option<Vec<u8>> {
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, ReleaseDC, SelectObject, SetBrushOrgEx,
        SetStretchBltMode, StretchBlt, CAPTUREBLT, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HALFTONE, SRCCOPY,
    };
    if w < 16 || h < 16 || gw == 0 || gh == 0 {
        return None;
    }
    unsafe {
        let screen = GetDC(null_mut());
        if screen.is_null() {
            return None;
        }
        let mem = CreateCompatibleDC(screen);
        let bmp = CreateCompatibleBitmap(screen, gw as i32, gh as i32);
        let mut out = None;
        if !mem.is_null() && !bmp.is_null() {
            let old = SelectObject(mem, bmp as _);
            SetStretchBltMode(mem, HALFTONE as _);
            SetBrushOrgEx(mem, 0, 0, null_mut());
            let rop = if include_layered { SRCCOPY | CAPTUREBLT } else { SRCCOPY };
            let ok = StretchBlt(mem, 0, 0, gw as i32, gh as i32, screen, x, y, w, h, rop);
            let mut info: BITMAPINFO = std::mem::zeroed();
            info.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
            info.bmiHeader.biWidth = gw as i32;
            info.bmiHeader.biHeight = -(gh as i32); // top-down
            info.bmiHeader.biPlanes = 1;
            info.bmiHeader.biBitCount = 32;
            info.bmiHeader.biCompression = BI_RGB;
            let mut buf = vec![0u8; (gw * gh * 4) as usize];
            let lines = GetDIBits(mem, bmp, 0, gh, buf.as_mut_ptr() as _, &mut info, DIB_RGB_COLORS);
            if ok != 0 && lines != 0 {
                out = Some(crate::picture::gray_from_bgra(&buf));
            }
            SelectObject(mem, old);
        }
        if !bmp.is_null() {
            DeleteObject(bmp as _);
        }
        if !mem.is_null() {
            DeleteDC(mem);
        }
        ReleaseDC(null_mut(), screen);
        let _ = null::<u8>();
        out
    }
}

/// Take Peak's own windows out of any capture (`WDA_EXCLUDEFROMCAPTURE`) or put them back (`WDA_NONE`). Found on 2026-11-15: a transparent
/// window of ours is **in** the usual picture (the terrain overlay saw its own tints and lines), so the windows are left out for the moment
/// of the capture only; they stay visible on the monitor all the time. Windows 10 version 2004 or later; a failure changes nothing.
/// Returns `None` when **every** window accepted the change, else the system error code of the first one that did not. Before Windows 10 version 2004 the call is refused for 0x11: the windows then stay in
/// the picture, and the caller must not use it (a cat that sees its own body would find itself covering the screen everywhere, PS-10).
#[cfg(windows)]
pub fn set_capture_exclusion(hwnds: &[isize], exclude: bool) -> Option<u32> {
    use windows_sys::Win32::Foundation::GetLastError;
    use windows_sys::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity;
    let mut first_error = None;
    for &h in hwnds {
        let ok = unsafe { SetWindowDisplayAffinity(h as _, if exclude { 0x11 } else { 0 }) };
        if ok == 0 && first_error.is_none() {
            first_error = Some(unsafe { GetLastError() });
        }
    }
    first_error
}
