import SwiftUI

// Simple flat drawings of each part. Each drawing uses its own design-space
// width, then scales to whatever size it's given.

extension View {
    /// Places a view at (x, y) with size (w, h) in design units, scaled by s.
    func place(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ s: CGFloat) -> some View {
        frame(width: w * s, height: h * s).offset(x: x * s, y: y * s)
    }
}

/// A top-left aligned canvas that hands its scale factor to the content.
struct Board<Content: View>: View {
    let designWidth: CGFloat
    @ViewBuilder let content: (CGFloat) -> Content

    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .topLeading) {
                content(g.size.width / designWidth)
            }
            .frame(width: g.size.width, height: g.size.height, alignment: .topLeading)
        }
    }
}

struct PartArt: View {
    let part: PartID
    let powered: Bool

    var body: some View {
        switch part {
        case .pcCase: CaseArt(powered: powered)
        case .psu: PSUArt(powered: powered)
        case .motherboard: MotherboardArt(powered: powered)
        case .cpu: CPUArt()
        case .cooler: CoolerArt(powered: powered)
        case .ram: RAMArt(powered: powered)
        case .ssd: SSDArt(powered: powered)
        case .gpu: GPUArt(powered: powered)
        case .cables: CablesArt()
        }
    }
}

// MARK: - Fan

struct FanView: View {
    var spinning: Bool
    var glow: Color = .cyan
    var speed: Double = 600 // degrees per second

    var body: some View {
        TimelineView(.animation(minimumInterval: nil, paused: !spinning)) { ctx in
            let angle = spinning
                ? (ctx.date.timeIntervalSinceReferenceDate * speed).truncatingRemainder(dividingBy: 360)
                : 0
            GeometryReader { g in
                let d = min(g.size.width, g.size.height)
                ZStack {
                    Circle().fill(Color.black.opacity(0.6))
                    ZStack {
                        ForEach(0..<7, id: \.self) { i in
                            Ellipse()
                                .fill(Color(white: 0.5))
                                .frame(width: d * 0.17, height: d * 0.36)
                                .rotationEffect(.degrees(20))
                                .offset(y: -d * 0.21)
                                .rotationEffect(.degrees(Double(i) * 360 / 7))
                        }
                        Circle().fill(Color(white: 0.25)).frame(width: d * 0.26, height: d * 0.26)
                    }
                    .rotationEffect(.degrees(angle))
                    Circle()
                        .stroke(spinning ? glow : Color(white: 0.4), lineWidth: max(1, d * 0.06))
                        .shadow(color: spinning ? glow : .clear, radius: d * 0.1)
                }
                .frame(width: g.size.width, height: g.size.height)
            }
        }
    }
}

// MARK: - Case

struct CaseArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 320) { s in
            RoundedRectangle(cornerRadius: 14 * s)
                .fill(Color(white: 0.17))
                .place(0, 0, 320, 400, s)
            RoundedRectangle(cornerRadius: 14 * s)
                .stroke(powered ? Color.cyan : Color(white: 0.38), lineWidth: 3 * s)
                .shadow(color: powered ? .cyan : .clear, radius: 10 * s)
                .place(0, 0, 320, 400, s)
            // Inside of the case
            RoundedRectangle(cornerRadius: 8 * s)
                .fill(Color(white: 0.1))
                .place(10, 10, 300, 380, s)
            // PSU shroud
            Rectangle()
                .fill(Color(white: 0.2))
                .place(10, 302, 300, 88, s)
            // Front intake fans
            ForEach(0..<3, id: \.self) { i in
                FanView(spinning: powered)
                    .place(266, 50 + CGFloat(i) * 80, 42, 42, s)
            }
            // Front panel power button
            Circle()
                .fill(powered ? Color.green : Color(white: 0.4))
                .shadow(color: powered ? .green : .clear, radius: 4 * s)
                .place(281, 18, 12, 12, s)
            Text("FRONT")
                .font(.system(size: 9 * s, weight: .bold))
                .foregroundStyle(Color(white: 0.45))
                .place(262, 290, 50, 12, s)
        }
    }
}

// MARK: - Power supply

struct PSUArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 150) { s in
            RoundedRectangle(cornerRadius: 5 * s)
                .fill(Color(white: 0.08))
                .overlay(RoundedRectangle(cornerRadius: 5 * s).stroke(Color.yellow.opacity(0.6), lineWidth: 1.5 * s))
                .place(0, 0, 150, 66, s)
            FanView(spinning: powered, glow: .yellow, speed: 300)
                .place(8, 7, 52, 52, s)
            Text("PSU")
                .font(.system(size: 15 * s, weight: .heavy))
                .foregroundStyle(.yellow)
                .place(70, 10, 70, 20, s)
            Text("850 W · 80+ Gold")
                .font(.system(size: 8 * s, weight: .medium))
                .foregroundStyle(.white.opacity(0.7))
                .place(66, 32, 80, 12, s)
            // Modular sockets
            ForEach(0..<4, id: \.self) { i in
                RoundedRectangle(cornerRadius: 1 * s)
                    .fill(Color(white: 0.3))
                    .place(72 + CGFloat(i) * 17, 48, 13, 9, s)
            }
        }
    }
}

