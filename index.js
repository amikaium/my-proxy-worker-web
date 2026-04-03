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
    // THE ULTIMATE BYPASS: BLOB DOUBLE IFRAME
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;
      let blobUrl = null;

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
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

        if (!newMatchId) return;

        // ২. Scoreboard এবং Live TV ট্যাবের এরিয়া খুঁজে বের করা
        const tabsContainer = document.querySelector('ul.nav-tabs.scrtv') || document.querySelector('#newdivscoretv');
        
        if (tabsContainer && tabsContainer.parentNode) {
          
          let myIsconBox = document.getElementById('myIsconMaster');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIsconMaster';
            myIsconBox.style.cssText = 'width: 100% !important; height: 210.6px !important; background-color: #172832 !important; display: block !important; margin-bottom: 5px !important;';
            
            tabsContainer.parentNode.insertBefore(myIsconBox, tabsContainer.nextSibling);
          }

          // ৩. নতুন ম্যাচ ওপেন হলে Blob (ভার্চুয়াল ফাইল) তৈরি করা
          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
              currentMatchId = newMatchId;
              myIsconBox.innerHTML = ''; // পুরোনোটা ক্লিয়ার
              
              // পুরোনো Blob মেমরি থেকে ক্লিয়ার করা
              if (blobUrl) {
                  URL.revokeObjectURL(blobUrl);
              }

              // অরিজিনাল টার্গেট লিংক
              const targetUrl = "https://score1.365cric.com/#/score1/" + newMatchId;
              
              // আপনার সেই লোকাল HTML এর মতো করে একটি "ভার্চুয়াল HTML" তৈরি
              const wrapperHtml = \`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="referrer" content="no-referrer">
                  <style>
                    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #172832; }
                  </style>
                </head>
                <body>
                  <iframe src="\${targetUrl}" style="width: 100%; height: 100%; border: none;" allowfullscreen="true" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
                </body>
                </html>
              \`;

              // HTML টিকে একটি File/Blob এ রূপান্তর করা
              const blob = new Blob([wrapperHtml], { type: 'text/html' });
              blobUrl = URL.createObjectURL(blob);
              
              // সেই ভার্চুয়াল ফাইলটিকে এখন মেইন আইফ্রেমে লোড করানো
              const iframe = document.createElement('iframe');
              iframe.src = blobUrl;
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
