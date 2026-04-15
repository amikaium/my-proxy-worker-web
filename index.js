export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_DOMAINS = ["vrnlapi.com"]; 
    const MEDIA_AND_SCORE_DOMAINS = ["aax-eu1314.com"]; 
    const ALL_TARGETS =[...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // =========================================================================
    // ⚙️ অটোমেটিক প্যাকার ইঞ্জিন
    // =========================================================================
    const autoPackJS = (rawCode) => {
        const obfuscated = btoa(unescape(encodeURIComponent(rawCode)));
        return `!function(){var e="${obfuscated}",t=decodeURIComponent(escape(atob(e)));new Function(t)()}();`;
    };

    // ==========================================
    // 🛡️ প্রফেশনাল সিকিউরিটি: Ghost Script Route
    // ==========================================
    if (url.pathname === '/__secure_core.js') {
        const referer = request.headers.get("Referer");
        if (!referer || !referer.includes(url.hostname)) {
            return new Response(`console.log("Access Denied: Nice try, but you can't copy this code! 😎");`, {
                status: 200,
                headers: { "Content-Type": "application/javascript" }
            });
        }

        const rawJs = `
          (function() {
            const proxyPrefix = '/__api_proxy/';
            const targetApis = ${JSON.stringify(ALL_TARGETS)};
            function shouldIntercept(url) {
              if (typeof url !== 'string') return false;
              if (url.includes('__api_proxy')) return false; 
              return targetApis.some(api => url.includes(api));
            }
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
              try {
                let reqUrl = args[0];
                if (typeof reqUrl === 'string' && shouldIntercept(reqUrl)) {
                  args[0] = proxyPrefix + reqUrl;
                } else if (reqUrl instanceof Request && shouldIntercept(reqUrl.url)) {
                  args[0] = new Request(proxyPrefix + reqUrl.url, reqUrl);
                }
              } catch(e) {}
              return originalFetch.apply(this, args);
            };
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
              try {
                if (typeof url === 'string' && shouldIntercept(url)) {
                  url = proxyPrefix + url;
                }
              } catch(e) {}
              return originalOpen.call(this, method, url, ...rest);
            };
          })();
        `;
        
        const secretCode = autoPackJS(rawJs);
        return new Response(secretCode, {
            status: 200,
            headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate" }
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

    // ২. API এবং Video Stream প্রক্সি
    if (url.pathname.startsWith('/__api_proxy/')) {
      let actualApiUrl = request.url.substring(request.url.indexOf('/__api_proxy/') + 13);
      if (!actualApiUrl.startsWith('http')) { actualApiUrl = 'https://' + actualApiUrl; }
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
      } catch (e) { return new Response(JSON.stringify({ error: "Proxy Error" }), { status: 500 }); }
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

        text = text.replaceAll(/velki123\.win/gi, "velkix.live");
        text = text.replaceAll(/velki123/gi, "velkix.live");

        const newLogoUrl = "https://i.postimg.cc/J0P019Hr/20260408-225146.webp";
        const newLoginBanner = "https://i.postimg.cc/CLCXKkN6/20260408-232743.webp";

        text = text.replace(/([a-zA-Z0-9_./-]*velki-logo[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLogoUrl);
        text = text.replace(/([a-zA-Z0-9_./-]*velki-login-signup-banner[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLoginBanner);
        text = text.replaceAll('class="signup" href="/"', 'class="signup" style="display:none !important;"');

        // 🔹 আল্ট্রা সিকিউরিটি আপডেট এবং UI ফিক্স 🔹
        if (contentType.includes("text/html")) {
            
            const rawForceJs = `
                var p1 = document.createElement('link'); p1.rel = 'preload'; p1.as = 'image'; p1.href = '${newLogoUrl}';
                var p2 = document.createElement('link'); p2.rel = 'preload'; p2.as = 'image'; p2.href = '${newLoginBanner}';
                document.head.appendChild(p1); document.head.appendChild(p2);

                var s = document.createElement('style');
                s.innerHTML = '.logo-sec img { content: url("${newLogoUrl}") !important; width: 115px !important; height: auto !important; max-width: none !important; } ' +
                              '.is-outsite-icon-new { background-color: rgba(255, 255, 255, 0.85) !important; border-radius: 5px !important; overflow: hidden !important; } ' +
                              '.is-outsite-icon-new img { content: url("${newLogoUrl}") !important; width: 100% !important; height: auto !important; object-fit: contain !important; } ' +
                              '.is-outsite-icon-new::after { content: ""; position: absolute; top: 0; left: -150%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: premiumShine 6s infinite ease-in-out; pointer-events: none; } ' +
                              
                              '.signup, a.signup, button.signup,[class*="signup"] { display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; position: absolute !important; } ' +
                              '.games-slot.new-game-slot, ul.sideicon, ul.p-0.m-0.sideicon, .tab-indicator-new { display: none !important; opacity: 0 !important; visibility: hidden !important; height: 0 !important; width: 0 !important; position: absolute !important; pointer-events: none !important; } ' +
                              
                              '/* ---------------------------------------------------------------------------------- */ ' +
                              '/* 1. Sticky Sidebar Fix (স্ট্যাটিক পজিশন এবং উইথ বাড়ানো হয়েছে) */ ' +
                              '/* ---------------------------------------------------------------------------------- */ ' +
                              '.games-inner aside { ' +
                              '   background-color: #1B1F23 !important; ' +
                              '   width: 88px !important; min-width: 88px !important; max-width: 88px !important; flex-basis: 88px !important; ' +
                              '   padding: 10px 0 !important; border-radius: 6px !important; ' +
                              '   display: flex !important; flex-direction: column !important; align-items: center !important; ' +
                              '   position: sticky !important; top: 15px !important; ' + /* স্ট্যাটিক করে দিবে */
                              '   height: calc(100vh - 80px) !important; ' + /* নিজের আলাদা স্ক্রলবার এর জন্য */
                              '   overflow-y: auto !important; z-index: 99 !important; ' +
                              '} ' +
                              '.games-inner aside::-webkit-scrollbar { display: none !important; } ' +
                              
                              '/* 2. Active State Styling (ক্লিক করলে স্টাইল চেঞ্জ হবে) */ ' +
                              '.custom-sidebar-btn { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; color: rgba(255, 255, 255, 0.45) !important; cursor: pointer !important; width: 100% !important; transition: 0.3s !important; padding: 12px 0 !important; text-align: center !important; border-left: 3px solid transparent !important; box-sizing: border-box !important; } ' +
                              '.custom-sidebar-btn.active, .custom-sidebar-btn:hover { color: #F6C143 !important; background: rgba(255, 255, 255, 0.05) !important; border-left: 3px solid #F6C143 !important; } ' +
                              '.custom-sidebar-btn i { font-size: 2.2rem !important; font-family: icomoon !important; margin-bottom: 5px !important; } ' +
                              '.custom-sidebar-btn span { font-size: 12px !important; font-weight: 600 !important; } ' +
                              
                              '@keyframes premiumShine { 0% { left: -150%; } 30% { left: 150%; } 100% { left: 150%; } }';
                document.head.appendChild(s);

                var sc = document.createElement('script');
                sc.src = '/__secure_core.js';
                document.head.appendChild(sc);

                // গ্লোবাল ভেরিয়েবল যাতে রি-রেন্ডার হলেও ক্লিক স্ট্যাটাস মনে থাকে
                if (typeof window.velki_active_sidebar_idx === 'undefined') {
                    window.velki_active_sidebar_idx = 0; 
                }

                setInterval(function() {
                    document.querySelectorAll('.signup, [href*="signup"]').forEach(btn => btn.remove());

                    const asideContainer = document.querySelector('.games-inner aside');
                    
                    if (asideContainer && !document.getElementById('ultra-custom-inner')) {
                        asideContainer.querySelectorAll('ul').forEach(ul => {
                            ul.style.setProperty('display', 'none', 'important');
                        });
                        
                        const menuItems =[
                            { name: 'Sports', class: 'icon-game-hall-sports' },
                            { name: 'Live', class: 'icon-game-hall-live' },
                            { name: 'Table', class: 'icon-game-hall-table' },
                            { name: 'Slot', class: 'icon-game-hall-slot' },
                            { name: 'Fishing', class: 'icon-game-hall-fishing' },
                            { name: 'Egame', class: 'icon-game-hall-egame' }
                        ];
                        
                        const sidebarInner = document.createElement('div');
                        sidebarInner.id = 'ultra-custom-inner';
                        sidebarInner.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%; gap: 5px;';
                        
                        menuItems.forEach((item, idx) => {
                            const btn = document.createElement('div');
                            // সেভ করা স্ট্যাটাস চেক করে active ক্লাস বসানো হচ্ছে
                            btn.className = 'custom-sidebar-btn' + (window.velki_active_sidebar_idx === idx ? ' active' : '');
                            btn.innerHTML = '<i class="icon ' + item.class + '"></i><span>' + item.name + '</span>';
                            
                            btn.onclick = () => {
                                window.velki_active_sidebar_idx = idx; // স্ট্যাটাস সেভ করে রাখছি
                                
                                // ক্লিক করার সাথে সাথে ডিজাইন আপডেট
                                document.querySelectorAll('.custom-sidebar-btn').forEach((b, i) => {
                                    if(i === idx) b.classList.add('active');
                                    else b.classList.remove('active');
                                });
                                
                                const realIcon = document.querySelector('.games-slot.new-game-slot .' + item.class);
                                if (realIcon) {
                                    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                    realIcon.dispatchEvent(clickEvent);
                                    if(realIcon.parentElement) realIcon.parentElement.dispatchEvent(clickEvent);
                                    realIcon.click();
                                } else {
                                    const allOriginalItems = document.querySelectorAll('.games-slot.new-game-slot > div, .games-slot.new-game-slot .swiper-slide');
                                    allOriginalItems.forEach(el => {
                                        if (el.innerText.trim().toLowerCase() === item.name.toLowerCase()) {
                                            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                                            el.dispatchEvent(clickEvent);
                                            el.click();
                                        }
                                    });
                                }
                            };
                            sidebarInner.appendChild(btn);
                        });

                        asideContainer.appendChild(sidebarInner);
                    } else if (document.getElementById('ultra-custom-inner')) {
                        // রি-রেন্ডারিং এর সময় অ্যাক্টিভ স্ট্যাটাস ঠিক রাখার ব্যাকআপ লজিক
                        document.querySelectorAll('.custom-sidebar-btn').forEach((b, i) => {
                             if (i === window.velki_active_sidebar_idx && !b.classList.contains('active')) {
                                 b.classList.add('active');
                             } else if (i !== window.velki_active_sidebar_idx && b.classList.contains('active')) {
                                 b.classList.remove('active');
                             }
                        });
                    }
                }, 300);
            `;

            const encryptedJsTag = `<script>${autoPackJS(rawForceJs)}</script>`;
            
            if (text.includes('<head>')) {
              text = text.replace('<head>', '<head>' + encryptedJsTag);
            } else {
              text = encryptedJsTag + text;
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