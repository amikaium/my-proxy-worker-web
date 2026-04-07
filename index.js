export default {
  async fetch(request) {
    const TARGET_DOMAIN = "vellki365.app";
    const url = new URL(request.url);
    const myDomain = url.hostname; // আপনার বর্তমান ডোমেইন বা ওয়ার্কার লিংক ক্যাচ করবে

    // URL-এর হোস্টনেম পরিবর্তন করে টার্গেট ডোমেইনে সেট করা
    url.hostname = TARGET_DOMAIN;

    // মূল রিকোয়েস্টের হেডার কপি করে টার্গেট ডোমেইন বসানো
    const proxyRequest = new Request(url.toString(), request);
    proxyRequest.headers.set("Host", TARGET_DOMAIN);
    proxyRequest.headers.set("Origin", `https://${TARGET_DOMAIN}`);
    proxyRequest.headers.set("Referer", `https://${TARGET_DOMAIN}${url.pathname}`);
    
    // এনকোডিং রিমুভ করা যাতে আমরা রেসপন্স বডি টেক্সট হিসেবে মডিফাই করতে পারি
    proxyRequest.headers.delete("Accept-Encoding");

    try {
      const response = await fetch(proxyRequest);
      const newHeaders = new Headers(response.headers);

      // সিকিউরিটি হেডারগুলো বাইপাস করা
      newHeaders.delete("Content-Security-Policy");
      newHeaders.delete("X-Frame-Options");
      newHeaders.delete("Clear-Site-Data");
      newHeaders.set("Access-Control-Allow-Origin", "*");

      // রিডাইরেক্ট (Redirect) ঠিক করা
      if (newHeaders.has("Location")) {
        let location = newHeaders.get("Location");
        newHeaders.set("Location", location.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain));
      }

      // কুকি (Cookies) ডোমেইন ঠিক করা
      if (newHeaders.has("Set-Cookie")) {
        let cookies = newHeaders.get("Set-Cookie");
        newHeaders.set("Set-Cookie", cookies.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain));
      }

      let body = response.body;
      const contentType = newHeaders.get("content-type") || "";
      
      // যদি রেসপন্স HTML, JS বা JSON হয়, তবে ভেতরের হার্ডকোড ডোমেইন রিপ্লেস করা
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("application/json")) {
        let text = await response.text();
        // টার্গেট ডোমেইনের সব উল্লেখ খুঁজে আপনার ডোমেইন বসিয়ে দেওয়া
        text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), myDomain);
        body = text;
      }

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
