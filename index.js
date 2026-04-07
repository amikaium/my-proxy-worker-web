export default {
  async fetch(request, env, ctx) {
    // Environment Variable থেকে টার্গেট ডোমেইন নেবে, না থাকলে ডিফল্টটি কাজ করবে
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    // স্ক্রিনশটে দেওয়া আপনার মেইন API সার্ভার
    const API_SERVER = "https://vrnlapi.com:4041"; 
    
    const url = new URL(request.url);

    // ১. CORS প্রিফ্লাইট (OPTIONS) রিকোয়েস্ট হ্যান্ডেল করা (যাতে React এর API কল ব্লক না হয়)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API রিকোয়েস্টগুলোকে অরিজিনাল API সার্ভারে প্রক্সি করা
    if (url.pathname.startsWith('/__api_proxy')) {
      const apiTargetUrl = new URL(request.url);
      apiTargetUrl.hostname = "vrnlapi.com";
      apiTargetUrl.port = "4041";
      // পাথ থেকে /__api_proxy অংশটুকু বাদ দিয়ে আসল API পাথ তৈরি করা
      apiTargetUrl.pathname = apiTargetUrl.pathname.replace('/__api_proxy', '');

      const apiReq = new Request(apiTargetUrl.toString(), request);
      // অরিজিনাল API সার্ভারকে বোঝানো যে রিকোয়েস্ট velki123.win থেকেই আসছে
      apiReq.headers.set("Host", "vrnlapi.com:4041");
      apiReq.headers.set("Origin", "https://velki123.win"); 
      apiReq.headers.set("Referer", "https://velki123.win/");

      try {
        const apiRes = await fetch(apiReq);
        const newApiRes = new Response(apiRes.body, apiRes);
        // ক্লায়েন্টের জন্য CORS ওপেন করে দেওয়া
        newApiRes.headers.set("Access-Control-Allow-Origin", "*"); 
        return newApiRes;
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "API Proxy Error: " + e.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ৩. মেইন ওয়েবসাইটের রিকোয়েস্ট হ্যান্ডেল করা
    const target = new URL(TARGET_DOMAIN);
    target.pathname = url.pathname;
    target.search = url.search;

    const proxyRequest = new Request(target.toString(), request);
    proxyRequest.headers.set("Host", target.hostname);
    proxyRequest.headers.set("Origin", target.origin);
    proxyRequest.headers.set("Referer", target.origin);
    
    // ব্রাউজারের এনকোডিং মুছে দেওয়া হচ্ছে যাতে আমরা Worker-এর ভেতর JS/HTML ফাইল পড়তে ও মডিফাই করতে পারি
    proxyRequest.headers.delete("Accept-Encoding"); 

    try {
      const response = await fetch(proxyRequest);
      const contentType = response.headers.get("content-type") || "";
      let newResponse;

      // ৪. ডাইনামিক রিপ্লেসমেন্ট: React এর JS বা HTML ফাইলে API এর লিংক আপনার বর্তমান ডোমেইনে রিপ্লেস করা
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        
        // যেখানেই 'https://vrnlapi.com:4041' আছে, সেখানে আপনার প্রক্সি লিংকের '/__api_proxy' বসিয়ে দেওয়া হবে
        const proxyApiPath = `https://${url.host}/__api_proxy`;
        text = text.replaceAll(API_SERVER, proxyApiPath);

        newResponse = new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        // ইমেজ, ফন্ট বা অন্য কোনো ফাইলের ক্ষেত্রে কোনো পরিবর্তন হবে না
        newResponse = new Response(response.body, response);
      }

      // ৫. সিকিউরিটি হেডার রিমুভ ও ফ্রন্টএন্ডের জন্য CORS ফিক্স করা
      const responseHeaders = new Headers(newResponse.headers);
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");
      responseHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(newResponse.body, {
        status: newResponse.status,
        statusText: newResponse.statusText,
        headers: responseHeaders
      });
      
    } catch (error) {
      return new Response("Web Proxy Error: " + error.message, { status: 500 });
    }
  }
};
