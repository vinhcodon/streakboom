# Issue 14: every window that is shown and hidden must be shown and hidden by the same kind of call. This script drives a
# test build with the real mouse and keyboard and records, for the pet's own windows only, whether each one is shown,
# hidden and shown again, and where the keyboard is.
#
# What it checks (one line per observation, PASS/FAIL/INFO, into the log and the console):
#   A. passive bubble (a poke), three times on the same window before the 45 s destroy: shown, hidden by its own timer,
#      shown again; it never becomes the foreground window and the window that had the keyboard keeps it
#   B. interactive bubble (a double click), twice on the same window: shown, takes the keyboard (typed letters reach it),
#      Esc hides it, shown again
#   C. destroy and recreate: after 47 s hidden the bubble window is gone; a poke makes a new one, shown, never foreground
#   D. tray round trip, with the overlay following Peak: tray click hides Peak and the overlay, a second click shows both
#   E. "go away" (Luon di) with STREAKBOOM_AWAY_SECS=5: Peak and the overlay hide, come back, then the tray hides and
#      shows both again (the bug of issue 14)
#
# Setup (nothing of the person's own Peak is touched):
#   - a build with a test identifier, so its data folder is %APPDATA%\com.streakboom.i14test, not Stable's:
#       npm run tauri build -- --no-bundle --features terrain-overlay --config <file with {"identifier":"com.streakboom.i14test"}>
#     (`terrain-overlay` makes the overlay reachable in a Stable-numbered build; STREAKBOOM_DEV_OVERLAY=1 opens it)
#   - a pet.json in that data folder whose first-run introduction is done (-Seed copies one there if the folder has none), no key
#   - one monitor; the tray icon on the taskbar or in the hidden-icons flyout (the script opens the flyout if needed)
#   - no other streakboom.exe running: the script refuses to start if one is, and stops only the process it started
# Run from a normal PowerShell on the desktop (an agent's sandboxed shell may see a private AppData):
#   powershell -ExecutionPolicy Bypass -File scripts\windows\issue14-window-pairs.ps1 -Exe <path to the test build> -Out <folder>
# It clicks and types only in the program under test and in its own small form.
param(
    [Parameter(Mandatory = $true)][string]$Exe,
    [string]$Out = (Join-Path $env:TEMP "issue14-run"),
    [string]$Seed = "" # a pet.json whose introduction is done; copied into the test data folder only if that folder has none
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, UIAutomationClient, UIAutomationTypes
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class W {
    public delegate bool EnumProc(IntPtr h, IntPtr p);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr p);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, uint d, UIntPtr e);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint flags);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [StructLayout(LayoutKind.Sequential)] public struct NOTIFYICONIDENTIFIER { public uint cbSize; public IntPtr hWnd; public uint uID; public Guid guidItem; }
    [DllImport("shell32.dll")] public static extern int Shell_NotifyIconGetRect(ref NOTIFYICONIDENTIFIER id, out RECT r);
    public static bool IconRect(IntPtr owner, out RECT r) {
        r = new RECT();
        for (uint id = 0; id < 32; id++) {
            var n = new NOTIFYICONIDENTIFIER(); n.cbSize = (uint)Marshal.SizeOf(n); n.hWnd = owner; n.uID = id;
            if (Shell_NotifyIconGetRect(ref n, out r) == 0) return true;
        }
        return false;
    }
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
    public static bool OverflowOpen() { var h = FindWindow("NotifyIconOverflowWindow", null); return h != IntPtr.Zero && IsWindowVisible(h); }
    public static string Class(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
    public static List<IntPtr> Of(uint pid) {
        var list = new List<IntPtr>();
        EnumWindows((h, p) => { uint q; GetWindowThreadProcessId(h, out q); if (q == pid) list.Add(h); return true; }, IntPtr.Zero);
        return list;
    }
    public static string Title(IntPtr h) { var s = new StringBuilder(256); GetWindowText(h, s, 256); return s.ToString(); }
    public static uint Pid(IntPtr h) { uint q; GetWindowThreadProcessId(h, out q); return q; }
    public static void Click(int x, int y, bool dbl) {
        SetCursorPos(x, y);
        System.Threading.Thread.Sleep(60);
        mouse_event(2, 0, 0, 0, UIntPtr.Zero); mouse_event(4, 0, 0, 0, UIntPtr.Zero);
        if (dbl) { System.Threading.Thread.Sleep(90); mouse_event(2, 0, 0, 0, UIntPtr.Zero); mouse_event(4, 0, 0, 0, UIntPtr.Zero); }
    }
}
"@

