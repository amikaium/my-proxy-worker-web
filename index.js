const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const MY_LOGO = 'https://i.postimg.cc/Hk8xp7X7/Photo-Room-20260404-125618.png'; 
const MY_FAVICON = 'https://i.postimg.cc/tJXJpqHb/20260404-151145.jpg'; // আপনার নতুন ফেভ আইকন
const NEW_COLOR = '#56BAD9';             
const NEW_COLOR_ENCODED = '%2356BAD9';   

const TARGET_COLORS_HEX = /#(D0021B|C60000|DE362D|F10000|C70000|FF0000|E60000)/gi;
const TARGET_COLORS_ENCODED = /%23(D0021B|C60000|DE362D|F10000|C70000|FF0000|E60000)/gi;
const TARGET_COLORS_RGB = /rgb\(\s*208\s*,\s*2\s*,\s*27\s*\)|rgb\(\s*198\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*222\s*,\s*54\s*,\s*45\s*\)|rgb\(\s*241\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*199\s*,\s*0\s*,\s*0\s*\)/gi;

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

  // CSS/JS ফাইল প্রসেসিং
  if (contentType.includes('text/css') || contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
    let text = await response.text();
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(TARGET_COLORS_HEX, NEW_COLOR);
    text = text.replace(TARGET_COLORS_ENCODED, NEW_COLOR_ENCODED);
    text = text.replace(TARGET_COLORS_RGB, NEW_COLOR);
    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // HTML ফাইল প্রসেসিং
  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);
    text = text.replace(TARGET_COLORS_HEX, NEW_COLOR);
    text = text.replace(TARGET_COLORS_ENCODED, NEW_COLOR_ENCODED);
    text = text.replace(TARGET_COLORS_RGB, NEW_COLOR);

    // পুরনো ফেভ আইকন রিমুভ করার জন্য হেড সেকশন মডিফাই
    const faviconHead = `
    <link rel="icon" href="${MY_FAVICON}" type="image/x-icon">
    <link rel="shortcut icon" href="${MY_FAVICON}" type="image/x-icon">
    <link rel="apple-touch-icon" href="${MY_FAVICON}">
    <style>
      :root {
          --loginpagebackground: ${NEW_COLOR} !important;
          --theme-red: ${NEW_COLOR} !important;
          --main-color-red: ${NEW_COLOR} !important;
      }
      .login-index, a.login-index.ui-link, .btn-red, .bg-red, #cricketHeading, h3#cricketHeading {
          background: ${NEW_COLOR} !important;
          background-color: ${NEW_COLOR} !important;
          background-image: none !important; 
          border-color: ${NEW_COLOR} !important;
          color: #ffffff !important;
      }
      dd.play-btn, dd.game-btn { background-color: ${NEW_COLOR} !important; }
      img#headLogo, img.top-logo {
          content: url('${MY_LOGO}') !important;
          max-width: 140px !important; max-height: 45px !important;
          object-fit: contain !important;
      }
      .score_area, #animScore { padding: 0 !important; margin: 0 !important; width: 100% !important; }
    </style>
    `;
    
    // হেড ট্যাগের শুরুতে ফেভ আইকন বসানো হচ্ছে যাতে এটি প্রায়োরিটি পায়
    text = text.replace('<head>', '<head>' + faviconHead);

    // JS স্ক্রিপ্ট (Branding & Live Score)
    const emptyBoxScript = `
    <script>
      function safeTextReplace(node) {
        if (node.nodeType === 3) {
            let text = node.nodeValue;
            if (text && text.trim() !== '') {
                let newText = text.replace(/3wickets\\.live|all9x\\.live|7wickets\\.live/gi, 'skyx.live')
                                  .replace(/3wickets|all9x|7wickets|7wicket|9xlive/gi, 'SkyX');
                if (newText !== text) node.nodeValue = newText;
            }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE' && node.nodeName !== 'IFRAME') {
            for (let i = 0; i < node.childNodes.length; i++) safeTextReplace(node.childNodes[i]);
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
         safeTextReplace(document.body);
         document.title = document.title.replace(/3wickets|all9x|7wickets|7wicket|9xlive/gi, 'SkyX');
         
         // ডাইনামিক ফেভ আইকন ফিক্স (যদি অন্য কোনো স্ক্রিপ্ট চেঞ্জ করতে চায়)
         const links = document.querySelectorAll("link[rel*='icon']");
         links.forEach(link => link.href = '${MY_FAVICON}');
      });

      let currentMatchId = null;
      setInterval(() => {
        // Video Branding
        const videoElem = document.querySelector('video'); 
        if (videoElem && videoElem.parentElement) {
            let watermark = document.getElementById('my-video-watermark');
            if (!watermark) {
                watermark = document.createElement('img');
                watermark.id = 'my-video-watermark';
                watermark.src = '${MY_LOGO}'; 
                watermark.style = "position:absolute;top:10px;right:10px;width:70px;z-index:9999;pointer-events:none;opacity:0.4 !important;";
                videoElem.parentElement.appendChild(watermark);
            }
        }
        // Live Score
        const pathSegments = window.location.pathname.split('/').filter(s => s.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        const sportId = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        if (scoreArea && newMatchId) {
          let myIsconBox = document.getElementById('myIscon');
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            myIsconBox.style = "width:100%;height:201.6px;background-color:#172832;display:flex;justify-content:center;align-items:center;";
            scoreArea.innerHTML = ''; scoreArea.appendChild(myIsconBox); 
          }
          if (newMatchId !== currentMatchId) {
            currentMatchId = newMatchId;
            myIsconBox.innerHTML = ''; 
            if (sportId === '4') {
                const ifrm = document.createElement('iframe');
                ifrm.src = "https://score1.365cric.com/#/ourscore_C/" + newMatchId;
                ifrm.style = "width:100%;height:100%;border:none;overflow:hidden;";
                myIsconBox.appendChild(ifrm);
            } else {
                myIsconBox.innerHTML = '<div style="color:white;font-weight:bold;">Live Score Not Available</div>';
            }
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
