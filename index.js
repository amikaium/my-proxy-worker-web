const TARGET_HOSTNAME = '7wickets.live'; // মূল ডোমেইন

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. WebSocket সাপোর্ট
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
    url.hostname = TARGET_HOSTNAME;
    const wsRequest = new Request(url.toString(), request);
    wsRequest.headers.set('Host', TARGET_HOSTNAME);
    wsRequest.headers.set('Origin', `https://${TARGET_HOSTNAME}`);
    return fetch(wsRequest);
  }

  // ২. CORS Preflight বাইপাস
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ৩. রিকোয়েস্ট মডিফাই করা (Request Headers)
  url.hostname = TARGET_HOSTNAME;
  const proxyRequest = new Request(url.toString(), request);
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  
  if (request.headers.has('Origin')) {
    proxyRequest.headers.set('Origin', request.headers.get('Origin').replace(myDomain, TARGET_HOSTNAME));
  }
  if (request.headers.has('Referer')) {
    proxyRequest.headers.set('Referer', request.headers.get('Referer').replace(myDomain, TARGET_HOSTNAME));
  }

  // ক্লাউডফ্লেয়ারের নিজস্ব হেডার রিমুভ করা (যাতে অরিজিন সার্ভার ব্লক না করে)
  proxyRequest.headers.delete('cf-ray');
  proxyRequest.headers.delete('cf-connecting-ip');
  proxyRequest.headers.delete('cf-ipcountry');
  proxyRequest.headers.delete('cf-visitor');

  // ৪. সার্ভার থেকে রেসপন্স আনা
  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৫. Security Headers রিমুভ করা (Iframe এবং Blob ব্লক ঠেকানোর জন্য)
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('Content-Security-Policy-Report-Only');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Strict-Transport-Security'); // HSTS রিমুভ করা জরুরি

  // ৬. CORS অ্যালাউ করা
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');

  // ৭. রিডাইরেক্ট (Location Header) ফিক্স করা
  if (responseHeaders.has('Location')) {
    let location = responseHeaders.get('Location');
    location = location.replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain);
    responseHeaders.set('Location', location);
  }

  // ৮. কুকিজ (Set-Cookie) ফিক্স করা (অত্যন্ত জরুরি লাইভ টিভির সেশন ধরে রাখার জন্য)
  const setCookies = responseHeaders.get('Set-Cookie');
  if (setCookies) {
    // অরিজিনাল ডোমেইনের কুকি প্রক্সি ডোমেইনে সেট করা
    const modifiedCookies = setCookies.replace(new RegExp(TARGET_HOSTNAME, 'ig'), myDomain);
    responseHeaders.set('Set-Cookie', modifiedCookies);
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();
  
  // ৯. টেক্সট বেসড ফাইল এবং HLS/M3U8 ভিডিও প্লেলিস্টে ডোমেইন রিপ্লেস করা
  const isTextContent = contentType.includes('text/') || 
                        contentType.includes('application/json') || 
                        contentType.includes('application/javascript') ||
                        contentType.includes('application/x-javascript') ||
                        contentType.includes('application/vnd.apple.mpegurl') || // HLS Video Playlist
                        contentType.includes('audio/mpegurl');

  if (isTextContent) {
    let text = await response.text();
    
    // মেইন ডোমেইন, URL Encoded এবং Escaped ডোমেইন রিপ্লেস করার শক্তিশালী Regex
    const regex1 = new RegExp(`https://${TARGET_HOSTNAME}`, 'g');
    const regex2 = new RegExp(`http://${TARGET_HOSTNAME}`, 'g');
    const regex3 = new RegExp(TARGET_HOSTNAME, 'g');
    const regex4 = new RegExp(TARGET_HOSTNAME.replace(/\./g, '\\\\.'), 'g'); // যেমন: 7wickets\.live
    
    text = text.replace(regex1, `https://${myDomain}`)
               .replace(regex2, `http://${myDomain}`)
               .replace(regex4, myDomain)
               .replace(regex3, myDomain);

    // Content-Length ডিলিট করা কারণ টেক্সট মডিফাই করার পর সাইজ পরিবর্তন হয়ে যায়
    responseHeaders.delete('Content-Length');

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }

  // ১০. ভিডিও (.ts ফাইল), ইমেজ বা অন্য বাইনারি ডাটা সরাসরি ব্রাউজারে স্ট্রিম করা
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
