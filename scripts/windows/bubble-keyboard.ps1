# The bubble and the keyboard (B1, ADR-0173, issue 13): a test-only harness, separate from the product code.
# It replaces the retired probe-b1.ps1, whose first press could pass through the pet's click-through window to whatever lay beneath:
# every press here is made only after the pet's window is seen to take the cursor at that point (not click-through, and the window under
# the cursor is the pet's), and checked again before the second press of a double click. Keys are sent only while a window of the program
# under test or this script's own form has the keyboard. A cycle is judged by the bubble's own report (bubble-trace.log: the interactive
# fit and whether the keyboard was read back as taken), the window shown (IsWindowVisible) and a readback of the typed text, never by the
# foreground alone.
#
# Needs a test build (the terrain-overlay feature, so the trace is written), test data in com.streakboom.i14test, no key, no other
# streakboom.exe running. Run: powershell -File bubble-keyboard.ps1 -Exe <exe> -Out <folder> -Plan A|B|C [-Seed <pet.json>]
#   A (experiment off): three chats each after Esc, two chats over a speech line, two chats opened while this script's form takes the
#     keyboard back (Windows should refuse it), three speech lines while the form has the keyboard.
#   B (experiment off): a chat hidden by its own timeout then opened again (twice), and a chat after the window was destroyed and made again.
#   C (experiment on, canned replies): three speech lines while the form has the keyboard, and two double clicks that open the chat box.
param([Parameter(Mandatory = $true)][string]$Exe, [Parameter(Mandatory = $true)][string]$Out, [Parameter(Mandatory = $true)][ValidateSet("A", "B", "C")][string]$Plan, [string]$Seed = "")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, UIAutomationClient, UIAutomationTypes
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class W {
    public delegate bool EnumProc(IntPtr h, IntPtr p);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr p);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, uint d, UIntPtr e);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint flags);
    [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT p);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int i);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    public static List<IntPtr> Of(uint pid) {
        var list = new List<IntPtr>();
        EnumWindows((h, p) => { uint q; GetWindowThreadProcessId(h, out q); if (q == pid) list.Add(h); return true; }, IntPtr.Zero);
        return list;
    }
    public static string Title(IntPtr h) { var s = new StringBuilder(256); GetWindowText(h, s, 256); return s.ToString(); }
    public static uint Pid(IntPtr h) { uint q; GetWindowThreadProcessId(h, out q); return q; }
    public static IntPtr RootAt(int x, int y) { var p = new POINT(); p.X = x; p.Y = y; return GetAncestor(WindowFromPoint(p), 2); }
    public static void Press() { mouse_event(2, 0, 0, 0, UIntPtr.Zero); mouse_event(4, 0, 0, 0, UIntPtr.Zero); }
}
"@
[W]::SetProcessDPIAware() | Out-Null
New-Item -ItemType Directory -Force $Out | Out-Null
$log = Join-Path $Out "bubble-keyboard-log.txt"
"" | Set-Content -Encoding utf8 $log
$script:fails = 0; $script:passes = 0
function Note([string]$kind, [string]$text) {
    $line = "{0} {1,-4} {2}" -f (Get-Date -Format "HH:mm:ss.fff"), $kind, $text
    if ($kind -eq "FAIL") { $script:fails++ } elseif ($kind -eq "PASS") { $script:passes++ }
    Write-Host $line
    Add-Content -Encoding utf8 $log $line
}
function Check([bool]$ok, [string]$text) { if ($ok) { Note "PASS" $text } else { Note "FAIL" $text } }
function NowMs { [DateTimeOffset]::Now.ToUnixTimeMilliseconds() }

$exeName = [System.IO.Path]::GetFileNameWithoutExtension($Exe)
if (Get-Process streakboom, $exeName -ErrorAction SilentlyContinue) { throw "a streakboom.exe or $exeName.exe is already running; close it first (this script stops only what it starts)" }
$data = Join-Path $env:APPDATA "com.streakboom.i14test"
if (-not (Test-Path (Join-Path $data "pet.json"))) {
    if ($Seed -eq "" -or -not (Test-Path $Seed)) { throw "no pet.json in $data; pass -Seed" }
    New-Item -ItemType Directory -Force $data | Out-Null
    Copy-Item $Seed (Join-Path $data "pet.json")
}
$trace = Join-Path $data "bubble-trace.log"
Note "INFO" ("plan {0}; exe {1}; sha256 {2}; STREAKBOOM_DUO={3}; STREAKBOOM_DUO_FAKE={4}" -f $Plan, $Exe, (Get-FileHash $Exe -Algorithm SHA256).Hash, $env:STREAKBOOM_DUO, $env:STREAKBOOM_DUO_FAKE)

