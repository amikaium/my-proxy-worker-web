export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    // এই API ডোমেইনগুলোকে আমরা ইন্টারসেপ্ট করব
    const API_DOMAIN = "vrnlapi.com"; 
    
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

    // ২. ইউনিভার্সাল API প্রক্সি (সব রিকোয়েস্ট এখান দিয়ে যাবে)
    if (url.pathname.startsWith('/__api_proxy/')) {
      // ব্রাউজার থেকে পাঠানো আসল API লিংকটি বের করা হচ্ছে
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
      
      // ৪. শুধুমাত্র HTML ফাইলের ভেতর আমাদের "Interceptor Script" ইনজেক্ট করা হবে
      if (contentType.includes("text/html")) {
        let html = await response.text();
        
        // এই স্ক্রিপ্টটি ব্রাউজারের সমস্ত নেটওয়ার্ক কল হ্যাক করে আমাদের প্রক্সিতে পাঠিয়ে দেবে
        const interceptorScript = `
        <script>
          (function() {
            const proxyPrefix = '/__api_proxy/';
            const targetApi = '${API_DOMAIN}';

            // Fetch API ইন্টারসেপ্ট করা
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
              try {
                let reqUrl = args[0];
                if (typeof reqUrl === 'string' && reqUrl.includes(targetApi)) {
                  args[0] = proxyPrefix + reqUrl;
                } else if (reqUrl instanceof Request && reqUrl.url.includes(targetApi)) {
                  args[0] = new Request(proxyPrefix + reqUrl.url, reqUrl);
                }
              } catch(e) { console.error("Fetch Intercept Error", e); }
              return originalFetch.apply(this, args);
            };

            // XMLHttpRequest (XHR) ইন্টারসেপ্ট করা
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
              try {
                if (typeof url === 'string' && url.includes(targetApi)) {
                  url = proxyPrefix + url;
                }
              } catch(e) {}
              return originalOpen.call(this, method, url, ...rest);
            };
            
          })();
        </script>
        `;
        
        // HTML এর <head> ট্যাগের ঠিক পরেই স্ক্রিপ্টটি বসিয়ে দেওয়া হচ্ছে
        if (html.includes('<head>')) {
          html = html.replace('<head>', '<head>' + interceptorScript);
        } else {
          html = interceptorScript + html;
        }

        const newResponseHeaders = new Headers(response.headers);
        newResponseHeaders.delete("Content-Security-Policy");
        newResponseHeaders.delete("X-Frame-Options");
        // ব্রাউজারকে ক্যাশ করতে বারণ করা হচ্ছে
        newResponseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        newResponseHeaders.set("Access-Control-Allow-Origin", originHeader);

        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers: newResponseHeaders
        });
      }

      // ৫. JS বা CSS ফাইলের ভেতরে আমরা কোনো হাত দেব না (যাতে ওয়েবসাইট কোনোভাবেই ব্রেক না করে)
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
