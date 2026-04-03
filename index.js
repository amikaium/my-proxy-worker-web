const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com';    
const LMT_TARGET = 'live.ckex.xyz';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. ব্রাউজারের সিকিউরিটি ব্লক সরানো
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

  // ২. লাইভ ভিডিও বাইপাস
  if (url.pathname.includes('/__video_proxy__/')) {
    url.hostname = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
    return proxyRequest(request, url, STREAM_TARGET, myDomain, false);
  }

  // ৩. ডাইনামিক হোস্ট ট্র্যাকিং (স্কোরবোর্ডের API এবং WebSockets এর জন্য)
  if (url.searchParams.has('__proxy_host')) {
    const target = url.searchParams.get('__proxy_host');
    url.hostname = target;
    url.searchParams.delete('__proxy_host');
    return proxyRequest(request, url, target, myDomain, true);
  }

  // ৪. অটো-ফলব্যাক ইঞ্জিন (ফাঁকা/কালো স্ক্রিনের ম্যাজিক সমাধান)
  // প্রথমে মেইন সাইট থেকে ফাইল খোঁজার চেষ্টা করবে
  let response = await proxyRequest(request, url, MAIN_TARGET, myDomain, true);
  let status = response.status;
  let cType = (response.headers.get('content-type') || '').toLowerCase();
  
  // চেক করা হচ্ছে ফাইলটি কোনো ডিজাইন বা স্ক্রিপ্ট ফাইল কিনা
  let isAsset = request.method === 'GET' && url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|json)$/i);
  
  // মেইন সাইটে ফাইলটি না পেলে (404) বা ফাইলটি মিসিং থাকলে
  let isFailed = status === 404 || status === 403 || (isAsset && cType.includes('text/html'));

  if (isFailed && isAsset) {
     // নিজে থেকেই LMT (live.ckex.xyz) সার্ভারে ফাইলটি খুঁজবে
     let fallback1 = await proxyRequest(request, url, LMT_TARGET, myDomain, true);
     if (fallback1.status === 200) return fallback1;
     
     // সেখানেও না পেলে score1.365cric.com সার্ভারে খুঁজবে
     let fallback2 = await proxyRequest(request, url, SCORE_TARGET, myDomain, true);
     if (fallback2.status === 200) return fallback2;
  }

  return response;
}

// প্রক্সি করার মূল ফাংশন
async function proxyRequest(originalRequest, targetUrl, targetHost, myDomain, rewriteContent) {
  let init = {
      method: originalRequest.method,
      headers: new Headers(originalRequest.headers),
      redirect: 'manual'
  };
  
  if (!['GET', 'HEAD'].includes(originalRequest.method)) {
      init.body = originalRequest.clone().body;
  }

  // মেইন সার্ভারগুলোকে ধোঁকা দেওয়ার জন্য হেডার পরিবর্তন
  init.headers.set('Host', targetHost);
  init.headers.set('Origin', `https://${targetHost}`);
  init.headers.set('Referer', `https://${targetHost}/`);
  
  // WebSockets সাপোর্ট (লাইভ স্কোর আপডেটের জন্য)
  if (init.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
     return fetch(targetUrl.toString(), init);
  }

  let response = await fetch(targetUrl.toString(), init);
  let responseHeaders = new Headers(response.headers);

  // রিডাইরেক্ট লিংক ফিক্স করা
  let location = responseHeaders.get('Location');
  if (location) {
     try {
        let locUrl = new URL(location, `https://${targetHost}`);
        let newLoc = new URL(`https://${myDomain}${locUrl.pathname}${locUrl.search}`);
        newLoc.searchParams.set('__proxy_host', locUrl.hostname);
        responseHeaders.set('Location', newLoc.toString());
     } catch(e) {}
  }

  // আইফ্রেম এবং ব্রাউজার সিকিউরিটি বাইপাস
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  let cType = (responseHeaders.get('content-type') || '').toLowerCase();

  // ৫. সব সার্ভারের কন্টেন্ট ერთ করে আপনার ডোমেইনে বসানো
  if (rewriteContent && (cType.includes('text/') || cType.includes('application/json') || cType.includes('application/javascript'))) {
     let text = await response.text();
     
     text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
     text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/?__proxy_host=${SCORE_TARGET}`);
     text = text.replace(new RegExp(LMT_TARGET, 'g'), `${myDomain}/?__proxy_host=${LMT_TARGET}`);
     text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);

     responseHeaders.delete('Content-Length');
     return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
