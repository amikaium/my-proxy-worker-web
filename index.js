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

  let targetHost = MAIN_TARGET;
  let isScore = false;
  let isStream = false;
  let isLmt = false;

  // ২. পাথ রাউটিং (Path Routing)
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
  // ৩. রেফারার রাউটিং (Iframe এর ভেতরের ফাইলগুলোর জন্য)
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

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  proxyReqHeaders.set('Origin', `https://${targetHost}`);
  
  if (isScore) proxyReqHeaders.set('Referer', `https://${SCORE_TARGET}/`);
  else if (isStream) proxyReqHeaders.set('Referer', `https://${STREAM_TARGET}/`);
  else if (isLmt) proxyReqHeaders.set('Referer', `https://${LMT_TARGET}/`);
  else proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);

  proxyReqHeaders.delete('Accept-Encoding');

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: proxyReqHeaders,
    body: request.body,
    redirect: 'manual'
  });

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

  // রিডাইরেক্ট হ্যান্ডলিং
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${SCORE_TARGET}`, `https://${myDomain}/__score_proxy__/`);
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৪. HTML ফাইলের জন্য স্পেশাল ফিক্স এবং আপনার ম্যাজিক স্ক্রিপ্ট ইনজেকশন
  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(/integrity="[^"]*"/ig, '');
    text = text.replace(/crossorigin="[^"]*"/ig, '');
    text = text.replace(/<meta[^>]*name="referrer"[^>]*>/ig, '');
    text = text.replace('<head>', '<head><meta name="referrer" content="unsafe-url">');

    text = text.replace(new RegExp(`https://${MAIN_TARGET}/?`, 'g'), `https://${myDomain}/`);
    text = text.replace(new RegExp(`//${MAIN_TARGET}/?`, 'g'), `//${myDomain}/`);

    text = text.replace(new RegExp(`https://${SCORE_TARGET}/?`, 'g'), `https://${myDomain}/__score_proxy__/`);
    text = text.replace(new RegExp(`//${SCORE_TARGET}/?`, 'g'), `//${myDomain}/__score_proxy__/`);

    text = text.replace(new RegExp(`https://${STREAM_TARGET}/?`, 'g'), `https://${myDomain}/__video_proxy__/`);
    text = text.replace(new RegExp(`//${STREAM_TARGET}/?`, 'g'), `//${myDomain}/__video_proxy__/`);

    text = text.replace(new RegExp(`https://${LMT_TARGET}/?`, 'g'), `https://${myDomain}/__lmt_proxy__/`);
    text = text.replace(new RegExp(`//${LMT_TARGET}/?`, 'g'), `//${myDomain}/__lmt_proxy__/`);

    // ==========================================
    // আপনার আইডিয়া: Auto Match ID Finder & Fixer
    // ==========================================
    const dynamicScoreScript = `
    <script>
      setInterval(() => {
        try {
          // ১. বর্তমান পেজের লিংক থেকে ম্যাচ আইডি বের করা
          // উদাহরণ: url যদি /exchange/match/cricket/35422778 হয়, তাহলে 35422778 বের করবে
          const urlParts = window.location.pathname.split('/');
          const matchId = urlParts[urlParts.length - 1]; 
          
          // চেক করা হচ্ছে এটা আসলেই কোনো নাম্বার (ম্যাচ আইডি) কিনা
          if (matchId && !isNaN(matchId)) {
            const myDomain = window.location.hostname;
            // আমাদের প্রক্সি করা নতুন নিখুঁত লিংক তৈরি করা
            const correctUrl = 'https://' + myDomain + '/__score_proxy__/#/score1/' + matchId;
            
            // ২. আইফ্রেম খুঁজে বের করা (id="myIframe" অথবা যেকোনো iframe)
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
              // আমরা শুধু স্কোরবোর্ডের আইফ্রেমটাকেই টার্গেট করব
              if (iframe.id === 'myIframe' || iframe.src.includes('score') || iframe.src.includes('__score_proxy__')) {
                // লিংক যদি আগে থেকেই ঠিক না থাকে, তবেই আপডেট করবে (লুপ ঠেকানোর জন্য)
                if (iframe.src !== correctUrl) {
                  iframe.src = correctUrl;
                  console.log('🔥 Scoreboard ID Matched & Proxied Successfully: ', matchId);
                }
              }
            });
          }
        } catch(e) {}
      }, 1000); // প্রতি ১ সেকেন্ড পর পর চেক করবে
    </script>
    `;

    // পেজের একদম শেষে আমাদের স্ক্রিপ্ট বসিয়ে দেওয়া হচ্ছে
    text = text.replace('</body>', dynamicScoreScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ৫. JS/JSON ফাইলের লিংক রিপ্লেসমেন্ট
  else if (contentType.includes('application/javascript') || contentType.includes('text/javascript') || contentType.includes('application/json')) {
    let text = await response.text();

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

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
