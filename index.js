const MAIN_TARGET = '7wickets.live'; 

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

  url.hostname = MAIN_TARGET;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', MAIN_TARGET);
  proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
  proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);
  proxyReqHeaders.delete('Accept-Encoding'); // ফাইল ক্লিয়ার পাওয়ার জন্য

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
    // THE MASTER FIX: Auto Iframe Corrector
    // ==========================================
    const iframeFixScript = `
    <script>
      setInterval(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          let currentSrc = iframe.src || '';
          
          // যদি Iframe এর লিংকে ভুল করে আপনার ডোমেইন বা পুরোনো প্রক্সি কোড চলে আসে
          if (currentSrc.includes('${myDomain}') && currentSrc.includes('score1')) {
            // লিংকের শেষ থেকে ম্যাচ আইডিটি (যেমন: 35404287) আলাদা করা
            let matchId = currentSrc.split('/').pop();
            // জোর করে অরিজিনাল স্কোরবোর্ডের লিংক বসিয়ে দেওয়া
            let correctUrl = 'https://score1.365cric.com/#/score1/' + matchId;
            
            if (iframe.src !== correctUrl) {
              iframe.src = correctUrl;
              console.log('✅ Scoreboard Link Auto-Fixed!');
            }
          }
        });
      }, 500); // প্রতি আধা সেকেন্ড পরপর চেক করবে
    </script>
    `;

    // ওয়েবসাইটের </body> ট্যাগের ঠিক আগে আমাদের স্ক্রিপ্টটি বসিয়ে দেওয়া হচ্ছে
    text = text.replace('</body>', iframeFixScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  } 
  
  // JS বা JSON ফাইলগুলোর জন্য
  else if (contentType.includes('application/javascript') || contentType.includes('application/json')) {
    let text = await response.text();
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
