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
      }
    });
  }

  let targetHost = MAIN_TARGET;
  
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
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
    return new Response("Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // ==========================================
    // THE MASTER FIX: Multi-Location Test Injector
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      // অরিজিনাল স্কোরবোর্ড হাইড করার CSS
      if (!document.getElementById('hide-original-score')) {
        const style = document.createElement('style');
        style.id = 'hide-original-score';
        style.innerHTML = \`
          .score_area, #animScore, #mobAnimScore { 
            display: none !important; 
            height: 0px !important; 
            overflow: hidden !important; 
            visibility: hidden !important;
          }
        \`;
        document.head.appendChild(style);
      }

      setInterval(() => {
        // URL থেকে ID নেওয়া
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

        if (!newMatchId) return;

        const iframeSrc = "https://score1.365cric.com/#/score1/" + newMatchId;

        // ইনজেকশন হেল্পার ফাংশন (নিরাপদভাবে বসানোর জন্য)
        function injectTestBox(targetSelector, position, boxId, color, labelText) {
          const target = document.querySelector(targetSelector);
          if (target && target.parentNode && !document.getElementById(boxId)) {
            const box = document.createElement('div');
            box.id = boxId;
            box.style.cssText = \`width: 100% !important; height: 230px !important; background-color: #172832 !important; display: block !important; border: 4px solid \${color} !important; margin-bottom: 10px !important;\`;
            
            // Label for identification
            const label = document.createElement('div');
            label.style.cssText = \`background: \${color}; color: white; text-align: center; font-weight: bold; padding: 5px;\`;
            label.innerText = labelText;
            box.appendChild(label);

            // Iframe
            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.style.cssText = "width: 100% !important; height: 200px !important; border: none !important; overflow: hidden !important;";
            box.appendChild(iframe);

            if (position === 'before') {
              target.parentNode.insertBefore(box, target);
            } else if (position === 'after') {
              target.parentNode.insertBefore(box, target.nextSibling);
            } else if (position === 'prepend') {
              target.insertBefore(box, target.firstChild);
            }
          }
        }

        // ==========================================
        // 📌 টেস্ট লোকেশন ১: লাল বক্স (সবচেয়ে বাইরে, mainWrap এর আগে)
        // ==========================================
        injectTestBox('#mainWrap', 'before', 'testBox1_red', 'red', 'TEST 1: RED BOX (Outside Main Wrap)');

        // ==========================================
        // 📌 টেস্ট লোকেশন ২: সবুজ বক্স (Tabs এর ঠিক উপরে)
        // ==========================================
        injectTestBox('#newdivscoretv', 'before', 'testBox2_green', 'green', 'TEST 2: GREEN BOX (Above Tabs)');

        // ==========================================
        // 📌 টেস্ট লোকেশন ৩: নীল বক্স (Tabs এবং বাটনের নিচে, Odds এর আগে)
        // ==========================================
        injectTestBox('#marketBetsWrapOdds', 'before', 'testBox3_blue', 'blue', 'TEST 3: BLUE BOX (Below Match Buttons)');

      }, 1000); // লোড কমানোর জন্য 1000ms (১ সেকেন্ড) করে দিয়েছি
    </script>
    `;

    text = text.replace('</body>', emptyBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
