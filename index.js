const TARGET_DOMAIN = "vellki365.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. CORS Preflight: লগইন API এর জন্য অত্যন্ত জরুরি
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true", // লগইন সেশন সেভ করার জন্য
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    url.hostname = TARGET_DOMAIN;
    url.protocol = "https:";

    // ২. রিকোয়েস্ট হেডার মডিফাই করা
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", TARGET_DOMAIN);
    proxyHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
    proxyHeaders.set("Referer", `https://${TARGET_DOMAIN}${url.pathname}`);
    
    // আসল আইপি পাস করা (যাতে সাইট আপনাকে বট ভেবে ব্লক না করে)
    const clientIP = request.headers.get('cf-connecting-ip');
    if (clientIP) {
      proxyHeaders.set('X-Forwarded-For', clientIP);
    }
    
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

      // ৩. CORS হেডার ഫিক্স করা
      responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");

      // ৪. রিডাইরেক্ট হ্যান্ডেল করা
      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        location = location.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        location = location.replace(new RegExp(`http://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        responseHeaders.set("Location", location);
      }

      // ৫. কুকি (Cookies) পারফেক্টভাবে হ্যান্ডেল করা
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

      // ৬. HTML, JSON এবং CSS থেকে কালার ও ডোমেইন রিপ্লেস
      if (contentType.includes("text/html") || contentType.includes("application/json") || contentType.includes("text/css")) {
        let text = await response.text();
        
        // ডোমেইন রিপ্লেস
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);

        // --- কালার রিপ্লেস করার লজিক (Yellow থেকে একটু লাইট 1xBet Blue) ---
        const lightBlueRGB = '#FFFFFF'; // নতুন লাইট ব্লু RGB
        const lightBlueHex = '#FFFFFF';          // নতুন লাইট ব্লু HEX

        // হলুদ কালার রিপ্লেস
        text = text.replace(/rgb\(\s*255\s*,\s*200\s*,\s*0\s*\)/gi, lightBlueRGB);
        text = text.replace(/#ffc800/gi, lightBlueHex);

        // ৭. বাটনের লেখার কালার সাদা করার জন্য CSS ইনজেক্ট করা (শুধুমাত্র HTML পেজে)
        if (contentType.includes("text/html")) {
          const customCSS = `
            <style>
              .theme-btn, .btn-primary { 
                color: #ffffff !important; 
              }
            </style>
          </head>`;
          text = text.replace('</head>', customCSS);
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
