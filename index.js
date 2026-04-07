export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    // ম্যাজিক: এখানে আমরা একটি তালিকা তৈরি করেছি। ব্যালেন্স এবং লাইভ টিভি উভয়ের ডোমেইনই এখন ইন্টারসেপ্ট হবে।
    const TARGET_APIS = ["vrnlapi.com", "aax-eu1314.com"]; 
    
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // ১. CORS প্রিফ্লাইট
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. ইউনিভার্সাল API এবং Video Stream প্রক্সি
    if (url.pathname.startsWith('/__api_proxy/')) {
      const actualApiUrl = request.url.substring(request.url.indexOf('/__api_proxy/') + 13);
      
      try {
        const targetApi = new URL(actualApiUrl);
        const apiReq = new Request(targetApi.toString(), request);
        
        // টার্গেট সার্ভারকে ধোঁকা দেওয়া
        apiReq.headers.set("Host", targetApi.host);
        apiReq.headers.set("Origin", TARGET_DOMAIN);
        apiReq.headers.set("Referer", TARGET_DOMAIN + "/");

        const apiRes = await fetch(apiReq);
        const newApiRes = new Response(apiRes.body, apiRes);
        
        newApiRes.headers.set("Access-Control-Allow-Origin", originHeader);
        newApiRes.headers.set("Access-Control-Allow-Credentials", "true");
        
        // মিডিয়া (ভিডিও) ফাইলগুলো ঠিকমতো প্লে হওয়ার জন্য Content-Type ঠিক রাখা
        if (apiRes.headers.has("content-type")) {
           newApiRes.headers.set("content-type", apiRes.headers.get("content-type"));
        }
        
        return newApiRes;
      } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy Error", message: e.message }), { status: 500 });
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
      
      // ৪. HTML এর ভেতর আমাদের আপডেটেড "Interceptor Script" বসানো
      if (contentType.includes("text/html")) {
        let html = await response.text();
        
        const interceptorScript = `
        <script>
          (function() {
            const proxyPrefix = '/__api_proxy/';
            const targetApis = ${JSON.stringify(TARGET_APIS)}; // আমাদের টার্গেট লিস্ট

            // লিংকটা টার্গেট লিস্টের মধ্যে আছে কি না সেটা চেক করার ফাংশন
            function shouldIntercept(url) {
              if (typeof url !== 'string') return false;
              return targetApis.some(api => url.includes(api));
            }

            // Fetch API ইন্টারসেপ্ট
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
              try {
                let reqUrl = args[0];
                if (typeof reqUrl === 'string' && shouldIntercept(reqUrl)) {
                  args[0] = proxyPrefix + reqUrl;
                } else if (reqUrl instanceof Request && shouldIntercept(reqUrl.url)) {
                  args[0] = new Request(proxyPrefix + reqUrl.url, reqUrl);
                }
              } catch(e) { console.error("Fetch Intercept Error", e); }
              return originalFetch.apply(this, args);
            };

            // XMLHttpRequest (XHR) ইন্টারসেপ্ট
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
        </script>
        `;
        
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>' + interceptorScript);
        } else {
          html = interceptorScript + html;
        }

        const newResponseHeaders = new Headers(response.headers);
        newResponseHeaders.delete("Content-Security-Policy");
        newResponseHeaders.delete("X-Frame-Options");
        newResponseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        newResponseHeaders.set("Access-Control-Allow-Origin", originHeader);

        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: newResponseHeaders
        });
      }

      const newResponseHeaders = new Headers(response.headers);
      newResponseHeaders.delete("Content-Security-Policy");
      newResponseHeaders.delete("X-Frame-Options");
      newResponseHeaders.set("Access-Control-Allow-Origin", originHeader);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newResponseHeaders
      });
      
    } catch (error) {
      return new Response("System Error: " + error.message, { status: 500 });
    }
  }
};
