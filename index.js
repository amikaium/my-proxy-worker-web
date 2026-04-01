export default {
  async fetch(request) {
    const TARGET_DOMAIN = "vellki247.com";
    const TARGET_URL = `https://${TARGET_DOMAIN}`;
    
    let url = new URL(request.url);
    const MY_DOMAIN = url.hostname;

    // ১. CORS Preflight (OPTIONS) বাইপাস - স্ট্যাটাস ২০৪ (No Content) দেওয়া হলো
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

    url.hostname = TARGET_DOMAIN;

    let newRequest = new Request(url.toString(), request);
    newRequest.headers.set("Host", TARGET_DOMAIN);
    newRequest.headers.set("Origin", TARGET_URL);
    newRequest.headers.set("Referer", `${TARGET_URL}/`);

    // ২. WebSocket সাপোর্ট
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(newRequest);
    }

    let response = await fetch(newRequest);
    
    // হেডার মডিফাই করার জন্য
    let modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set("Access-Control-Allow-Origin", "*");
    modifiedHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    modifiedHeaders.set("Access-Control-Allow-Headers", "*");
    modifiedHeaders.delete("X-Frame-Options");
    modifiedHeaders.delete("Content-Security-Policy");

    // ৩. HTML, JSON, API এবং JS ফাইলের ভেতরের লিঙ্কগুলো আপনার ডোমেইনে কনভার্ট করা
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") || 
        contentType.includes("application/json") || 
        contentType.includes("application/javascript") || 
        contentType.includes("text/javascript") ||
        contentType.includes("application/vnd.apple.mpegurl") || 
        contentType.includes("application/x-mpegURL") ||
        contentType.includes("text/plain")) {
        
      let text = await response.text();
      // vellki247.com কে আপনার m00.workers.dev দিয়ে রিপ্লেস করা
      let modifiedText = text.replace(new RegExp(TARGET_DOMAIN, 'g'), MY_DOMAIN);
      
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders
      });
    }

    // ৪. ছবি, ভিডিও বা অন্যান্য বাইনারি ফাইলের জন্য রেগুলার রেসপন্স
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders
    });
  }
};
