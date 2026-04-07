const TARGET_DOMAIN = "vellki365.app";
const API_TARGET = "vrnlapi.com:4041";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. গ্লোবাল CORS Preflight (সবচেয়ে বেশি পারমিসিভ করা হয়েছে)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ==========================================
    // ২. API বাইপাস সিস্টেম (Backend Proxy)
    // ==========================================
    if (url.pathname.startsWith('/__api/')) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "vrnlapi.com";
      targetUrl.port = "4041";
      targetUrl.protocol = "https:";
      targetUrl.pathname = targetUrl.pathname.replace(/^\/__api/, '');

      const apiHeaders = new Headers(request.headers);
      
      // আসল সার্ভারকে ধোকা দেওয়ার জন্য
      apiHeaders.set("Host", API_TARGET);
      apiHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
      apiHeaders.set("Referer", `https://${TARGET_DOMAIN}/`);
      
      // ক্লাউডফ্লেয়ারের কিছু হেডার রিমুভ করা যা সার্ভার ব্লক করতে পারে
      apiHeaders.delete("cf-connecting-ip");
      apiHeaders.delete("cf-ipcountry");
      apiHeaders.delete("cf-ray");
      apiHeaders.delete("cf-visitor");

      const apiRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: apiHeaders,
        body: request.body,
        redirect: "manual"
      });

      try {
        const apiResponse = await fetch(apiRequest);
        const responseHeaders = new Headers(apiResponse.headers);
        
        responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        
        return new Response(apiResponse.body, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response("API Error: " + e.message, { status: 500 });
      }
    }

    // ==========================================
    // ৩. মেইন ওয়েবসাইট প্রক্সি করা
    // ==========================================
    url.hostname = TARGET_DOMAIN;
    url.protocol = "https:";

    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", TARGET_DOMAIN);
    proxyHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
    proxyHeaders.set("Referer", `https://${TARGET_DOMAIN}${url.pathname}`);
    proxyHeaders.delete("Accept-Encoding");

    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: "manual"
    });

    try {
      const response = await fetch(proxyRequest);
      const responseHeaders = new Headers(response.headers);

      responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");

      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        location = location.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        location = location.replace(new RegExp(`http://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        responseHeaders.set("Location", location);
      }

      if (typeof response.headers.getSetCookie === 'function') {
        const cookies = response.headers.getSetCookie();
        responseHeaders.delete("Set-Cookie"); 
        cookies.forEach(cookie => {
          let newCookie = cookie.replace(new RegExp(`domain=${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          newCookie = newCookie.replace(new RegExp(`domain=\\.${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          newCookie = newCookie.replace(/SameSite=Strict/gi, "SameSite=Lax");
          responseHeaders.append("Set-Cookie", newCookie);
        });
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // ৪. HTML এর ভেতর Fetch API Interceptor ইনজেক্ট করা (মূল জাদু)
      if (contentType.includes("text/html")) {
        let text = await response.text();
        
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);

        // ক্লায়েন্ট-সাইড API ইন্টারসেপ্টর স্ক্রিপ্ট (এটি সকল রিকোয়েস্ট বাইপাস করবে)
        const interceptorScript = `
          <script>
            // Fetch API Override
            const originalFetch = window.fetch;
            window.fetch = async function() {
              let args = arguments;
              if (typeof args[0] === 'string' && args[0].includes('${API_TARGET}')) {
                args[0] = args[0].replace('https://${API_TARGET}', window.location.origin + '/__api');
                args[0] = args[0].replace('http://${API_TARGET}', window.location.origin + '/__api');
                args[0] = args[0].replace('//${API_TARGET}', window.location.origin + '/__api');
              } else if (args[0] instanceof Request && args[0].url.includes('${API_TARGET}')) {
                args[0] = new Request(args[0].url.replace('https://${API_TARGET}', window.location.origin + '/__api'), args[0]);
              }
              return originalFetch.apply(this, args);
            };

            // XMLHttpRequest (AJAX) Override
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function() {
              let args = arguments;
              if (typeof args[1] === 'string' && args[1].includes('${API_TARGET}')) {
                args[1] = args[1].replace('https://${API_TARGET}', window.location.origin + '/__api');
                args[1] = args[1].replace('http://${API_TARGET}', window.location.origin + '/__api');
                args[1] = args[1].replace('//${API_TARGET}', window.location.origin + '/__api');
              }
              return originalXHR.apply(this, args);
            };
          </script>
        </head>`;

        text = text.replace('</head>', interceptorScript);
        body = text;
      } 
      // JS ফাইলগুলোর জন্য সাধারণ রিপ্লেস
      else if (contentType.includes("application/javascript") || contentType.includes("application/json") || contentType.includes("text/javascript")) {
        let text = await response.text();
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);
        text = text.replace(new RegExp(`https://${API_TARGET}/`, 'g'), `https://${myDomain}/__api/`);
        text = text.replace(new RegExp(`https://${API_TARGET}`, 'g'), `https://${myDomain}/__api`);
        body = text;
      }

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