# The script's own form: the "other program in front". It takes the keyboard back and catches the letters typed while it has it.
$form = New-Object System.Windows.Forms.Form
$form.Text = "bubble-keyboard harness"; $form.StartPosition = "Manual"; $form.Location = New-Object System.Drawing.Point(20, 20)
$form.Size = New-Object System.Drawing.Size(320, 110); $form.TopMost = $true
$box = New-Object System.Windows.Forms.TextBox; $box.Dock = "Fill"; $box.Multiline = $true; $form.Controls.Add($box)
$form.Show(); [System.Windows.Forms.Application]::DoEvents()
$formH = $form.Handle
function Pump([int]$ms) { $end = (Get-Date).AddMilliseconds($ms); while ((Get-Date) -lt $end) { [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 15 } }
function WaitFor([scriptblock]$cond, [int]$ms) { $end = (Get-Date).AddMilliseconds($ms); while ((Get-Date) -lt $end) { if (& $cond) { return $true }; Pump 30 }; return [bool](& $cond) }

$proc = Start-Process $Exe -PassThru
Note "INFO" "started pid $($proc.Id)"
Pump 9000
function Wins { [W]::Of([uint32]$proc.Id) | ForEach-Object { [pscustomobject]@{ H = $_; Title = [W]::Title($_); Vis = [W]::IsWindowVisible($_) } } }
function Width($h) { $r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null; $r.R - $r.L }
function Main { Wins | Where-Object { $_.Title -eq "Streakboom" -and $_.Vis -and (Width $_.H) -lt 600 } | Select-Object -First 1 }
function Bubble { Wins | Where-Object { $_.Title -eq "Streakboom bubble" } | Select-Object -First 1 }
function ChatBox { Wins | Where-Object { $_.Title -eq "Streakboom chat" } | Select-Object -First 1 }
function FgH { [W]::GetForegroundWindow() }
function Fg { $h = FgH; $b = Bubble; $c = ChatBox; if ($b -and $h -eq $b.H) { "bubble" } elseif ($c -and $h -eq $c.H) { "chatbox" } elseif ($h -eq $formH) { "harness" } elseif ([W]::Pid($h) -eq $proc.Id) { "pet:" + [W]::Title($h) } else { "other" } }
function OwnHasKeyboard { $h = FgH; ($h -eq $formH) -or ([W]::Pid($h) -eq $proc.Id) }
function PeakPoint { $m = Main; if (-not $m) { return $null }; $r = New-Object W+RECT; [W]::GetWindowRect($m.H, [ref]$r) | Out-Null; [pscustomobject]@{ X = [int](($r.L + $r.R) / 2); Y = [int]($r.T + ($r.B - $r.T) * 0.62); H = $m.H } }
# The pet takes the cursor at (x, y): its window is not click-through (WS_EX_TRANSPARENT) and is the window the system finds there.
function PetTakes($p) { $ex = [W]::GetWindowLong($p.H, -20); (($ex -band 0x20) -eq 0) -and ([W]::RootAt($p.X, $p.Y) -eq $p.H) }
function SafeClick([string]$label, [bool]$dbl) {
    $p = PeakPoint
    if (-not $p) { Note "INFO" "$label no pet window; nothing pressed"; return $false }
    [W]::SetCursorPos($p.X, $p.Y) | Out-Null
    if (-not (WaitFor { PetTakes $p } 2000)) { Note "INFO" "$label the pet did not take the cursor within 2 s; nothing pressed"; return $false }
    Pump 60
    if (-not (PetTakes $p)) { Note "INFO" "$label the pet let the cursor go before the press; nothing pressed"; return $false }
    [W]::Press()
    if ($dbl) {
        Start-Sleep -Milliseconds 90
        if (-not (PetTakes $p)) { Note "INFO" "$label the pet let the cursor go before the second press; the second press was withheld"; return $false }
        [W]::Press()
    }
    return $true
}
function FormClick { $x = $form.Left + 160; $y = $form.Top + 70; [W]::SetCursorPos($x, $y) | Out-Null; Start-Sleep -Milliseconds 20; if ([W]::RootAt($x, $y) -ne $formH) { Note "INFO" "the harness form is not under the cursor; nothing pressed"; return $false }; [W]::Press(); return $true }
function FocusForm { if (FormClick) { Pump 250; $box.Focus() | Out-Null; Pump 80 } }
function TraceSince([long]$ms) { if (-not (Test-Path $trace)) { return @() }; Get-Content $trace | Where-Object { $_ -match '^(\d+) (.*)$' -and [long]$Matches[1] -ge $ms } }
function Keys([string]$k) { if (OwnHasKeyboard) { [System.Windows.Forms.SendKeys]::SendWait($k); return $true }; Note "INFO" "keys '$k' withheld: neither the pet nor the harness has the keyboard ($(Fg))"; return $false }
function EditValue($b) {
    if (-not $b) { return "<no bubble>" }
    try {
        $root = [System.Windows.Automation.AutomationElement]::FromHandle($b.H)
        $c = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
        $e = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c)
        if (-not $e) { return "<no edit field>" }
        return $e.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value
    } catch { return "<uia error>" }
}
function BubbleHidden { $b = Bubble; -not ($b -and $b.Vis) }
function FitLine([long]$since, [string]$kind) { TraceSince $since | Where-Object { $_ -match "fit interactive=$kind " } | Select-Object -First 1 }

