const TARGET_DOMAIN = "vellki365.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // টার্গেট ডোমেইন এবং প্রোটোকল সেট করা (HTTPS বাধ্যতামূলক)
    url.hostname = TARGET_DOMAIN;
    url.protocol = "https:"; 

    // অরিজিনাল রিকোয়েস্টের হেডার কপি করে মডিফাই করা
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", TARGET_DOMAIN);
    proxyHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
    proxyHeaders.set("Referer", `https://${TARGET_DOMAIN}${url.pathname}`);
    
    // টার্গেট সার্ভারকে বোঝানো যে এটি একটি প্রক্সি রিকোয়েস্ট
    proxyHeaders.set("X-Forwarded-Host", myDomain);
    proxyHeaders.set("X-Forwarded-Proto", "https");

    // এনকোডিং রিমুভ করা যাতে আমরা রেসপন্স বডি (HTML) মডিফাই করতে পারি
    proxyHeaders.delete("Accept-Encoding");

    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: "manual" // রিডাইরেক্ট আমরা নিচে ম্যানুয়ালি কন্ট্রোল করব
    });

    try {
      const response = await fetch(proxyRequest);
      const responseHeaders = new Headers(response.headers);

      // সিকিউরিটি হেডারগুলো রিমুভ করা যাতে ফ্রেম বা ব্লকিং ইস্যু না হয়
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");
      responseHeaders.delete("Clear-Site-Data");
      responseHeaders.set("Access-Control-Allow-Origin", "*");

      // রিডাইরেক্ট (Redirects 301, 302) সঠিকভাবে হ্যান্ডেল করা
      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        // টার্গেট ডোমেইনের রিডাইরেক্ট লিংক পরিবর্তন করে আপনার ডোমেইন বসানো
        location = location.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        location = location.replace(new RegExp(`http://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        responseHeaders.set("Location", location);
      }

      // কুকি (Cookies) ডোমেইন ঠিক করা
      if (responseHeaders.has("Set-Cookie")) {
        const cookies = responseHeaders.get("Set-Cookie");
        responseHeaders.set("Set-Cookie", cookies.replace(new RegExp(TARGET_DOMAIN, 'gi'), myDomain));
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // মূল সমাধান: শুধুমাত্র HTML ফাইলে রিপ্লেস করব। JS বা JSON মডিফাই করলে React অ্যাপ ভেঙে যায়!
      if (contentType.includes("text/html")) {
        let text = await response.text();
        // HTML এর ভেতরের লিংকগুলো আপনার ডোমেইনে পরিবর্তন করা
        text = text.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`);
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);
        body = text;
      }

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
      
    } catch (e) {
      return new Response("Reverse Proxy Error: " + e.message, { status: 500 });
    }
  }
};
