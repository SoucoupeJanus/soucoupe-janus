/* Soucoupe Janus : service worker minimal (installation + secours hors ligne).
   Réseau d'abord : chaque mise à jour du jeu est prise en compte immédiatement. */
const CACHE='soucoupe-janus-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  e.respondWith(fetch(req).then(res=>{
    if(res&&res.ok&&(new URL(req.url).origin===location.origin||/cdnjs|fonts\.(googleapis|gstatic)/.test(req.url))){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(req).then(r=>r||Response.error())));
});
