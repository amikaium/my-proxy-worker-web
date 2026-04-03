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
    // THE MASTER FIX: Safe Iframe Injector
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      // ১. সাইটের অরিজিনাল স্কোরবোর্ড হাইড করার জন্য CSS ইনজেক্ট করা (যাতে সাইটের কোড ব্রেক না করে)
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
        // পুরোনো myIframe আইডিটা থাকলে রিমুভ করে দেওয়া
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) {
          oldIframe.remove();
        }

        // URL থেকে ID নেওয়া
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

        // ২. Scoreboard এবং Live TV এর ট্যাব মেনু খুঁজে বের করা (আপনার স্ক্রিনশট অনুযায়ী)
        const tabsContainer = document.querySelector('ul.nav-tabs.scrtv');
        
        if (tabsContainer && tabsContainer.parentNode) {
          
          // ৩. আমাদের সম্পূর্ণ আলাদা 'myIscon' বক্স তৈরি করা
          let myIsconBox = document.getElementById('myIscon');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            
            // স্টাইল সেট করা (201.6px height)
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '201.6px', 'important');
            myIsconBox.style.setProperty('background-color', '#172832', 'important');
            myIsconBox.style.setProperty('display', 'block', 'important');
            
            // সবথেকে গুরুত্বপূর্ণ: Tabs এর ঠিক "নিচে" বসানো (insertBefore with nextSibling)
            tabsContainer.parentNode.insertBefore(myIsconBox, tabsContainer.nextSibling);
          }

          // ৪. ডাইনামিক আইফ্রেম ইনজেক্ট করা
          if (newMatchId) {
            if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
              currentMatchId = newMatchId;
              
              myIsconBox.innerHTML = ''; 
              
              const newIframe = document.createElement('iframe');
              newIframe.src = "https://score1.365cric.com/#/score1/" + newMatchId;
              newIframe.style.setProperty('width', '100%', 'important');
              newIframe.style.setProperty('height', '100%', 'important');
              newIframe.style.setProperty('border', 'none', 'important');
              newIframe.style.setProperty('overflow', 'hidden', 'important');
              
              myIsconBox.appendChild(newIframe);
            }
          }
        }
      }, 300);
    </script>
    `;

    text = text.replace('</body>', emptyBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
