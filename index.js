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

      // ৩. CORS হেডার ഫিক্স করা (Credentials True করা বাধ্যতামূলক লগইনের জন্য)
      responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");

      // ৪. রিডাইরেক্ট হ্যান্ডেল করা (লগইন হওয়ার পর ড্যাশবোর্ডে যাওয়ার জন্য)
      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        location = location.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        location = location.replace(new RegExp(`http://${TARGET_DOMAIN}`, 'gi'), `https://${myDomain}`);
        responseHeaders.set("Location", location);
      }

      // ৫. কুকি (Cookies) একদম পারফেক্টভাবে হ্যান্ডেল করা (লগইন ফিক্স)
      if (typeof response.headers.getSetCookie === 'function') {
        const cookies = response.headers.getSetCookie();
        responseHeaders.delete("Set-Cookie"); // আগের সব মুছে নতুন করে সেট করব
        
        cookies.forEach(cookie => {
          // ডোমেইন নেম চেঞ্জ করা
          let newCookie = cookie.replace(new RegExp(`domain=${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          newCookie = newCookie.replace(new RegExp(`domain=\\.${TARGET_DOMAIN}`, 'gi'), `domain=${myDomain}`);
          
          // SameSite=Strict থাকলে প্রক্সিতে লগইন ভেঙে যায়, তাই Lax করে দেওয়া হলো
          newCookie = newCookie.replace(/SameSite=Strict/gi, "SameSite=Lax");
          
          responseHeaders.append("Set-Cookie", newCookie);
        });
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // ৬. HTML, JSON এবং CSS থেকে ডোমেইন নেম ও কালার রিপ্লেস করা
      // এখানে text/css যুক্ত করা হয়েছে যাতে ওয়েবসাইটের স্টাইলশিটগুলো মোডিফাই করা যায়
      if (contentType.includes("text/html") || contentType.includes("application/json") || contentType.includes("text/css")) {
        let text = await response.text();
        
        // ডোমেইন রিপ্লেস
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);

        // --- কালার রিপ্লেস করার লজিক (Yellow থেকে 1xBet Dark Blue) ---
        
        // 1xBet এর ডার্ক ব্লু কালার কোড
        const darkBlueRGB = 'rgb(27, 42, 59)';
        const darkBlueHex = '#1B2A3B';

        // ১. rgb(255, 200, 0) রিপ্লেস করা (স্পেস সহ বা স্পেস ছাড়া সব ধরবে)
        text = text.replace(/rgb\(\s*255\s*,\s*200\s*,\s*0\s*\)/gi, darkBlueRGB);
        
        // ২. যদি কোথাও হেক্স কোড হিসেবে হলুদ কালার ব্যবহার করা হয় (#ffc800), সেটাও রিপ্লেস করবে
        text = text.replace(/#ffc800/gi, darkBlueHex);

        // বডি আপডেট করা
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
