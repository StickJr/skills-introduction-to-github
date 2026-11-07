// Minimal service worker so Folio can be installed to the home screen
// (which also enables "Share to Folio" on Android). Always uses the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
