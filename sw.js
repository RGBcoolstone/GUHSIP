// Minimal service worker so GUHSIP can be installed. It does not cache anything, so updates always show.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
