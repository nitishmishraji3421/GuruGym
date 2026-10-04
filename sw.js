const CACHE='guru-gym-v4';
const APP_SHELL=['./','./index.html','./style.css','./app.js','./media-studio.html','./media-studio.css','./media-studio.js','./gallery.html','./gallery.js','./manifest.webmanifest','./assets/guru-gym-logo.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();if(new URL(req.url).origin===location.origin)caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>req.destination==='document'?caches.match('./index.html'):new Response('',{status:503,statusText:'Offline'}))));
});