// MARK: - Motherboard

struct MotherboardArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 196) { s in
            RoundedRectangle(cornerRadius: 4 * s)
                .fill(Color(red: 0.08, green: 0.22, blue: 0.17))
                .overlay(RoundedRectangle(cornerRadius: 4 * s).stroke(Color.green.opacity(0.5), lineWidth: 1 * s))
                .place(0, 0, 196, 250, s)
            // Circuit traces
            ForEach(0..<6, id: \.self) { i in
                Rectangle()
                    .fill(Color.green.opacity(0.18))
                    .place(10, 110 + CGFloat(i) * 8, 120, 1.2, s)
            }
            // Rear I/O and VRM heatsinks
            RoundedRectangle(cornerRadius: 2 * s).fill(Color(white: 0.35)).place(4, 8, 18, 70, s)
            RoundedRectangle(cornerRadius: 2 * s).fill(Color(white: 0.45)).place(40, 6, 70, 14, s)
            RoundedRectangle(cornerRadius: 2 * s).fill(Color(white: 0.45)).place(28, 22, 12, 62, s)
            // CPU socket
            RoundedRectangle(cornerRadius: 2 * s)
                .stroke(Color(white: 0.75), lineWidth: 1.5 * s)
                .background(Color(white: 0.2))
                .place(66, 40, 52, 52, s)
            // RAM slots
            ForEach(0..<4, id: \.self) { i in
                RoundedRectangle(cornerRadius: 1 * s)
                    .fill(Color(white: 0.12))
                    .overlay(RoundedRectangle(cornerRadius: 1 * s).stroke(Color(white: 0.4), lineWidth: 0.8 * s))
                    .place(148 + CGFloat(i) * 9, 22, 6, 108, s)
            }
            // 24-pin power connector
            RoundedRectangle(cornerRadius: 1 * s).fill(Color(white: 0.85)).place(186, 100, 7, 40, s)
            // M.2 slot
            RoundedRectangle(cornerRadius: 1 * s)
                .stroke(Color(white: 0.5), style: StrokeStyle(lineWidth: 0.8 * s, dash: [3 * s, 2 * s]))
                .place(36, 132, 110, 16, s)
            // PCIe x16 slot
            RoundedRectangle(cornerRadius: 1 * s).fill(Color(white: 0.75)).place(14, 214, 120, 6, s)
            // Chipset
            RoundedRectangle(cornerRadius: 2 * s)
                .fill(Color(white: 0.4))
                .overlay(Circle().fill(powered ? Color.green : Color(white: 0.6)).padding(5 * s))
                .place(150, 180, 30, 30, s)
        }
    }
}

// MARK: - CPU

struct CPUArt: View {
    var body: some View {
        Board(designWidth: 48) { s in
            RoundedRectangle(cornerRadius: 4 * s)
                .fill(LinearGradient(colors: [Color(white: 0.85), Color(white: 0.6)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .place(0, 0, 48, 48, s)
            RoundedRectangle(cornerRadius: 3 * s)
                .stroke(Color(white: 0.5), lineWidth: 1 * s)
                .place(6, 6, 36, 36, s)
            Text("CPU")
                .font(.system(size: 10 * s, weight: .heavy))
                .foregroundStyle(Color.blue)
                .frame(width: 48 * s, height: 48 * s)
            // Orientation triangle
            Path { p in
                p.move(to: CGPoint(x: 2 * s, y: 2 * s))
                p.addLine(to: CGPoint(x: 10 * s, y: 2 * s))
                p.addLine(to: CGPoint(x: 2 * s, y: 10 * s))
                p.closeSubpath()
            }
            .fill(Color.yellow)
        }
    }
}

// MARK: - Cooler

struct CoolerArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 76) { s in
            RoundedRectangle(cornerRadius: 6 * s)
                .fill(Color(white: 0.55))
                .place(0, 0, 76, 76, s)
            // Heatsink fins
            ForEach(0..<9, id: \.self) { i in
                Rectangle()
                    .fill(Color(white: 0.4))
                    .place(4 + CGFloat(i) * 8, 2, 3, 72, s)
            }
            FanView(spinning: powered, speed: 800)
                .place(6, 6, 64, 64, s)
        }
    }
}

// MARK: - RAM

struct RAMArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 32) { s in
            ForEach(0..<2, id: \.self) { i in
                let x: CGFloat = i == 0 ? 3 : 19
                RoundedRectangle(cornerRadius: 2 * s)
                    .fill(Color(white: 0.15))
                    .overlay(RoundedRectangle(cornerRadius: 2 * s).stroke(Color.purple.opacity(0.7), lineWidth: 1 * s))
                    .place(x, 0, 10, 104, s)
                // Memory chips
                ForEach(0..<5, id: \.self) { c in
                    Rectangle()
                        .fill(Color(white: 0.3))
                        .place(x + 2, 18 + CGFloat(c) * 17, 6, 12, s)
                }
                // RGB light bar
                RoundedRectangle(cornerRadius: 1 * s)
                    .fill(powered
                          ? AnyShapeStyle(LinearGradient(colors: [.pink, .purple, .blue, .cyan], startPoint: .top, endPoint: .bottom))
                          : AnyShapeStyle(Color(white: 0.4)))
                    .shadow(color: powered ? .purple : .clear, radius: 4 * s)
                    .place(x + 1, 2, 8, 12, s)
            }
        }
    }
}

