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
                     🎯 BAJI999 PRO UI THEME (CSS OVERRIDE FOR CHAKRA UI)
                     অরিজিনাল পেজ ঠিক রেখে শুধুমাত্র ডিজাইন মডিফাই করা হলো
                     ======================================================== */
                  
                  /* পুরো ব্যাকগ্রাউন্ড ডার্ক করা */
                  .page-dw body, .page-dw #root, .page-dw .chakra-ui-light { background-color: #17181b !important; color: #ffffff !important; }
                  .page-dw .css-1jagptf, .page-dw .css-qx6nre, .page-dw .css-cipbx3, .page-dw .css-15dddk { background-color: #17181b !important; }
                  
                  /* সব টেক্সট এবং লেবেল সুন্দর করা */
                  .page-dw p, .page-dw span { color: #e0e0e0 !important; }
                  .page-dw label.chakra-form__label { color: #8c8c8c !important; font-weight: 600 !important; font-size: 13px !important; margin-bottom: 8px !important; }
                  
                  /* ইনপুট ফিল্ড (Amount, TrxID, Account Number) */
                  .page-dw input.chakra-input {
                      background-color: #222328 !important;
                      border: 1px solid #33353b !important;
                      color: #ffffff !important;
                      height: 48px !important;
                      border-radius: 8px !important;
                      font-size: 16px !important;
                      font-weight: 500 !important;
                  }
                  .page-dw input.chakra-input:focus { border-color: #12b984 !important; box-shadow: 0 0 0 1px #12b984 !important; }
                  .page-dw .chakra-input__left-addon { background-color: #222328 !important; border: 1px solid #33353b !important; border-right: none !important; color: #8c8c8c !important; height: 48px !important; border-radius: 8px 0 0 8px !important;}
                  
                  /* পেমেন্ট মেথড এবং অ্যামাউন্ট কার্ড (Chakra Grid Classes) */
                  /* css-q9ajxl = Inactive Card, css-hv1tgg = Active Card */
                  .page-dw .css-q9ajxl {
                      background-color: #222328 !important;
                      border: 1px solid #33353b !important;
                      border-radius: 8px !important;
                      transition: all 0.2s ease !important;
                  }
                  .page-dw .css-hv1tgg {
                      background-color: rgba(18, 185, 132, 0.08) !important;
                      border: 1px solid #12b984 !important;
                      border-radius: 8px !important;
                  }
                  /* কার্ডের ভেতরের টেক্সট */
                  .page-dw .css-q9ajxl p, .page-dw .css-hv1tgg p, .page-dw .css-q9ajxl span, .page-dw .css-hv1tgg span {
                      color: #ffffff !important; font-size: 13px !important; font-weight: 600 !important;
                  }

                  /* সাবমিট বাটন (Submit/Confirm) */
                  .page-dw button.chakra-button {
                      background-color: #12b984 !important;
                      color: #ffffff !important;
                      height: 50px !important;
                      border-radius: 8px !important;
                      font-weight: 700 !important;
                      font-size: 16px !important;
                      border: none !important;
                      margin-top: 15px !important;
                      box-shadow: 0 4px 12px rgba(18, 185, 132, 0.2) !important;
                      transition: 0.2s !important;
                  }
                  .page-dw button.chakra-button:active { background-color: #0fa374 !important; transform: scale(0.98) !important; }
                  
                  /* ডিফল্ট লাল রঙের সতর্কবাণীগুলোকে সুন্দর Baji999 Reminder বক্সে রূপান্তর */
                  .page-dw [style*="color: red"], .page-dw [style*="color: rgb(255, 0, 0)"] {
                      color: #12b984 !important;
                      background: #222328 !important;
                      border: 1px solid #33353b !important;
                      padding: 12px !important;
                      border-radius: 8px !important;
                      font-size: 12px !important;
                      display: block !important;
                      margin-top: 15px !important;
                      line-height: 1.5 !important;
                  }

                  /* ডিভাইডার লাইন */
                  .page-dw .chakra-divider { border-color: #33353b !important; opacity: 0.5 !important; }
                </style>

                <script>
                  (function(){
                    // ⚙️ PWA ব্রাউজার কানেকশন 
                    let deferredPrompt;
                    window.addEventListener('beforeinstallprompt', (e) => {
                        e.preventDefault(); 
                        deferredPrompt = e; 
                        showAppBanner(); 
                    });

                    window.addEventListener('appinstalled', () => {
                        hideAppBanner(); 
                    });

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
                            document.querySelectorAll('[data-pushed="true"]').forEach(el => {
                                el.style.top = '0px';
                            });
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
                        if (isIOS && !window.navigator.standalone) {
                            showAppBanner();
                        }
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
                                if (img.getAttribute('src') !== b1) { 
                                    img.src = b1; img.srcset = ''; img.setAttribute('src', b1); 
                                }
                            }
                            if (src.includes('banner10.jpg') || alt.includes('banner10.jpg')) {
                                if (img.getAttribute('src') !== b2) { 
                                    img.src = b2; img.srcset = ''; img.setAttribute('src', b2); 
                                }
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

                        /* ডিপোজিট পেজের জন্য বিশেষ লজিক: 
                           এখানে HTML হাইড বা পরিবর্তন করা হচ্ছে না। 
                           বরং আপনার অরিজিনাল ডাটা এবং লজিকগুলোই কাজ করবে, 
                           CSS শুধু এর উপরে "Baji999" এর মতো মেকআপ বসিয়ে দেবে।
                        */
                        if (currentPath === 'dw') {
                            document.querySelectorAll('.page-dw .chakra-input__left-addon').forEach(addon => {
                                if (addon.textContent.includes('BDT')) {
                                    let amountInput = addon.nextElementSibling;
                                    if (amountInput && amountInput.tagName === 'INPUT') {
                                        if(amountInput.getAttribute('inputmode') !== 'decimal') {
                                            amountInput.setAttribute('inputmode', 'decimal');
                                            amountInput.setAttribute('pattern', '[0-9]*');
                                        }
                                    }
                                }
                            });
                        }
                    });

                    window.addEventListener('load', () => {
                        initAppInstallBanner(); 
                        updateBodyClass(); 
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
