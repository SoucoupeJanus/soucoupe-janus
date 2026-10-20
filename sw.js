/* Soucoupe Janus : service worker (installation + jeu hors ligne).
   Réseau d'abord : à chaque lancement connecté, la dernière version publiée sur GitHub est chargée
   et la copie locale est mise à jour au passage. Sans réseau, le jeu démarre depuis cette copie. */
const CACHE='soucoupe-janus-v4';
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const FONTS_URL='https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon.svg','./icons/favicon.ico'];
/* les simulations (dossier sims/, ~40 Mo) ne sont jamais mises en cache : elles ne se chargent qu'à la demande, en ligne. */
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(async c=>{
  await Promise.all(LOCAL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
  // moteur 3D et polices : requêtes « no-cors » comme celles de la page, pour que la copie corresponde
  await Promise.all([THREE_URL,FONTS_URL].map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{})));}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const keep=(req,res)=>res&&(res.ok||res.type==='opaque')&&!/\/sims\//.test(req.url)&&(new URL(req.url).origin===location.origin||/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(req.url));
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
  const page=req.mode==='navigate'||(url.origin===location.origin&&/\/(index\.html)?$/.test(url.pathname));
  const cdn=/cdnjs\.cloudflare\.com|fonts\.gstatic\.com/.test(req.url);
  // moteur 3D et fichiers de police : versions figées, la copie locale suffit (plus rapide, et indispensable hors ligne)
  if(cdn){e.respondWith(caches.match(req,{ignoreVary:true}).then(hit=>hit||fetch(req).then(res=>{if(keep(req,res)){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});}return res;})));return;}
  e.respondWith(fetch(req,page?{cache:'no-cache'}:undefined).then(res=>{
    if(keep(req,res)){const copy=res.clone();caches.open(CACHE).then(c=>c.put(page?'./index.html':req,copy)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(req,{ignoreSearch:page,ignoreVary:true}).then(r=>r||(page?caches.match('./index.html'):null)).then(r=>r||Response.error())));
});
