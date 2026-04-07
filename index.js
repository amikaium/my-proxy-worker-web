export default {
  async fetch(request, env, ctx) {
    const TARGET_DOMAIN = env.TARGET_URL || "https://velki123.win";
    const API_SERVER = "https://vrnlapi.com:4041"; 
    
    const url = new URL(request.url);

    // ১. CORS প্রিফ্লাইট ফিক্স (Authorization টোকেন ও ব্যালেন্স লোড হওয়ার জন্য)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          // ডাইনামিক হেডার এলাউ করা যাতে Authorization টোকেন ব্রাউজার ব্লক না করে
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, Accept",
          "Access-Control-Allow-Credentials": "true", // এটি সবচেয়ে গুরুত্বপূর্ণ ব্যালেন্স ডেটা আসার জন্য
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API প্রক্সি (আপডেটেড CORS সহ)
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
        
        // ক্লায়েন্টের জন্য CORS পারফেক্টলি ওপেন করা
        newApiRes.headers.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*"); 
        newApiRes.headers.set("Access-Control-Allow-Credentials", "true");
        
        return newApiRes;
      } catch (e) {
        return new Response(JSON.stringify({ success: false, message: "API Proxy Error: " + e.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ৩. মেইন ওয়েবসাইটের রিকোয়েস্ট হ্যান্ডেলিং
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
        const proxyApiPath = `https://${url.host}/__api_proxy`;
        
        // রেগুলার লিংক রিপ্লেস
        text = text.replaceAll(API_SERVER, proxyApiPath);
        
        // এক্সট্রা সেফটি: React ফাইলে অনেক সময় লিংক এস্কেপ (https:\/\/) করা থাকে, সেটাও রিপ্লেস করা হলো
        const escapedApiServer = API_SERVER.replace(/\//g, '\\/');
        const escapedProxyApiPath = proxyApiPath.replace(/\//g, '\\/');
        text = text.replaceAll(escapedApiServer, escapedProxyApiPath);

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
      responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
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
