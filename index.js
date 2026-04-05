export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট (ইমেজ রিপ্লেসমেন্ট)
    // ==========================================
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      
      // পয়েন্ট আপডেট করা হয়েছে। 
      // এখন এটি ঠিক আগের অরিজিনাল শেপের মতো বাম দিকে জায়গা নিয়ে পজিশনমতো বসবে।
      const customSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="20,0 100,0 100,100 0,100" fill="#56BAD9" />
        </svg>
      `;
      
      return new Response(customSvg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=86400" 
        }
      });
    }

    // ==========================================
    // ২. ডাইনামিক রিভার্স প্রক্সি সেটআপ
    // ==========================================
    
    const targetDomain = env.TARGET || "pori365.live";
    const proxyDomain = url.hostname;

    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;
    targetUrl.protocol = 'https:';

    const newRequestHeaders = new Headers(request.headers);
    newRequestHeaders.set("Host", targetDomain);
    newRequestHeaders.set("Referer", `https://${targetDomain}/`);
    newRequestHeaders.set("Origin", `https://${targetDomain}`);
    
    newRequestHeaders.delete("cf-connecting-ip");
    newRequestHeaders.delete("x-real-ip");

    let response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: newRequestHeaders,
      body: request.body,
      redirect: "manual",
    });

    let newResponseHeaders = new Headers(response.headers);
    newResponseHeaders.set("Access-Control-Allow-Origin", "*");
    newResponseHeaders.delete("content-security-policy");
    newResponseHeaders.delete("x-frame-options");

    if (newResponseHeaders.has("Location")) {
      let location = newResponseHeaders.get("Location");
      newResponseHeaders.set("Location", location.replace(new RegExp(targetDomain, 'g'), proxyDomain));
    }

    const setCookie = newResponseHeaders.get("Set-Cookie");
    if (setCookie) {
      newResponseHeaders.set("Set-Cookie", setCookie.replace(new RegExp(targetDomain, 'g'), proxyDomain));
    }

    const contentType = newResponseHeaders.get("Content-Type") || "";

    if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/css")) {
      let text = await response.text();
      
      const dynamicRegex = new RegExp(targetDomain, 'g');
      text = text.replace(dynamicRegex, proxyDomain);
      
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);

      return new Response(text, {
        status: response.status,
        headers: newResponseHeaders
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: newResponseHeaders
    });
  }
};
