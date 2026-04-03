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

  // ১. ব্রাউজার সিকিউরিটি বাইপাস (CORS)
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

  // ২. স্মার্ট রাউটিং লজিক 
  let targetHost = MAIN_TARGET;
  let isScore = false;
  let isStream = false;
  let isLmt = false;

  // URL পাথ চেক করা
  if (url.pathname.startsWith('/__score_proxy__')) {
    targetHost = SCORE_TARGET;
    isScore = true;
    url.pathname = url.pathname.replace('/__score_proxy__', '') || '/';
  } else if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    isStream = true;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  } else if (url.pathname.startsWith('/__lmt_proxy__')) {
    targetHost = LMT_TARGET;
    isLmt = true;
    url.pathname = url.pathname.replace('/__lmt_proxy__', '') || '/';
  }
  // ব্যাকগ্রাউন্ড API/JS কলের জন্য Referer চেক করা
  else if (referer) {
    if (referer.includes('/__score_proxy__')) {
      targetHost = SCORE_TARGET;
      isScore = true;
    } else if (referer.includes('/__video_proxy__')) {
      targetHost = STREAM_TARGET;
      isStream = true;
    } else if (referer.includes('/__lmt_proxy__')) {
      targetHost = LMT_TARGET;
      isLmt = true;
    }
  }

  url.hostname = targetHost;

  // ৩. রিকোয়েস্ট কাস্টমাইজেশন
  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  proxyReqHeaders.set('Origin', `https://${targetHost}`);
  
  // অরিজিনাল সার্ভারকে ধোকা দেওয়ার জন্য সঠিক Referer সেট করা
  if (isScore) proxyReqHeaders.set('Referer', `https://${SCORE_TARGET}/`);
  else if (isStream) proxyReqHeaders.set('Referer', `https://${STREAM_TARGET}/`);
  else if (isLmt) proxyReqHeaders.set('Referer', `https://${LMT_TARGET}/`);
  else proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);

  // [সবচেয়ে গুরুত্বপূর্ণ ফিক্স]: সার্ভারকে সংকুচিত (GZIP/Brotli) ফাইল পাঠাতে নিষেধ করা
  // যাতে আমরা কোড এডিট করতে পারি এবং ফাইল করাপ্ট না হয়।
  proxyReqHeaders.delete('Accept-Encoding');

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: proxyReqHeaders,
    body: request.body,
    redirect: 'manual' // Redirect আমরা নিজে মডিফাই করবো
  });

  let response;
  try {
    response = await fetch(proxyRequest);
  } catch (err) {
    return new Response("Server Connection Error", { status: 500 });
  }

  // ৪. রেসপন্স মডিফিকেশন
  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  // যদি সার্ভার Redirect করে, তবে আমাদের লিংকেও তা ঠিক করা
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${SCORE_TARGET}`, `https://${myDomain}/__score_proxy__`);
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৫. নিখুঁত লিংক রিপ্লেসমেন্ট (শুধুমাত্র টেক্সট/কোড ফাইলের জন্য)
  if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/javascript') || contentType.includes('application/json')) {
      
    let text = await response.text();
    
    // https:// এবং // (protocol relative) উভয় ধরনের লিংক রিপ্লেস করা
    text = text.replace(new RegExp(`https://${MAIN_TARGET}`, 'g'), `https://${myDomain}`);
    text = text.replace(new RegExp(`//${MAIN_TARGET}`, 'g'), `//${myDomain}`);

    text = text.replace(new RegExp(`https://${SCORE_TARGET}`, 'g'), `https://${myDomain}/__score_proxy__`);
    text = text.replace(new RegExp(`//${SCORE_TARGET}`, 'g'), `//${myDomain}/__score_proxy__`);

    text = text.replace(new RegExp(`https://${STREAM_TARGET}`, 'g'), `https://${myDomain}/__video_proxy__`);
    text = text.replace(new RegExp(`//${STREAM_TARGET}`, 'g'), `//${myDomain}/__video_proxy__`);

    text = text.replace(new RegExp(`https://${LMT_TARGET}`, 'g'), `https://${myDomain}/__lmt_proxy__`);
    text = text.replace(new RegExp(`//${LMT_TARGET}`, 'g'), `//${myDomain}/__lmt_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ছবি, ভিডিও বা ফন্টের ক্ষেত্রে যেমন আছে তেমনই রিটার্ন করা
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
