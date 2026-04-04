const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const MY_LOGO = 'https://i.postimg.cc/Hk8xp7X7/Photo-Room-20260404-125618.png'; // আপনার দেওয়া লোগো

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
    // CSS দিয়ে লোগো রিপ্লেস (Zero Flash) + গ্যাপ ফিক্স
    // ==========================================
    const customCss = `
    <style>
      /* লোগো রিপ্লেসমেন্ট ম্যাজিক */
      #headLogo, .top-logo {
        content: url('${MY_LOGO}') !important;
        object-fit: contain !important;
      }
      
      /* আইফ্রেমের গ্যাপ রিমুভ */
      .score_area, #animScore {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      #myIscon {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    </style>
    `;
    text = text.replace('</head>', customCss + '</head>');

    // ==========================================
    // লাইভ স্কোর এবং JS লোগো ফিক্স লজিক
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      setInterval(() => {
        // ১. জাভাস্ক্রিপ্ট দিয়েও লোগো ফোর্স আপডেট রাখা (ডাবল সেফটি)
        const logo = document.getElementById('headLogo') || document.querySelector('.top-logo');
        if (logo && logo.src !== '${MY_LOGO}') {
            logo.src = '${MY_LOGO}';
        }

        // ২. পুরোনো আইফ্রেম রিমুভ
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) oldIframe.remove();

        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        const sportId = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;
        
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        
        if (scoreArea && newMatchId) {
          scoreArea.style.setProperty('display', 'block', 'important');
          scoreArea.style.setProperty('visibility', 'visible', 'important');

          let myIsconBox = document.getElementById('myIscon');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '201.6px', 'important');
            myIsconBox.style.setProperty('background-color', '#172832', 'important');
            
            // "Not Available" টেক্সট মাঝখানে রাখার জন্য
            myIsconBox.style.setProperty('display', 'flex', 'important');
            myIsconBox.style.setProperty('justify-content', 'center', 'important');
            myIsconBox.style.setProperty('align-items', 'center', 'important');
            
            scoreArea.innerHTML = ''; 
            scoreArea.appendChild(myIsconBox); 
          }

          if (newMatchId !== currentMatchId) {
            currentMatchId = newMatchId;
            myIsconBox.innerHTML = ''; 
            
            if (sportId === '4') {
                // ক্রিকেট হলে আইফ্রেম
                const newIframe = document.createElement('iframe');
                newIframe.src = "https://score1.365cric.com/#/ourscore_C/" + newMatchId;
                newIframe.style.setProperty('width', '100%', 'important');
                newIframe.style.setProperty('height', '100%', 'important');
                newIframe.style.setProperty('border', 'none', 'important');
                newIframe.style.setProperty('overflow', 'hidden', 'important');
                myIsconBox.appendChild(newIframe);
            } else {
                // অন্য গেম হলে মেসেজ
                const notAvailableText = document.createElement('div');
                notAvailableText.innerText = "Live Score Not Available";
                notAvailableText.style.setProperty('color', '#ffffff', 'important');
                notAvailableText.style.setProperty('font-size', '18px', 'important');
                notAvailableText.style.setProperty('font-weight', 'bold', 'important');
                myIsconBox.appendChild(notAvailableText);
            }
          }

          if (myIsconBox) {
            Array.from(myIsconBox.children).forEach(child => {
              if (sportId === '4' && child.tagName !== 'IFRAME') child.remove();
              if (sportId !== '4' && child.tagName !== 'DIV') child.remove();
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
