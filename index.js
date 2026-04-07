export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    // এই ডোমেইনগুলোকে আমরা প্রক্সি করব (API + Video)
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

    // ২. API এবং Video Stream (m3u8/ts) প্রক্সি
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
        
        // জাদুকরী ট্রিক: লাইভ টিভির m3u8 প্লেলিস্ট ফাইলের ভেতরের লিংকগুলোকেও প্রক্সি করা
        if (contentType.includes("mpegurl") || contentType.includes("m3u8") || url.pathname.endsWith(".m3u8")) {
            let m3u8Text = await apiRes.text();
            const proxyPrefix = `https://${url.host}/__api_proxy/`;
            
            // m3u8 এর ভেতরে থাকা ভিডিও ডোমেইনগুলোকে প্রক্সিতে কনভার্ট করা
            TARGET_APIS.forEach(api => {
                m3u8Text = m3u8Text.replaceAll(`https://${api}`, `${proxyPrefix}https://${api}`);
            });
            newApiRes = new Response(m3u8Text, apiRes);
        } else {
            // .ts ভিডিও ফাইল বা অন্য API ডেটার জন্য
            newApiRes = new Response(apiRes.body, apiRes);
        }
        
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
      let responseBody;
      const newResponseHeaders = new Headers(response.headers);

      // ৪. HTML এবং JS ফাইলের ভেতর ডাইনামিক রিপ্লেসমেন্ট (ভিডিও প্লেয়ারের Web Worker এর জন্য)
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        const proxyPrefix = `https://${url.host}/__api_proxy/`;
        
        TARGET_APIS.forEach(api => {
            const originalUrl = `https://${api}`;
            const proxyUrl = `${proxyPrefix}${originalUrl}`;
            text = text.replaceAll(originalUrl, proxyUrl);
            
            // এস্কেপ করা লিংকের জন্য (যেমন: https:\/\/aax-eu...)
            const escapedOriginal = originalUrl.replace(/\//g, '\\/');
            const escapedProxy = proxyUrl.replace(/\//g, '\\/');
            text = text.replaceAll(escapedOriginal, escapedProxy);
        });

        // HTML ফাইলে Interceptor Script বসানো (আগের মতোই এক্সট্রা সেফটির জন্য)
        if (contentType.includes("text/html")) {
            const interceptorScript = `
            <script>
              (function() {
                const proxyPrefix = '/__api_proxy/';
                const targetApis = ${JSON.stringify(TARGET_APIS)};
                function shouldIntercept(url) {
                  if (typeof url !== 'string') return false;
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
            </script>
            `;
            if (text.includes('<head>')) {
              text = text.replace('<head>', '<head>' + interceptorScript);
            } else {
              text = interceptorScript + text;
            }
        }
        
        responseBody = text;
        // ব্রাউজারকে ক্যাশ করতে বারণ করা হচ্ছে 
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
      return new Response("System Error: " + error.message, { status: 500 });
    }
  }
};
