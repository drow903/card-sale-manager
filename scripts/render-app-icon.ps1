Add-Type -AssemblyName System.Drawing.Common

$assetDir = Join-Path (Split-Path $PSScriptRoot -Parent) "assets"
$bitmap = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$background = [System.Drawing.Drawing2D.GraphicsPath]::new()
$background.AddArc(30, 30, 220, 220, 180, 90)
$background.AddArc(774, 30, 220, 220, 270, 90)
$background.AddArc(774, 774, 220, 220, 0, 90)
$background.AddArc(30, 774, 220, 220, 90, 90)
$background.CloseFigure()
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(80, 40), [System.Drawing.Point]::new(940, 980), [System.Drawing.Color]::FromArgb(11, 39, 64), [System.Drawing.Color]::FromArgb(5, 17, 28))
$graphics.FillPath($backgroundBrush, $background)

$bluePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(47, 107, 255), 58)
$bluePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$whitePen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 58)
$whitePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$backCard = [System.Drawing.Point[]]@([System.Drawing.Point]::new(150,300),[System.Drawing.Point]::new(640,170),[System.Drawing.Point]::new(760,700),[System.Drawing.Point]::new(265,835))
$frontCard = [System.Drawing.Point[]]@([System.Drawing.Point]::new(290,180),[System.Drawing.Point]::new(745,145),[System.Drawing.Point]::new(790,675),[System.Drawing.Point]::new(330,720))
$graphics.DrawPolygon($bluePen, $backCard)
$graphics.DrawPolygon($whitePen, $frontCard)

$tag = [System.Drawing.Drawing2D.GraphicsPath]::new()
$tag.AddPolygon([System.Drawing.Point[]]@([System.Drawing.Point]::new(445,215),[System.Drawing.Point]::new(755,215),[System.Drawing.Point]::new(835,295),[System.Drawing.Point]::new(835,590),[System.Drawing.Point]::new(620,855),[System.Drawing.Point]::new(405,640),[System.Drawing.Point]::new(405,265)))
$tagBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Point]::new(440,220), [System.Drawing.Point]::new(800,840), [System.Drawing.Color]::FromArgb(38,215,128), [System.Drawing.Color]::FromArgb(17,151,84))
$tagPen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 46)
$tagPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.FillPath($tagBrush, $tag)
$graphics.DrawPath($tagPen, $tag)
$graphics.FillEllipse([System.Drawing.Brushes]::Black, 692, 290, 92, 92)

$checkPen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, 70)
$checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$checkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawLines($checkPen, [System.Drawing.Point[]]@([System.Drawing.Point]::new(495,570),[System.Drawing.Point]::new(590,665),[System.Drawing.Point]::new(760,470)))

$pngPath = Join-Path $assetDir "icon-1024.png"
$icoPath = Join-Path $assetDir "icon.ico"
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconBitmap = [System.Drawing.Bitmap]::new($bitmap, 256, 256)
$pngStream = [System.IO.MemoryStream]::new()
$iconBitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $pngStream.ToArray()
$icoStream = [System.IO.File]::Create($icoPath)
$writer = [System.IO.BinaryWriter]::new($icoStream)
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Close()
$pngStream.Dispose()
$iconBitmap.Dispose()

$checkPen.Dispose()
$tagPen.Dispose()
$tagBrush.Dispose()
$tag.Dispose()
$whitePen.Dispose()
$bluePen.Dispose()
$backgroundBrush.Dispose()
$background.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
