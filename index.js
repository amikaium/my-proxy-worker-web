let cachedConfig = null;
let lastCacheTime = 0;

async function getDynamicConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastCacheTime < 60000)) return cachedConfig;

  try {
    const firestoreUrl = "https://firestore.googleapis.com/v1/projects/rivers-proxy/databases/(default)/documents/config/main";
    const res = await fetch(firestoreUrl);
    if (res.ok) {
      const json = await res.json();
      const fields = json.fields || {};
      
      let thumbs = {};
      if(fields.thumbnails?.mapValue?.fields) {
         for(let key in fields.thumbnails.mapValue.fields) {
             thumbs[key] = fields.thumbnails.mapValue.fields[key].stringValue;
         }
      }

      cachedConfig = {
        targetDomain: fields.targetDomain?.stringValue?.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] || "pori365.live",
        themeColor: fields.themeColor?.stringValue || "#FCAF04",
        favicon: fields.favicon?.stringValue || "",
        logo: fields.logo?.stringValue || "",
        loginBg: fields.loginBg?.stringValue || "",
        banners: fields.banners?.arrayValue?.values?.map(v => v.stringValue) || [],
        thumbnails: thumbs
      };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (err) {}
  
  return cachedConfig || { targetDomain: "pori365.live", themeColor: "#FCAF04", favicon: "", logo: "", loginBg: "", banners: [], thumbnails: {} };
}

