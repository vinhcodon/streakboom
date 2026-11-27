<#
.SYNOPSIS
  Synthetic, reproducible evidence for issue #8: what a text of a known physical pixel size looks like after the
  screen picture's own reduction (GDI StretchBlt with HALFTONE, as in app/src-tauri/src/picture.rs), grey, enlarged
  with nearest neighbour.

.DESCRIPTION
  No real screen is captured and nothing personal is drawn. A synthetic "screen" bitmap of the chosen size is made
  in memory: one band per text size, a line of Latin text with Vietnamese marks in Segoe UI, black on white (or white
  on black with -Dark). The bitmap is reduced to the grid of the app (GRID_W 192 wide, height round(192*h/w) cut to
  1..216, as grid_dims() in picture.rs), converted to grey with 0.299 R + 0.587 G + 0.114 B, and written as a
  contact sheet: the synthetic screen (scaled for viewing, bilinear) on the left, the grid enlarged by -Scale
  (nearest neighbour) on the right. The sizes are physical pixels (GraphicsUnit.Pixel = the em height), not points,
  and say nothing about a person's DPI scale or zoom.

  Limits, repeated on the sheet: one font, one machine, one OS reduction, synthetic text only; the sheet shows what
  can be read by eye at that enlargement; it proves nothing about all fonts, screens, or a reader with a tool.

.PARAMETER OutDir  where the PNG files and the parameters file are written (created if missing).
.PARAMETER Width / Height  the synthetic screen, physical pixels (default 1920 x 1080; also run 1366 x 768).
.PARAMETER Scale  enlargement of the grid for the sheet (nearest neighbour), default 5.
.PARAMETER Dark  white text on a dark background instead of black on white.
#>
param(
  [string]$OutDir = (Join-Path $PSScriptRoot "..\..\docs\plans\assets\screen-picture"),
  [int]$Width = 1920,
  [int]$Height = 1080,
  [int]$Scale = 5,
  [switch]$Dark
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace Gdi -Name Native -MemberDefinition @"
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern int SetStretchBltMode(System.IntPtr hdc, int mode);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern bool SetBrushOrgEx(System.IntPtr hdc, int x, int y, System.IntPtr old);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern System.IntPtr CreateCompatibleDC(System.IntPtr hdc);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern System.IntPtr CreateCompatibleBitmap(System.IntPtr hdc, int w, int h);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern System.IntPtr SelectObject(System.IntPtr hdc, System.IntPtr obj);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern bool DeleteDC(System.IntPtr hdc);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern bool DeleteObject(System.IntPtr obj);
[System.Runtime.InteropServices.DllImport("gdi32.dll")] public static extern bool StretchBlt(System.IntPtr hdcDest, int xD, int yD, int wD, int hD, System.IntPtr hdcSrc, int xS, int yS, int wS, int hS, int rop);
"@
New-Item -ItemType Directory -Force $OutDir | Out-Null

# the grid of the app (grid_dims in picture.rs): 192 wide, round(192 * h / w) tall, cut to 1..216
$gw = 192
$gh = [Math]::Min(216, [Math]::Max(1, [int][Math]::Round(192.0 * $Height / $Width, [MidpointRounding]::AwayFromZero)))
$cell = [Math]::Round($Width / $gw, 2)

$sizes = @(8, 10, 12, 14, 16, 20, 24, 32, 40, 48)
# Latin text with Vietnamese marks, written with code points so the file stays ASCII (Windows PowerShell 5.1 reads it as ANSI)
$text = "Hello Peak 2026 - Xin ch" + [char]0xE0 + "o, " + [char]0x111 + [char]0xE2 + "y l" + [char]0xE0 + " ch" + [char]0x1EEF
$bg = if ($Dark) { [System.Drawing.Color]::FromArgb(24, 24, 28) } else { [System.Drawing.Color]::White }
$fg = if ($Dark) { [System.Drawing.Color]::FromArgb(235, 235, 235) } else { [System.Drawing.Color]::Black }

# 1. the synthetic screen
$src = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppRgb)
$g = [System.Drawing.Graphics]::FromImage($src)
$g.Clear($bg)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$band = [int][Math]::Floor($Height / $sizes.Count)
$brush = New-Object System.Drawing.SolidBrush $fg
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $font = New-Object System.Drawing.Font("Segoe UI", [single]$sizes[$i], [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($text, $font, $brush, 24, $i * $band + [Math]::Max(0, ($band - $sizes[$i] * 1.4) / 2))
  $font.Dispose()
}
$g.Dispose()

# 2. the reduction of the app: StretchBlt with HALFTONE from a device context into a bitmap of the grid size
$hSrc = $src.GetHbitmap()
$dc1 = [Gdi.Native]::CreateCompatibleDC([System.IntPtr]::Zero)
[void][Gdi.Native]::SelectObject($dc1, $hSrc)
$dc2 = [Gdi.Native]::CreateCompatibleDC($dc1)
$hDst = [Gdi.Native]::CreateCompatibleBitmap($dc1, $gw, $gh)
[void][Gdi.Native]::SelectObject($dc2, $hDst)
[void][Gdi.Native]::SetStretchBltMode($dc2, 4)                       # HALFTONE
[void][Gdi.Native]::SetBrushOrgEx($dc2, 0, 0, [System.IntPtr]::Zero)  # required after HALFTONE
$ok = [Gdi.Native]::StretchBlt($dc2, 0, 0, $gw, $gh, $dc1, 0, 0, $Width, $Height, 0x00CC0020)  # SRCCOPY
$dst = [System.Drawing.Image]::FromHbitmap($hDst)
[void][Gdi.Native]::DeleteDC($dc2); [void][Gdi.Native]::DeleteDC($dc1)
[void][Gdi.Native]::DeleteObject($hDst); [void][Gdi.Native]::DeleteObject($hSrc)
if (-not $ok) { throw "StretchBlt failed" }

# 3. grey (0.299 R + 0.587 G + 0.114 B), kept as a bitmap for the enlargement
$grey = New-Object System.Drawing.Bitmap $gw, $gh, ([System.Drawing.Imaging.PixelFormat]::Format32bppRgb)
for ($y = 0; $y -lt $gh; $y++) { for ($x = 0; $x -lt $gw; $x++) {
  $p = $dst.GetPixel($x, $y)
  $v = [int][Math]::Round(0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B)
  $grey.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($v, $v, $v))
} }

