export default {
  async fetch(request) {
    const TARGET_DOMAIN = "vellki247.com";
    const TARGET_URL = `https://${TARGET_DOMAIN}`;
    
    let url = new URL(request.url);
    const MY_DOMAIN = url.hostname;

    // ১. CORS Preflight (OPTIONS) বাইপাস - এটিই আপনার .ts ফাইলের Status 0 এরর ফিক্স করবে
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    url.hostname = TARGET_DOMAIN;

    let newRequest = new Request(url.toString(), request);
    newRequest.headers.set("Host", TARGET_DOMAIN);
    newRequest.headers.set("Origin", TARGET_URL);
    newRequest.headers.set("Referer", `${TARGET_URL}/`);

    // ২. WebSocket সাপোর্ট (লাইভ স্কোরের জন্য)
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(newRequest);
    }

    let response = await fetch(newRequest);
    let newResponse = new Response(response.body, response);

    // ৩. সব রেসপন্সে CORS অ্যালাউ করে দেওয়া
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    newResponse.headers.set("Access-Control-Allow-Headers", "*");
    
    // ৪. ব্রাউজারের সিকিউরিটি ব্লক সরিয়ে দেওয়া
    newResponse.headers.delete("X-Frame-Options");
    newResponse.headers.delete("Content-Security-Policy");

    // ৫. HTML এবং m3u8 প্লেলিস্ট ফাইলের ভেতরের লিঙ্কগুলো আপনার ডোমেইনে পরিবর্তন করা
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") || contentType.includes("application/vnd.apple.mpegurl") || contentType.includes("application/x-mpegURL")) {
      let text = await response.text();
      // মেইন সাইটের নাম মুছে আপনার ডোমেইনের নাম বসিয়ে দেওয়া
      let modifiedText = text.replace(new RegExp(TARGET_DOMAIN, 'g'), MY_DOMAIN);
      return new Response(modifiedText, newResponse);
    }

    return newResponse;
  }
};
