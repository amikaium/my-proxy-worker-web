export default {
  async fetch(request) {
    const targetDomain = "velkebdt.com";
    // আপনার ওয়েবসাইটের প্রক্সি ডোমেইন বের করা
    const proxyHost = new URL(request.url).host;
    const url = new URL(request.url);
    
    // টার্গেট URL তৈরি
    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;
    targetUrl.protocol = "https:";

    // ১. ভিডিও এবং API-এর জন্য OPTIONS রিকোয়েস্ট পুরোপুরি ওপেন করে দেওয়া
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // লাইভ স্কোরের জন্য WebSocket বাইপাস
    if (request.headers.get("Upgrade") === "websocket") {
      const wsRequest = new Request(targetUrl, request);
      wsRequest.headers.set("Host", targetDomain);
      wsRequest.headers.set("Origin", `https://${targetDomain}`);
      return fetch(wsRequest);
    }

    // ২. অরিজিনাল সার্ভারকে ধোকা দেওয়ার জন্য শক্তিশালী হেডার স্পুফিং
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("Host", targetDomain);
    modifiedHeaders.set("Origin", `https://${targetDomain}`);
    modifiedHeaders.set("Referer", `https://${targetDomain}/`);
    modifiedHeaders.set("User-Agent", request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    
    // Cloudflare-এর ট্রেস মুছে ফেলা (যাতে সার্ভার প্রক্সি ধরতে না পারে)
    modifiedHeaders.delete("cf-connecting-ip");
    modifiedHeaders.delete("cf-worker");
    modifiedHeaders.delete("x-forwarded-for");
    modifiedHeaders.delete("x-real-ip");
    modifiedHeaders.delete("Accept-Encoding"); // জিপ করা ডাটা রোধ করা

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
      redirect: "manual"
    });

    try {
      const response = await fetch(modifiedRequest);
      const newHeaders = new Headers(response.headers);
      
      // ৩. ব্রাউজারের সিকিউরিটি এবং CORS পুরোপুরি নিষ্ক্রিয় করা
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Credentials", "true");
      newHeaders.delete("X-Frame-Options");
      newHeaders.delete("Content-Security-Policy");
      newHeaders.delete("Strict-Transport-Security");

      const contentType = newHeaders.get("content-type") || "";

      // ৪. HTML এর ভেতরে সিকিউরিটি পলিসি ইনজেক্ট করা (ভিডিও প্লেয়ারের জন্য)
      if (contentType.includes("text/html")) {
        let htmlText = await response.text();
        
        // HTML এর ভেতরের সব লিংক চেঞ্জ করা
        const regex = new RegExp(targetDomain, 'gi');
        htmlText = htmlText.replace(regex, proxyHost);

        // ব্রাউজারকে বাধ্য করা যেন সে ভিডিও সার্ভারে অরিজিনাল Referer পাঠায়
        const headInjection = `
          <head>
          <meta name="referrer" content="no-referrer-when-downgrade" />
          <script>
            // XHR/Fetch API হুক করা (ভিডিও লিংক বাইপাস করার জন্য)
            const originalFetch = window.fetch;
            window.fetch = async function() {
              let args = arguments;
              if (typeof args[0] === 'string' && args[0].includes('${targetDomain}')) {
                args[0] = args[0].replace('${targetDomain}', '${proxyHost}');
              }
              return originalFetch.apply(this, args);
            };
          </script>
        `;
        htmlText = htmlText.replace('<head>', headInjection);

        return new Response(htmlText, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      // ৫. API, JSON এবং ভিডিও স্ট্রিমিং ফাইলের (m3u8/js) ডিপ স্ক্যানিং
      if (
        contentType.includes("application/json") || 
        contentType.includes("text/javascript") || 
        contentType.includes("application/javascript") ||
        contentType.includes("application/x-mpegURL")
      ) {
        let bodyText = await response.text();
        
        // সাধারণ ডোমেইন রিপ্লেস
        const normalRegex = new RegExp(targetDomain, 'gi');
        bodyText = bodyText.replace(normalRegex, proxyHost);
        
        // JSON Escaped ডোমেইন রিপ্লেস (যেমন: vellki247\.com)
        const escapedDomain = targetDomain.replace('.', '\\\\.'); 
        const escapedRegex = new RegExp(escapedDomain, 'gi');
        bodyText = bodyText.replace(escapedRegex, proxyHost);

        return new Response(bodyText, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      // অন্যান্য ফাইল (ইমেজ, ভিডিও সেগমেন্ট) সরাসরি পাস করা
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
