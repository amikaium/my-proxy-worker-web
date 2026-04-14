export default {
  async fetch(request, env, ctx) {
    // ==========================================
    // ⚙️ ইউজার কনফিগারেশন সেকশন
    // ==========================================
    
    const TARGET_DOMAIN = env.TARGET_URL || "https://www.baji11.live";
    const API_DOMAINS =["liveapi247.live"]; 
    const MEDIA_AND_SCORE_DOMAINS =["tv.nginx0.com"]; 
    
    const ALL_TARGETS =[...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // 🛡️ প্রফেশনাল সিকিউরিটি: Ghost Script Route
    if (url.pathname === '/__secure_core.js') {
        const referer = request.headers.get("Referer");
        if (!referer || !referer.includes(url.hostname)) {
            return new Response(`console.log("Access Denied: Highly Secured Proxy System 😎");`, {
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
            
            // ==========================================
            // 🔥 রিয়েক্ট/চাকরা স্পেসিফিক ব্যানার রিপ্লেসমেন্ট 
            // ==========================================
            const newBannerImage = "https://i.postimg.cc/d05XnH5B/20260414-035715.webp";
            const newBannerEscaped = newBannerImage.replace(/\//g, '\\/'); // রিয়েক্ট JSON এর জন্য

            // ১. নরমাল HTML টেক্সট রিপ্লেস (বর্তমান স্ক্রিনশট banner10.jpg এবং আগের স্ক্রিনশট banner-first-d.jpg এর জন্য)
            text = text.replaceAll("/pub-images/maza365/banner/banner10.jpg", newBannerImage);
            text = text.replaceAll("/pub-images/maza365/banner/banner-first-d.jpg", newBannerImage);
            
            // ২. React Hydration Data (JSON State) রিপ্লেস! এটা না করলে রিয়েক্ট পুরনো ছবি লোড করে দেয়।
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner10.jpg", newBannerEscaped);
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner-first-d.jpg", newBannerEscaped);

            if (contentType.includes("text/html")) {
                const customStylesAndScripts = `
                <style>
                  /* ==========================================
                     🚀 CSS লেয়ার: ইনস্ট্যান্ট ইমেজ ওভাররাইড (0 Millisecond delay)
                     ========================================== */
                  img[src*="banner10.jpg"], img[alt*="banner10.jpg"],
                  img[src*="banner-first-d.jpg"], img[alt*="banner-first-d.jpg"] {
                      content: url("${newBannerImage}") !important;
                      object-fit: cover !important;
                  }

                  /* ==========================================
                     🎨 সাইনআপ এবং লগইন পেজের আপডেট ডিজাইন
                     ========================================== */
                  .page-signup body, .page-login body { background-color: #121212 !important; }
                  .page-signup .chakra-form-control .chakra-input-group,
                  .page-login .chakra-form-control .chakra-input-group { background-color: transparent !important; border: none !important; }
                  .page-signup .chakra-input,
                  .page-login .chakra-input { height: 45px !important; background-color: #2c2c2c !important; border-radius: 4px !important; border: 1px solid #4e4e4e !important; color: #ffffff !important; }
                  .page-signup .chakra-input::placeholder,
                  .page-login .chakra-input::placeholder { color: #808080 !important; }
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
                  .custom-video-wrapper video { width: 100% !important; height: auto !important; display: block !important; object-fit: cover !important; pointer-events: none !important; opacity: 0; transition: opacity 0.5s ease-in-out; }
                  .ios-spinner { position: absolute; width: 32px; height: 32px; z-index: 10; transition: opacity 0.3s ease-out; }
                  .ios-spinner::after { content: ""; display: block; width: 100%; height: 100%; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='8' stroke-linecap='round'%3E%3Cpath d='M50 15V25' opacity='.2'/%3E%3Cpath d='M50 15V25' transform='rotate(45 50 50)' opacity='.3'/%3E%3Cpath d='M50 15V25' transform='rotate(90 50 50)' opacity='.4'/%3E%3Cpath d='M50 15V25' transform='rotate(135 50 50)' opacity='.5'/%3E%3Cpath d='M50 15V25' transform='rotate(180 50 50)' opacity='.6'/%3E%3Cpath d='M50 15V25' transform='rotate(225 50 50)' opacity='.7'/%3E%3Cpath d='M50 15V25' transform='rotate(270 50 50)' opacity='.8'/%3E%3Cpath d='M50 15V25' transform='rotate(315 50 50)' opacity='1'/%3E%3C/g%3E%3C/svg%3E"); background-size: cover; animation: ios-spin 1s steps(8, end) infinite; }
                  @keyframes ios-spin { 100% { transform: rotate(360deg); } }

                  /* ==========================================
                     🛑 ডিপোজিট ও উইথড্রয়াল পেজ (/dw) কাস্টম ডিজাইন
                     ========================================== */
                  .page-dw .css-10ici4o { display: none !important; }
                  .page-dw label.chakra-form__label { pointer-events: none !important; user-select: none !important; }
                  .page-dw .css-1kzylc3, .page-dw .css-109ik7k, .page-dw .css-1h8d01g { height: 45px !important; border-radius: 4px !important; pointer-events: none !important; user-select: none !important; opacity: 0.9 !important; }
                  .page-dw .chakra-input { height: 45px !important; border-radius: 4px !important; }
                  .page-dw .chakra-input__left-addon { height: 45px !important; border-radius: 4px 0 0 4px !important; }
                  .page-dw .chakra-input__left-addon + .chakra-input { border-radius: 0 4px 4px 0 !important; pointer-events: auto !important; user-select: auto !important; opacity: 1 !important; }
                  .page-dw .css-8w1h6v { height: 45px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; }
                  .page-dw .chakra-input__right-element { height: 45px !important; }
                </style>

                <script>
                  (function(){
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

                    const domObserver = new MutationObserver(() => {
                        let fullPath = window.location.pathname.replace(/\\//g, '');
                        let currentPath = fullPath.split('?')[0]; 
                        
                        // ৩. Mutation Observer লেয়ার: রিয়েক্ট ডায়নামিক ইমেজ লোড করলে সাথে সাথে রিপ্লেস
                        document.querySelectorAll('img').forEach(img => {
                            if (img.src.includes('banner10.jpg') || img.src.includes('banner-first-d.jpg')) {
                                img.src = '${newBannerImage}';
                                if (img.srcset) img.srcset = '';
                            }
                        });
                        
                        const refInput = document.querySelector('input[placeholder="Enter if you have one"]');
                        if (refInput) {
                            if (refInput.value !== REF_CODE) setNativeValue(refInput, REF_CODE);
                            const parentGroup = refInput.closest('.chakra-form-control');
                            if (parentGroup && parentGroup.style.display !== 'none') parentGroup.style.display = 'none';
                        }

                        const phoneInput = document.querySelector('input[placeholder="Phone Number"]');
                        if (phoneInput && phoneInput.type !== 'tel') {
                            phoneInput.type = 'tel';
                        }

                        const codeInput = document.querySelector('input[placeholder="Enter 4 digit code"]');
                        if (codeInput && codeInput.type !== 'number') {
                            codeInput.type = 'number';
                        }

                        const agreeCheckbox = document.querySelector('input[type="checkbox"]');
                        if (agreeCheckbox && !agreeCheckbox.hasAttribute('data-auto-checked')) {
                            if (!agreeCheckbox.checked) {
                                agreeCheckbox.click();
                            }
                            agreeCheckbox.setAttribute('data-auto-checked', 'true');
                        }

                        document.querySelectorAll('button').forEach(btn => {
                            const txt = btn.textContent.toLowerCase();
                            if (txt.includes('forgot') || txt.includes('password?')) {
                                if (btn.style.display !== 'none') {
                                    btn.style.setProperty('display', 'none', 'important');
                                }
                            }
                        });

                        document.querySelectorAll('button.chakra-button').forEach(btn => {
                            const btnText = btn.textContent.trim();
                            if (btnText === 'Confirm' || btnText === 'Login') {
                                btn.style.setProperty('height', '45px', 'important');
                                btn.style.setProperty('border-radius', '4px', 'important');
                                if (btnText === 'Login') {
                                    btn.style.setProperty('margin-top', '10px', 'important');
                                }
                            }
                        });

                        if (currentPath === 'login' || currentPath === 'signup') {
                            const targetDivForVideo = document.querySelector('div.css-lpwed4');
                            if (targetDivForVideo && !document.getElementById('arfan-custom-video')) {
                                if (!document.getElementById('preload-custom-vid')) {
                                    const preloadLink = document.createElement('link');
                                    preloadLink.id = 'preload-custom-vid';
                                    preloadLink.rel = 'preload';
                                    preloadLink.as = 'video';
                                    preloadLink.href = VIDEO_URL;
                                    document.head.appendChild(preloadLink);
                                }
                                const videoHTML = \`
                                <div id="arfan-custom-video" class="custom-video-wrapper">
                                    <div id="arfan-spinner" class="ios-spinner"></div>
                                    <video id="arfan-vid" autoplay loop muted playsinline preload="auto">
                                        <source src="\${VIDEO_URL}" type="video/mp4">
                                    </video>
                                </div>\`;
                                targetDivForVideo.insertAdjacentHTML('afterend', videoHTML);
                                setTimeout(() => {
                                    const vidElement = document.getElementById('arfan-vid');
                                    const spinnerElement = document.getElementById('arfan-spinner');
                                    if(vidElement) {
                                        vidElement.addEventListener('playing', () => {
                                            if(spinnerElement) spinnerElement.style.opacity = '0';
                                            vidElement.style.opacity = '1';
                                        });
                                        vidElement.play().catch(e => console.log("Auto-play ready."));
                                    }
                                }, 100);
                            }
                        } else {
                            const existingVideo = document.getElementById('arfan-custom-video');
                            if (existingVideo) { existingVideo.remove(); }
                        }

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

                            document.querySelectorAll('.page-dw button').forEach(btn => {
                                if(btn.innerText.includes('Submit')) {
                                    btn.style.setProperty('height', '45px', 'important');
                                    btn.style.setProperty('border-radius', '4px', 'important');
                                }
                            });
                        }
                    });

                    window.addEventListener('load', () => {
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