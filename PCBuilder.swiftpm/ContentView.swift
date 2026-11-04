import SwiftUI

struct ContentView: View {
    @EnvironmentObject var model: BuildModel

    var body: some View {
        VStack(spacing: 10) {
            HeaderView()
            PCSceneView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal)
            Text(model.status)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .padding(.horizontal)
                .animation(nil, value: model.status)
            InfoPanel()
            PartTray()
        }
        .padding(.vertical, 8)
        .background(Color(red: 0.06, green: 0.07, blue: 0.1).ignoresSafeArea())
    }
}

// MARK: - Header

struct HeaderView: View {
    @EnvironmentObject var model: BuildModel

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("PC Builder").font(.title2.bold())
                    Text("\(model.installed.count)/\(PartID.allCases.count) parts · ≈\(model.powerDraw) W draw")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Menu {
                    Button { model.autoBuild() } label: {
                        Label("Build everything", systemImage: "hammer.fill")
                    }
                    Button(role: .destructive) { model.autoBreakdown() } label: {
                        Label("Break it all down", systemImage: "wrench.and.screwdriver.fill")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle").font(.title2)
                }
                Button { model.togglePower() } label: {
                    Image(systemName: "power")
                        .font(.title3.bold())
                        .foregroundStyle(model.poweredOn ? Color.green : (model.isComplete ? Color.white : Color.gray))
                        .padding(10)
                        .background(Circle().fill(Color.white.opacity(0.1)))
                        .shadow(color: model.poweredOn ? .green : .clear, radius: 8)
                }
                .accessibilityLabel(model.poweredOn ? "Power off" : "Power on")
            }
            ProgressView(value: model.progress)
                .tint(.cyan)
                .animation(.easeInOut, value: model.progress)
        }
        .padding(.horizontal)
    }
}

// MARK: - Side view of the PC

struct PCSceneView: View {
    @EnvironmentObject var model: BuildModel

    var body: some View {
        GeometryReader { geo in
            let s = min(geo.size.width / 320, geo.size.height / 400)
            ZStack {
                ForEach(PartID.allCases) { part in
                    slot(part, scale: s)
                }
            }
            .frame(width: 320 * s, height: 400 * s)
            .position(x: geo.size.width / 2, y: geo.size.height / 2)
        }
    }

    @ViewBuilder
    private func slot(_ part: PartID, scale s: CGFloat) -> some View {
        let r = part.layout
        let size = CGSize(width: r.width * s, height: r.height * s)
        let center = CGPoint(x: r.midX * s, y: r.midY * s)

        if model.isInstalled(part) {
            PartArt(part: part, powered: model.poweredOn)
                .frame(width: size.width, height: size.height)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.yellow, lineWidth: 2)
                        .opacity(model.selected == part && part != .cables ? 1 : 0)
                )
                .contentShape(Rectangle())
                .onTapGesture { model.selected = part }
                .allowsHitTesting(part != .cables)
                .position(center)
                .transition(.asymmetric(
                    insertion: .scale(scale: 1.4).combined(with: .opacity),
                    removal: .offset(x: 0, y: -60 * s).combined(with: .opacity)
                ))
                .zIndex(part.layer)
        } else if model.canInstall(part) && part != .cables {
            GhostSlot(label: part == .pcCase ? "Tap here to place the case" : part.short,
                      highlighted: model.selected == part)
                .frame(width: size.width, height: size.height)
                .contentShape(Rectangle())
                .onTapGesture { model.install(part) }
                .position(center)
                .transition(.opacity)
                .zIndex(part.layer + 10)
        }
    }
}

// MARK: - Info about the selected part

struct InfoPanel: View {
    @EnvironmentObject var model: BuildModel

    var body: some View {
        if let part = model.selected {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 10) {
                    Image(systemName: part.symbol)
                        .font(.title3)
                        .foregroundStyle(part.tint)
                        .frame(width: 32)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(part.name).font(.headline)
                        Text(stateText(part))
                            .font(.caption)
                            .foregroundStyle(stateColor(part))
                    }
                    Spacer()
                    actionButton(part)
                }
                ScrollView {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(part.summary)
                            .font(.subheadline)
                        Label(part.tip, systemImage: "lightbulb.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow.opacity(0.9))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 110)
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 14).fill(Color.white.opacity(0.07)))
            .padding(.horizontal)
        }
    }

    @ViewBuilder
    private func actionButton(_ part: PartID) -> some View {
        if model.isInstalled(part) {
            Button { model.remove(part) } label: {
                Label("Remove", systemImage: "minus.circle.fill")
            }
            .buttonStyle(.bordered)
            .tint(.red)
        } else {
            Button { model.install(part) } label: {
                Label("Install", systemImage: "plus.circle.fill")
            }
            .buttonStyle(.borderedProminent)
            .tint(model.canInstall(part) ? .blue : .gray)
        }
    }

    private func stateText(_ part: PartID) -> String {
        if model.isInstalled(part) {
            let blockers = model.blockingDependents(part)
            return blockers.isEmpty
                ? "Installed · ≈\(part.watts) W"
                : "Installed · remove \(blockers.map(\.short).joined(separator: ", ")) first"
        }
        let missing = model.missingRequirements(part)
        return missing.isEmpty
            ? "Ready to install"
            : "Needs: \(missing.map(\.short).joined(separator: ", "))"
    }

    private func stateColor(_ part: PartID) -> Color {
        if model.isInstalled(part) { return .green }
        return model.canInstall(part) ? .cyan : .orange
    }
}

// MARK: - Parts tray

struct PartTray: View {
    @EnvironmentObject var model: BuildModel

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(PartID.allCases) { part in
                    PartCard(part: part)
                }
            }
            .padding(.horizontal)
        }
    }
}

struct PartCard: View {
    @EnvironmentObject var model: BuildModel
    let part: PartID

    var body: some View {
        let installed = model.isInstalled(part)
        let available = model.canInstall(part)
        let isSelected = model.selected == part

        VStack(spacing: 4) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: part.symbol)
                    .font(.title2)
                    .frame(width: 44, height: 34)
                if installed {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.green)
                } else if !available {
                    Image(systemName: "lock.fill")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
            Text(part.short)
                .font(.caption2.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .foregroundStyle(installed ? part.tint : (available ? Color.white : Color.gray))
        .padding(8)
        .frame(width: 76)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(isSelected ? 0.16 : 0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.yellow : Color.clear, lineWidth: 1.5)
        )
        .contentShape(Rectangle())
        .onTapGesture { model.selected = part }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isButton)
    }
}
