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
    // FINAL FIX: Direct Iframe with No-Referrer
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      // ১. অরিজিনাল স্কোরবোর্ড হাইড করা
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

        // ২. Scoreboard এবং Live TV ট্যাবের এরিয়া খুঁজে বের করা
        const tabsContainer = document.querySelector('ul.nav-tabs.scrtv') || document.querySelector('#newdivscoretv');
        
        if (tabsContainer && tabsContainer.parentNode) {
          
          let myIsconBox = document.getElementById('myIsconFinal');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIsconFinal';
            // ব্যাকগ্রাউন্ড ডার্ক রাখা হয়েছে যেন লোড হওয়ার সময় সাদা ফ্ল্যাশ না করে
            myIsconBox.style.cssText = 'width: 100% !important; height: 210.6px !important; background-color: #172832 !important; display: block !important;';
            
            // ঠিক ট্যাবের নিচে বসিয়ে দেওয়া হচ্ছে
            tabsContainer.parentNode.insertBefore(myIsconBox, tabsContainer.nextSibling);
          }

          // ৩. নতুন ম্যাচ ওপেন হলে আইফ্রেম আপডেট করা
          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
              currentMatchId = newMatchId;
              
              myIsconBox.innerHTML = ''; // পুরোনোটা ক্লিয়ার
              
              const iframe = document.createElement('iframe');
              // এই দুটি অ্যাট্রিবিউটই "Not Authorized" এররটিকে চিরতরে মুছে দেবে
              iframe.setAttribute('referrerpolicy', 'no-referrer');
              iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
              
              // সরাসরি অরিজিনাল লিংক ব্যবহার করা হচ্ছে
              iframe.src = "https://score1.365cric.com/#/score1/" + newMatchId;
              iframe.style.cssText = 'width: 100% !important; height: 100% !important; border: none !important; overflow: hidden !important;';
              
              myIsconBox.appendChild(iframe);
          }
        }
      }, 500); // প্রতি আধা সেকেন্ডে চেক করবে যেন পেজ চেঞ্জ হলে আপডেট হয়
    </script>
    `;

    text = text.replace('</body>', emptyBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
