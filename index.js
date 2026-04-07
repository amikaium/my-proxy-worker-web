export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_SERVER = "https://vrnlapi.com:4041"; 
    
    const url = new URL(request.url);
    // ডাইনামিক অরিজিন সেট করা হচ্ছে
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // ১. CORS প্রিফ্লাইট
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API প্রক্সি 
    if (url.pathname.startsWith('/__api_proxy')) {
      const apiTargetUrl = new URL(request.url);
      apiTargetUrl.hostname = "vrnlapi.com";
      apiTargetUrl.port = "4041";
      apiTargetUrl.pathname = apiTargetUrl.pathname.replace('/__api_proxy', '');

      const apiReq = new Request(apiTargetUrl.toString(), request);
      apiReq.headers.set("Host", "vrnlapi.com:4041");
      apiReq.headers.set("Origin", "https://velki123.win"); 
      apiReq.headers.set("Referer", "https://velki123.win/");

      try {
        const apiRes = await fetch(apiReq);
        const newApiRes = new Response(apiRes.body, apiRes);
        
        newApiRes.headers.set("Access-Control-Allow-Origin", originHeader); 
        newApiRes.headers.set("Access-Control-Allow-Credentials", "true");
        return newApiRes;
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "API Proxy Error: " + e.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ৩. মেইন ওয়েবসাইট
    const target = new URL(TARGET_DOMAIN);
    target.pathname = url.pathname;
    target.search = url.search;

    const proxyRequest = new Request(target.toString(), request);
    proxyRequest.headers.set("Host", target.hostname);
    proxyRequest.headers.set("Origin", target.origin);
    proxyRequest.headers.set("Referer", target.origin);
    proxyRequest.headers.delete("Accept-Encoding"); 

    try {
      const response = await fetch(proxyRequest);
      const contentType = response.headers.get("content-type") || "";
      let newResponse;

      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        
        // শুধু রিলেটিভ পাথ, কোনো হার্ডকোড ডোমেইন নেই
        const relativeApiPath = `/__api_proxy`;
        text = text.replaceAll(API_SERVER, relativeApiPath);
        
        const escapedApiServer = API_SERVER.replace(/\//g, '\\/');
        const escapedRelativeApiPath = relativeApiPath.replace(/\//g, '\\/');
        text = text.replaceAll(escapedApiServer, escapedRelativeApiPath);

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
      
      // এই লাইনটি ব্রাউজারকে বাধ্য করবে সবসময় নতুন কোড লোড করতে (ক্যাশ সমস্যা ফিক্স)
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
      return new Response("Web Proxy Error: " + error.message, { status: 500 });
    }
  }
};
