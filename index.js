export default {
  async fetch(request) {
    const targetDomain = "vellki247.com";
    const url = new URL(request.url);
    const proxyHost = url.host; // আপনার workers.dev ডোমেইন

    // মূল ওয়েবসাইটের জন্য URL তৈরি
    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;

    // ১. ভিডিও স্ট্রিমিংয়ের জন্য অত্যন্ত জরুরি: OPTIONS Preflight রিকোয়েস্ট বাইপাস
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // WebSocket সাপোর্ট
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(targetUrl, request);
    }

    // মূল সার্ভারে পাঠানোর জন্য রিকোয়েস্ট তৈরি
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("Host", targetDomain);
    modifiedHeaders.set("Origin", `https://${targetDomain}`);
    modifiedHeaders.set("Referer", `https://${targetDomain}/`);
    
    // Cloudflare IP ট্র্যাকিং হাইড করা
    modifiedHeaders.delete("cf-connecting-ip");
    modifiedHeaders.delete("x-forwarded-for");
    modifiedHeaders.delete("x-real-ip");
    // জিপ করা ফাইল যেন না আসে তাই এনকোডিং রিমুভ (যাতে আমরা এডিট করতে পারি)
    modifiedHeaders.delete("Accept-Encoding");

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
      redirect: "manual"
    });

    try {
      const response = await fetch(modifiedRequest);
      const newHeaders = new Headers(response.headers);
      
      // ২. সিকিউরিটি পলিসি ব্রেক করা (যাতে প্রক্সিতে ভিডিও প্লেয়ার কাজ করে)
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      newHeaders.delete("X-Frame-Options");
      newHeaders.delete("Content-Security-Policy");
      newHeaders.delete("Strict-Transport-Security");

      const contentType = newHeaders.get("content-type") || "";

      // ৩. ভিডিও লাইভ স্ট্রিমিং ফাইল (m3u8), JSON (API Data) এবং JavaScript মডিফাই করা
      if (
        contentType.includes("application/json") || 
        contentType.includes("text/javascript") || 
        contentType.includes("application/javascript") ||
        contentType.includes("application/x-mpegURL") || 
        contentType.includes("application/vnd.apple.mpegurl") ||
        contentType.includes("text/html")
      ) {
        
        // ফাইলটি টেক্সট হিসেবে পড়া
        let bodyText = await response.text();
        
        // ফাইলের ভেতর যত জায়গায় vellki247.com আছে, সব আপনার প্রক্সি ডোমেইন দিয়ে রিপ্লেস হবে
        // এটি API থেকে আসা ভিডিও লিংকগুলোকেও চেঞ্জ করে দেবে
        const domainRegex = new RegExp(targetDomain, 'gi');
        bodyText = bodyText.replace(domainRegex, proxyHost);

        // HTML ফাইলের ভেতরে অতিরিক্ত একটি মেটা ট্যাগ বসানো (CORS/Referer ব্লকিং এড়াতে)
        if (contentType.includes("text/html")) {
          bodyText = bodyText.replace('<head>', '<head><meta name="referrer" content="no-referrer" />');
        }

        return new Response(bodyText, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      // ৪. ভিডিওর মূল অংশ (.ts ফাইল), ছবি, ফন্ট ইত্যাদি সরাসরি পাঠিয়ে দেওয়া (এডিট করলে নষ্ট হয়ে যাবে)
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
