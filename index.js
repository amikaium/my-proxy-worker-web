export default {
  async fetch(request, env, ctx) {

    // ==========================================
    // ★ গ্লোবাল থিম কালার ও কাস্টম লোগো
    // ==========================================
    const THEME_COLOR = "#FCAF04";
    const CUSTOM_LOGO_URL = "https://image2url.com/r2/default/images/1775421100175-4839c224-d781-4752-be19-a6b02ccc51a0.webp"; 
    
    // ==========================================
    // ★ কাস্টম ব্যানার লিস্ট (১১ টি)
    // ==========================================
    const CUSTOM_BANNERS = [
      "https://i.postimg.cc/prhbQxqv/20260406-144304.jpg", // 0
      "https://i.postimg.cc/MHCkd4F9/20260406-144338.jpg", // 1
      "https://i.postimg.cc/4yDCBMSw/20260406-144450.jpg", // 2
      "https://i.postimg.cc/D09VBDMB/20260406-144633.jpg", // 3
      "https://i.postimg.cc/VvxyDTVj/20260406-144658.jpg", // 4
      "https://i.postimg.cc/66gNW25k/20260406-144724.jpg", // 5
      "https://i.postimg.cc/2jMfkbSb/20260406-144748.jpg", // 6
      "https://i.postimg.cc/bYWjyDwt/20260406-144806.jpg", // 7
      "https://i.postimg.cc/Y2ZwrGCL/20260406-144824.jpg", // 8
      "https://i.postimg.cc/kMzdJ6gK/20260406-144858.jpg", // 9
      "https://i.postimg.cc/CL8pzhRd/20260406-144936.jpg"  // 10
    ];

    const url = new URL(request.url);
    const targetDomain = env.TARGET || "pori365.live";
    const proxyDomain = url.hostname;

    // ==========================================
    // ★ ১. দ্য আল্টিমেট ব্যানার স্পুফার (অটো-রিলোড ব্লকার)
    // ==========================================
    // যখনই ব্রাউজার MainImage লোড করতে চাইবে, আমরা আমাদের ইমেজ দিয়ে দিব। HTML এ হাত দেব না।
    if (url.pathname.includes('/assets/New/MainImage')) {
      let bannerIndex = 0;
      
      // ব্রাউজার কোন ইমেজটা চাচ্ছে তার নাম্বার বের করা (যেমন: MainImage (2).webp থেকে 2 বের করা)
      const match = url.pathname.match(/MainImage(?:%20|\s)*\(?(\d+)\)?/i);
      if (match && match[1]) {
        bannerIndex = parseInt(match[1]);
      }

      // আমাদের লিস্ট থেকে সঠিক ইমেজটা সিলেক্ট করা
      const customImageUrl = CUSTOM_BANNERS[bannerIndex % CUSTOM_BANNERS.length];

      // আমাদের ইমেজটা ডাউনলোড করে ব্রাউজারকে দিয়ে দেওয়া (ব্রাউজার ভাববে অরিজিনালটাই পেয়েছে)
      const imgResponse = await fetch(customImageUrl);
      let newHeaders = new Headers(imgResponse.headers);
      newHeaders.set('Cache-Control', 'public, max-age=86400'); // ফাস্ট লোডের জন্য ক্যাশ
      newHeaders.set('Access-Control-Allow-Origin', '*');

      return new Response(imgResponse.body, {
        status: 200,
        headers: newHeaders
      });
    }

    // ==========================================
    // ২. কাস্টম SVG ইন্টারসেপ্ট
    // ==========================================
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

    // ==========================================
    // ৩. API ও Live TV ইন্টারসেপ্টর
    // ==========================================
    if (url.pathname.startsWith('/_api_proxy/')) {
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');

      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Max-Age": "86400",
          }
        });
      }

      const apiReqHeaders = new Headers(request.headers);
      apiReqHeaders.delete('Host');
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      let apiRes = await fetch(targetApiUrlStr, {
        method: request.method,
        headers: apiReqHeaders,
        body: request.body, // বডি মডিফাই বন্ধ করেছি রিলোড ঠেকানোর জন্য
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

      return new Response(apiRes.body, { status: apiRes.status, headers: apiResHeaders });
    }

    // ==========================================
    // ৪. মূল ওয়েবসাইটের রিভার্স প্রক্সি
    // ==========================================
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

    // ==========================================
    // ৫. HTML এবং CSS মডিফিকেশন (লোগো ও কালার)
    // ==========================================
    if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
      let text = await response.text();

      // লোগো প্রটেকশন
      text = text.replace(/\/static\/media\/logo[^"'\s\)\\]+/gi, CUSTOM_LOGO_URL);

      if (contentType.includes("text/html")) {
        const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}";
            const targetDom = "${targetDomain}";
            const customLogo = "${CUSTOM_LOGO_URL}";

            // API রিডাইরেক্ট (লাইট ওয়েট)
            const needsProxy = function(url) {
              if (typeof url !== 'string') return false;
              return url.includes('trueexch.com') || url.includes('aax-eu1314.com') || url.includes('.m3u8') || url.includes('.ts');
            };

            const origFetch = window.fetch;
            window.fetch = async function() {
              let args = Array.prototype.slice.call(arguments);
              if (typeof args[0] === 'string' && needsProxy(args[0]) && !args[0].includes('/_api_proxy/')) {
                 args[0] = 'https://' + proxyDom + '/_api_proxy/' + args[0];
              }
              return origFetch.apply(this, args);
            };

            // শুধুমাত্র লোগো রিপ্লেস করবে (ব্যানারে হাত দিবে না)
            const observer = new MutationObserver((mutations) => {
              const bgLogos = document.querySelectorAll('h1.top-logo, .top-logo');
              bgLogos.forEach(el => {
                if (el.style.backgroundImage !== 'url("' + customLogo + '")') {
                  el.style.setProperty('background-image', 'url("' + customLogo + '")', 'important');
                }
              });

              const imgLogos = document.querySelectorAll('.home_logo img, img[src*="logo"]');
              imgLogos.forEach(img => {
                if (img.src && !img.src.includes(customLogo)) {
                  if(img.closest('.home_logo') || img.src.includes('/static/media/logo')) {
                    img.src = customLogo;
                  }
                }
              });
            });

            document.addEventListener("DOMContentLoaded", () => {
              observer.observe(document.documentElement, {
                childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'src']
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

          /* লোগো ডিজাইন */
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

          /* ★ ব্যানার গ্যাপ ফিক্সার (ব্যানারগুলো ফুল স্ক্রিন নিবে) */
          .van-swipe-item img, .swiper-slide img, .carousel-item img {
             width: 100% !important;
             height: 100% !important;
             object-fit: fill !important; 
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
