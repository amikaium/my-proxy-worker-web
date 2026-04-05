export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট (ইমেজ রিপ্লেসমেন্ট)
    // ==========================================
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
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
    // ২. ডোমেইন এবং API টার্গেট সেটআপ
    // ==========================================
    const targetDomain = env.TARGET || "pori365.live";
    const apiDomain = "trueexch.com:5018"; // আপনার স্ক্রিনশট থেকে নেওয়া API ডোমেইন
    const proxyDomain = url.hostname;

    // CORS Preflight Request হ্যান্ডেল করা (লগইন API এর জন্য খুব জরুরি)
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

    // ==========================================
    // ৩. রিকোয়েস্ট বডি (Payload) মডিফাই করা (Login Fix)
    // ==========================================
    // ব্রাউজার থেকে আসা JSON ডাটায় ওয়ার্কার ডোমেইনের নাম থাকলে তা পরিবর্তন করে মূল ডোমেইন করে দেওয়া
    let reqBody = request.body;
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json") || contentType.includes("text/plain") || contentType.includes("application/x-www-form-urlencoded")) {
        let textBody = await request.text();
        // Payload এর ভেতর ওয়ার্কার ডোমেইন থাকলে তা টার্গেট ডোমেইনে রিপ্লেস করবে
        textBody = textBody.replace(new RegExp(proxyDomain, 'g'), targetDomain);
        reqBody = textBody;
      }
    }

    // ==========================================
    // ৪. API রিকোয়েস্ট প্রক্সি করা (লগইন বাইপাস)
    // ==========================================
    // যখন স্ক্রিপ্ট /api-route/ এ কল করবে, তখন তা trueexch.com:5018 এ পাঠিয়ে দেওয়া হবে
    if (url.pathname.startsWith('/api-route/')) {
      const actualApiPath = url.pathname.replace('/api-route/', '/');
      const targetApiUrl = new URL(`https://${apiDomain}${actualApiPath}${url.search}`);

      const apiHeaders = new Headers(request.headers);
      apiHeaders.set("Host", apiDomain);
      apiHeaders.set("Origin", `https://${targetDomain}`);
      apiHeaders.set("Referer", `https://${targetDomain}/`);

      let apiResponse = await fetch(targetApiUrl.toString(), {
        method: request.method,
        headers: apiHeaders,
        body: reqBody,
        redirect: "manual",
      });

      let newApiResHeaders = new Headers(apiResponse.headers);
      newApiResHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: newApiResHeaders
      });
    }

    // ==========================================
    // ৫. মূল ওয়েবসাইটের রিকোয়েস্ট প্রক্সি করা
    // ==========================================
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
      body: reqBody, // আপডেট করা বডি পাঠানো হচ্ছে
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

    const resContentType = newResponseHeaders.get("Content-Type") || "";

    // HTML, JS বা CSS ফাইলের ভেতরের লিংক রিপ্লেস করা
    if (resContentType.includes("text/html") || resContentType.includes("application/javascript") || resContentType.includes("text/css")) {
      let text = await response.text();
      
      // মূল ডোমেইন রিপ্লেস
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      
      // লগইন API ডোমেইন (trueexch.com:5018) রিপ্লেস করে আমাদের ওয়ার্কারে রিডাইরেক্ট করা
      text = text.replace(new RegExp(`https://${apiDomain}`, 'g'), `https://${proxyDomain}/api-route`);
      
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
