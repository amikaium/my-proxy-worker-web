const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com'; // নতুন: স্কোরবোর্ড আনব্লক করার জন্য

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;
  const refererHeader = request.headers.get('Referer') || '';

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
  
  // ১. ভিডিও প্রক্সি হ্যান্ডেল
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  }
  
  // ২. স্কোরবোর্ড প্রক্সি হ্যান্ডেল (The Master Fix for Authorization Error)
  // এটি আইফ্রেমের সিকিউরিটি বাইপাস করবে
  else if (url.pathname.startsWith('/__score_proxy__') || refererHeader.includes('/__score_proxy__')) {
    targetHost = SCORE_TARGET;
    if (url.pathname.startsWith('/__score_proxy__')) {
        url.pathname = url.pathname.replace('/__score_proxy__', '') || '/';
    }
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  
  // যার কাছে রিকোয়েস্ট পাঠাচ্ছি, তাকে তার নিজের ঠিকানাই দেখাচ্ছি যেন সে ব্লক না করে
  if (targetHost === SCORE_TARGET) {
     proxyReqHeaders.set('Origin', `https://${SCORE_TARGET}`);
     proxyReqHeaders.set('Referer', `https://${SCORE_TARGET}/`);
  } else {
     proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
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
    return new Response("Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // শুধুমাত্র মেইন সাইটের HTML-এ আমাদের স্ক্রিপ্ট ইনজেক্ট করব
  if (contentType.includes('text/html') && targetHost !== SCORE_TARGET) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // ==========================================
    // INJECTOR SCRIPT: Clean & Secure Placement
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      // অরিজিনাল স্কোরবোর্ড হাইড করা
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
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

        if (!newMatchId) return;

        // DIRECT URL এর বদলে আমাদের WORKER PROXY ব্যবহার করা হচ্ছে
        const iframeSrc = "/__score_proxy__/#/score1/" + newMatchId;

        // Scoreboard এবং Live TV ট্যাবের এরিয়া খুঁজে বের করা
        const tabsContainer = document.querySelector('ul.nav-tabs.scrtv') || document.querySelector('#newdivscoretv');
        
        if (tabsContainer && tabsContainer.parentNode) {
          
          let myIsconBox = document.getElementById('myIsconSecure');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIsconSecure';
            myIsconBox.style.cssText = 'width: 100% !important; height: 210.6px !important; background-color: #172832 !important; display: block !important; margin-bottom: 5px !important;';
            
            // ঠিক ট্যাবের নিচে বসিয়ে দেওয়া হচ্ছে
            tabsContainer.parentNode.insertBefore(myIsconBox, tabsContainer.nextSibling);
          }

          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
              currentMatchId = newMatchId;
              
              myIsconBox.innerHTML = ''; 
              
              const iframe = document.createElement('iframe');
              iframe.setAttribute('referrerpolicy', 'no-referrer');
              iframe.src = iframeSrc;
              iframe.style.cssText = 'width: 100% !important; height: 100% !important; border: none !important; overflow: hidden !important;';
              
              myIsconBox.appendChild(iframe);
          }
        }
      }, 500);
    </script>
    `;

    text = text.replace('</body>', emptyBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
