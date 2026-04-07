const TARGET_DOMAIN = "vellki365.app";
const API_TARGET = "vrnlapi.com:4041"; // স্ক্রিনশট থেকে পাওয়া লগইন API সার্ভার

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. CORS Preflight (সব রিকোয়েস্টের জন্য)
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
    // ২. লগইন API বাইপাস করা (CORS Error ফিক্স)
    // ==========================================
    if (url.pathname.startsWith('/__api/')) {
      const targetUrl = new URL(request.url);
      targetUrl.hostname = "vrnlapi.com";
      targetUrl.port = "4041";
      targetUrl.protocol = "https:";
      // /__api/ অংশটুকু রিমুভ করে আসল পাথ তৈরি করা
      targetUrl.pathname = targetUrl.pathname.replace('/__api/', '/');

      const apiHeaders = new Headers(request.headers);
      apiHeaders.set("Host", API_TARGET);
      apiHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
      apiHeaders.set("Referer", `https://${TARGET_DOMAIN}/`);

      const apiRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: apiHeaders,
        body: request.body,
        redirect: "manual"
      });

      try {
        const apiResponse = await fetch(apiRequest);
        const responseHeaders = new Headers(apiResponse.headers);
        
        // API থেকে আসা রেসপন্সে CORS ঠিক করা
        responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        
        // API যদি কোনো কুকি দেয়, সেটা নিজের ডোমেইনে সেট করা
        if (typeof apiResponse.headers.getSetCookie === 'function') {
            const cookies = apiResponse.headers.getSetCookie();
            responseHeaders.delete("Set-Cookie");
            cookies.forEach(cookie => {
                let newCookie = cookie.replace(/domain=[^;]+/gi, `domain=${myDomain}`);
                newCookie = newCookie.replace(/SameSite=Strict/gi, "SameSite=Lax");
                responseHeaders.append("Set-Cookie", newCookie);
            });
        }

        return new Response(apiResponse.body, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response("API Proxy Error: " + e.message, { status: 500 });
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
    
    const clientIP = request.headers.get('cf-connecting-ip');
    if (clientIP) {
      proxyHeaders.set('X-Forwarded-For', clientIP);
    }
    
    proxyHeaders.delete("Accept-Encoding"); // Text replace করার জন্য এটি জরুরি

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

      // ৪. HTML এবং Javascript ফাইলের ভেতর থেকে লিংক চেঞ্জ করা
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("application/json")) {
        let text = await response.text();
        
        // মেইন ডোমেইন রিপ্লেস
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);

        // API লিংক বাইপাস (লগইন লিংকটি আমাদের ওয়ার্কার রাউটে ডাইভার্ট করা)
        text = text.replace(/https:\/\/vrnlapi\.com:4041\//g, `https://${myDomain}/__api/`);
        text = text.replace(/https:\/\/vrnlapi\.com:4041/g, `https://${myDomain}/__api/`);

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
