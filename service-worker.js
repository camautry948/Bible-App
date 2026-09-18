const APP_CACHE='journey-v3';
const BIBLE_CACHE='journey-bible-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(APP_CACHE).then(c=>c.addAll(SHELL)));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(k=>k!==APP_CACHE && k!==BIBLE_CACHE)
        .map(k=>caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;

  const u=new URL(e.request.url);

  if(u.hostname==='bible-api.com'){
    e.respondWith((async()=>{
      const bible=await caches.open(BIBLE_CACHE);

      const saved=await bible.match(e.request);
      if(saved) return saved;

      try{
        const r=await fetch(e.request);

        if(r.ok){
          await bible.put(e.request,r.clone());
        }

        return r;
      }catch(err){
        return new Response(
          JSON.stringify({error:'offline'}),
          {
            status:503,
            headers:{
              'Content-Type':'application/json'
            }
          }
        );
      }
    })());

    return;
  }

  // Network-first for app updates.
  // Cache fallback keeps the installed app usable offline.
  e.respondWith((async()=>{
    const c=await caches.open(APP_CACHE);

    try{
      const r=await fetch(e.request);

      if(r.ok){
        await c.put(e.request,r.clone());
      }

      return r;
    }catch(err){
      return (
        (await c.match(e.request)) ||
        (await c.match('./index.html'))
      );
    }
  })());
});
