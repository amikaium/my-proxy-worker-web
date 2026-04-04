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
    // BACK TO ORIGINAL LOGIC (With updated working URL)
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      setInterval(() => {
        // ১. পুরোনো myIframe আইডিটা থাকলে সেটাকে রিমুভ করে দেওয়া
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) {
          oldIframe.remove();
        }

        // ২. URL থেকে ডাইনামিক ID বের করা
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;

        // ৩. ওয়েবসাইটের অরিজিনাল score_area খুঁজে বের করা
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        
        if (scoreArea && newMatchId) {
          // বক্সটিকে অবশ্যই দৃশ্যমান রাখা
          scoreArea.style.setProperty('display', 'block', 'important');
          scoreArea.style.setProperty('visibility', 'visible', 'important');

          // ৪. 'myIscon' আইডি বক্স চেক বা তৈরি করা
          let myIsconBox = document.getElementById('myIscon');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            
            // অরিজিনাল স্টাইল সেট করা
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '201.6px', 'important');
            myIsconBox.style.setProperty('background-color', '#172832', 'important');
            myIsconBox.style.setProperty('display', 'block', 'important');
            
            scoreArea.innerHTML = ''; // অরিজিনাল বক্সের ভেতরটা পরিষ্কার করা
            scoreArea.appendChild(myIsconBox); // ভেতরে আমাদের বক্স বসানো
          }

          // ৫. নতুন কাজ করা লিংকটি দিয়ে আইফ্রেম বসানো বা আপডেট করা
          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
            currentMatchId = newMatchId;
            
            myIsconBox.innerHTML = ''; 
            
            const newIframe = document.createElement('iframe');
            
            // 🔴 আপনার কাজ করা নতুন লিংক (ourscore_C)
            newIframe.src = "https://score1.365cric.com/#/ourscore_C/" + newMatchId;
            
            newIframe.style.setProperty('width', '100%', 'important');
            newIframe.style.setProperty('height', '100%', 'important');
            newIframe.style.setProperty('border', 'none', 'important');
            newIframe.style.setProperty('overflow', 'hidden', 'important');
            
            myIsconBox.appendChild(newIframe);
          }

          // ৬. আমাদের Iframe ছাড়া অন্য কিছু ওয়েবসাইটে চলে আসলে তা রিমুভ করে দেওয়া
          if (myIsconBox) {
            Array.from(myIsconBox.children).forEach(child => {
              if (child.tagName !== 'IFRAME') {
                child.remove();
              }
            });
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
