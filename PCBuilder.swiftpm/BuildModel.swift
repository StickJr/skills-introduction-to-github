import SwiftUI

@MainActor
final class BuildModel: ObservableObject {
    @Published private(set) var installed: Set<PartID> = []
    @Published var selected: PartID? = .pcCase
    @Published private(set) var poweredOn = false
    @Published private(set) var status = "Start with the case: tap it below, then tap Install."

    private var autoTask: Task<Void, Never>?

    // MARK: - Queries

    var isComplete: Bool { installed.count == PartID.allCases.count }
    var progress: Double { Double(installed.count) / Double(PartID.allCases.count) }
    var powerDraw: Int { installed.reduce(0) { $0 + $1.watts } }
    var nextStep: PartID? { PartID.allCases.first { canInstall($0) } }

    func isInstalled(_ part: PartID) -> Bool { installed.contains(part) }

    func missingRequirements(_ part: PartID) -> [PartID] {
        part.requires.filter { !installed.contains($0) }
    }

    /// Installed parts that sit on or plug into this part.
    func blockingDependents(_ part: PartID) -> [PartID] {
        PartID.allCases.filter { installed.contains($0) && $0.requires.contains(part) }
    }

    func canInstall(_ part: PartID) -> Bool {
        !installed.contains(part) && missingRequirements(part).isEmpty
    }

    func canRemove(_ part: PartID) -> Bool {
        installed.contains(part) && blockingDependents(part).isEmpty
    }

    // MARK: - Actions

    func install(_ part: PartID) {
        guard !installed.contains(part) else { return }
        let missing = missingRequirements(part)
        guard missing.isEmpty else {
            status = "The \(part.short) needs the \(Self.list(missing)) installed first."
            return
        }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
            _ = installed.insert(part)
        }
        selected = part
        if let next = nextStep {
            status = "\(part.name) installed. Next up: \(next.short)."
        } else {
            status = "Build complete! Press the power button at the top."
        }
    }

    func remove(_ part: PartID) {
        guard installed.contains(part) else { return }
        let blockers = blockingDependents(part)
        guard blockers.isEmpty else {
            status = "Remove the \(Self.list(blockers)) first. It's attached to the \(part.short)."
            return
        }
        poweredOn = false
        withAnimation(.easeInOut(duration: 0.35)) {
            _ = installed.remove(part)
        }
        status = "\(part.name) removed."
    }

    func togglePower() {
        guard isComplete else {
            let missing = PartID.allCases.filter { !installed.contains($0) }
            status = "Can't power on yet. Missing: \(Self.list(missing))."
            return
        }
        withAnimation { poweredOn.toggle() }
        status = poweredOn
            ? "Powered on! Fans spin, the PC passes its self-test (POST) and boots. Total draw ≈ \(powerDraw) W."
            : "Powered off. Always switch off and unplug before removing parts."
    }

    func autoBuild() {
        autoTask?.cancel()
        autoTask = Task {
            for part in PartID.allCases where !installed.contains(part) {
                if Task.isCancelled { return }
                install(part)
                try? await Task.sleep(nanoseconds: 450_000_000)
            }
        }
    }

    func autoBreakdown() {
        autoTask?.cancel()
        poweredOn = false
        autoTask = Task {
            for part in PartID.allCases.reversed() where installed.contains(part) {
                if Task.isCancelled { return }
                remove(part)
                try? await Task.sleep(nanoseconds: 400_000_000)
            }
            status = "Everything is taken apart. Tap a part below to start building again."
            selected = .pcCase
        }
    }

    private static func list(_ parts: [PartID]) -> String {
        let names = parts.map(\.short)
        guard names.count > 1 else { return names.first ?? "" }
        return names.dropLast().joined(separator: ", ") + " and " + names.last!
    }
}
