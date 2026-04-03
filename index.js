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

  // রিডাইরেক্ট সমস্যার চূড়ান্ত সমাধান
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${SCORE_TARGET}`, `https://${myDomain}/__score_proxy__/`);
        location = location.replace(`https://${LMT_TARGET}`, `https://${myDomain}/__lmt_proxy__/`); // LMT রিডাইরেক্ট ফিক্স
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // HTML মডিফিকেশন এবং বক্স ওপেনার স্ক্রিপ্ট
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
    // THE MASTER FIX: Smart ID Extractor & Injector
    // ==========================================
    const dynamicScoreScript = `
    <script>
      setInterval(() => {
        try {
          // ১. এই জাদুকরী কোডটি পুরো ইউআরএল থেকে শুধু ৭ থেকে ১০ ডিজিটের আসল ম্যাচ আইডিটাই খুঁজবে
          const urlMatch = window.location.href.match(/\\d{7,10}/);
          const matchId = urlMatch ? urlMatch[0] : null; 
          
          if (matchId) {
            const myDomain = window.location.hostname;
            const correctUrl = 'https://' + myDomain + '/__score_proxy__/#/score1/' + matchId;
            
            // ২. লুকানো বক্সটাকে খুঁজে বের করা
            const scoreArea = document.querySelector('.score_area') || 
                              document.getElementById('animScore') || 
                              document.querySelector('.center-m');

            if (scoreArea) {
              scoreArea.style.setProperty('display', 'block', 'important');
              scoreArea.style.setProperty('visibility', 'visible', 'important');
              scoreArea.style.minHeight = '190px'; // বক্স যেন চুপসে না যায়
            }

            // ৩. আইফ্রেম খুঁজে বের করা
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

              // ৪. সঠিক ম্যাচ আইডির লিংক বসানো (আগের ভুল লিংক পাল্টে দেবে)
              if (!iframe.src || !iframe.src.includes(matchId) || !iframe.src.includes('__score_proxy__')) {
                iframe.src = correctUrl;
                console.log('🔥 Perfect Match ID Injected:', matchId);
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
