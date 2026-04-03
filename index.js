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
    // আপনার লজিক: Hide old iframe & Create "myIscon" box
    // ==========================================
    const customBoxScript = `
    <script>
      setInterval(() => {
        // ১. শুধুমাত্র পুরোনো myIframe আইডিটাকে হাইড করা হচ্ছে
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) {
          oldIframe.style.setProperty('display', 'none', 'important');
        }

        // ২. score_area দৃশ্যমান রাখা হচ্ছে
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        if (scoreArea) {
          scoreArea.style.setProperty('display', 'block', 'important');
          scoreArea.style.setProperty('visibility', 'visible', 'important');

          // ৩. 'myIscon' নামে নতুন আইডি বক্স তৈরি করা হচ্ছে (যদি আগে থেকে না থাকে)
          if (!document.getElementById('myIscon')) {
            const myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            
            // আপনার দেওয়া ডাইমেনশন ও কালার
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '178px', 'important');
            myIsconBox.style.setProperty('background-color', 'gray', 'important');
            
            // বক্সটিকে score_area এর ভেতরে যুক্ত করা হলো
            scoreArea.appendChild(myIsconBox);
          }
        }
      }, 500); // সাইটের নিজস্ব স্ক্রিপ্ট যেন এটাকে আবার চেঞ্জ না করতে পারে তাই লুপ রাখা হয়েছে
    </script>
    `;

    text = text.replace('</body>', customBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
