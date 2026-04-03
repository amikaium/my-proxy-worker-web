const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; // আপনার বের করা ভিডিও সার্ভার

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. CORS Preflight বাইপাস (ব্রাউজার যেন ব্লক না করে)
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

  // ২. রাউটিং লজিক: ভিডিওর রিকোয়েস্ট নাকি সাইটের রিকোয়েস্ট সেটা আলাদা করা
  let targetHost = MAIN_TARGET;
  
  if (url.pathname.startsWith('/__video_proxy__/')) {
    // যদি রিকোয়েস্টটি ভিডিওর হয়, তবে n11-production.click এ পাঠাও
    targetHost = STREAM_TARGET;
    url.hostname = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  } else {
    // সাধারণ রিকোয়েস্ট হলে 7wickets.live এ পাঠাও
    url.hostname = MAIN_TARGET;
  }

  const proxyRequest = new Request(url.toString(), request);
  
  // ৩. দুই সার্ভারকেই ধোঁকা দেওয়ার জন্য হেডার সেট করা
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${MAIN_TARGET}`);
  proxyRequest.headers.set('Referer', `https://${MAIN_TARGET}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৪. সব ধরনের সিকিউরিটি পলিসি মুছে ফেলা
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৫. কন্টেন্টের ভেতর লিংক রিপ্লেস করা (ম্যাজিকটা এখানেই)
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript') ||
      url.pathname.endsWith('.m3u8')) {
      
    let text = await response.text();
    
    // মেইন সাইটের নাম পাল্টে আপনার ডোমেইন বসানো
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    
    // ভিডিও সার্ভারের নাম (n11-production.click) পেলে সেখানে আমাদের স্পেশাল পাথ বসিয়ে দেওয়া
    // ফলে ব্রাউজার ভাববে ভিডিও আপনার ডোমেইন থেকেই আসছে!
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ৬. ভিডিওর অংশ (.ts) সরাসরি স্ট্রিম করে দেওয়া
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
