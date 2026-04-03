const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com';    

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

  // ২. স্মার্ট ডাইনামিক রাউটিং (ফাঁকা পেজের সমাধান)
  let targetHost = MAIN_TARGET;
  
  // চেক করা হচ্ছে রিকোয়েস্টটি কোন সার্ভারের জন্য
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

  // লাইভ টিভির ভিডিওর জন্য আগের নিয়মই থাকছে (যাতে ভিডিও নষ্ট না হয়)
  if (url.pathname.includes('/__video_proxy__/')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  }

  // রিকোয়েস্টের টার্গেট সেট করা
  url.hostname = targetHost;
  
  // মেইন সার্ভারে পাঠানোর আগে আমাদের গোপন প্যারামিটারটি মুছে ফেলা
  url.searchParams.delete('__proxy_host');

  const proxyRequest = new Request(url.toString(), request);
  
  // সার্ভারগুলোকে ধোঁকা দেওয়া
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${targetHost}`);
  proxyRequest.headers.set('Referer', `https://${targetHost}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৩. রিডাইরেক্ট ফিক্স (যদি live.ckex.xyz বা অন্য কোথাও পাঠায়, সেটাও আমাদের প্রক্সি দিয়ে যাবে)
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

  // আইফ্রেম সাপোর্ট করার জন্য ব্লকগুলো মুছে ফেলা
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৪. কন্টেন্ট মডিফিকেশন
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript')) {
      
    let text = await response.text();
    
    if (targetHost === MAIN_TARGET) {
      // মেইন সাইটের নাম রিপ্লেস
      text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
      // ভিডিওর লিংক রিপ্লেস
      text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
      // স্কোরবোর্ডের লিংক রিপ্লেস (ম্যাজিক ট্রিক: এখানে প্যারামিটার যুক্ত করা হচ্ছে)
      text = text.replace(/https:\/\/score1\.365cric\.com/g, `https://${myDomain}/?__proxy_host=${SCORE_TARGET}`);
    } 
    else {
      // স্কোরবোর্ড বা অন্য সার্ভারের ভেতরের লিংকগুলো প্রক্সির আওতায় আনা
      text = text.replace(new RegExp(targetHost, 'g'), `${myDomain}/?__proxy_host=${targetHost}`);
    }

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
