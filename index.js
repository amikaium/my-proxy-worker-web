const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 

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

  let targetHost = MAIN_TARGET;
  let isStream = false;

  // ভিডিওর জন্য প্রক্সি (যেহেতু ভিডিও প্রক্সি ছাড়া চলে না)
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    isStream = true;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  } 
  else if (request.headers.get('Referer') && request.headers.get('Referer').includes('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    isStream = true;
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  proxyReqHeaders.set('Origin', `https://${targetHost}`);
  
  if (isStream) {
      proxyReqHeaders.set('Referer', `https://${STREAM_TARGET}/`);
  } else {
      proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);
  }

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

  // রিডাইরেক্ট 
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // HTML মডিফিকেশন 
  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(/integrity="[^"]*"/ig, '');
    text = text.replace(/crossorigin="[^"]*"/ig, '');
    
    // এই মেটা ট্যাগটি আসল সার্ভারকে আপনার ডোমেইনের নাম দেখতে দেবে না (Not Authorized ঠেকানোর জন্য)
    text = text.replace(/<meta[^>]*name="referrer"[^>]*>/ig, '');
    text = text.replace('<head>', '<head><meta name="referrer" content="no-referrer">');

    // মেইন সাইট এবং ভিডিও লিংক রিপ্লেসমেন্ট
    text = text.replace(new RegExp(`https://${MAIN_TARGET}/?`, 'g'), `https://${myDomain}/`);
    text = text.replace(new RegExp(`//${MAIN_TARGET}/?`, 'g'), `//${myDomain}/`);
    text = text.replace(new RegExp(`https://${STREAM_TARGET}/?`, 'g'), `https://${myDomain}/__video_proxy__/`);
    text = text.replace(new RegExp(`//${STREAM_TARGET}/?`, 'g'), `//${myDomain}/__video_proxy__/`);

    // ==========================================
    // আপনার চাওয়া লজিক: Direct Original Link + Match ID
    // ==========================================
    const dynamicScoreScript = `
    <script>
      setInterval(() => {
        try {
          // ১. ইউআরএল এর একদম শেষের অংশ (স্ল্যাশের পরের অংশ) বের করা
          const pathArray = window.location.pathname.split('/').filter(Boolean);
          const matchId = pathArray[pathArray.length - 1]; 
          
          if (matchId && /^\\d+$/.test(matchId)) {
            
            // ২. একদম হুবহু আসল লিংক তৈরি করা (কোনো প্রক্সি ছাড়া)
            const correctUrl = 'https://score1.365cric.com/#/score1/' + matchId;
            
            // ৩. লুকানো বক্সটাকে খুঁজে বের করা
            const scoreArea = document.querySelector('.score_area') || 
                              document.getElementById('animScore') || 
                              document.querySelector('.center-m');

            if (scoreArea) {
              scoreArea.style.setProperty('display', 'block', 'important');
              scoreArea.style.setProperty('visibility', 'visible', 'important');
              scoreArea.style.minHeight = '190px'; 
            }

            // ৪. আইফ্রেম খুঁজে বের করা বা তৈরি করা
            let iframe = document.getElementById('myIframe');
            
            if (!iframe && scoreArea) {
                iframe = document.createElement('iframe');
                iframe.id = 'myIframe';
                iframe.setAttribute('allowfullscreen', 'true');
                scoreArea.prepend(iframe); 
            }

            if (iframe) {
              iframe.style.setProperty('display', 'block', 'important');
              iframe.style.setProperty('visibility', 'visible', 'important');
              iframe.style.setProperty('width', '100%', 'important');
              iframe.style.setProperty('height', '190px', 'important'); 
              iframe.style.setProperty('border', 'none', 'important');
              iframe.style.setProperty('background-color', '#fff', 'important'); 
              
              if (iframe.parentElement) {
                 iframe.parentElement.style.setProperty('display', 'block', 'important');
              }

              // ৫. আসল লিংকটি বসিয়ে দেওয়া
              if (iframe.src !== correctUrl) {
                iframe.src = correctUrl;
                console.log('✅ Injected Exact Original Link:', correctUrl);
              }
            }
          }
        } catch(e) {}
      }, 500); 
    </script>
    `;

    text = text.replace('</body>', dynamicScoreScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  else if (contentType.includes('application/javascript') || contentType.includes('text/javascript') || contentType.includes('application/json')) {
    let text = await response.text();

    text = text.replace(new RegExp(`https://${MAIN_TARGET}`, 'g'), `https://${myDomain}`);
    text = text.replace(new RegExp(`//${MAIN_TARGET}`, 'g'), `//${myDomain}`);
    text = text.replace(new RegExp(`https://${STREAM_TARGET}`, 'g'), `https://${myDomain}/__video_proxy__`);
    text = text.replace(new RegExp(`//${STREAM_TARGET}`, 'g'), `//${myDomain}/__video_proxy__`);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
