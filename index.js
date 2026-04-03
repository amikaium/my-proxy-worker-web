const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com';    

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;
  
  // ব্রাউজার কোথা থেকে রিকোয়েস্ট পাঠাচ্ছে সেটা চেক করা
  const referer = request.headers.get('Referer') || '';

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

  // রাউটিং লজিক: ফাইলগুলো কার কাছে যাবে?
  let targetHost = MAIN_TARGET;
  
  // ১. ভিডিওর রিকোয়েস্ট ট্র্যাকিং
  if (url.pathname.includes('/__video_proxy__') || referer.includes('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.hostname = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  } 
  // ২. স্কোরবোর্ডের রিকোয়েস্ট ট্র্যাকিং (যাতে ফাঁকা না দেখায়)
  else if (url.pathname.includes('/__score_proxy__') || referer.includes('/__score_proxy__')) {
    targetHost = SCORE_TARGET;
    url.hostname = SCORE_TARGET;
    url.pathname = url.pathname.replace('/__score_proxy__', ''); 
  } 
  // ৩. মেইন সাইটের রিকোয়েস্ট
  else {
    url.hostname = MAIN_TARGET;
  }

  const proxyRequest = new Request(url.toString(), request);
  
  // আসল সার্ভারগুলোকে বোকা বানানোর জন্য হেডার সেট করা
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${targetHost}`);
  proxyRequest.headers.set('Referer', `https://${targetHost}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ব্রাউজারের সিকিউরিটি ব্লক মুছে ফেলা
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // কন্টেন্টের লিংকগুলো পাল্টে দেওয়া
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript') ||
      url.pathname.endsWith('.m3u8')) {
      
    let text = await response.text();
    
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
    text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/__score_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