// MARK: - SSD

struct SSDArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 110) { s in
            RoundedRectangle(cornerRadius: 2 * s)
                .fill(Color(white: 0.06))
                .overlay(RoundedRectangle(cornerRadius: 2 * s).stroke(Color.orange.opacity(0.7), lineWidth: 1 * s))
                .place(0, 0, 110, 16, s)
            // Gold contacts
            Rectangle().fill(Color.yellow.opacity(0.8)).place(0, 2, 5, 12, s)
            ForEach(0..<3, id: \.self) { i in
                Rectangle().fill(Color(white: 0.28)).place(12 + CGFloat(i) * 22, 3, 18, 10, s)
            }
            Text("NVMe")
                .font(.system(size: 7 * s, weight: .bold))
                .foregroundStyle(.orange)
                .place(78, 3, 26, 10, s)
            Circle()
                .fill(powered ? Color.orange : Color(white: 0.3))
                .place(104, 6, 4, 4, s)
        }
    }
}

// MARK: - GPU

struct GPUArt: View {
    let powered: Bool

    var body: some View {
        Board(designWidth: 236) { s in
            RoundedRectangle(cornerRadius: 6 * s)
                .fill(Color(white: 0.2))
                .overlay(RoundedRectangle(cornerRadius: 6 * s).stroke(Color.red.opacity(0.7), lineWidth: 1.5 * s))
                .place(0, 0, 236, 48, s)
            // PCIe gold fingers
            Rectangle().fill(Color.yellow.opacity(0.85)).place(16, 46, 100, 5, s)
            // Bracket at the back of the case
            Rectangle().fill(Color(white: 0.6)).place(0, 0, 4, 48, s)
            FanView(spinning: powered, glow: .red)
                .place(26, 4, 40, 40, s)
            FanView(spinning: powered, glow: .red)
                .place(90, 4, 40, 40, s)
            FanView(spinning: powered, glow: .red)
                .place(154, 4, 40, 40, s)
            Text("GPU")
                .font(.system(size: 10 * s, weight: .heavy))
                .foregroundStyle(.red)
                .place(200, 18, 30, 14, s)
            // Power socket on top
            RoundedRectangle(cornerRadius: 1 * s).fill(Color(white: 0.05)).place(196, 0, 22, 6, s)
            // RGB strip
            Rectangle()
                .fill(powered ? Color.red : Color.clear)
                .shadow(color: powered ? .red : .clear, radius: 4 * s)
                .place(10, 44, 220, 2, s)
        }
    }
}

// MARK: - Cables

struct CablesArt: View {
    var body: some View {
        Board(designWidth: 320) { s in
            let pt = { (x: CGFloat, y: CGFloat) in CGPoint(x: x * s, y: y * s) }
            // 24-pin motherboard power
            Path { p in
                p.move(to: pt(150, 316))
                p.addCurve(to: pt(216, 140), control1: pt(240, 300), control2: pt(240, 150))
            }
            .stroke(Color(white: 0.9), style: StrokeStyle(lineWidth: 6 * s, lineCap: .round))
            // 8-pin CPU power
            Path { p in
                p.move(to: pt(50, 316))
                p.addCurve(to: pt(56, 36), control1: pt(16, 260), control2: pt(16, 40))
            }
            .stroke(Color.pink, style: StrokeStyle(lineWidth: 4 * s, lineCap: .round))
            // GPU power
            Path { p in
                p.move(to: pt(110, 316))
                p.addCurve(to: pt(232, 198), control1: pt(150, 280), control2: pt(250, 260))
            }
            .stroke(Color.pink.opacity(0.8), style: StrokeStyle(lineWidth: 4 * s, lineCap: .round))
            // Front panel wires
            Path { p in
                p.move(to: pt(200, 278))
                p.addCurve(to: pt(282, 30), control1: pt(250, 300), control2: pt(250, 30))
            }
            .stroke(Color.orange.opacity(0.8), style: StrokeStyle(lineWidth: 1.5 * s, lineCap: .round, dash: [4 * s, 2 * s]))
        }
    }
}

// MARK: - Empty slot outline

struct GhostSlot: View {
    let label: String
    let highlighted: Bool

    var body: some View {
        RoundedRectangle(cornerRadius: 6)
            .strokeBorder(highlighted ? Color.yellow : Color.white.opacity(0.45),
                          style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
            .background(RoundedRectangle(cornerRadius: 6).fill(Color.white.opacity(highlighted ? 0.12 : 0.04)))
            .overlay(
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.75))
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.4)
                    .padding(2)
            )
    }
}