# One chat opened by a double click and judged: the bubble's report says the keyboard was taken, the window is shown, it is the
# foreground window and a typed 'hi' is read back from its field. $close: "esc", "keep" (left open), "wait" (left to its own timeout).
function Chat([string]$label, [string]$close, [string]$needBefore = "") {
    $t0 = NowMs
    if (-not (SafeClick $label $true)) { Note "FAIL" "$label not run: the double click was not made"; return }
    $got = WaitFor { [bool](FitLine $t0 "1") } 3000
    Pump 400
    $fit = FitLine $t0 "1"; $b = Bubble; $vis = [bool]($b -and $b.Vis); $fg = Fg
    Note "INFO" "$label fit: $fit | shown=$vis foreground=$fg | trace since: $((TraceSince $t0) -join ' / ')"
    if ($needBefore -ne "" -and -not ($fit -match $needBefore)) { Note "INFO" "$label precondition '$needBefore' not met by this fit" }
    $read = "<not typed>"
    if ($fg -eq "bubble") { if (Keys "hi") { Pump 400; $read = EditValue $b } }
    Check ($got -and ($fit -match "result=keyboard taken") -and $vis -and $fg -eq "bubble" -and $read -like "*hi*") "$label the chat bubble reports the keyboard taken, is shown, in front and 'hi' reads back ('$read')"
    if ($close -eq "esc" -and $fg -eq "bubble") { Keys "{ESC}" | Out-Null; Check (WaitFor { BubbleHidden } 4000) "$label hidden within 4 s after Esc" }
    elseif ($close -eq "wait") { Check (WaitFor { BubbleHidden } 30000) "$label hidden by its own timeout within 30 s" }
    Pump 800
}
# A chat opened by a double click while this script's form takes the keyboard back at once: Windows should refuse the keyboard to the
# bubble. Judged: the bubble's report does not say taken, the bubble is shown, the form keeps the keyboard and letters typed reach the form.
function ChatRefused([string]$label) {
    $t0 = NowMs
    if (-not (SafeClick $label $true)) { Note "FAIL" "$label not run: the double click was not made"; return }
    $null = FormClick; $tForm = NowMs; $box.Text = ""
    $got = WaitFor { [bool](FitLine $t0 "1") } 3000
    Pump 400
    $fit = FitLine $t0 "1"; $b = Bubble; $vis = [bool]($b -and $b.Vis); $fg = Fg
    $fitMs = if ($fit -match '^(\d+) ') { [long]$Matches[1] } else { 0 }
    Note "INFO" "$label fit: $fit | form pressed at $tForm, fit at $fitMs (precondition: the form first = $($tForm -lt $fitMs)) | shown=$vis foreground=$fg"
    if ($fg -eq "harness") { $box.Focus() | Out-Null; Keys "abc" | Out-Null; Pump 300 }
    if ($fit -match "result=keyboard taken") { Note "INFO" "$label Windows gave the bubble the keyboard (the form's press did not count against it); the report says taken" ; Check ($vis -and $fg -eq "bubble") "$label reported taken and it is true (shown, in front)" }
    else { Check ($got -and ($fit -match "result=keyboard not taken") -and $vis -and $fg -eq "harness" -and $box.Text -eq "abc") "$label reported not taken, shown, the form keeps the keyboard and gets 'abc' ('$($box.Text)')" }
    if ((Fg) -eq "bubble") { Keys "{ESC}" | Out-Null }
    Check (WaitFor { BubbleHidden } 30000) "$label the bubble goes within 30 s"
    Pump 800
}
# A speech line from a poke while this script's form takes the keyboard back: the line must never take it.
function Speech([string]$label) {
    foreach ($try in 1..3) {
        FocusForm; $box.Text = ""
        $t0 = NowMs
        if (-not (SafeClick "$label try $try" $false)) { continue }
        $null = FormClick
        if (WaitFor { [bool](FitLine $t0 "0") } 2500) {
            Pump 300
            $fit = FitLine $t0 "0"; $b = Bubble; $vis = [bool]($b -and $b.Vis); $fg = Fg
            $box.Focus() | Out-Null; Keys "abc" | Out-Null; Pump 300
            Check (($fit -match "result=speech") -and $vis -and $fg -eq "harness" -and $box.Text -eq "abc") "$label a speech line is shown without the keyboard (fit: $fit; shown=$vis; foreground=$fg; form got '$($box.Text)')"
            WaitFor { BubbleHidden } 15000 | Out-Null; Pump 3300
            return
        }
        Pump 3300 # a poke speaks at most every 3 s
    }
    Note "FAIL" "$label no speech line came after three pokes"
}
# A chat opened over a speech line that is still showing.
function OverSpeech([string]$label) {
    foreach ($try in 1..3) {
        $t0 = NowMs
        if (-not (SafeClick "$label poke $try" $false)) { Pump 3300; continue }
        if (WaitFor { ([bool](FitLine $t0 "0")) -and -not (BubbleHidden) } 2500) {
            Pump 200
            if (BubbleHidden) { Note "INFO" "$label the speech line went before the double click" }
            Chat "$label (over the speech line)" "esc" "was_visible=1"
            return
        }
        Pump 3300
    }
    Note "FAIL" "$label no speech line came after three pokes"
}
# The chat box of the experiment (not the bubble): a double click opens it in front.
function BoxOpen([string]$label) {
    if (-not (SafeClick $label $true)) { Note "FAIL" "$label not run: the double click was not made"; return }
    $ok = WaitFor { $c = ChatBox; $c -and $c.Vis -and (Fg) -eq "chatbox" } 3000
    $t1 = NowMs
    Check $ok "$label the chat box is shown and in front ($(Fg))"
    $bubbleFit = TraceSince ($t1 - 3000) | Where-Object { $_ -match "fit interactive=1" }
    Check (-not $bubbleFit) "$label no interactive bubble was shown with the box"
    if ((Fg) -eq "chatbox") { Keys "{ESC}" | Out-Null }
    WaitFor { $c = ChatBox; -not ($c -and $c.Vis) } 6000 | Out-Null
    Pump 1500
}

Check ($null -ne (Main)) "Peak's window is shown at start"
switch ($Plan) {
    "A" {
        foreach ($i in 1..3) { Chat "A-esc$i" "esc" }
        foreach ($i in 1..2) { OverSpeech "A-over$i" }
        foreach ($i in 1..2) { ChatRefused "A-front$i" }
        foreach ($i in 1..3) { Speech "A-speech$i" }
    }
    "B" {
        foreach ($i in 1..2) { Chat "B-timeout$i" "wait" }
        Chat "B-before-destroy" "esc"
        $t0 = NowMs
        $gone = WaitFor { [bool](TraceSince $t0 | Where-Object { $_ -match "destroyed after idle" }) } 70000
        Check $gone "B the hidden bubble's window was destroyed after its idle time"
        $t1 = NowMs
        Chat "B-after-destroy" "esc"
        Check ([bool](TraceSince $t1 | Where-Object { $_ -match " made$" })) "B the window was made again for that chat"
    }
    "C" {
        foreach ($i in 1..3) { Speech "C-speech$i" }
        foreach ($i in 1..2) { BoxOpen "C-box$i" }
    }
}
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Note "INFO" "done: $($script:passes) PASS, $($script:fails) FAIL"
$form.Close()