[W]::SetProcessDPIAware() | Out-Null # every coordinate below is in physical pixels (window rects, the cursor, the tray)
New-Item -ItemType Directory -Force $Out | Out-Null
$log = Join-Path $Out "issue14-log.txt"
"" | Set-Content -Encoding utf8 $log
$script:fails = 0
function Note([string]$kind, [string]$text) {
    $line = "{0} {1,-4} {2}" -f (Get-Date -Format "HH:mm:ss.fff"), $kind, $text
    if ($kind -eq "FAIL") { $script:fails++ }
    Write-Host $line
    Add-Content -Encoding utf8 $log $line
}
function Check([bool]$ok, [string]$text) { if ($ok) { Note "PASS" $text } else { Note "FAIL" $text } }

$exeName = [System.IO.Path]::GetFileNameWithoutExtension($Exe)
if (Get-Process streakboom, $exeName -ErrorAction SilentlyContinue) { throw "a streakboom.exe or $exeName.exe is already running; close it first (this script stops only what it starts)" }
$data = Join-Path $env:APPDATA "com.streakboom.i14test"
if (-not (Test-Path (Join-Path $data "pet.json"))) {
    if ($Seed -eq "" -or -not (Test-Path $Seed)) { throw "no pet.json in $data; pass -Seed or see Setup" }
    New-Item -ItemType Directory -Force $data | Out-Null
    Copy-Item $Seed (Join-Path $data "pet.json")
    Write-Host "seeded $data from $Seed"
}
$sha = (& git -C (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) rev-parse HEAD 2>$null)
$exeInfo = Get-Item $Exe
Note "INFO" ("exe {0} ({1} bytes, written {2}); checkout HEAD {3}" -f $exeInfo.FullName, $exeInfo.Length, $exeInfo.LastWriteTime.ToString("s"), $sha)
Note "INFO" ("screen {0}; data folder {1}" -f [System.Windows.Forms.Screen]::PrimaryScreen.Bounds, $data)

