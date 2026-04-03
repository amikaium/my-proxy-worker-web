const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; // লাইভ টিভির সার্ভার
const SCORE_TARGET = 'score1.365cric.com';    // স্কোরবোর্ডের সার্ভার

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. CORS Preflight বাইপাস
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

  // ২. রাউটিং লজিক: রিকোয়েস্টটি কার কাছে যাবে তা নির্ধারণ করা
  let targetHost = MAIN_TARGET;
  
  if (url.pathname.startsWith('/__video_proxy__/')) {
    // ভিডিওর রিকোয়েস্ট হলে
    targetHost = STREAM_TARGET;
    url.hostname = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  } else if (url.pathname.startsWith('/__score_proxy__/')) {
    // স্কোরবোর্ডের রিকোয়েস্ট হলে
    targetHost = SCORE_TARGET;
    url.hostname = SCORE_TARGET;
    url.pathname = url.pathname.replace('/__score_proxy__', ''); 
  } else {
    // সাধারণ সাইটের রিকোয়েস্ট হলে
    url.hostname = MAIN_TARGET;
  }

  const proxyRequest = new Request(url.toString(), request);
  
  // ৩. সব সার্ভারকেই ধোঁকা দেওয়ার জন্য হেডার সেট করা (যাতে Unauthorized না দেখায়)
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${MAIN_TARGET}`);
  proxyRequest.headers.set('Referer', `https://${MAIN_TARGET}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৪. সব ধরনের সিকিউরিটি পলিসি মুছে ফেলা (iframe সাপোর্ট করার জন্য X-Frame-Options মাস্ট ডিলিট করতে হবে)
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৫. কন্টেন্টের ভেতর লিংক রিপ্লেস করা
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript') ||
      url.pathname.endsWith('.m3u8')) {
      
    let text = await response.text();
    
    // মেইন সাইটের নাম রিপ্লেস করা
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    
    // ভিডিও সার্ভারের নাম পেলে সেখানে আমাদের স্পেশাল ভিডিও পাথ বসিয়ে দেওয়া
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // স্কোরবোর্ডের নাম পেলে সেখানে আমাদের স্পেশাল স্কোর পাথ বসিয়ে দেওয়া
    text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/__score_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ৬. বাইনারি ফাইল সরাসরি স্ট্রিম করে দেওয়া
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
