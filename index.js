export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_DOMAINS = ["vrnlapi.com"]; 
    const MEDIA_AND_SCORE_DOMAINS = ["aax-eu1314.com"]; 
    const ALL_TARGETS = [...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // ==========================================
    // 🛡️ প্রফেশনাল সিকিউরিটি: Ghost Script Route
    // ==========================================
    if (url.pathname === '/__secure_core.js') {
        const referer = request.headers.get("Referer");
        
        // যদি কেউ সরাসরি লিংক ওপেন করে কোড চুরি করতে চায়, তবে তাকে ফেক কোড দেখানো হবে
        if (!referer || !referer.includes(url.hostname)) {
            return new Response(`console.log("Access Denied: Nice try, but you can't copy this code! 😎");`, {
                status: 200,
                headers: { "Content-Type": "application/javascript" }
            });
        }

        // 🔹 আপনার নির্দেশ অনুযায়ী শক্তিশালী IIFE Obfuscation 🔹
        // এই rawJs আপনার মূল কাজ করবে, কিন্তু ব্রাউজারে এটি এনক্রিপ্ট হয়ে যাবে
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
        
        // আসল কোডটিকে Base64 এ রূপান্তর করে একটি IIFE ফাংশনের ভেতর র‍্যাপ করা হলো 
        // এর ফলে ইন্সপেক্টরে কোড সম্পূর্ণ আনরিডেবল (Unreadable) দেখাবে
        const obfuscatedPayload = btoa(unescape(encodeURIComponent(rawJs)));
        const secretCode = `!function(){var e="${obfuscatedPayload}",t=decodeURIComponent(escape(atob(e)));new Function(t)()}();`;

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

        // 🔹 আপনার নির্দেশ অনুযায়ী লোগো পারফেক্টলি হাইড ও রিপ্লেসমেন্ট 🔹
        const newLogoUrl = "https://i.postimg.cc/J0P019Hr/20260408-225146.webp";
        // সোর্স কোড থেকে আগের লোগোর পাথগুলো সম্পূর্ণ মুছে ফেলা হচ্ছে
        text = text.replaceAll("../../assets/images/velki-logo.png", newLogoUrl);
        text = text.replaceAll("/assets/images/velki-logo.png", newLogoUrl);
        text = text.replaceAll("assets/images/velki-logo.png", newLogoUrl);

        // 🔒 প্রফেশনাল ইনজেকশন (Logo CSS Force + Security JS)
        if (contentType.includes("text/html")) {
            // 🔹 এখানে width: 115px দেওয়া হয়েছে লোগো বড় দেখানোর জন্য 🔹
            const forceLogoCSS = `<style>.logo-sec img { content: url("${newLogoUrl}") !important; width: 115px !important; height: auto !important; max-width: none !important; }</style>`;
            const ghostScriptTag = `<script src="/__secure_core.js"></script>`;
            
            if (text.includes('<head>')) {
              text = text.replace('<head>', '<head>' + forceLogoCSS + ghostScriptTag);
            } else {
              text = forceLogoCSS + ghostScriptTag + text;
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