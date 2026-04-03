const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com';    
const LMT_TARGET = 'live.ckex.xyz'; // আপনার খুঁজে বের করা নতুন স্কোর সার্ভার

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;
  const referer = request.headers.get('Referer') || '';

  // ১. ব্রাউজার সিকিউরিটি বাইপাস
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

  // ২. রাউটিং: রিকোয়েস্ট কোন সার্ভারে যাবে?
  let targetHost = MAIN_TARGET;
  
  if (url.searchParams.has('__proxy_host')) {
    targetHost = url.searchParams.get('__proxy_host');
  } else if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.searchParams.has('__proxy_host')) {
        targetHost = refUrl.searchParams.get('__proxy_host');
      }
    } catch(e) {}
  }

  if (url.pathname.includes('/__video_proxy__/')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  }

  url.hostname = targetHost;
  url.searchParams.delete('__proxy_host');

  const proxyRequest = new Request(url.toString(), request);
  
  // সার্ভারগুলোকে ধোঁকা দেওয়া
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${targetHost}`);
  proxyRequest.headers.set('Referer', `https://${targetHost}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৩. রিডাইরেক্ট ফিক্স (যাতে এক সার্ভার থেকে অন্য সার্ভারে গেলেও প্রক্সি কাজ করে)
  const location = responseHeaders.get('Location');
  if (location) {
    try {
      const locUrl = new URL(location, `https://${targetHost}`);
      const newLoc = new URL(`https://${myDomain}${locUrl.pathname}${locUrl.search}`);
      newLoc.searchParams.set('__proxy_host', locUrl.hostname);
      newLoc.hash = locUrl.hash;
      responseHeaders.set('Location', newLoc.toString());
    } catch(e) {}
  }

  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৪. সব লিংকের ডোমেইন নেম পরিবর্তন করা (যাতে কোনো কিছু ব্লক না হয়)
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript')) {
      
    let text = await response.text();
    
    // মেইন সাইটের নাম রিপ্লেস
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    // লাইভ টিভির লিংক রিপ্লেস
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
    
    // স্কোরবোর্ডের প্রথম সার্ভার রিপ্লেস
    text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/?__proxy_host=${SCORE_TARGET}`);
    // স্কোরবোর্ডের দ্বিতীয় (লুকানো) সার্ভার রিপ্লেস
    text = text.replace(new RegExp(LMT_TARGET, 'g'), `${myDomain}/?__proxy_host=${LMT_TARGET}`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
