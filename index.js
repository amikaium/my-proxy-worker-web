export default {
  async fetch(request) {
    const TARGET_DOMAIN = "vellki247.com";
    const TARGET_URL = `https://${TARGET_DOMAIN}`;
    
    let url = new URL(request.url);
    const MY_DOMAIN = url.hostname;

    // ১. CORS Preflight (OPTIONS) বাইপাস - ভিডিও খণ্ড (.ts) ফেইল হওয়া ঠেকাতে
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // মূল রিকোয়েস্টের ইউআরএল পরিবর্তন
    url.hostname = TARGET_DOMAIN;

    let newHeaders = new Headers(request.headers);
    newHeaders.set("Host", TARGET_DOMAIN);
    newHeaders.set("Origin", TARGET_URL);
    newHeaders.set("Referer", `${TARGET_URL}${url.pathname}`);

    let newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "manual"
    });

    // ২. WebSocket সাপোর্ট (লাইভ স্কোরের জন্য)
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(newRequest);
    }

    // মেইন সাইট থেকে ডাটা ফেচ করা
    let response = await fetch(newRequest);
    let responseHeaders = new Headers(response.headers);

    // ৩. সিকিউরিটি এবং CORS হেডার সেট করা (ভিডিও প্লেয়ার যেন ব্লক না হয়)
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    responseHeaders.delete("X-Frame-Options");
    responseHeaders.delete("Content-Security-Policy");
    responseHeaders.delete("Strict-Transport-Security");

    // ৪. লগইন সমস্যা সমাধান (Cookie Modification)
    // SameSite পলিসি পরিবর্তন করে None এবং Secure করা যেন লগইন ব্লক না হয়
    if (responseHeaders.has("Set-Cookie")) {
      const setCookies = responseHeaders.getSetCookie ? responseHeaders.getSetCookie() : [responseHeaders.get("Set-Cookie")];
      responseHeaders.delete("Set-Cookie"); 
      
      for (let cookie of setCookies) {
          if (cookie) {
              let modifiedCookie = cookie.replace(/SameSite=(Lax|Strict)/ig, "SameSite=None");
              if (!/Secure/i.test(modifiedCookie)) {
                  modifiedCookie += "; Secure";
              }
              responseHeaders.append("Set-Cookie", modifiedCookie);
          }
      }
    }

    // রিডাইরেক্ট ইউআরএল ফিক্স করা (লগইন করার পর যেন মেইন সাইটে না চলে যায়)
    if (responseHeaders.has("Location")) {
       let loc = responseHeaders.get("Location");
       responseHeaders.set("Location", loc.replace(TARGET_DOMAIN, MY_DOMAIN));
    }

    // ৫. কন্টেন্ট রিপ্লেসমেন্ট (HTML, API, JS এবং m3u8 এর ভেতরের লিঙ্ক পরিবর্তন)
    const contentType = responseHeaders.get("content-type") || "";
    const shouldRewrite = contentType.includes("text/html") || 
                          contentType.includes("application/json") || 
                          contentType.includes("application/javascript") || 
                          contentType.includes("text/javascript") ||
                          contentType.includes("application/vnd.apple.mpegurl") || 
                          contentType.includes("application/x-mpegURL");

    if (shouldRewrite) {
      try {
        let text = await response.text();
        let modifiedText = text.replace(new RegExp(TARGET_DOMAIN, 'g'), MY_DOMAIN);
        return new Response(modifiedText, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (e) {
        // ফাইল সাইজ অনেক বড় হলে বা এরর হলে অরিজিনাল ফাইল রিটার্ন করবে
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      }
    }

    // ছবি, ভিডিও (.ts) বা অন্যান্য বাইনারি ফাইলের জন্য সরাসরি রেসপন্স
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};
