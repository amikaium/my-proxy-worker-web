const MAIN_TARGET = '7wickets.live'; 
const SCORE_TARGET = 'score1.365cric.com';
const LMT_TARGET = 'live.ckex.xyz';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

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

  // ==========================================
  // ১. স্কোরবোর্ডের জন্য স্পেশাল প্রক্সি রাউট
  // ==========================================
  if (url.pathname.startsWith('/__score__/')) {
    let targetHost = SCORE_TARGET;
    
    // যদি লাইভ স্কোরের এপিআই (live.ckex.xyz) রিকোয়েস্ট করে
    if (url.searchParams.has('__host')) {
        targetHost = url.searchParams.get('__host');
        url.searchParams.delete('__host');
    }

    url.hostname = targetHost;
    url.pathname = url.pathname.replace('/__score__', '');

    const scoreReqHeaders = new Headers(request.headers);
    // সার্ভারকে ধোঁকা দেওয়ার জন্য হেডার চেঞ্জ (You are not authorized এর সমাধান)
    scoreReqHeaders.set('Host', targetHost);
    scoreReqHeaders.set('Origin', `https://${targetHost}`);
    scoreReqHeaders.set('Referer', `https://${targetHost}/`);

    const scoreReq = new Request(url.toString(), {
        method: request.method,
        headers: scoreReqHeaders,
        body: request.body,
        redirect: 'manual'
    });

    let response = await fetch(scoreReq);
    let responseHeaders = new Headers(response.headers);
    responseHeaders.delete('X-Frame-Options');
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();
    
    // স্কোরবোর্ডের ভেতরের ফাইলগুলোর লিংক ফিক্স করা
    if (contentType.includes('text/') || contentType.includes('javascript') || contentType.includes('json')) {
        let text = await response.text();
        text = text.replace(new RegExp(SCORE_TARGET, 'g'), `${myDomain}/__score__`);
        text = text.replace(new RegExp(LMT_TARGET, 'g'), `${myDomain}/__score__/?__host=${LMT_TARGET}`);
        responseHeaders.delete('Content-Length');
        return new Response(text, {status: response.status, headers: responseHeaders});
    }
    return new Response(response.body, {status: response.status, headers: responseHeaders});
  }

  // ==========================================
  // ২. মেইন সাইটের সাধারণ প্রক্সি
  // ==========================================
  url.hostname = MAIN_TARGET;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', MAIN_TARGET);
  proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
  proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);
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

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // HTML মডিফিকেশন এবং অটো-ফিক্সার ইনজেকশন
  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);

    // ==========================================
    // THE MASTER FIX: Auto Iframe Corrector (Updated)
    // ==========================================
    const iframeFixScript = `
    <script>
      setInterval(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          let currentSrc = iframe.src || '';
          
          // যদি লিংকটি ভুল করে শুধু আপনার ডোমেইন নিয়ে বসে থাকে
          if (currentSrc.includes('${myDomain}') && currentSrc.includes('score1')) {
            // Hash (#) এর পরের অংশটুকু (যেমন: /score1/35404287) আলাদা করা
            let hashPart = currentSrc.split('#')[1] || '';
            
            // জোর করে লিংকটিকে আমাদের প্রক্সি রাউটের (/__score__/) ভেতর পাঠানো
            let correctUrl = 'https://${myDomain}/__score__/#' + hashPart;
            
            if (iframe.src !== correctUrl) {
              iframe.src = correctUrl;
              console.log('✅ Scoreboard Link Auto-Fixed & Proxied!');
            }
          }
        });
      }, 500); 
    </script>
    `;

    text = text.replace('</body>', iframeFixScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  } 
  
  else if (contentType.includes('application/javascript') || contentType.includes('application/json')) {
    let text = await response.text();
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    
    // মেইন সাইটের JS ফাইল থেকে আসা সরাসরি লিংকগুলোকেও আমাদের প্রক্সিতে কনভার্ট করা
    text = text.replace(/https:\/\/score1\.365cric\.com/g, `https://${myDomain}/__score__`);
    
    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
