export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট (ইমেজ রিপ্লেসমেন্ট)
    // ==========================================
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      
      // পয়েন্ট আপডেট করা হয়েছে: points="15,0 100,0 100,100 0,100"
      // এটি শেপটিকে আরও চওড়া করে বাম দিকে নিয়ে আসবে এবং ডান দিক ভরাট রাখবে।
      const customSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="15,0 100,0 100,100 0,100" fill="#56BAD9" />
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
    
    // আপনার টার্গেট ডোমেইনটি Environment Variable (TARGET) থেকে নেওয়া হবে।
    const targetDomain = env.TARGET || "pori365.live";
    const proxyDomain = url.hostname;

    // টার্গেট ইউআরএল তৈরি
    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;
    targetUrl.protocol = 'https:';

    // রিকোয়েস্ট হেডার মডিফাই করা
    const newRequestHeaders = new Headers(request.headers);
    newRequestHeaders.set("Host", targetDomain);
    newRequestHeaders.set("Referer", `https://${targetDomain}/`);
    newRequestHeaders.set("Origin", `https://${targetDomain}`);
    
    // রিয়েল আইপি সংক্রান্ত হেডার রিমুভ করা
    newRequestHeaders.delete("cf-connecting-ip");
    newRequestHeaders.delete("x-real-ip");

    // মূল সার্ভার থেকে ডেটা ফেচ করা
    let response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: newRequestHeaders,
      body: request.body,
      redirect: "manual",
    });

    // রেসপন্স হেডার কপি এবং মডিফাই
    let newResponseHeaders = new Headers(response.headers);
    newResponseHeaders.set("Access-Control-Allow-Origin", "*");
    newResponseHeaders.delete("content-security-policy");
    newResponseHeaders.delete("x-frame-options");

    // রিডাইরেক্ট (301/302) হ্যান্ডেল করা
    if (newResponseHeaders.has("Location")) {
      let location = newResponseHeaders.get("Location");
      newResponseHeaders.set("Location", location.replace(new RegExp(targetDomain, 'g'), proxyDomain));
    }

    // কুকিজ ডোমেইন পরিবর্তন করা (লগইন ঠিক রাখার জন্য)
    const setCookie = newResponseHeaders.get("Set-Cookie");
    if (setCookie) {
      newResponseHeaders.set("Set-Cookie", setCookie.replace(new RegExp(targetDomain, 'g'), proxyDomain));
    }

    const contentType = newResponseHeaders.get("Content-Type") || "";

    // HTML, JS বা CSS ফাইলের ভেতরের সব লিংক রিপ্লেস করা
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

    // ইমেজ বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স পাঠানো
    return new Response(response.body, {
      status: response.status,
      headers: newResponseHeaders
    });
  }
};