# The script's own form: it holds the keyboard for the passive checks and catches the letters typed while it has it.
$form = New-Object System.Windows.Forms.Form
$form.Text = "issue14 harness"; $form.StartPosition = "Manual"; $form.Location = New-Object System.Drawing.Point(20, 20)
$form.Size = New-Object System.Drawing.Size(320, 110); $form.TopMost = $true
$box = New-Object System.Windows.Forms.TextBox; $box.Dock = "Fill"; $box.Multiline = $true; $form.Controls.Add($box)
$form.Show(); [System.Windows.Forms.Application]::DoEvents()
$formH = $form.Handle
function Pump([int]$ms) { $end = (Get-Date).AddMilliseconds($ms); while ((Get-Date) -lt $end) { [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 20 } }
function FocusForm { $c = [System.Drawing.Rectangle]::new($form.Left, $form.Top, $form.Width, $form.Height); [W]::Click($c.X + 160, $c.Y + 70, $false); Pump 300; $box.Focus() | Out-Null; Pump 100 }

$env:STREAKBOOM_AWAY_SECS = "5"
$env:STREAKBOOM_DEV_OVERLAY = "1"
$proc = Start-Process $Exe -PassThru
Note "INFO" "started pid $($proc.Id) with STREAKBOOM_AWAY_SECS=5 STREAKBOOM_DEV_OVERLAY=1"
Pump 9000

function Wins { [W]::Of([uint32]$proc.Id) | ForEach-Object { [pscustomobject]@{ H = $_; Title = [W]::Title($_); Vis = [W]::IsWindowVisible($_) } } }
function Width($h) { $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null; $r.R - $r.L }
# Peak's window is small (200 logical px); the overlay covers the work area; the bubble has its own title
function Main { Wins | Where-Object { $_.Title -eq "Streakboom" -and (Width $_.H) -lt 600 } | Select-Object -First 1 }
function Bubble { Wins | Where-Object { $_.Title -eq "Streakboom bubble" } | Select-Object -First 1 }
function Overlay { Wins | Where-Object { $_.Title -ne "Streakboom bubble" -and $_.Title -ne "" -and (Width $_.H) -ge 800 } | Select-Object -First 1 }
function Fg { $h = [W]::GetForegroundWindow(); $t = [W]::Title($h); "{0}:{1}" -f $h, $(if ([W]::Pid($h) -eq $proc.Id) { "pet/$t" } elseif ($h -eq $formH) { "harness" } else { "other" }) }
function PeakCenter { $m = Main; $r = New-Object W+RECT; [W]::GetWindowRect($m.H, [ref]$r) | Out-Null; [pscustomobject]@{ X = [int](($r.L + $r.R) / 2); Y = [int]($r.T + ($r.B - $r.T) * 0.62) } }
# A poke speaks at most every 3 s and not every poke finds a line: poke up to three times until the bubble shows.
function Poke([string]$label) {
    foreach ($try in 1..3) {
        $p = PeakCenter
        [W]::Click($p.X, $p.Y, $false)
        $script:afterClick = Fg
        if (WaitFor { $b = Bubble; $b -and $b.Vis } 2500) { if ($try -gt 1) { Note "INFO" "$label the bubble came at poke $try" }; return $true }
        Pump 1200
    }
    return $false
}
function WaitFor([scriptblock]$cond, [int]$ms) { $end = (Get-Date).AddMilliseconds($ms); while ((Get-Date) -lt $end) { if (& $cond) { return $true }; Pump 50 }; return [bool](& $cond) }

$m = Main
Check ($null -ne $m -and $m.Vis) "Peak's window is shown at start"
WaitFor { $null -ne (Overlay) } 8000 | Out-Null
$ov = Overlay
Note "INFO" ("overlay window: {0}" -f $(if ($ov) { "$($ov.H) '$($ov.Title)' visible=$($ov.Vis)" } else { "not found" }))
Note "INFO" ("all windows of the pet: " + ((Wins | ForEach-Object { "$($_.H)'$($_.Title)'v=$($_.Vis)" }) -join ", "))

# ---------------------------------------------------------------- A. passive bubble, three cycles on one window
$firstBubble = $null
foreach ($i in 1..3) {
    FocusForm
    $before = Fg
    $shown = Poke "A$i"
    $afterClick = $script:afterClick
    $b = Bubble
    $fgShown = Fg
    Check $shown "A$i passive bubble shown after a poke"
    if ($b) {
        if (-not $firstBubble) { $firstBubble = $b.H }
        Check ($b.H -eq $firstBubble) "A$i same bubble window as the first cycle ($($b.H))"
        Check ([W]::GetForegroundWindow() -ne $b.H) "A$i the passive bubble is not the foreground window (before click: $before; after click: $afterClick; after shown: $fgShown)"
        Check ($fgShown -eq $afterClick) "A$i the foreground did not change when the bubble appeared"
    }
    $hidden = WaitFor { $b = Bubble; -not ($b -and $b.Vis) } 15000
    Check $hidden "A$i passive bubble hidden by its own timer"
    Pump 3300 # the poke speaks at most every 3 s
}
# keys while a passive bubble shows: the harness takes the keyboard, a poke shows the bubble, then the harness gets it back
# by a click on itself and letters are typed; they must arrive in the harness and the bubble must stay passive
FocusForm; $box.Text = ""
$shown = Poke "A4"
FocusForm
if ($shown -and [W]::GetForegroundWindow() -eq $formH) {
    [System.Windows.Forms.SendKeys]::SendWait("passive"); Pump 300
    $b = Bubble
    Check ($box.Text -eq "passive") "A4 letters typed while a passive bubble shows reach the harness ('$($box.Text)')"
    Check ($b -and $b.Vis -and [W]::GetForegroundWindow() -ne $b.H) "A4 the passive bubble is still shown and still not foreground"
} else { Note "INFO" "A4 not measured (bubble shown=$shown, foreground $(Fg))" }
WaitFor { $b = Bubble; -not ($b -and $b.Vis) } 15000 | Out-Null
Pump 3300

# ---------------------------------------------------------------- B. interactive bubble, two cycles on one window
foreach ($i in 1..2) {
    $p = PeakCenter
    [W]::Click($p.X, $p.Y, $true)
    $shown = WaitFor { $b = Bubble; $b -and $b.Vis } 4000
    Pump 700
    $b = Bubble
    Check $shown "B$i interactive bubble shown after a double click"
    if ($b) {
        Check ($b.H -eq $firstBubble) "B$i same bubble window as in A ($($b.H))"
        $fg = [W]::GetForegroundWindow()
        Check ($fg -eq $b.H -or [W]::GetAncestor($fg, 2) -eq $b.H) "B$i the interactive bubble took the keyboard (foreground $(Fg))"
        if ($fg -eq $b.H -or [W]::GetAncestor($fg, 2) -eq $b.H) {
            [System.Windows.Forms.SendKeys]::SendWait("hi"); Pump 300
            Note "INFO" "B$i typed 'hi' into the bubble (only into the pet's own window)"
            [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
        }
    }
    $hidden = WaitFor { $b = Bubble; -not ($b -and $b.Vis) } 5000
    Check $hidden "B$i interactive bubble hidden after Esc"
    Pump 1500
}

# ---------------------------------------------------------------- C. destroy and recreate
Note "INFO" "C waiting 47 s with the bubble hidden (destroy after 45 s)"
FocusForm
Pump 47000
$b = Bubble
Check ($null -eq $b -and -not [W]::IsWindow($firstBubble)) "C the unused bubble window was destroyed"
FocusForm
$shown = Poke "C"
$afterClick = $script:afterClick
$b = Bubble
Check $shown "C a new bubble window is made and shown by a poke"
if ($b) {
    Check ($b.H -ne $firstBubble) "C it is a new window ($($b.H))"
    Check ([W]::GetForegroundWindow() -ne $b.H) "C the recreated passive bubble is not foreground (after click $afterClick, now $(Fg))"
}
WaitFor { $b = Bubble; -not ($b -and $b.Vis) } 15000 | Out-Null

# ---------------------------------------------------------------- D and E. tray and overlay
# The tray icon is clicked with the real mouse at the rectangle the shell gives for it (Shell_NotifyIconGetRect, keyed by the
# program's own tray window, class tray_icon_app). When the icon sits in the hidden-icons flyout, the script first opens the
# flyout with the taskbar's chevron: that is the only click outside the program, and only to reach the program's own icon.
function OnTaskbar($r) { $tb = [System.Windows.Forms.Screen]::PrimaryScreen; ($r.T -ge $tb.WorkingArea.Bottom) -and ($r.R - $r.L) -gt 0 }
function TrayClick([string]$label) {
    $tw = [W]::Of([uint32]$proc.Id) | Where-Object { [W]::Class($_) -eq "tray_icon_app" } | Select-Object -First 1
    if (-not $tw) { Note "FAIL" "$label the program's tray window was not found"; return }
    $r = New-Object W+RECT
    $ok = [W]::IconRect($tw, [ref]$r)
    $how = "on the taskbar"
    $chev = $null
    if ([W]::OverflowOpen()) { $how = "in the hidden-icons flyout (already open)" }
    elseif (-not $ok -or -not (OnTaskbar $r)) {
        $root = [System.Windows.Automation.AutomationElement]::RootElement
        $tray = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, "Shell_TrayWnd")))
        $notify = $tray.FindFirst([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, "TrayNotifyWnd")))
        $chev = $notify.FindFirst([System.Windows.Automation.TreeScope]::Children, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, "Button")))
        if (-not $chev) { Note "FAIL" "$label the icon is hidden and the flyout chevron was not found"; return }
        $c = $chev.Current.BoundingRectangle
        [W]::Click([int]($c.X + $c.Width / 2), [int]($c.Y + $c.Height / 2), $false)
        Pump 800
        $ok = [W]::IconRect($tw, [ref]$r)
        $how = "in the hidden-icons flyout (opened with the chevron)"
    }
    if (-not $ok) { Note "FAIL" "$label the shell gave no rectangle for the tray icon"; return }
    [W]::Click([int](($r.L + $r.R) / 2), [int](($r.T + $r.B) / 2), $false)
    Note "INFO" "$label real click on the tray icon $how at ($($r.L),$($r.T))-($($r.R),$($r.B))"
    Pump 1500
    if ([W]::OverflowOpen() -and $chev) { # close the flyout again with the same chevron, so the next step starts as this one did
        $c = $chev.Current.BoundingRectangle
        [W]::Click([int]($c.X + $c.Width / 2), [int]($c.Y + $c.Height / 2), $false)
        Pump 600
    }
}
function State([string]$label) {
    $m = Main; $o = Overlay
    Note "INFO" ("{0}: main visible={1}; overlay visible={2}" -f $label, $m.Vis, $(if ($o) { $o.Vis } else { "n/a" }))
    [pscustomobject]@{ Main = [bool]$m.Vis; Ov = $(if ($o) { [bool]$o.Vis } else { $null }) }
}
TrayClick "D1"; $s = State "D1 after tray click 1"
Check (-not $s.Main) "D1 the tray hides Peak"; if ($null -ne $s.Ov) { Check (-not $s.Ov) "D1 the overlay hides with Peak" }
TrayClick "D2"; $s = State "D2 after tray click 2"
Check $s.Main "D2 the tray shows Peak again"; if ($null -ne $s.Ov) { Check $s.Ov "D2 the overlay shows with Peak" }

