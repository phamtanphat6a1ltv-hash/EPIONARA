// EPIONARA Service Worker v3.0 - Powered by Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`[SW] Workbox is loaded 🎉`);

  // Force taking control immediately
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Cache page navigations (html) with a Network First strategy
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'epionara-pages',
    })
  );

  // Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'epionara-assets',
    })
  );

  // Cache images with a Cache First strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'epionara-images-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Network Only for external APIs like Gemini (Security fix: do not cache sensitive AI responses)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://generativelanguage.googleapis.com' || url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkOnly()
  );

  // Message validation
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  // Background sync for offline journal entries
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('sync-journals', {
    maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
  });
  
  // Registering a route for sync
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('journals'),
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );

} else {
  console.warn(`[SW] Workbox didn't load. Service worker functionality will be limited.`);
}
