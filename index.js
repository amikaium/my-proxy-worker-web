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
  const referer = request.headers.get('Referer') || '';

  // ১. ব্রাউজার সিকিউরিটি বাইপাস
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

  // ২. স্মার্ট রাউটিং (স্কোরবোর্ডের ফাইলগুলো যেন নিখুঁতভাবে লোড হয়)
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

  // ভিডিও সার্ভারের রাউটিং
  if (url.pathname.includes('/__video_proxy__/')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  }

  url.hostname = targetHost;
  url.searchParams.delete('__proxy_host');

  const proxyRequest = new Request(url.toString(), request);
  
  proxyRequest.headers.set('Host', targetHost);
  proxyRequest.headers.set('Origin', `https://${targetHost}`);
  proxyRequest.headers.set('Referer', `https://${targetHost}/`);

  let response;
  try {
    response = await fetch(proxyRequest);
  } catch (err) {
    return new Response("Server Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৩. নিখুঁত লিংক মডিফিকেশন (সাবডোমেইন ভাঙবে না)
  if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/javascript')) {
      
    let text = await response.text();
    
    // এই Regex নিশ্চিত করবে যে casino.7wickets.live এর মতো লিংকগুলো পাল্টে যাবে না
    const mainReg = new RegExp(`(^|[^\\w.-])${MAIN_TARGET}`, 'g');
    text = text.replace(mainReg, `$1${myDomain}`);
    
    const streamReg = new RegExp(`(^|[^\\w.-])${STREAM_TARGET}`, 'g');
    text = text.replace(streamReg, `$1${myDomain}/__video_proxy__`);
    
    const scoreReg = new RegExp(`(^|[^\\w.-])${SCORE_TARGET}`, 'g');
    text = text.replace(scoreReg, `$1${myDomain}/?__proxy_host=${SCORE_TARGET}`);
    
    const lmtReg = new RegExp(`(^|[^\\w.-])${LMT_TARGET}`, 'g');
    text = text.replace(lmtReg, `$1${myDomain}/?__proxy_host=${LMT_TARGET}`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
