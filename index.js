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

  // ২. স্মার্ট রাউটিং (Path-based approach for SPA)
  let targetHost = MAIN_TARGET;

  // URL এর পাথ অনুযায়ী টার্গেট পরিবর্তন
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', ''); 
  } 
  else if (url.pathname.startsWith('/__score_proxy__')) {
    targetHost = SCORE_TARGET;
    url.pathname = url.pathname.replace('/__score_proxy__', ''); 
  }
  else if (url.pathname.startsWith('/__lmt_proxy__')) {
    targetHost = LMT_TARGET;
    url.pathname = url.pathname.replace('/__lmt_proxy__', ''); 
  }
  // Iframe এর ভেতর থেকে যখন API বা JS ফাইল কল হবে, তখন Referer চেক করে সঠিক টার্গেটে পাঠানো
  else if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.pathname.startsWith('/__score_proxy__')) {
        targetHost = SCORE_TARGET;
      } else if (refUrl.pathname.startsWith('/__lmt_proxy__')) {
        targetHost = LMT_TARGET;
      } else if (refUrl.pathname.startsWith('/__video_proxy__')) {
        targetHost = STREAM_TARGET;
      }
    } catch(e) {}
  }

  // পুরানো query parameter (proxy_host) মেথডটি বাদ দেওয়া হলো কারণ এটি SPA তে কাজ করে না

  url.hostname = targetHost;

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

  // ৩. নিখুঁত লিংক মডিফিকেশন
  if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('application/javascript')) {
      
    let text = await response.text();
    
    // Main
    const mainReg = new RegExp(`(^|[^\\w.-])${MAIN_TARGET}`, 'g');
    text = text.replace(mainReg, `$1${myDomain}`);
    
    // Video
    const streamReg = new RegExp(`(^|[^\\w.-])${STREAM_TARGET}`, 'g');
    text = text.replace(streamReg, `$1${myDomain}/__video_proxy__`);
    
    // Score (Path-based Replacement)
    const scoreReg = new RegExp(`(^|[^\\w.-])${SCORE_TARGET}`, 'g');
    text = text.replace(scoreReg, `$1${myDomain}/__score_proxy__`);
    
    // LMT (Path-based Replacement)
    const lmtReg = new RegExp(`(^|[^\\w.-])${LMT_TARGET}`, 'g');
    text = text.replace(lmtReg, `$1${myDomain}/__lmt_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
