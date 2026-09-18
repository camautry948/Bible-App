const CACHE='journey-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(SHELL))
  )
);

self.addEventListener('activate',e=>
  e.waitUntil(self.clients.claim())
);

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);

  if(u.hostname==='bible-api.com'){
    e.respondWith(
      caches.open(CACHE).then(async c=>{
        try{
          const r=await fetch(e.request);
          if(r.ok)c.put(e.request,r.clone());
          return r;
        }catch(err){
          return (await c.match(e.request)) ||
            new Response(
              JSON.stringify({error:'offline'}),
              {
                status:503,
                headers:{'Content-Type':'application/json'}
              }
            );
        }
      })
    );
  } else if(e.request.method==='GET'){
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request))
    );
  }
});
