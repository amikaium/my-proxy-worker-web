export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_SERVER = "https://vrnlapi.com:4041"; 
    
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // ১. CORS প্রিফ্লাইট
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "*", 
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API প্রক্সি (HTTP এবং WebSocket দুটোর জন্যই)
    if (url.pathname.startsWith('/__api_proxy')) {
      const apiTargetUrl = new URL(request.url);
      apiTargetUrl.hostname = "vrnlapi.com";
      apiTargetUrl.port = "4041";
      apiTargetUrl.pathname = apiTargetUrl.pathname.replace('/__api_proxy', '');
      
      // ম্যাজিক: রিকোয়েস্টটি যদি লাইভ ব্যালেন্সের (WebSocket) হয়, তবে প্রোটোকল পাল্টে দেওয়া
      if (request.headers.get("Upgrade") === "websocket") {
        apiTargetUrl.protocol = "wss:";
      } else {
        apiTargetUrl.protocol = "https:";
      }

      const apiReq = new Request(apiTargetUrl.toString(), request);
      apiReq.headers.set("Host", "vrnlapi.com:4041");
      apiReq.headers.set("Origin", "https://velki123.win"); 
      apiReq.headers.set("Referer", "https://velki123.win/");

      // WebSocket কানেকশন সরাসরি অরিজিনাল সার্ভারে বাইপাস করা
      if (request.headers.get("Upgrade") === "websocket") {
        return await fetch(apiReq);
      }

      try {
        const apiRes = await fetch(apiReq);
        const newApiRes = new Response(apiRes.body, apiRes);
        newApiRes.headers.set("Access-Control-Allow-Origin", originHeader); 
        newApiRes.headers.set("Access-Control-Allow-Credentials", "true");
        return newApiRes;
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "API Error: " + e.message }), { status: 500 });
      }
    }

    // ৩. মেইন ওয়েবসাইট (HTTP এবং WebSocket)
    const target = new URL(TARGET_DOMAIN);
    target.pathname = url.pathname;
    target.search = url.search;

    const proxyRequest = new Request(target.toString(), request);
    proxyRequest.headers.set("Host", target.hostname);
    proxyRequest.headers.set("Origin", target.origin);
    proxyRequest.headers.set("Referer", target.origin);
    proxyRequest.headers.delete("Accept-Encoding"); 

    // মেইন ওয়েবসাইটের কোনো লাইভ কানেকশন থাকলে সেটাও পার করে দেওয়া
    if (request.headers.get("Upgrade") === "websocket") {
      return await fetch(proxyRequest);
    }

    try {
      const response = await fetch(proxyRequest);
      const contentType = response.headers.get("content-type") || "";
      let newResponse;

      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        
        const relativeApiPath = `/__api_proxy`;
        
        // সাধারণ HTTP লিংক রিপ্লেস
        text = text.replaceAll(API_SERVER, relativeApiPath);
        text = text.replaceAll(API_SERVER.replace(/\//g, '\\/'), relativeApiPath.replace(/\//g, '\\/'));
        
        // লাইভ ব্যালেন্সের WSS লিংক রিপ্লেস করা
        const wssApiServer = "wss://vrnlapi.com:4041";
        const wssRelativePath = `wss://${url.host}/__api_proxy`;
        text = text.replaceAll(wssApiServer, wssRelativePath);
        text = text.replaceAll(wssApiServer.replace(/\//g, '\\/'), wssRelativePath.replace(/\//g, '\\/'));

        newResponse = new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } else {
        newResponse = new Response(response.body, response);
      }

      const responseHeaders = new Headers(newResponse.headers);
      responseHeaders.delete("Content-Security-Policy");
      responseHeaders.delete("X-Frame-Options");
      
      // ব্রাউজারকে বাধ্য করা নতুন কোড নেওয়ার জন্য
      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
         responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }

      responseHeaders.set("Access-Control-Allow-Origin", originHeader);
      responseHeaders.set("Access-Control-Allow-Credentials", "true");

      return new Response(newResponse.body, {
        status: newResponse.status,
        statusText: newResponse.statusText,
        headers: responseHeaders
      });
      
    } catch (error) {
      return new Response("Proxy Error: " + error.message, { status: 500 });
    }
  }
};