export default {
  async fetch(request, env, ctx) {
    const config = await getDynamicConfig();
    const url = new URL(request.url);
    const targetDomain = config.targetDomain;
    const proxyDomain = url.hostname;

    // অটো ব্র্যান্ড নেম জেনারেটর (proxy domain থেকে)
    // Example: proxy is "velkix-bot.workers.dev" -> Brand Name is "Velkix Bot"
    let autoBrandName = proxyDomain.split('.')[0].replace(/-/g, ' ');
    autoBrandName = autoBrandName.replace(/\b\w/g, l => l.toUpperCase());

    // ==========================================
    // ১. ব্যানার স্পুফার
    // ==========================================
    if (url.pathname.includes('/assets/New/MainImage') && config.banners.length > 0) {
      let bannerIndex = 0;
      const match = url.pathname.match(/MainImage(?:%20|\s)*\(?(\d+)\)?/i);
      if (match && match[1]) { bannerIndex = parseInt(match[1]); }
      let customImageUrl = config.banners[bannerIndex % config.banners.length];
      
      if (customImageUrl.startsWith('data:image')) {
          const base64Data = customImageUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) { bytes[i] = binaryStr.charCodeAt(i); }
          return new Response(bytes.buffer, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    // ==========================================
    // ২. API ইন্টারসেপ্টর
    // ==========================================
    if (url.pathname.startsWith('/_api_proxy/')) {
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');
      if (request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*" } });

      const apiReqHeaders = new Headers(request.headers);
      apiReqHeaders.delete('Host');
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      let apiRes = await fetch(targetApiUrlStr, { method: request.method, headers: apiReqHeaders, body: request.body, redirect: 'manual' });
      let apiResHeaders = new Headers(apiRes.headers);
      apiResHeaders.set("Access-Control-Allow-Origin", "*");
      const setCookie = apiResHeaders.get("Set-Cookie");
      if (setCookie) apiResHeaders.set("Set-Cookie", setCookie.replace(/domain=[^;]+/gi, `domain=${proxyDomain}`));

      const apiContentType = apiResHeaders.get("Content-Type") || "";
      if (apiContentType.includes("mpegurl") || targetApiUrlStr.includes('.m3u8')) {
        let m3u8Text = await apiRes.text();
        m3u8Text = m3u8Text.replace(/(https?:\/\/[^\s"'<>]+)/g, `https://${proxyDomain}/_api_proxy/$1`);
        return new Response(m3u8Text, { status: apiRes.status, headers: apiResHeaders });
      } 
      return new Response(apiRes.body, { status: apiRes.status, headers: apiResHeaders });
    }

    // ==========================================
    // ৩. রিভার্স প্রক্সি রিকোয়েস্ট
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
    // ৪. HTML/CSS মডিফিকেশন (ম্যাজিক পার্ট)
    // ==========================================
    if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
      let text = await response.text();

      // অটোমেটিক ব্র্যান্ড নেম পরিবর্তন (pori365 -> Your Domain Name)
      text = text.replace(/(?<![\/\.a-zA-Z-])pori365(?![a-zA-Z-])/gi, autoBrandName);
      text = text.replace(/(?<![\/\.a-zA-Z-])pori(?![a-zA-Z-])/gi, autoBrandName.split(' ')[0]);

      if (config.logo) text = text.replace(/\/static\/media\/logo[^"'\s\)\\]+/gi, config.logo);

      if (contentType.includes("text/html")) {
        
        // Favicon Injector
        if(config.favicon) {
           text = text.replace(/<link rel="icon"[^>]+>/gi, '');
           text = text.replace(/<link rel="shortcut icon"[^>]+>/gi, '');
           text = text.replace('<head>', `<head>\n<link rel="icon" type="image/x-icon" href="${config.favicon}">\n<link rel="shortcut icon" href="${config.favicon}">`);
        }

        const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}"; const targetDom = "${targetDomain}";
            const customLogo = "${config.logo}";
            const thumbData = ${JSON.stringify(config.thumbnails)};

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

            const observer = new MutationObserver((mutations) => {
              // Logo Replacements
              if(customLogo) {
                  const bgLogos = document.querySelectorAll('h1.top-logo, .top-logo');
                  bgLogos.forEach(el => { if (el.style.backgroundImage !== 'url("' + customLogo + '")') el.style.setProperty('background-image', 'url("' + customLogo + '")', 'important'); });
                  const imgLogos = document.querySelectorAll('.home_logo img, img[src*="logo"]');
                  imgLogos.forEach(img => { if (img.src && !img.src.includes(customLogo) && (img.closest('.home_logo') || img.src.includes('/static/media/logo'))) img.src = customLogo; });
              }

              // Dynamic Game Thumbnails Replacement
              Object.keys(thumbData).forEach(key => {
                  if(!thumbData[key]) return;
                  // Search for text matching the key (e.g. 'sports', 'jili') inside game cards
                  const cards = document.querySelectorAll('.game-item, .item-wrap, .list-item'); 
                  cards.forEach(card => {
                      if(card.innerText.toLowerCase().replace(/\\s+/g, '').includes(key)) {
                          const img = card.querySelector('img');
                          if(img && !img.src.includes(thumbData[key])) {
                              img.src = thumbData[key];
                              img.style.objectFit = 'cover';
                          }
                      }
                  });
              });
            });

            document.addEventListener("DOMContentLoaded", () => { observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'src'] }); });
          })();
        </script>
        `;

        const customCssOverrides = `
        <style> 
          :root { --theme-color: ${config.themeColor}; }
          dl.entrance-title { border-bottom-color: var(--theme-color) !important; } 
          div.login_main { background-image: linear-gradient(235deg, var(--theme-color) 21%, var(--theme-color)) !important; background-color: var(--theme-color) !important; } 
          .bg-theme, .btn-primary { background-color: var(--theme-color) !important; }
          .text-theme { color: var(--theme-color) !important; }

          ${config.logo ? `
          h1.top-logo, .top-logo { background-image: url('${config.logo}') !important; background-size: contain !important; background-position: left center !important; background-repeat: no-repeat !important; background-color: transparent !important; width: 280px !important; height: 50px !important; min-width: 250px !important; margin-left: 5px !important; }
          .home_logo img, img[src*="/static/media/logo"] { content: url('${config.logo}') !important; max-width: 260px !important; height: auto !important; object-fit: contain !important; }
          ` : ''}

          ${config.loginBg ? `
          header.login-head, .login-head, .login-bg { 
            background-image: url('${config.loginBg}') !important; 
            background-size: cover !important; 
            background-position: center !important; 
          }
          ` : ''}

          .van-swipe-item img, .swiper-slide img, .carousel-item img { width: 100% !important; height: 100% !important; object-fit: fill !important; display: block !important; }
        </style>`;

        text = text.replace('<head>', '<head>' + interceptorScript + customCssOverrides);
      }

      // Domain Replace
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      
      // Color Replace
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, config.themeColor);
      text = text.replace(/#14805e/gi, config.themeColor);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    if (contentType.includes("text/css")) {
      let text = await response.text();
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, config.themeColor);
      text = text.replace(/#14805e/gi, config.themeColor);
      return new Response(text, { status: response.status, headers: resHeaders });
    }

    return new Response(response.body, { status: response.status, headers: resHeaders });
  }
};
