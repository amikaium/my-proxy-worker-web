const TARGET_DOMAIN = "vellki365.app";
const API_TARGET_HOST = "vrnlapi.com:4041";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;
    const clientOrigin = request.headers.get("Origin") || `https://${myDomain}`;

    // ১. গ্লোবাল CORS (Preflight Request)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": clientOrigin, // '*' এর বদলে স্পেসিফিক ডোমেইন (খুবই জরুরি)
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Authorization, Content-Type, Accept, Origin, User-Agent, Referer, Cache-Control, token",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ==========================================
    // ২. API বাইপাস রাউট
    // ==========================================
    if (url.pathname.startsWith('/__api')) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "vrnlapi.com";
      targetUrl.port = "4041";
      targetUrl.protocol = "https:";
      targetUrl.pathname = targetUrl.pathname.replace(/^\/__api/, '');

      const apiHeaders = new Headers(request.headers);
      apiHeaders.set("Host", API_TARGET_HOST);
      apiHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
      apiHeaders.set("Referer", `https://${TARGET_DOMAIN}/`);
      
      apiHeaders.delete("cf-connecting-ip");
      apiHeaders.delete("cf-ipcountry");

      const apiRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: apiHeaders,
        body: request.body,
        redirect: "manual"
      });

      try {
        const apiResponse = await fetch(apiRequest);
        const responseHeaders = new Headers(apiResponse.headers);
        
        // CORS ফিক্স (আপনার স্ক্রিনশটের এররটি এখান থেকেই হচ্ছিল)
        responseHeaders.set("Access-Control-Allow-Origin", clientOrigin);
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.delete("content-length"); // সেফটির জন্য
        
        return new Response(apiResponse.body, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "API Server Unreachable" }), { status: 500 });
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

      responseHeaders.set("Access-Control-Allow-Origin", clientOrigin);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");

      // ওয়েবসাইটের টেক্সট মডিফাই করলে Content-Length মুছে দেওয়া বাধ্যতামূলক, নইলে সাইট লোড হয়ে ঘুরতে থাকবে
      responseHeaders.delete("content-length"); 

      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        location = location.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        responseHeaders.set("Location", location);
      }

      if (typeof response.headers.getSetCookie === 'function') {
        const cookies = response.headers.getSetCookie();
        responseHeaders.delete("Set-Cookie"); 
        cookies.forEach(cookie => {
          let newCookie = cookie.replace(new RegExp(`domain=${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          newCookie = newCookie.replace(new RegExp(`domain=\\.${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          newCookie = newCookie.replace(/SameSite=Strict/gi, "SameSite=None; Secure"); // লগিন ইস্যু ফিক্স
          responseHeaders.append("Set-Cookie", newCookie);
        });
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // ৪. স্মার্ট লিংক রিপ্লেসমেন্ট (যাতে প্রোফাইল বা অন্যান্য লিংক ব্রেক না করে)
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        
        // শুধু ফুল URL গুলো চেঞ্জ হবে, যেকোনো র‍্যান্ডম টেক্সট নয়
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(`wss://${TARGET_DOMAIN}`, 'g'), `wss://${myDomain}`);
        
        // API ডোমেইন রিপ্লেস (নিখুঁত ভাবে)
        text = text.replace(new RegExp(`https://${API_TARGET_HOST}`, 'g'), `https://${myDomain}/__api`);
        text = text.replace(new RegExp(`http://${API_TARGET_HOST}`, 'g'), `https://${myDomain}/__api`);
        
        // বিকল্প API হোস্ট (যদি কোথাও শুধু ডোমেইন থাকে)
        text = text.split(`"${API_TARGET_HOST}"`).join(`"${myDomain}/__api"`);
        text = text.split(`'${API_TARGET_HOST}'`).join(`'${myDomain}/__api'`);

        // HTML পেজের একেবারে শুরুতে API ইন্টারসেপ্টর হুক 
        if (contentType.includes("text/html")) {
          const headInject = `
            <script>
              if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) { registration.unregister(); }
                  });
              }
              (function() {
                const proxyUrl = 'https://' + window.location.host + '/__api';
                const targetHost = '${API_TARGET_HOST}';
                
                function fixUrl(url) {
                    if(typeof url === 'string' && url.includes(targetHost)) {
                        return url.replace(new RegExp('https?://' + targetHost, 'g'), proxyUrl)
                                  .replace(new RegExp(targetHost, 'g'), window.location.host + '/__api');
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
                    if(args[1]) args[1] = fixUrl(args[1]);
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
