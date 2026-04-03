const TARGET_HOSTNAME = '7wickets.live'; 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. WebSockets সাপোর্ট (স্কোরবোর্ডের জন্য)
  if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
    url.hostname = TARGET_HOSTNAME;
    const wsRequest = new Request(url.toString(), request);
    wsRequest.headers.set('Host', TARGET_HOSTNAME);
    wsRequest.headers.set('Origin', `https://${TARGET_HOSTNAME}`);
    return fetch(wsRequest);
  }

  // ২. CORS Preflight (ভিডিও প্লেয়ারের জন্য মাস্ট)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ৩. মেইন রিকোয়েস্ট তৈরি করা
  url.hostname = TARGET_HOSTNAME;
  const proxyRequest = new Request(url.toString(), request);
  
  // স্ট্রিমিং সার্ভারকে ধোঁকা দিতে Origin এবং Referer রিমুভ/মডিফাই করা
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  proxyRequest.headers.set('Origin', `https://${TARGET_HOSTNAME}`);
  proxyRequest.headers.set('Referer', `https://${TARGET_HOSTNAME}/`);

  // ৪. সার্ভার থেকে রেসপন্স আনা
  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৫. Security Headers রিমুভ করা
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('X-Content-Type-Options');
  
  // ৬. সব রেসপন্সে অ্যাগ্রেসিভ CORS অ্যালাউ করা (ভিডিওর জন্য)
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  responseHeaders.set('Access-Control-Allow-Headers', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();
  
  // ৭. M3U8 প্লেলিস্ট বা টেক্সট ফাইলের ভেতরে ডোমেইন রিপ্লেস করা
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript') ||
      contentType.includes('application/vnd.apple.mpegurl') || 
      contentType.includes('application/x-mpegurl') ||
      url.pathname.endsWith('.m3u8')) {
      
    let text = await response.text();
    text = text.replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain);
    
    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ৮. .ts ভিডিও ফাইল বা অন্য বাইনারি ডাটা সরাসরি স্ট্রিম করা
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
