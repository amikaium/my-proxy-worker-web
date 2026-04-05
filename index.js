export default {
  async fetch(request, env, ctx) {

    // ==========================================
    // ★ আপনার গ্লোবাল থিম কালার
    // ==========================================
    const THEME_COLOR = "#435F70";
    // ==========================================

    const url = new URL(request.url);

    // ==========================================
    // ১. কাস্টম SVG ইন্টারসেপ্ট
    // ==========================================
    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      const customSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"> <polygon points="15,0 100,0 100,100 0,100" fill="${THEME_COLOR}" /> </svg>`;
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
    // ২. API ও Live TV ইন্টারসেপ্টর রুট
    // ==========================================
    if (url.pathname.startsWith('/_api_proxy/')) {
      const targetApiUrlStr = request.url.replace(new RegExp(`^https?://${proxyDomain}/_api_proxy/`), '');

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
      apiReqHeaders.delete('Host');
      apiReqHeaders.set('Origin', `https://${targetDomain}`);
      apiReqHeaders.set('Referer', `https://${targetDomain}/`);

      let reqBody = request.body;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        let textBody = await request.text();
        textBody = textBody.replace(new RegExp(proxyDomain, 'g'), targetDomain);
        reqBody = textBody;
      }

      let apiRes = await fetch(targetApiUrlStr, {
        method: request.method,
        headers: apiReqHeaders,
        body: reqBody,
        redirect: 'manual'
      });

      let apiResHeaders = new Headers(apiRes.headers);
      apiResHeaders.set("Access-Control-Allow-Origin", "*");

      const setCookie = apiResHeaders.get("Set-Cookie");
      if (setCookie) {
        let updatedCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${proxyDomain}`);
        apiResHeaders.set("Set-Cookie", updatedCookie);
      }

      // ★ LIVE TV M3U8 FIX: লাইভ টিভির ফাইলের ভেতরের ডিরেক্ট লিংকগুলো প্রক্সি করা হচ্ছে
      const apiContentType = apiResHeaders.get("Content-Type") || "";
      if (apiContentType.includes("mpegurl") || targetApiUrlStr.includes('.m3u8')) {
        let m3u8Text = await apiRes.text();
        // M3U8 এর ভেতরের https:// লিংকগুলোকে প্রক্সির আন্ডারে আনা
        m3u8Text = m3u8Text.replace(/(https?:\/\/[^\s"'<>]+)/g, `https://${proxyDomain}/_api_proxy/$1`);
        return new Response(m3u8Text, {
          status: apiRes.status,
          headers: apiResHeaders
        });
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

    // রিডাইরেক্ট ফিক্স
    if (resHeaders.has("Location")) {
      let location = resHeaders.get("Location");
      let newLocation = location.replace(new RegExp(`https?://${targetDomain}`, 'gi'), `https://${proxyDomain}`);
      resHeaders.set("Location", newLocation);
    }

    const contentType = resHeaders.get("Content-Type") || "";

    // ==========================================
    // ৪. HTML এবং CSS মডিফিকেশন (কালার ও লাইভ টিভি ফিক্স)
    // ==========================================
    if (contentType.includes("text/html")) {
      let text = await response.text();

      // স্ক্রিপ্ট ইন্টারসেপ্টর (লগইন + লাইভ টিভি)
      const interceptorScript = `
      <script>
        (function() {
          const proxyDom = "${proxyDomain}";
          const targetDom = "${targetDomain}";

          // ★ LIVE TV FIX: এই ফাংশনটি trueexch এর পাশাপাশি লাইভ টিভির ডোমেইনকেও প্রক্সি করবে
          const needsProxy = function(url) {
            if (typeof url !== 'string') return false;
            return url.includes('trueexch.com') || url.includes('aax-eu1314.com') || url.includes('.m3u8') || url.includes('.ts');
          };

          const origFetch = window.fetch;
          window.fetch = async function() {
            let args = Array.prototype.slice.call(arguments);
            
            if (typeof args[0] === 'string' && needsProxy(args[0])) {
              if (!args[0].includes('/_api_proxy/')) {
                 args[0] = 'https://' + proxyDom + '/_api_proxy/' + args[0];
              }
            } else if (args[0] instanceof Request && needsProxy(args[0].url)) {
              if (!args[0].url.includes('/_api_proxy/')) {
                 args[0] = new Request('https://' + proxyDom + '/_api_proxy/' + args[0].url, args[0]);
              }
            }

            if (args[1] && args[1].body && typeof args[1].body === 'string') {
              args[1].body = args[1].body.split(proxyDom).join(targetDom);
            }
            return origFetch.apply(this, args);
          };

          const origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url) {
            if (typeof url === 'string' && needsProxy(url)) {
               if (!url.includes('/_api_proxy/')) {
                   url = 'https://' + proxyDom + '/_api_proxy/' + url;
               }
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

      // ★ কাস্টম CSS 
      const customCssOverrides = `<style> /* বর্ডার কালার পরিবর্তন */ dl.entrance-title { border-bottom-color: ${THEME_COLOR} !important; } /* লগইন পেজের ব্যাকগ্রাউন্ড কালার পরিবর্তন */ div.login_main { background-image: linear-gradient(235deg, ${THEME_COLOR} 21%, ${THEME_COLOR}) !important; background-color: ${THEME_COLOR} !important; } </style>`;

      // HTML এর <head> এ স্ক্রিপ্ট এবং কাস্টম স্টাইল ইনজেক্ট
      text = text.replace('<head>', '<head>' + interceptorScript + customCssOverrides);

      // ডোমেইন রিপ্লেস
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);

      // গ্লোবাল কালার রিপ্লেসমেন্ট
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);
      text = text.replace(/rgb\(\s*0\s*,\s*153\s*,\s*153\s*\)/gi, THEME_COLOR);
      text = text.replace(/#009999/gi, THEME_COLOR);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    // JS বা CSS ফাইলের জন্য
    if (contentType.includes("application/javascript") || contentType.includes("text/css")) {
      let text = await response.text();

      // ডোমেইন রিপ্লেস
      text = text.replace(new RegExp(targetDomain, 'g'), proxyDomain);
      text = text.replace(new RegExp(`http://${proxyDomain}`, 'g'), `https://${proxyDomain}`);

      // গ্লোবাল কালার রিপ্লেসমেন্ট
      text = text.replace(/rgb\(\s*20\s*,\s*128\s*,\s*94\s*\)/gi, THEME_COLOR);
      text = text.replace(/#14805e/gi, THEME_COLOR);
      text = text.replace(/rgb\(\s*0\s*,\s*153\s*,\s*153\s*\)/gi, THEME_COLOR);
      text = text.replace(/#009999/gi, THEME_COLOR);

      return new Response(text, { status: response.status, headers: resHeaders });
    }

    // ইমেজ বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স
    return new Response(response.body, { status: response.status, headers: resHeaders });

  }
};
