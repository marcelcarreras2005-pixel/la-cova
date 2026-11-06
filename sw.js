// Primer la xarxa, i si no n'hi ha, l'última còpia. Les dades no es desen aquí: només l'aplicació.
const V = 'cova-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
