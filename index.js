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

  // ২. স্মার্ট রাউটিং (কোন ফাইল কোন সার্ভার থেকে আসবে তা ঠিক করা)
  let targetHost = MAIN_TARGET;
  
  if (url.pathname.includes('/__video_proxy__/') || referer.includes('/__video_proxy__/')) {
    targetHost = STREAM_TARGET;
    url.hostname = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  } 
  else if (url.pathname.includes('/__score_proxy__/') || referer.includes('/__score_proxy__/')) {
    targetHost = SCORE_TARGET;
    url.hostname = SCORE_TARGET;
    url.pathname = url.pathname.replace('/__score_proxy__', ''); 
  } 
  else {
    url.hostname = MAIN_TARGET;
  }

  const proxyRequest = new Request(url.toString(), request);
  
  // সার্ভারগুলোকে ধোঁকা দেওয়া
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${targetHost}`);
  proxyRequest.headers.set('Referer', `https://${targetHost}/`);

  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৩. কন্টেন্ট মডিফিকেশন (আসল ম্যাজিক)
  if (contentType.includes('text/') || 
      contentType.includes('application/json') || 
      contentType.includes('application/javascript') ||
      url.pathname.endsWith('.m3u8')) {
      
    let text = await response.text();
    
    // যদি ফাইলটি স্কোরবোর্ডের হয়, তবে তার ভেতরের রিলেটিভ পাথগুলো ফিক্স করা (যাতে ফাঁকা না দেখায়)
    if (targetHost === SCORE_TARGET) {
        // src="/assets/..." কে src="/__score_proxy__/assets/..." তে কনভার্ট করা
        text = text.replace(/(src|href)="\/([^/])/g, `$1="/__score_proxy__/$2`);
        text = text.replace(/(src|href)='\/([^/])/g, `$1='/__score_proxy__/$2`);
        text = text.replace(/https:\/\/score1\.365cric\.com/g, `https://${myDomain}/__score_proxy__`);
    } 
    // যদি ফাইলটি মেইন সাইটের হয়
    else {
        text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
        text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
        text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/__score_proxy__`);
    }

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
