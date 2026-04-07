const TARGET_DOMAIN = "vellki365.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. CORS Preflight (OPTIONS) বাইপাস করা (React অ্যাপের জন্য অত্যন্ত জরুরি)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. রিকোয়েস্ট URL ঠিক করা
    url.hostname = TARGET_DOMAIN;
    url.protocol = "https:";

    // ৩. রিকোয়েস্ট হেডার মডিফাই করা
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", TARGET_DOMAIN);
    proxyHeaders.set("Origin", `https://${TARGET_DOMAIN}`);
    proxyHeaders.set("Referer", `https://${TARGET_DOMAIN}${url.pathname}`);
    proxyHeaders.delete("Accept-Encoding"); // এটি ডিলিট করা জরুরি, নাহলে বডি মডিফাই করা যায় না

    const proxyRequest = new Request(url.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: "manual"
    });

    try {
      const response = await fetch(proxyRequest);
      const responseHeaders = new Headers(response.headers);

      // ৪. সিকিউরিটি এবং CORS হেডার ফিক্স করা
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");
      responseHeaders.delete("Clear-Site-Data");

      // ৫. রিডাইরেক্ট হ্যান্ডেল করা
      if ([301, 302, 303, 307, 308].includes(response.status) && responseHeaders.has("Location")) {
        let location = responseHeaders.get("Location");
        location = location.replace(new RegExp(TARGET_DOMAIN, 'gi'), myDomain);
        responseHeaders.set("Location", location);
      }

      // ৬. কুকি ডোমেইন ফিক্স করা
      if (responseHeaders.has("Set-Cookie")) {
        const cookies = responseHeaders.get("Set-Cookie");
        responseHeaders.set("Set-Cookie", cookies.replace(new RegExp(TARGET_DOMAIN, 'gi'), myDomain));
      }

      let body = response.body;
      const contentType = responseHeaders.get("content-type") || "";

      // ৭. মূল ম্যাজিক: HTML এবং JSON (Remix Data) এর ভেতরের ডোমেইন নেম চেঞ্জ করা
      // JavaScript ফাইল (application/javascript) চেঞ্জ করব না, কারণ সেটা করলে কোড ভেঙে যেতে পারে।
      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        let text = await response.text();
        
        // টার্গেট ডোমেইনকে প্রক্সি ডোমেইন দিয়ে রিপ্লেস করা
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
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
