const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com'; // স্কোরবোর্ডের অরিজিনাল সার্ভার

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
  let isScoreRequest = false;
  
  // ম্যাজিক চেকার: URL বা Referer এর মধ্যে আমাদের গোপন কোড আছে কি না
  const isScoreQuery = url.searchParams.has('__score_proxy__');
  const isScoreReferer = refererHeader.includes('__score_proxy__=1');

  // ১. ভিডিও প্রক্সি
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  }
  // ২. স্কোরবোর্ড প্রক্সি (কালো স্ক্রিন দূর করার জাদুকরী লজিক)
  else if (isScoreQuery || isScoreReferer) {
    targetHost = SCORE_TARGET;
    isScoreRequest = true;
    
    // স্কোর সার্ভারে পাঠানোর আগে আমাদের গোপন কোডটি মুছে দিচ্ছি, যাতে তারা সন্দেহ না করে
    url.searchParams.delete('__score_proxy__');
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  
  // ৩. হেডার স্পুফিং: আমরা স্কোর সার্ভারকে বোকা বানাবো যেন সে ভাবে সরাসরি ভিজিট হচ্ছে
  if (isScoreRequest) {
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

  // ==========================================
  // SCOREBOARD HTML FIX (যাতে সব ডিজাইন ঠিকমতো পায়)
  // ==========================================
  if (contentType.includes('text/html') && isScoreRequest) {
    let text = await response.text();
    // আইফ্রেম যেন তার অরিজিনাল ডাটা ঠিকমতো পায়, তাই কিছু সিকিউরিটি ট্যাগ রিমুভ করছি
    text = text.replace(/<meta[^>]*name=["']referrer["'][^>]*>/gi, '');
    text = text.replace(new RegExp(`https://${SCORE_TARGET}`, 'g'), `https://${myDomain}`);
    
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ==========================================
  // MAIN SITE INJECTOR (আপনার ওয়েবসাইটে আইফ্রেম বসানো)
  // ==========================================
  if (contentType.includes('text/html') && !isScoreRequest && targetHost !== STREAM_TARGET) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

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

        const tabsContainer = document.querySelector('ul.nav-tabs.scrtv') || document.querySelector('#newdivscoretv');
        
        if (tabsContainer && tabsContainer.parentNode) {
          
          let myIsconBox = document.getElementById('myIsconMaster');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIsconMaster';
            myIsconBox.style.cssText = 'width: 100% !important; height: 210.6px !important; background-color: #172832 !important; display: block !important; margin-bottom: 5px !important;';
            
            tabsContainer.parentNode.insertBefore(myIsconBox, tabsContainer.nextSibling);
          }

          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
              currentMatchId = newMatchId;
              
              myIsconBox.innerHTML = ''; 
              
              const iframe = document.createElement('iframe');
              
              // 🔴 দ্য মাস্টার স্ট্রোক: সাবফোল্ডার ব্যবহার না করে শুধু ?__score_proxy__=1 যুক্ত করা হলো
              iframe.src = "/?__score_proxy__=1#/score1/" + newMatchId;
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
