importScripts('./ngsw-worker.js');

const playlists = {};
const pwaBroadcastChannel = new BroadcastChannel('ytd-pwa');
const messagesCallbacks = {
  'playlist-info': ({ playlist }) => {
    console.log('[Service Worker]: Callback for playlist-info message', playlist);
    playlists[playlist.uuid] = playlist;
    console.log('[Service Worker]: playlists', playlists)
  }
}

pwaBroadcastChannel.onmessage = async (event) => {
  console.log("Received message from pwa app", event);
  if(event.data && event.data.name) {
    await messagesCallbacks[event.data.name](event.data.payload || {});
  }
}

self.addEventListener('backgroundfetchclick', (event) => {
  console.log('[Service Worker]: event backgroundfetchclick', event, clients);
  event.waitUntil(
    (async function() {
      // get playlist info somehow
      // const playlist = await getPlaylist(event.registration.id);
      if(event.registration.result !== 'success') {
        return;
      }
      pwaBroadcastChannel.postMessage({name: 'PLAYLIST_PLAY', payload: { id: event.registration.id }});
      clients.openWindow('url per riprodurre la playlist');
    })()
  );
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.log('[Service Worker]: Background Fetch failed', event);
  event.waitUntil(
    (async function() {
      // get playlist info somehow
      // const playlist = await getPlaylist(event.registration.id);
      pwaBroadcastChannel.postMessage({name: 'PLAYLIST_FAILED', payload: { id: event.registration.id }});
      event.updateUI({ title: 'Failed' });
    })()
  );
});

self.addEventListener('backgroundfetchabort', (event) => {
  console.log('[Service Worker]: Background Fetch aborted', event);
  event.waitUntil(
    (async function() {
      // get playlist info somehow
      // const playlist = await getPlaylist(event.registration.id);
      pwaBroadcastChannel.postMessage({name: 'PLAYLIST_ABORTED', payload: { id: event.registration.id }});
      event.updateUI({ title: 'Aborted' });
    })()
  );
});


self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[Service Worker]: Background Fetch Success', event);
  event.waitUntil(
    (async function() {
      try {
        const cache = await caches.open(event.registration.id);
        const records = await event.registration.matchAll();
        const promises = records.map(async (record) => {
          const response = await record.responseReady;
          await cache.put(record.request, response);
        });
        await Promise.all(promises);


        pwaBroadcastChannel.postMessage({name: 'PLAYLIST_DOWNLOADED', payload: { id: event.registration.id }});
        const playlist = playlists[event.registration.id];
        // Update the progress notification.
        event.updateUI({ title: `Playlist ${playlist.name} downloaded` });
      } catch (err) {
        console.error(err)
      }
    })()
  );
});
