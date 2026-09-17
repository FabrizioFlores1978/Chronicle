import Cocoa

// Window dimensions in points and pixels (660 x 400)
let width: CGFloat = 660
let height: CGFloat = 400

// Target size 660 x 400 at 72 DPI (1:1 for Finder DMG windows)
let size = NSSize(width: width, height: height)
let image = NSImage(size: size)

image.lockFocus()

guard let context = NSGraphicsContext.current?.cgContext else {
    exit(1)
}

// 1. Sleek Modern Gradient Background (Dark Slate / Deep Indigo)
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bgColors = [
    NSColor(red: 0.05, green: 0.07, blue: 0.12, alpha: 1.0).cgColor, // Deep slate #0d121f
    NSColor(red: 0.09, green: 0.11, blue: 0.18, alpha: 1.0).cgColor, // Modern night #171c2e
    NSColor(red: 0.06, green: 0.08, blue: 0.14, alpha: 1.0).cgColor  // #0f1424
] as CFArray
let bgLocations: [CGFloat] = [0.0, 0.5, 1.0]
if let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: bgLocations) {
    context.drawLinearGradient(bgGradient, start: CGPoint(x: 0, y: height), end: CGPoint(x: width, y: 0), options: [])
}

// Icon centers in Cocoa coordinates (Finder y=190 from top -> Cocoa y=210 from bottom)
let iconY: CGFloat = 210
let leftX: CGFloat = 180
let rightX: CGFloat = 480

// 2. Ambient Colorful Glows Behind Icon Landing Zones
let leftGlowColors = [
    NSColor(red: 0.39, green: 0.45, blue: 0.95, alpha: 0.22).cgColor, // Indigo glow
    NSColor(red: 0.39, green: 0.45, blue: 0.95, alpha: 0.0).cgColor
] as CFArray
if let leftGlow = CGGradient(colorsSpace: colorSpace, colors: leftGlowColors, locations: [0.0, 1.0]) {
    context.drawRadialGradient(leftGlow, startCenter: CGPoint(x: leftX, y: iconY), startRadius: 10, endCenter: CGPoint(x: leftX, y: iconY), endRadius: 110, options: [])
}

let rightGlowColors = [
    NSColor(red: 0.70, green: 0.35, blue: 0.95, alpha: 0.22).cgColor, // Violet glow
    NSColor(red: 0.70, green: 0.35, blue: 0.95, alpha: 0.0).cgColor
] as CFArray
if let rightGlow = CGGradient(colorsSpace: colorSpace, colors: rightGlowColors, locations: [0.0, 1.0]) {
    context.drawRadialGradient(rightGlow, startCenter: CGPoint(x: rightX, y: iconY), startRadius: 10, endCenter: CGPoint(x: rightX, y: iconY), endRadius: 110, options: [])
}

// 3. Frosted Glass Pedestals (Dashed drop guides)
let pedestalSize: CGFloat = 114
let leftBaseRect = NSRect(x: leftX - pedestalSize/2, y: iconY - pedestalSize/2, width: pedestalSize, height: pedestalSize)
let leftPath = NSBezierPath(roundedRect: leftBaseRect, xRadius: 20, yRadius: 20)
NSColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.04).setFill()
leftPath.fill()
NSColor(red: 0.45, green: 0.55, blue: 0.95, alpha: 0.25).setStroke()
leftPath.lineWidth = 1.5
let dashPattern: [CGFloat] = [6.0, 4.0]
leftPath.setLineDash(dashPattern, count: 2, phase: 0.0)
leftPath.stroke()

let rightBaseRect = NSRect(x: rightX - pedestalSize/2, y: iconY - pedestalSize/2, width: pedestalSize, height: pedestalSize)
let rightPath = NSBezierPath(roundedRect: rightBaseRect, xRadius: 20, yRadius: 20)
NSColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.04).setFill()
rightPath.fill()
NSColor(red: 0.75, green: 0.45, blue: 0.95, alpha: 0.25).setStroke()
rightPath.lineWidth = 1.5
rightPath.setLineDash(dashPattern, count: 2, phase: 0.0)
rightPath.stroke()

// 4. Header: Title & Instructions
let titleFont = NSFont.systemFont(ofSize: 20, weight: .bold)
let titleShadow = NSShadow()
titleShadow.shadowColor = NSColor.black.withAlphaComponent(0.6)
titleShadow.shadowOffset = NSSize(width: 0, height: -1)
titleShadow.shadowBlurRadius = 3

