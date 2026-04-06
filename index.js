// গ্লোবাল ক্যাশ ভেরিয়েবল (Firestore বারবার কল করা ঠেকাতে)
let cachedConfig = null;
let lastCacheTime = 0;

async function getDynamicConfig() {
  const now = Date.now();
  // ৬০ সেকেন্ডের ক্যাশ (খুব ফাস্ট লোডের জন্য)
  if (cachedConfig && (now - lastCacheTime < 60000)) {
    return cachedConfig;
  }

  try {
    // Firebase REST API (Worker এর জন্য বেস্ট)
    const firestoreUrl = "https://firestore.googleapis.com/v1/projects/rivers-proxy/databases/(default)/documents/config/main";
    const res = await fetch(firestoreUrl);
    if (res.ok) {
      const json = await res.json();
      const fields = json.fields || {};
      
      // Parse Firestore JSON format
      cachedConfig = {
        targetDomain: fields.targetDomain?.stringValue || "pori365.live",
        oldBrand: fields.oldBrand?.stringValue || "pori365",
        newBrand: fields.newBrand?.stringValue || "Velkix",
        logoUrl: fields.logoUrl?.stringValue || "",
        loginBgUrl: fields.loginBgUrl?.stringValue || "",
        banners: fields.banners?.arrayValue?.values?.map(v => v.stringValue) || []
      };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (err) {
    console.error("Config fetch failed", err);
  }
  
  // Default fallback if Firestore fails
  return cachedConfig || { targetDomain: "pori365.live", oldBrand: "pori365", newBrand: "Velkix", logoUrl: "", loginBgUrl: "", banners: [] };
}

export default {
  async fetch(request, env, ctx) {
    const config = await getDynamicConfig();
    const THEME_COLOR = "#FCAF04";
    const url = new URL(request.url);
    const targetDomain = config.targetDomain;
    const proxyDomain = url.hostname;

    // ==========================================
    // ১. ব্যানার স্পুফার (অটো-রিলোড ব্লকার)
    // ==========================================
    if (url.pathname.includes('/assets/New/MainImage') && config.banners.length > 0) {
      let bannerIndex = 0;
      const match = url.pathname.match(/MainImage(?:%20|\s)*\(?(\d+)\)?/i);
      if (match && match[1]) { bannerIndex = parseInt(match[1]); }

      let customImageUrl = config.banners[bannerIndex % config.banners.length];
      
      // If it's a Base64 WebP string from Firestore
      if (customImageUrl.startsWith('data:image')) {
          const base64Data = customImageUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) { bytes[i] = binaryStr.charCodeAt(i); }
          return new Response(bytes.buffer, {
              headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
          });
      }

      // If it's a regular URL
      const imgResponse = await fetch(customImageUrl);
      let newHeaders = new Headers(imgResponse.headers);
      newHeaders.set('Cache-Control', 'public, max-age=86400');
      newHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(imgResponse.body, { status: 200, headers: newHeaders });
    }

    // ==========================================
    // ২. API ও Live TV ইন্টারসেপ্টর
    // ==========================================
    if (url.pathname.startsWith('/_api_proxy/')) {
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Max-Age": "86400" } });
      }

      const apiReqHeaders = new Headers(request.headers);
      apiReqHeaders.delete('Host');
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      let apiRes = await fetch(targetApiUrlStr, { method: request.method, headers: apiReqHeaders, body: request.body, redirect: 'manual' });
      let apiResHeaders = new Headers(apiRes.headers);
      apiResHeaders.set("Access-Control-Allow-Origin", "*");

      const setCookie = apiResHeaders.get("Set-Cookie");
      if (setCookie) {
        apiResHeaders.set("Set-Cookie", setCookie.replace(/domain=[^;]+/gi, `domain=${proxyDomain}`));
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
    // ৩. মূল ওয়েবসাইটের রিভার্স প্রক্সি
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

    let response = await fetch(targetUrl.toString(), { method: request.method, headers: reqHeaders, body: request.body, redirect: 'manual' });
    let resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.delete("content-security-policy");
    resHeaders.delete("x-frame-options");

    if (resHeaders.has("Location")) {
      let location = resHeaders.get("Location");
      resHeaders.set("Location", location.replace(new RegExp(`https?://${targetDomain}`, 'gi'), `https://${proxyDomain}`));
    }

    const contentType = resHeaders.get("Content-Type") || "";

    // ==========================================
    // ৪. HTML এবং CSS মডিফিকেশন
    // ==========================================
    if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
      let text = await response.text();

      // ডাইনামিক ব্র্যান্ড টেক্সট রিপ্লেস (নিরাপদভাবে, URL নষ্ট না করে)
      if (config.oldBrand && config.newBrand) {
         const regexStr = `(?<![\\/\\.a-zA-Z-])${config.oldBrand}(?![\\.a-zA-Z-])`;
         text = text.replace(new RegExp(regexStr, 'gi'), config.newBrand);
         text = text.replace(new RegExp(config.oldBrand.replace(/\d+/g, ''), 'gi'), config.newBrand); // e.g. "pori" to "Velkix"
      }

      if (config.logoUrl) { text = text.replace(/\/static\/media\/logo[^"'\s\)\\]+/gi, config.logoUrl); }

      if (contentType.includes("text/html")) {
        const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}"; const targetDom = "${targetDomain}";
            const customLogo = "${config.logoUrl}";

            const needsProxy = function(url) {
              if (typeof url !== 'string') return false;
              return url.includes('trueexch.com') || url.includes('aax-eu1314.com') || url.includes('.m3u8') || url.includes('.ts');
            };

            const origFetch = window.fetch;
            window.fetch = async function() {
              let args = Array.prototype.slice.call(arguments);
              if (typeof args[0] === 'string' && needsProxy(args[0]) && !args[0].includes('/_api_proxy/')) { args[0] = 'https://' + proxyDom + '/_api_proxy/' + args[0]; }
              return origFetch.apply(this, args);
            };

            if(customLogo) {
                const observer = new MutationObserver((mutations) => {
                  const bgLogos = document.querySelectorAll('h1.top-logo, .top-logo');
                  bgLogos.forEach(el => { if (el.style.backgroundImage !== 'url("' + customLogo + '")') { el.style.setProperty('background-image', 'url("' + customLogo + '")', 'important'); } });

                  const imgLogos = document.querySelectorAll('.home_logo img, img[src*="logo"]');
                  imgLogos.forEach(img => { if (img.src && !img.src.includes(customLogo) && (img.closest('.home_logo') || img.src.includes('/static/media/logo'))) { img.src = customLogo; } });
                });
                document.addEventListener("DOMContentLoaded", () => { observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'src'] }); });
            }
          })();
        </script>
        `;

        const customCssOverrides = `
        <style> 
          dl.entrance-title { border-bottom-color: ${THEME_COLOR} !important; } 
          div.login_main { background-image: linear-gradient(235deg, ${THEME_COLOR} 21%, ${THEME_COLOR}) !important; background-color: ${THEME_COLOR} !important; } 

          ${config.logoUrl ? `
          h1.top-logo, .top-logo { background-image: url('${config.logoUrl}') !important; background-size: contain !important; background-position: left center !important; background-repeat: no-repeat !important; background-color: transparent !important; width: 280px !important; height: 50px !important; min-width: 250px !important; margin-left: 5px !important; }
          .home_logo img, img[src*="/static/media/logo"] { content: url('${config.logoUrl}') !important; max-width: 260px !important; height: auto !important; object-fit: contain !important; }
          ` : ''}

          /* ★ ডাইনামিক লগইন পেজ ব্যাকগ্রাউন্ড */
          ${config.loginBgUrl ? `
          header.login-head, .login-head { 
            background-image: url('${config.loginBgUrl}') !important; 
            background-size: cover !important; 
            background-position: center !important; 
          }
          ` : ''}

          .van-swipe-item img, .swiper-slide img, .carousel-item img { width: 100% !important; height: 100% !important; object-fit: fill !important; display: block !important; }
        </style>`;

        text = text.replace('<head>', '<head>' + interceptorScript + customCssOverrides);
      }

      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    if (contentType.includes("text/css")) {
      let text = await response.text();
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);
      return new Response(text, { status: response.status, headers: resHeaders });
    }

    return new Response(response.body, { status: response.status, headers: resHeaders });
  }
};
