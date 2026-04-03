const TARGET_HOSTNAME = 'all9x.com';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // ১. ভিডিও প্লেয়ার (hls.js) এবং React API-এর জন্য CORS Preflight বাইপাস
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  const url = new URL(request.url);
  const myDomain = url.hostname; // আপনার ডাইনামিক ডোমেইন

  // রিকোয়েস্টের URL মেইন সাইটে পয়েন্ট করা
  url.hostname = TARGET_HOSTNAME;

  // ২. মেইন সার্ভারকে ধোঁকা দেওয়ার জন্য হেডার মডিফাই করা
  const proxyRequest = new Request(url.toString(), request);
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  
  if (request.headers.has('Origin')) {
    proxyRequest.headers.set('Origin', request.headers.get('Origin').replace(myDomain, TARGET_HOSTNAME));
  }
  if (request.headers.has('Referer')) {
    proxyRequest.headers.set('Referer', request.headers.get('Referer').replace(myDomain, TARGET_HOSTNAME));
  }

  // ৩. মেইন সাইট থেকে ডাটা নিয়ে আসা
  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);
  
  // ৪. সব ধরনের রেসপন্সে CORS অ্যালাউ করা (লাইভ ভিডিও প্লে হওয়ার জন্য এটা মাস্ট)
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  
  // রিডাইরেক্ট ফিক্স
  const location = responseHeaders.get('Location');
  if (location) {
    responseHeaders.set('Location', location.replace(TARGET_HOSTNAME, myDomain));
  }

  // ৫. Content-Type চেক করা (React, API এবং Live TV ফাইলের জন্য)
  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();
  const isM3U8Url = url.pathname.endsWith('.m3u8'); // m3u8 ফাইল কিনা চেক
  
  // আমরা শুধু টেক্সট বেসড ফাইলগুলোর ভেতরে ঢুকে লিংক বদলাবো
  const isTextContent = isM3U8Url || 
                        contentType.includes('text/') || 
                        contentType.includes('application/json') || 
                        contentType.includes('application/javascript') || 
                        contentType.includes('application/x-mpegurl') || 
                        contentType.includes('application/vnd.apple.mpegurl');

  if (isTextContent) {
    // ফাইলটি টেক্সট হিসেবে রিড করা
    let text = await response.text();
    
    // JS, JSON এবং m3u8 এর ভেতরে থাকা মেইন ডোমেইন রিপ্লেস করে আপনার ডোমেইন বসানো
    const regex = new RegExp(TARGET_HOSTNAME, 'g');
    text = text.replace(regex, myDomain);
    
    // React অ্যাপ অনেক সময় URL Encode করে JSON এ পাঠায়, সেটাও রিপ্লেস করা
    const encodedTarget = encodeURIComponent(TARGET_HOSTNAME);
    if (text.includes(encodedTarget)) {
        const encodedMyDomain = encodeURIComponent(myDomain);
        text = text.replace(new RegExp(encodedTarget, 'g'), encodedMyDomain);
    }

    // বডি সাইজ চেঞ্জ হওয়ার কারণে Content-Length মুছে দেওয়া
    responseHeaders.delete('Content-Length');

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }

  // ৬. ভিডিওর অংশ (.ts ফাইল) বা ইমেজের মতো বাইনারি ডাটা হলে সরাসরি স্ট্রিম করে দেওয়া
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
