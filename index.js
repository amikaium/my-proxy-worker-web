export default {
  async fetch(request) {
    const targetDomain = "vellki247.com";
    const url = new URL(request.url);
    const proxyHost = url.hostname;

    const targetUrl = new URL(`https://${targetDomain}${url.pathname}${url.search}`);

    // ১. ভিডিও স্ট্রিমিংয়ের জন্য অত্যন্ত জরুরি: OPTIONS Preflight রিকোয়েস্ট সরাসরি বাইপাস করা
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(targetUrl, request);
    }

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: "manual"
    });

    // হেডার মডিফাই করা (মূল সাইটকে বোকা বানানোর জন্য)
    modifiedRequest.headers.set("Host", targetDomain);
    if (modifiedRequest.headers.has("Origin")) {
      modifiedRequest.headers.set("Origin", `https://${targetDomain}`);
    }
    if (modifiedRequest.headers.has("Referer")) {
      modifiedRequest.headers.set("Referer", `https://${targetDomain}/`);
    }

    // ক্লাউডফ্লেয়ারের ট্রেসিং হেডারগুলো মুছে ফেলা
    modifiedRequest.headers.delete("cf-connecting-ip");
    modifiedRequest.headers.delete("cf-visitor");
    modifiedRequest.headers.delete("x-forwarded-for");
    modifiedRequest.headers.delete("x-real-ip");
    
    // JS ফাইলগুলো যেন জিপ করা (gzip) অবস্থায় না আসে, যাতে আমরা টেক্সট চেঞ্জ করতে পারি
    modifiedRequest.headers.delete("Accept-Encoding");

    try {
      const response = await fetch(modifiedRequest);
      const newHeaders = new Headers(response.headers);
      
      // CORS ও Security Policy পুরোপুরি ওপেন করে দেওয়া
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      newHeaders.delete("X-Frame-Options");
      newHeaders.delete("Content-Security-Policy"); 

      const contentType = newHeaders.get("content-type") || "";

      // ২. HTML এবং ইনলাইন স্ক্রিপ্ট এর লিংক পরিবর্তন
      if (contentType.includes("text/html")) {
        const rewriter = new HTMLRewriter()
          .on('*', new AttributeRewriter(targetDomain, proxyHost))
          .on('script', new ScriptRewriter(targetDomain, proxyHost)); // ইনলাইন JS কোড পরিবর্তন
        
        return rewriter.transform(new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        }));
      }

      // ৩. সবচেয়ে গুরুত্বপূর্ণ: Javascript, JSON ও m3u8 (ভিডিও প্লেলিস্ট) ফাইলের ভেতরের ডোমেইন পরিবর্তন
      if (contentType.includes("application/javascript") || 
          contentType.includes("text/javascript") || 
          contentType.includes("application/json") ||
          contentType.includes("application/x-mpegURL") ||
          contentType.includes("application/vnd.apple.mpegurl")) {
          
          let bodyText = await response.text();
          // ফাইলের ভেতর যত জায়গায় vellki247.com আছে, সব প্রক্সি ডোমেইন দিয়ে রিপ্লেস হবে
          const regex = new RegExp(targetDomain, 'g');
          bodyText = bodyText.replace(regex, proxyHost);

          return new Response(bodyText, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
      }

      // অন্যান্য ফাইল (যেমন- ছবি, ভিডিও সেগমেন্ট) সরাসরি পাঠিয়ে দেওয়া
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

// HTML ট্যাগের অ্যাট্রিবিউট পরিবর্তনের ক্লাস
class AttributeRewriter {
  constructor(targetDomain, proxyHost) {
    this.targetDomain = targetDomain;
    this.proxyHost = proxyHost;
  }
  element(element) {
    const attributesToRewrite = ['href', 'src', 'action', 'data-url', 'data-src'];
    attributesToRewrite.forEach(attr => {
      if (element.hasAttribute(attr)) {
        let value = element.getAttribute(attr);
        if (value.includes(this.targetDomain)) {
          value = value.replace(new RegExp(this.targetDomain, 'g'), this.proxyHost);
          element.setAttribute(attr, value);
        }
      }
    });
  }
}

// ইনলাইন <script> ট্যাগের ভেতরের কোড পরিবর্তনের ক্লাস
class ScriptRewriter {
  constructor(targetDomain, proxyHost) {
    this.targetDomain = targetDomain;
    this.proxyHost = proxyHost;
    this.buffer = "";
  }
  text(text) {
    this.buffer += text.text;
    if (text.lastInTextNode) {
      let modifiedText = this.buffer.replace(new RegExp(this.targetDomain, 'g'), this.proxyHost);
      text.replace(modifiedText, { html: true });
      this.buffer = "";
    }
  }
}
