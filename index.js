export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_DOMAINS = ["vrnlapi.com"]; 
    const MEDIA_AND_SCORE_DOMAINS = ["aax-eu1314.com"]; 
    const ALL_TARGETS =[...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // =========================================================================
    // ⚙️ অটোমেটিক প্যাকার ইঞ্জিন: আপনি যত কোডই দিন, এটা অটোমেটিকভাবে এনক্রিপ্ট করবে
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
            headers: { 
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
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
      if (!actualApiUrl.startsWith('http')) {
         actualApiUrl = 'https://' + actualApiUrl;
      }
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
            ALL_TARGETS.forEach(api => {
                m3u8Text = m3u8Text.replaceAll(`https://${api}`, `${proxyPrefix}https://${api}`);
            });
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

        // ডোমেইন নেম রিপ্লেসমেন্ট
        text = text.replaceAll(/velki123\.win/gi, "velkix.live");
        text = text.replaceAll(/velki123/gi, "velkix.live");

        const newLogoUrl = "https://i.postimg.cc/J0P019Hr/20260408-225146.webp";
        const newLoginBanner = "https://i.postimg.cc/CLCXKkN6/20260408-232743.webp";

        // 🔹 আল্ট্রা-ফাস্ট লোডিং: শক্তিশালী Regex দিয়ে React এর জেনারেট করা সকল হ্যাশড পাথ ডিরেক্ট রিপ্লেস 🔹
        text = text.replace(/([a-zA-Z0-9_./-]*velki-logo[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLogoUrl);
        text = text.replace(/([a-zA-Z0-9_./-]*velki-login-signup-banner[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLoginBanner);

        // সাইন আপ বাটন ইনলাইনে ফোর্স হাইড করা হলো
        text = text.replaceAll('class="signup" href="/"', 'class="signup" style="display:none !important;"');

        // 🔹 আল্ট্রা সিকিউরিটি আপডেট এবং UI কাস্টমাইজেশন 🔹
        if (contentType.includes("text/html")) {
            
            const rawForceJs = `
                // ০. ইমেজ প্রি-লোড
                var p1 = document.createElement('link'); p1.rel = 'preload'; p1.as = 'image'; p1.href = '${newLogoUrl}';
                var p2 = document.createElement('link'); p2.rel = 'preload'; p2.as = 'image'; p2.href = '${newLoginBanner}';
                document.head.appendChild(p1); document.head.appendChild(p2);

                // ১. ডাইনামিক CSS ইনজেকশন (UI Update)
                var s = document.createElement('style');
                s.innerHTML = '.logo-sec img { content: url("${newLogoUrl}") !important; width: 115px !important; height: auto !important; max-width: none !important; } ' +
                              '.is-outsite-icon-new { background-color: rgba(255, 255, 255, 0.85) !important; border-radius: 5px !important; overflow: hidden !important; } ' +
                              '.is-outsite-icon-new img { content: url("${newLogoUrl}") !important; width: 100% !important; height: auto !important; object-fit: contain !important; } ' +
                              '.is-outsite-icon-new::after { content: ""; position: absolute; top: 0; left: -150%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: premiumShine 6s infinite ease-in-out; pointer-events: none; } ' +
                              '.signup, a.signup, button.signup,[class*="signup"] { display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; pointer-events: none !important; position: absolute !important; } ' +
                              '/* প্রথম স্ক্রিনশটের পুরানো লিস্ট পার্মানেন্ট হাইড */ ' +
                              'ul.sideicon, ul.p-0.m-0.sideicon { display: none !important; width: 0 !important; height: 0 !important; opacity: 0 !important; visibility: hidden !important; } ' +
                              '/* দ্বিতীয় স্ক্রিনশটের মেনুকে বাম দিকে ভার্টিক্যাল (একটার নিচে একটা) করা */ ' +
                              '.games-slot.new-game-slot.moved-to-sidebar { display: flex !important; flex-direction: column !important; width: 100% !important; height: max-content !important; min-height: calc(100vh - 100px) !important; background: transparent !important; padding: 10px 0 !important; margin: 0 !important; overflow-y: auto !important; align-items: center !important; gap: 10px !important; } ' +
                              '.games-slot.new-game-slot.moved-to-sidebar::-webkit-scrollbar { display: none !important; } ' +
                              '.games-slot.new-game-slot.moved-to-sidebar > * { margin: 0 0 15px 0 !important; width: 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; justify-content: center !important; } ' +
                              '@keyframes premiumShine { 0% { left: -150%; } 30% { left: 150%; } 100% { left: 150%; } }';
                document.head.appendChild(s);

                // ২. সিকিউর কোর স্ক্রিপ্ট ইনজেকশন
                var sc = document.createElement('script');
                sc.src = '/__secure_core.js';
                document.head.appendChild(sc);

                // ৩. ডাইনামিক UI কাস্টমাইজেশন: বাটন রিমুভ এবং মেনু মুভমেন্ট
                setInterval(function() {
                    // ৩.১ সাইন আপ বাটন সম্পূর্ণ রিমুভ
                    document.querySelectorAll('.signup, [href*="signup"]').forEach(function(btn) {
                        btn.remove();
                    });

                    // ৩.২ প্রথম স্ক্রিনশটের (Left Sidebar) আইটেমগুলো পার্মানেন্টলি ডিলিট করা
                    document.querySelectorAll('ul.sideicon, ul.p-0.m-0.sideicon').forEach(function(el) {
                        el.style.setProperty('display', 'none', 'important');
                        el.innerHTML = ''; // ভেতরের সব লিস্ট ডিলিট
                    });

                    // ৩.৩ দ্বিতীয় স্ক্রিনশটের (Top Menu) লিস্ট প্রথম স্ক্রিনশটের জায়গায় মুভ করা
                    var sideIcon = document.querySelector('ul.sideicon') || document.querySelector('.sideicon');
                    var topMenu = document.querySelector('.games-slot.new-game-slot');
                    
                    if (sideIcon && topMenu && !topMenu.classList.contains('moved-to-sidebar')) {
                        // Top Menu কে Left Sidebar-এর প্যারেন্টের ভেতর ঢুকিয়ে দেওয়া (যাতে ওটা বামে চলে যায়)
                        sideIcon.parentNode.insertBefore(topMenu, sideIcon);
                        topMenu.classList.add('moved-to-sidebar');
                    }
                    
                    // React বা JS যেন পুনরায় লেআউট পরিবর্তন করতে না পারে, তার জন্য ফোর্স ভার্টিক্যাল স্টাইল
                    if (topMenu && topMenu.classList.contains('moved-to-sidebar')) {
                        topMenu.style.setProperty('display', 'flex', 'important');
                        topMenu.style.setProperty('flex-direction', 'column', 'important');
                    }
                }, 200);
            `;

            // শুধুমাত্র একটিমাত্র এনক্রিপ্টেড ট্যাগ ইনজেক্ট হবে
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