# E. go away and come back, then the tray (one retry if Peak did not leave, with the reason from the test data's leave trace)
function GoAway([string]$label) {
    Pump 1500
    $p = PeakCenter
    [W]::Click($p.X, $p.Y, $true)
    $shown = WaitFor { $b = Bubble; $b -and $b.Vis } 4000
    Pump 900
    $b = Bubble; $fg = [W]::GetForegroundWindow()
    if ($shown -and ($fg -eq $b.H -or [W]::GetAncestor($fg, 2) -eq $b.H)) {
        [System.Windows.Forms.SendKeys]::SendWait("go away"); Pump 300
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        Note "INFO" "$label typed 'go away' + Enter into the bubble"
    } else { Note "INFO" "$label the chat input did not take the keyboard (foreground $(Fg))" }
    WaitFor { $m = Main; -not $m.Vis } 30000
}
$left = GoAway "E"
if (-not $left) {
    $trace = Join-Path $data "leave-trace.log"
    if (Test-Path $trace) { Note "INFO" ("E leave trace, last lines: " + ((Get-Content $trace -Tail 4) -join " | ")) }
    Pump 3000
    $left = GoAway "E retry"
}
$s = State "E after leaving"
Check $left "E Peak left (window hidden)"; if ($null -ne $s.Ov) { Check (-not $s.Ov) "E the overlay hid while Peak is away" }
$back = WaitFor { $m = Main; $m.Vis } 60000
Pump 2500
$s = State "E after coming back"
Check $back "E Peak came back (window shown)"; if ($null -ne $s.Ov) { Check $s.Ov "E the overlay is shown again" }
TrayClick "E1"; $s = State "E1 tray click after the return"
Check (-not $s.Main) "E1 the tray hides Peak after Luon di (issue 14)"; if ($null -ne $s.Ov) { Check (-not $s.Ov) "E1 the overlay hides with it" }
TrayClick "E2"; $s = State "E2 second tray click"
Check $s.Main "E2 the tray shows Peak again"; if ($null -ne $s.Ov) { Check $s.Ov "E2 the overlay shows with it" }

Note "INFO" ("done: {0} FAIL" -f $script:fails)
Stop-Process -Id $proc.Id -Force
$form.Close()
Note "INFO" "stopped pid $($proc.Id); log $log"