let titleAttrs: [NSAttributedString.Key: Any] = [
    .font: titleFont,
    .foregroundColor: NSColor(red: 0.95, green: 0.96, blue: 0.98, alpha: 1.0),
    .shadow: titleShadow
]
let titleStr = "Chronicle • Authoring Studio" as NSString
let titleSize = titleStr.size(withAttributes: titleAttrs)
titleStr.draw(at: NSPoint(x: (width - titleSize.width) / 2, y: height - 50), withAttributes: titleAttrs)

let subFont = NSFont.systemFont(ofSize: 12.5, weight: .medium)
let subAttrs: [NSAttributedString.Key: Any] = [
    .font: subFont,
    .foregroundColor: NSColor(red: 0.65, green: 0.70, blue: 0.80, alpha: 1.0)
]
let subStr = "Drag the Chronicle icon to Applications to install" as NSString
let subSize = subStr.size(withAttributes: subAttrs)
subStr.draw(at: NSPoint(x: (width - subSize.width) / 2, y: height - 74), withAttributes: subAttrs)

// 5. Sleek Flowing Gradient Arrow Between Icons
let arrowStartX: CGFloat = leftX + pedestalSize/2 + 12
let arrowEndX: CGFloat = rightX - pedestalSize/2 - 12
let arrowMidX: CGFloat = (arrowStartX + arrowEndX) / 2

let arrowPath = NSBezierPath()
arrowPath.move(to: NSPoint(x: arrowStartX, y: iconY))
arrowPath.curve(to: NSPoint(x: arrowEndX, y: iconY),
                controlPoint1: NSPoint(x: arrowStartX + 28, y: iconY + 16),
                controlPoint2: NSPoint(x: arrowEndX - 28, y: iconY + 16))

// Arrow head
arrowPath.move(to: NSPoint(x: arrowEndX - 14, y: iconY + 9))
arrowPath.line(to: NSPoint(x: arrowEndX + 2, y: iconY))
arrowPath.line(to: NSPoint(x: arrowEndX - 14, y: iconY - 9))

NSColor(red: 0.55, green: 0.65, blue: 0.95, alpha: 0.85).setStroke()
arrowPath.lineWidth = 2.5
arrowPath.lineCapStyle = .round
arrowPath.lineJoinStyle = .round
arrowPath.stroke()

// Glowing ambient pulse behind the arrow
let arrowGlowColors = [
    NSColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.35).cgColor,
    NSColor(red: 0.55, green: 0.65, blue: 1.0, alpha: 0.0).cgColor
] as CFArray
if let arrowGlow = CGGradient(colorsSpace: colorSpace, colors: arrowGlowColors, locations: [0.0, 1.0]) {
    context.drawRadialGradient(arrowGlow, startCenter: CGPoint(x: arrowMidX, y: iconY + 8), startRadius: 2, endCenter: CGPoint(x: arrowMidX, y: iconY + 8), endRadius: 45, options: [])
}

// 6. Bottom subtle badge
let footerFont = NSFont.systemFont(ofSize: 11, weight: .regular)
let footerAttrs: [NSAttributedString.Key: Any] = [
    .font: footerFont,
    .foregroundColor: NSColor(red: 0.40, green: 0.45, blue: 0.55, alpha: 0.8)
]
let footerStr = "100% Local-First & Private • Novelist Studio" as NSString
let footerSize = footerStr.size(withAttributes: footerAttrs)
footerStr.draw(at: NSPoint(x: (width - footerSize.width) / 2, y: 20), withAttributes: footerAttrs)

image.unlockFocus()

// Export as exact 660 x 400 PNG with 72 DPI metadata
let rep = NSBitmapImageRep(bitmapDataPlanes: nil,
                           pixelsWide: Int(width),
                           pixelsHigh: Int(height),
                           bitsPerSample: 8,
                           samplesPerPixel: 4,
                           hasAlpha: true,
                           isPlanar: false,
                           colorSpaceName: .deviceRGB,
                           bytesPerRow: 0,
                           bitsPerPixel: 0)!
rep.size = NSSize(width: width, height: height)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
image.draw(in: NSRect(x: 0, y: 0, width: width, height: height))
NSGraphicsContext.restoreGraphicsState()

if let pngData = rep.representation(using: .png, properties: [:]) {
    let outputPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "dmg-background.png"
    try? pngData.write(to: URL(fileURLWithPath: outputPath))
    
    // Set explicit 72 DPI metadata for Finder
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/sips")
    task.arguments = ["-s", "dpiWidth", "72.0", "-s", "dpiHeight", "72.0", outputPath]
    try? task.run()
    task.waitUntilExit()
    
    print("✓ Successfully generated exact 660x400 DMG background image at: \(outputPath)")
} else {
    print("❌ Failed to encode PNG")
    exit(1)
}
