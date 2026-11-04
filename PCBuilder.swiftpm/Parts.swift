import SwiftUI

/// Every part of the PC, listed in a sensible assembly order.
enum PartID: String, CaseIterable, Identifiable {
    case pcCase, psu, motherboard, cpu, cooler, ram, ssd, gpu, cables

    var id: String { rawValue }

    var name: String {
        switch self {
        case .pcCase: return "Case"
        case .psu: return "Power Supply"
        case .motherboard: return "Motherboard"
        case .cpu: return "Processor (CPU)"
        case .cooler: return "CPU Cooler"
        case .ram: return "Memory (RAM)"
        case .ssd: return "Storage (SSD)"
        case .gpu: return "Graphics Card (GPU)"
        case .cables: return "Cables"
        }
    }

    /// Short label for cards and slots.
    var short: String {
        switch self {
        case .pcCase: return "Case"
        case .psu: return "PSU"
        case .motherboard: return "Motherboard"
        case .cpu: return "CPU"
        case .cooler: return "Cooler"
        case .ram: return "RAM"
        case .ssd: return "SSD"
        case .gpu: return "GPU"
        case .cables: return "Cables"
        }
    }

    var symbol: String {
        switch self {
        case .pcCase: return "pc"
        case .psu: return "bolt.fill"
        case .motherboard: return "square.grid.3x3.fill"
        case .cpu: return "cpu"
        case .cooler: return "fanblades.fill"
        case .ram: return "memorychip"
        case .ssd: return "internaldrive"
        case .gpu: return "rectangle.3.group.fill"
        case .cables: return "cable.connector"
        }
    }

    var tint: Color {
        switch self {
        case .pcCase: return .gray
        case .psu: return .yellow
        case .motherboard: return .green
        case .cpu: return .blue
        case .cooler: return .cyan
        case .ram: return .purple
        case .ssd: return .orange
        case .gpu: return .red
        case .cables: return .pink
        }
    }

    /// Parts that must already be installed before this one can go in.
    var requires: [PartID] {
        switch self {
        case .pcCase: return []
        case .psu: return [.pcCase]
        case .motherboard: return [.pcCase]
        case .cpu: return [.motherboard]
        case .cooler: return [.cpu]
        case .ram: return [.motherboard]
        case .ssd: return [.motherboard]
        case .gpu: return [.motherboard]
        case .cables: return [.psu, .motherboard, .gpu]
        }
    }

    /// Rough typical power draw under gaming load, in watts.
    var watts: Int {
        switch self {
        case .pcCase: return 10      // case fans
        case .psu: return 0
        case .motherboard: return 50
        case .cpu: return 125
        case .cooler: return 5
        case .ram: return 10
        case .ssd: return 8
        case .gpu: return 300
        case .cables: return 0
        }
    }

    var summary: String {
        switch self {
        case .pcCase:
            return "The chassis that holds and protects everything. Its size (ATX, Micro-ATX, Mini-ITX) decides which motherboards fit, and its fans pull cool air in at the front and push hot air out the back."
        case .psu:
            return "Turns AC power from the wall into the steady 12 V, 5 V and 3.3 V DC the parts need. It's rated in watts and in efficiency (80 Plus Bronze up to Titanium)."
        case .motherboard:
            return "The main circuit board. Every part connects through it: the CPU socket, RAM slots, PCIe slot for the graphics card, M.2 slots for SSDs and the rear USB/network ports."
        case .cpu:
            return "The processor is the 'brain'. In games it runs the game logic, physics, AI and tells the graphics card what to draw. More fast cores help with streaming and multitasking."
        case .cooler:
            return "A CPU can make 100+ W of heat. The cooler moves it away with a metal heatsink and fan (air cooling) or a pump and radiator (liquid cooling)."
        case .ram:
            return "Fast short-term memory that holds what the CPU is working on right now. It's wiped when the PC turns off. 32 GB of DDR5 is a common gaming sweet spot."
        case .ssd:
            return "Long-term storage for Windows, your games and files. NVMe M.2 SSDs plug straight into the motherboard and are many times faster than old hard drives."
        case .gpu:
            return "The graphics card draws every frame you see. It's the most important part for gaming performance and usually the most expensive and power-hungry."
        case .cables:
            return "Power and signal connections: the 24-pin motherboard cable, the 8-pin CPU cable, the GPU power cable, and small front-panel wires for the power button, USB and audio."
        }
    }

    var tip: String {
        switch self {
        case .pcCase: return "Check the maximum GPU length and cooler height before buying a case."
        case .psu: return "Leave 30–40% headroom above your peak power draw. Most gaming PCs use a 650–850 W unit."
        case .motherboard: return "The CPU socket (e.g. AM5 or LGA 1851) must match your processor. Screw it onto the standoffs in the case."
        case .cpu: return "Line up the small gold triangle on the CPU with the mark on the socket. Never force it in."
        case .cooler: return "Put a pea-sized dot of thermal paste on the CPU first. The cooler's pressure spreads it."
        case .ram: return "With two sticks, use slots A2 and B2 (usually 2nd and 4th from the CPU), then turn on XMP/EXPO in the BIOS."
        case .ssd: return "A faster SSD shortens loading screens, but doesn't raise your frame rate."
        case .gpu: return "Use the top PCIe x16 slot. Push until the latch clicks, then screw the bracket to the case."
        case .cables: return "When a new build won't turn on, it's usually a loose cable or front-panel header."
        }
    }

    /// Where the part sits in the side view, in a 320 x 400 design space.
    var layout: CGRect {
        switch self {
        case .pcCase: return CGRect(x: 0, y: 0, width: 320, height: 400)
        case .motherboard: return CGRect(x: 24, y: 28, width: 196, height: 250)
        case .cpu: return CGRect(x: 92, y: 70, width: 48, height: 48)
        case .cooler: return CGRect(x: 78, y: 56, width: 76, height: 76)
        case .ram: return CGRect(x: 172, y: 52, width: 32, height: 104)
        case .ssd: return CGRect(x: 60, y: 160, width: 110, height: 16)
        case .gpu: return CGRect(x: 24, y: 196, width: 236, height: 52)
        case .psu: return CGRect(x: 24, y: 314, width: 150, height: 66)
        case .cables: return CGRect(x: 0, y: 0, width: 320, height: 400)
        }
    }

    /// Drawing order (higher = on top).
    var layer: Double {
        switch self {
        case .pcCase: return 0
        case .psu, .motherboard: return 1
        case .cpu, .ram, .ssd: return 2
        case .gpu: return 3
        case .cooler: return 4
        case .cables: return 5
        }
    }
}
