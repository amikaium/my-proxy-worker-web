const TARGET_HOSTNAME = '7wickets.live'; // এখানে আপনার মেইন সাইটের ডোমেইন দিন

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. WebSocket সাপোর্ট (লাইভ টিভি এবং বেটিং সাইটের ডাটা আসার জন্য এটা মাস্ট)
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

  // ৩. রিকোয়েস্ট মডিফাই করে মেইন সাইটের দিকে পাঠানো
  url.hostname = TARGET_HOSTNAME;
  const proxyRequest = new Request(url.toString(), request);
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  
  if (request.headers.has('Origin')) {
    proxyRequest.headers.set('Origin', request.headers.get('Origin').replace(myDomain, TARGET_HOSTNAME));
  }
  if (request.headers.has('Referer')) {
    proxyRequest.headers.set('Referer', request.headers.get('Referer').replace(myDomain, TARGET_HOSTNAME));
  }

  // ৪. সার্ভার থেকে রেসপন্স আনা
  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৫. Security Headers (CSP) রিমুভ করা (যাতে আপনার ডোমেইনে blob: URL ব্লক না হয়)
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  
  // ৬. সব রেসপন্সে CORS অ্যালাউ করা
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();
  
  // ৭. টেক্সট বেসড ফাইলে (JS, JSON, HTML) ডোমেইন রিপ্লেস করা
  if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/javascript')) {
    let text = await response.text();
    
    // মেইন ডোমেইন এবং তার URL Encoded ভার্সন রিপ্লেস করা
    text = text.replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain);
    text = text.replace(new RegExp(encodeURIComponent(TARGET_HOSTNAME), 'g'), encodeURIComponent(myDomain));

    responseHeaders.delete('Content-Length');

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }

  // ৮. ভিডিও বা অন্য বাইনারি ডাটা সরাসরি ব্রাউজারে স্ট্রিম করা
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
