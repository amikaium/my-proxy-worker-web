export default {
  async fetch(request, env, ctx) {

    // ==========================================
    // ★ আপনার গ্লোবাল থিম কালার ও কাস্টম লোগো
    // ==========================================
    const THEME_COLOR = "#FCAF04";
    const CUSTOM_LOGO_URL = "https://image2url.com/r2/default/images/1775421100175-4839c224-d781-4752-be19-a6b02ccc51a0.webp"; 
    
    // ==========================================
    // ★ আপনার কাস্টম ব্যানার লিস্ট (১১ টি ইমেজ)
    // ==========================================
    const CUSTOM_BANNERS = [
      "https://i.postimg.cc/prhbQxqv/20260406-144304.jpg",
      "https://i.postimg.cc/MHCkd4F9/20260406-144338.jpg",
      "https://i.postimg.cc/4yDCBMSw/20260406-144450.jpg",
      "https://i.postimg.cc/D09VBDMB/20260406-144633.jpg",
      "https://i.postimg.cc/VvxyDTVj/20260406-144658.jpg",
      "https://i.postimg.cc/66gNW25k/20260406-144724.jpg",
      "https://i.postimg.cc/2jMfkbSb/20260406-144748.jpg",
      "https://i.postimg.cc/bYWjyDwt/20260406-144806.jpg",
      "https://i.postimg.cc/Y2ZwrGCL/20260406-144824.jpg",
      "https://i.postimg.cc/kMzdJ6gK/20260406-144858.jpg",
      "https://i.postimg.cc/CL8pzhRd/20260406-144936.jpg"
    ];

    const url = new URL(request.url);
    const targetDomain = env.TARGET || "pori365.live";
    const proxyDomain = url.hostname;

    // ১. কাস্টম SVG ইন্টারসেপ্ট
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      const customSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"> <polygon points="15,0 100,0 100,100 0,100" fill="${THEME_COLOR}" /> </svg>`;
      return new Response(customSvg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=86400"
        }
      });
    }

    // ২. API ও Live TV ইন্টারসেপ্টর
    if (url.pathname.startsWith('/_api_proxy/')) {
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');

      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
          }
        });
      }

      const apiReqHeaders = new Headers(request.headers);
      apiReqHeaders.delete('Host');
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      let reqBody = request.body;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        let textBody = await request.text();
        textBody = textBody.replace(new RegExp(proxyDomain, 'g'), targetDomain);
        reqBody = textBody;
      }

      let apiRes = await fetch(targetApiUrlStr, {
        method: request.method,
        headers: apiReqHeaders,
        body: reqBody,
        redirect: 'manual'
      });

      let apiResHeaders = new Headers(apiRes.headers);
      apiResHeaders.set("Access-Control-Allow-Origin", "*");

      const setCookie = apiResHeaders.get("Set-Cookie");
      if (setCookie) {
        let updatedCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${proxyDomain}`);
        apiResHeaders.set("Set-Cookie", updatedCookie);
      }

      const apiContentType = apiResHeaders.get("Content-Type") || "";
      
      if (apiContentType.includes("mpegurl") || targetApiUrlStr.includes('.m3u8')) {
        let m3u8Text = await apiRes.text();
        m3u8Text = m3u8Text.replace(/(https?:\/\/[^\s"'<>]+)/g, `https://${proxyDomain}/_api_proxy/$1`);
        return new Response(m3u8Text, { status: apiRes.status, headers: apiResHeaders });
      } 
      // ★ শুধুমাত্র MainImage স্লাইডার ব্যানার রিপ্লেস করবে, গেম থাম্বনেইল নয়
      else if (apiContentType.includes("application/json") || apiContentType.includes("text/plain")) {
        let jsonText = await apiRes.text();
        let apiBannerIdx = 0;
        
        jsonText = jsonText.replace(/(?:https?:\/\/[^\/]+)?\/m\/\/assets\/New\/MainImage(?:[^"'\s\\]*)?\.(?:webp|jpg|jpeg|png|gif)/gi, (match) => {
            let rep = CUSTOM_BANNERS[apiBannerIdx % CUSTOM_BANNERS.length];
            apiBannerIdx++;
            return rep;
        });
        
        jsonText = jsonText.replace(new RegExp(targetDomain, 'g'), proxyDomain);
        return new Response(jsonText, { status: apiRes.status, headers: apiResHeaders });
      }

      return new Response(apiRes.body, { status: apiRes.status, headers: apiResHeaders });
    }

    // ৩. মূল ওয়েবসাইটের রিভার্স প্রক্সি
    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;
    targetUrl.protocol = 'https:';

    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("Host", targetDomain);
    reqHeaders.set("Origin", `https://${targetDomain}`);
    reqHeaders.set("Referer", `https://${targetDomain}/`);
    reqHeaders.delete("cf-connecting-ip");
    reqHeaders.delete("x-real-ip");

    let response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: reqHeaders,
      body: request.body,
      redirect: 'manual'
    });

    let resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.delete("content-security-policy");
    resHeaders.delete("x-frame-options");

    if (resHeaders.has("Location")) {
      let location = resHeaders.get("Location");
      let newLocation = location.replace(new RegExp(`https?://${targetDomain}`, 'gi'), `https://${proxyDomain}`);
      resHeaders.set("Location", newLocation);
    }

    const contentType = resHeaders.get("Content-Type") || "";

    // ৪. HTML এবং JS মডিফিকেশন
    if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
      let text = await response.text();

      // লোগো প্রটেকশন
      text = text.replace(/\/static\/media\/logo[^"'\s\)\\]+/gi, CUSTOM_LOGO_URL);

      // ★ HTML সোর্স থেকে শুধুমাত্র MainImage রিপ্লেস করবে
      let htmlBannerIdx = 0;
      text = text.replace(/(?:https?:\/\/[^\/]+)?\/m\/\/assets\/New\/MainImage(?:[^"'\s\\]*)?\.(?:webp|jpg|jpeg|png|gif)/gi, (match) => {
          let customBanner = CUSTOM_BANNERS[htmlBannerIdx % CUSTOM_BANNERS.length];
          htmlBannerIdx++;
          return customBanner;
      });

      if (contentType.includes("text/html")) {
        const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}";
            const targetDom = "${targetDomain}";
            const customLogo = "${CUSTOM_LOGO_URL}";
            const customBanners = ${JSON.stringify(CUSTOM_BANNERS)};

            const needsProxy = function(url) {
              if (typeof url !== 'string') return false;
              return url.includes('trueexch.com') || url.includes('aax-eu1314.com') || url.includes('.m3u8') || url.includes('.ts');
            };

            const origFetch = window.fetch;
            window.fetch = async function() {
              let args = Array.prototype.slice.call(arguments);
              if (typeof args[0] === 'string' && needsProxy(args[0])) {
                if (!args[0].includes('/_api_proxy/')) { args[0] = 'https://' + proxyDom + '/_api_proxy/' + args[0]; }
              } else if (args[0] instanceof Request && needsProxy(args[0].url)) {
                if (!args[0].url.includes('/_api_proxy/')) { args[0] = new Request('https://' + proxyDom + '/_api_proxy/' + args[0].url, args[0]); }
              }
              if (args[1] && args[1].body && typeof args[1].body === 'string') {
                args[1].body = args[1].body.split(proxyDom).join(targetDom);
              }
              return origFetch.apply(this, args);
            };

            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              if (typeof url === 'string' && needsProxy(url)) {
                 if (!url.includes('/_api_proxy/')) { url = 'https://' + proxyDom + '/_api_proxy/' + url; }
              }
              this._url = url;
              return origOpen.apply(this, arguments);
            };

            const origSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(body) {
              if (body && typeof body === 'string') { body = body.split(proxyDom).join(targetDom); }
              return origSend.call(this, body);
            };

            let dynamicBannerIdx = 0;

            const observer = new MutationObserver((mutations) => {
              // ব্যাকগ্রাউন্ড লোগো
              const bgLogos = document.querySelectorAll('h1.top-logo, .top-logo');
              bgLogos.forEach(el => {
                if (el.style.backgroundImage !== 'url("' + customLogo + '")') {
                  el.style.setProperty('background-image', 'url("' + customLogo + '")', 'important');
                }
              });

              // ইমেজ লোগো
              const imgLogos = document.querySelectorAll('.home_logo img, img[src*="logo"]');
              imgLogos.forEach(img => {
                if (img.src && !img.src.includes(customLogo)) {
                  if(img.closest('.home_logo') || img.src.includes('/static/media/logo')) {
                    img.src = customLogo;
                  }
                }
              });

              // ★ সেফটি ব্যানার ইনজেক্টর (Infinite Reload Fix)
              // শুধুমাত্র MainImage লেখা ইমেজগুলোকে টার্গেট করবে এবং data-fixed এট্রিবিউট দিয়ে লক করবে
              const badBanners = document.querySelectorAll('img[src*="MainImage"]');
              badBanners.forEach(img => {
                if (!img.hasAttribute('data-fixed')) {
                  img.src = customBanners[dynamicBannerIdx % customBanners.length];
                  img.setAttribute('data-fixed', 'true'); // লুপ বন্ধ করার চাবি
                  img.style.setProperty('visibility', 'visible', 'important');
                  dynamicBannerIdx++;
                }
              });
            });

            document.addEventListener("DOMContentLoaded", () => {
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'src']
              });
            });
          })();
        </script>
        `;

        const customCssOverrides = `
        <style> 
          dl.entrance-title { border-bottom-color: ${THEME_COLOR} !important; } 
          div.login_main { 
            background-image: linear-gradient(235deg, ${THEME_COLOR} 21%, ${THEME_COLOR}) !important; 
            background-color: ${THEME_COLOR} !important; 
          } 

          h1.top-logo, .top-logo {
            background-image: url('${CUSTOM_LOGO_URL}') !important;
            background-size: contain !important;
            background-position: left center !important;
            background-repeat: no-repeat !important;
            background-color: transparent !important;
            width: 280px !important;    
            height: 50px !important;    
            min-width: 250px !important;
            margin-left: 5px !important; 
          }
          .home_logo img, img[src*="/static/media/logo"] {
            content: url('${CUSTOM_LOGO_URL}') !important;
            max-width: 260px !important; 
            height: auto !important;
            object-fit: contain !important;
          }

          /* ★ ব্যানার গ্যাপ রিমুভার এবং ফ্ল্যাশ ব্লকার */
          img[src*="MainImage"] {
             visibility: hidden !important; 
          }
          
          /* আপনার ব্যানার ফুল স্ক্রিনে ফিট করার জন্য */
          img[data-fixed="true"],
          .van-swipe-item img {
             visibility: visible !important;
             width: 100% !important;
             height: 100% !important;
             object-fit: fill !important; /* গ্যাপ রিমুভ করবে */
             display: block !important;
          }
        </style>`;

        text = text.replace('<head>', '<head>' + interceptorScript + customCssOverrides);
      }

      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);
      text = text.replace(/rgb\(\s*0\s*,\s*153\s*,\s*153\s*\)/gi, THEME_COLOR);
      text = text.replace(/#009999/gi, THEME_COLOR);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    if (contentType.includes("text/css")) {
      let text = await response.text();
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);
      text = text.replace(/rgb\(\s*0\s*,\s*153\s*,\s*153\s*\)/gi, THEME_COLOR);
      text = text.replace(/#009999/gi, THEME_COLOR);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    return new Response(response.body, { status: response.status, headers: resHeaders });
  }
};
