import SwiftUI

@main
struct PCBuilderApp: App {
    @StateObject private var model = BuildModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .preferredColorScheme(.dark)
        }
    }
}
