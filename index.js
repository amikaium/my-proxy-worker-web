const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const MY_LOGO = 'https://i.postimg.cc/Hk8xp7X7/Photo-Room-20260404-125618.png'; 

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

    // শুধুমাত্র প্রক্সি ডোমেইনের জন্য বেসিক রিপ্লেসমেন্ট (ডিজাইন ভাঙবে না)
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // ==========================================
    // CSS: লোগো, গ্যাপ ফিক্স এবং গ্লোবাল কালার চেঞ্জ
    // ==========================================
    const customCss = `
    <style>
      img#headLogo, img.top-logo {
          content: url('${MY_LOGO}') !important;
          max-width: 140px !important; 
          max-height: 45px !important;
          object-fit: contain !important;
          object-position: left center !important;
      }
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
      
      /* --- Red Color to Target Color (#56BAD9) Replacement --- */
      
      /* 1. Targeting specific Login Button from your screenshot */
      a.login-index.ui-link, 
      .login-index,
      .btn-red, 
      .bg-red, 
      .theme-red {
          background-color: #56BAD9 !important;
          background-image: none !important; /* Removes the red gradient */
          border-color: #56BAD9 !important;
          color: #ffffff !important;
      }
      
      /* 2. Global attribute selector for inline styles (Catches other red areas) */
      [style*="rgb(241, 0, 0)"],
      [style*="rgb(199, 0, 0)"],
      [style*="#E50000"],
      [style*="#e50000"] {
          background-color: #56BAD9 !important;
          background-image: none !important;
          border-color: #56BAD9 !important;
      }
    </style>
    `;
    text = text.replace('</head>', customCss + '</head>');

    // ==========================================
    // JS: সেফ টেক্সট রিপ্লেসমেন্ট, লাইভ স্কোর এবং ভিডিও ওয়াটারমার্ক
    // ==========================================
    const emptyBoxScript = `
    <script>
      // 🟢 ডিজাইনে হাত না দিয়ে শুধুমাত্র ওয়েবসাইটের লেখা (Text) পরিবর্তনের লজিক
      function safeTextReplace(node) {
        if (node.nodeType === 3) { // Text Node
            let text = node.nodeValue;
            if (text && text.trim() !== '') {
                let newText = text.replace(/3wickets\\.live/gi, 'skyx.live')
                                  .replace(/3wickets/gi, 'SkyX')
                                  .replace(/all9x\\.live/gi, 'skyx.live')
                                  .replace(/all9x/gi, 'SkyX')
                                  .replace(/7wickets\\.live/gi, 'skyx.live')
                                  .replace(/7wickets/gi, 'SkyX')
                                  .replace(/7wicket/gi, 'SkyX')
                                  .replace(/9xlive/gi, 'SkyX')
                                  .replace(/9x live/gi, 'SkyX');
                if (newText !== text) {
                    node.nodeValue = newText;
                }
            }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE' && node.nodeName !== 'IFRAME') {
            for (let i = 0; i < node.childNodes.length; i++) {
                safeTextReplace(node.childNodes[i]);
            }
        }
      }

      const textObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
             safeTextReplace(node);
          });
        });
      });

      document.addEventListener("DOMContentLoaded", () => {
         safeTextReplace(document.body);
         document.title = document.title.replace(/3wickets|all9x|7wickets|7wicket|9xlive|9x live/gi, 'SkyX');
         textObserver.observe(document.body, { childList: true, subtree: true });
      });

      // 🟢 লাইভ স্কোর আইফ্রেম লজিক এবং ভিডিও ওয়াটারমার্ক
      let currentMatchId = null;
      setInterval(() => {
        
        // --- 1. Video Branding Logic (Top Right) ---
        const videoElem = document.querySelector('video'); 
        if (videoElem && videoElem.parentElement) {
            let watermark = document.getElementById('my-video-watermark');
            if (!watermark) {
                watermark = document.createElement('img');
                watermark.id = 'my-video-watermark';
                watermark.src = '${MY_LOGO}'; 
                
                // ওয়াটারমার্ক এর স্টাইল (Opacity 0.4 এবং Position Fix করা হয়েছে)
                watermark.style.setProperty('position', 'absolute', 'important');
                watermark.style.setProperty('top', '10px', 'important');     
                watermark.style.setProperty('right', '10px', 'important');   
                watermark.style.setProperty('width', '70px', 'important');   
                watermark.style.setProperty('z-index', '9999', 'important'); 
                watermark.style.setProperty('pointer-events', 'none', 'important'); 
                watermark.style.setProperty('opacity', '0.4', 'important'); 
                
                videoElem.parentElement.appendChild(watermark);
            }
        }

        // --- 2. Live Score Logic (Original) ---
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
                const newIframe = document.createElement('iframe');
                newIframe.src = "https://score1.365cric.com/#/ourscore_C/" + newMatchId;
                newIframe.style.setProperty('width', '100%', 'important');
                newIframe.style.setProperty('height', '100%', 'important');
                newIframe.style.setProperty('border', 'none', 'important');
                newIframe.style.setProperty('overflow', 'hidden', 'important');
                myIsconBox.appendChild(newIframe);
            } else {
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
