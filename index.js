export default {
  async fetch(request) {
    const targetDomain = "vellki247.com";
    const url = new URL(request.url);
    const proxyHost = url.hostname; // আপনার workers.dev ডোমেইন

    const targetUrl = new URL(`https://${targetDomain}${url.pathname}${url.search}`);

    // WebSocket রিকোয়েস্ট সাপোর্ট করার জন্য
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(targetUrl, request);
    }

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual"
    });

    // হেডার মডিফাই করা
    modifiedRequest.headers.set("Host", targetDomain);
    if (modifiedRequest.headers.has("Origin")) {
      modifiedRequest.headers.set("Origin", `https://${targetDomain}`);
    }
    if (modifiedRequest.headers.has("Referer")) {
      let refererUrl = new URL(modifiedRequest.headers.get("Referer"));
      refererUrl.hostname = targetDomain;
      modifiedRequest.headers.set("Referer", refererUrl.toString());
    }

    // ক্লাউডফ্লেয়ারের ট্রেসিং হেডারগুলো মুছে ফেলা
    modifiedRequest.headers.delete("cf-connecting-ip");
    modifiedRequest.headers.delete("cf-visitor");
    modifiedRequest.headers.delete("x-forwarded-for");
    modifiedRequest.headers.delete("x-real-ip");

    try {
      const response = await fetch(modifiedRequest);
      
      const newHeaders = new Headers(response.headers);
      
      // CORS ও Security Policy বাইপাস করা (ভিডিও প্লে হওয়ার জন্য অত্যন্ত জরুরি)
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      newHeaders.delete("X-Frame-Options");
      newHeaders.delete("Content-Security-Policy"); 

      // যদি রেসপন্সটি HTML হয়, তবে ভেতরের লিংকগুলো প্রক্সি ডোমেইন দিয়ে রিপ্লেস করে দেওয়া
      const contentType = newHeaders.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const rewriter = new HTMLRewriter()
          .on('*', new AttributeRewriter(targetDomain, proxyHost));
        
        return rewriter.transform(new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        }));
      }

      // অন্যান্য ফাইল (যেমন- ছবি, সিএসএস, জাভাস্ক্রিপ্ট) সরাসরি পাঠিয়ে দেওয়া
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

// HTMLRewriter এর জন্য ক্লাস যা ওয়েবসাইটের ভেতরের লিংকগুলো পরিবর্তন করবে
class AttributeRewriter {
  constructor(targetDomain, proxyHost) {
    this.targetDomain = targetDomain;
    this.proxyHost = proxyHost;
  }
  element(element) {
    const attributesToRewrite = ['href', 'src', 'action'];
    attributesToRewrite.forEach(attr => {
      if (element.hasAttribute(attr)) {
        let value = element.getAttribute(attr);
        // যদি লিংকের ভেতর আসল ডোমেইন থাকে, তা আপনার প্রক্সি ডোমেইন দিয়ে রিপ্লেস হবে
        if (value.includes(this.targetDomain)) {
          value = value.replace(new RegExp(this.targetDomain, 'g'), this.proxyHost);
          element.setAttribute(attr, value);
        }
      }
    });
  }
}
