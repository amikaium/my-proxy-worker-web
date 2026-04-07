const TARGET_DOMAIN = "vellki365.app";
const API_TARGET_HOST = "vrnlapi.com:4041";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;
    
    // ব্রাউজারের অরিজিন বের করা (যাতে শুধু "https" না আসে, সম্পূর্ণ URL আসে)
    const originHeader = request.headers.get("Origin");
    const safeOrigin = originHeader ? originHeader : url.origin;

    // ১. গ্লোবাল CORS (Preflight Request - API রিকোয়েস্ট অ্যালাউ করার জন্য)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": safeOrigin,
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "*", // সব ধরনের হেডার (Authorization Token) অ্যালাউ করা হলো
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ==========================================
    // ২. API ও WebSocket বাইপাস রাউট (ম্যাজিক ব্রিজ)
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
      
      // ক্লাউডফ্লেয়ারের রিয়েল আইপি হেডার রিমুভ (সার্ভার যেন ব্লক না করে)
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
        
        // API থেকে ব্রাউজারে ডেটা যাওয়ার সময় CORS ঠিক করে দেওয়া
        responseHeaders.set("Access-Control-Allow-Origin", safeOrigin);
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.delete("content-length"); 
        
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

      responseHeaders.set("Access-Control-Allow-Origin", safeOrigin);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");
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
          newCookie = newCookie.replace(/SameSite=Strict/gi, "SameSite=None; Secure"); 
          responseHeaders.append("Set-Cookie", newCookie);
        });
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // ৪. স্মার্ট লিংক ও API ইন্টারসেপ্টর (Frontend Hook)
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        
        // ডোমেইন রিপ্লেস
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        
        // HTML পেজের একেবারে শুরুতে API এবং WebSocket হুক ইনজেক্ট করা
        if (contentType.includes("text/html")) {
          const headInject = `
            <script>
              (function() {
                const proxyUrl = window.location.origin + '/__api';
                const targetHost = '${API_TARGET_HOST}';
                
                function fixUrl(url) {
                    if(typeof url === 'string') {
                        if(url.includes(targetHost)) {
                            return url.replace(new RegExp('https?://' + targetHost, 'g'), proxyUrl)
                                      .replace(new RegExp('wss?://' + targetHost, 'g'), 'wss://' + window.location.host + '/__api')
                                      .replace(new RegExp(targetHost, 'g'), window.location.host + '/__api');
                        }
                    }
                    return url;
                }

                // 1. Fetch API Hook (For Balance/Login requests)
                const origFetch = window.fetch;
                window.fetch = async function() {
                    let args = Array.from(arguments);
                    if (args[0] instanceof Request && args[0].url.includes('vrnlapi')) {
                        args[0] = new Request(fixUrl(args[0].url), args[0]);
                    } else if (typeof args[0] === 'string' && args[0].includes('vrnlapi')) {
                        args[0] = fixUrl(args[0]);
                    }
                    return origFetch.apply(this, args);
                };

                // 2. XMLHttpRequest Hook
                const origOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function() {
                    let args = Array.from(arguments);
                    if(args[1]) args[1] = fixUrl(args[1]);
                    return origOpen.apply(this, args);
                };

                // 3. WebSocket Hook (CRITICAL FOR LIVE BALANCE & ODDS)
                const OrigWebSocket = window.WebSocket;
                window.WebSocket = function(url, protocols) {
                    let newUrl = fixUrl(url);
                    if (protocols) return new OrigWebSocket(newUrl, protocols);
                    return new OrigWebSocket(newUrl);
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