# 4. the contact sheet: the screen scaled for viewing (left) and the grid enlarged, nearest neighbour (right)
$viewW = $gw * $Scale; $viewH = $gh * $Scale
$sheet = New-Object System.Drawing.Bitmap ($viewW * 2 + 30), ($viewH + 70), ([System.Drawing.Imaging.PixelFormat]::Format32bppRgb)
$gc = [System.Drawing.Graphics]::FromImage($sheet)
$gc.Clear([System.Drawing.Color]::FromArgb(60, 60, 60))
$gc.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
$gc.DrawImage($src, 10, 60, $viewW, $viewH)
$gc.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$gc.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$gc.DrawImage($grey, $viewW + 20, 60, $viewW, $viewH)
$lab = New-Object System.Drawing.Font("Segoe UI", [single]14, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$wh = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$theme = if ($Dark) { "white on dark" } else { "black on white" }
$gc.DrawString("synthetic screen $Width x $Height ($theme, Segoe UI, em height in physical px, top to bottom: $($sizes -join ', ')) shown at $viewW x $viewH", $lab, $wh, 10, 8)
$gc.DrawString("what the app keeps: $gw x $gh grey cells (StretchBlt HALFTONE, grey 0.299/0.587/0.114), enlarged x$Scale nearest neighbour; a cell is about $cell physical px", $lab, $wh, 10, 32)
$gc.Dispose()

$tag = "$($Width)x$($Height)" + $(if ($Dark) { "-dark" } else { "" })
$sheetPath = Join-Path $OutDir "contact-sheet-$tag.png"
$sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
$grey.Save((Join-Path $OutDir "grid-$tag.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose(); $grey.Dispose(); $dst.Dispose(); $src.Dispose()

$info = [ordered]@{
  script = "scripts/windows/picture-evidence.ps1"
  screen = "$Width x $Height (synthetic)"; grid = "$gw x $gh"; cell_px = $cell
  font = "Segoe UI, regular, GraphicsUnit.Pixel (em height), ClearTypeGridFit"
  text = $text; sizes_px = ($sizes -join ", "); band_px = $band; theme = $theme
  reduction = "StretchBlt HALFTONE (SetStretchBltMode 4, SetBrushOrgEx 0,0) from a device context into a bitmap of the grid size"
  grey = "0.299 R + 0.587 G + 0.114 B"; enlargement = "x$Scale nearest neighbour (PixelOffsetMode Half)"
  os = [System.Environment]::OSVersion.VersionString; sheet = (Split-Path $sheetPath -Leaf)
}
$info.GetEnumerator() | ForEach-Object { "{0}: {1}" -f $_.Key, $_.Value } | Set-Content (Join-Path $OutDir "params-$tag.txt") -Encoding utf8
Write-Host "written $sheetPath"
