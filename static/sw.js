self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalado');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Ativado');
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/add_tutorial') && event.request.method === 'POST') {
        console.log('[Service Worker] Interceptando upload para /add_tutorial');
        
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const file = formData.get('video');
                const totalSize = file.size;
                let uploadedSize = 0;

                const progressTrackingStream = new TransformStream({
                    transform(chunk, controller) {
                        uploadedSize += chunk.length;
                        const percentComplete = (uploadedSize / totalSize) * 100;
                        console.log('[Service Worker] Progresso:', percentComplete.toFixed(2) + '%');

                        // Enviar progresso para todos os clientes
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'progress',
                                    progress: percentComplete
                                });
                            });
                        });

                        controller.enqueue(chunk);
                    }
                });

                const newRequest = new Request(event.request.url, {
                    method: event.request.method,
                    headers: event.request.headers,
                    body: formData,
                    duplex: 'half'
                });

                return fetch(newRequest);
            })()
        );
    }
});