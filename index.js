const TARGET_DOMAIN = "vellki365.app";
const API_TARGET_HOST = "vrnlapi.com:4041";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. গ্লোবাল CORS (API এর জন্য প্রয়োজনীয় সব হেডার অ্যালাউ করা হয়েছে)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Authorization, Content-Type, Accept, Origin, User-Agent, Referer, Cache-Control",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ==========================================
    // ২. API বাইপাস রাউট (ম্যাজিক ব্রিজ)
    // ==========================================
    if (url.pathname.startsWith('/__api')) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "vrnlapi.com";
      targetUrl.port = "4041";
      targetUrl.protocol = "https:";
      
      // /__api অংশ কেটে দিয়ে আসল পাথ তৈরি
      targetUrl.pathname = targetUrl.pathname.replace(/^\/__api/, '');

      const apiHeaders = new Headers(request.headers);
      
      // আসল সার্ভারকে ধোকা দিয়ে বোঝানো যে অরিজিনাল সাইট থেকেই রিকোয়েস্ট যাচ্ছে
      apiHeaders.set("Host", API_TARGET_HOST);
      apiHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
      apiHeaders.set("Referer", `https://${TARGET_DOMAIN}/`);
      
      // ক্লাউডফ্লেয়ারের এক্সট্রা হেডার ডিলিট করা (যেন সার্ভার ব্লক না করে)
      apiHeaders.delete("cf-connecting-ip");
      apiHeaders.delete("cf-ipcountry");
      apiHeaders.delete("cf-ray");
      apiHeaders.delete("cf-visitor");
      apiHeaders.delete("x-forwarded-proto");

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
        return new Response(JSON.stringify({ error: "API Failed", details: e.message }), { status: 500 });
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
        location = location.split(`https://${TARGET_DOMAIN}`).join(`https://${myDomain}`);
        location = location.split(`http://${TARGET_DOMAIN}`).join(`https://${myDomain}`);
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

      // ৪. এডভান্স লিংক রিপ্লেসমেন্ট (ফোর্স বাইপাস)
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript") || contentType.includes("application/json")) {
        let text = await response.text();
        
        // মেইন ডোমেইন রিপ্লেস
        text = text.split(`https://${TARGET_DOMAIN}`).join(`https://${myDomain}`);
        text = text.split(TARGET_DOMAIN).join(myDomain);

        // API ডোমেইন ১০০% ফোর্স রিপ্লেস
        text = text.split(API_TARGET_HOST).join(`${myDomain}/__api`);

        // HTML পেজের একেবারে শুরুতে হুক ইনজেক্ট করা
        if (contentType.includes("text/html")) {
          const headInject = `
            <script>
              // পুরনো ক্যাশ এবং সার্ভিস ওয়ার্কার রিমুভ করা
              if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) { registration.unregister(); }
                  });
              }
              
              // জাভাস্ক্রিপ্ট হুক (ফোর্স API রাউটিং)
              (function() {
                const proxyUrl = window.location.host + '/__api';
                const targetHost = 'vrnlapi.com:4041';
                
                function fixUrl(url) {
                    if(typeof url === 'string' && url.includes(targetHost)) {
                        return url.split(targetHost).join(proxyUrl);
                    }
                    return url;
                }

                const origFetch = window.fetch;
                window.fetch = function() {
                    let args = Array.from(arguments);
                    if (args[0] instanceof Request && args[0].url.includes(targetHost)) {
                        args[0] = new Request(fixUrl(args[0].url), args[0]);
                    } else if (typeof args[0] === 'string') {
                        args[0] = fixUrl(args[0]);
                    }
                    return origFetch.apply(this, args);
                };

                const origOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function() {
                    let args = Array.from(arguments);
                    args[1] = fixUrl(args[1]);
                    return origOpen.apply(this, args);
                };
              })();
            </script>
          `;
          
          if (text.includes('<head>')) {
              text = text.replace('<head>', '<head>' + headInject);
          } else {
              text = headInject + text;
          }
        }

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
