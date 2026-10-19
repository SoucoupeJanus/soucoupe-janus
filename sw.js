/* Soucoupe Janus : service worker minimal (installation + secours hors ligne).
   Réseau d'abord : à chaque lancement, la dernière version publiée sur GitHub est chargée.
   La copie locale ne sert que si l'appareil est hors connexion. */
const CACHE='soucoupe-janus-v3';
/* les simulations (dossier sims/, ~40 Mo) ne sont jamais mises en cache : elles ne se chargent qu'à la demande. */
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const page=req.mode==='navigate'||/\/(index\.html)?$/.test(new URL(req.url).pathname);
  e.respondWith(fetch(req,page?{cache:'no-cache'}:undefined).then(res=>{
    if(res&&res.ok&&!/\/sims\//.test(req.url)&&(new URL(req.url).origin===location.origin||/cdnjs|fonts\.(googleapis|gstatic)/.test(req.url))){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(req).then(r=>r||Response.error())));
});
