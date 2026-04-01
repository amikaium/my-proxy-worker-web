const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const MY_DOMAIN = url.hostname;

    // ১. সেটিংস লোড করা
    let config = { 
        targetUrls: ['https://tenx365x.live'],
        logoUrl: '', loginBannerUrl: '', signupLink: '', sliderImages: [], gameBanners: {} 
    };

    try {
      const fsResponse = await fetch(FIRESTORE_URL);
      if (fsResponse.ok) {
        const fsData = await fsResponse.json();
        if (fsData && fsData.fields) {
          if (fsData.fields.logoUrl) config.logoUrl = fsData.fields.logoUrl.stringValue;
          if (fsData.fields.loginBannerUrl) config.loginBannerUrl = fsData.fields.loginBannerUrl.stringValue;
          if (fsData.fields.signupLink) config.signupLink = fsData.fields.signupLink.stringValue;
          if (fsData.fields.targetUrls?.arrayValue?.values) config.targetUrls = fsData.fields.targetUrls.arrayValue.values.map(v => v.stringValue);
          if (fsData.fields.sliderImages?.arrayValue?.values) config.sliderImages = fsData.fields.sliderImages.arrayValue.values.map(v => v.stringValue);
          if (fsData.fields.gameBanners?.mapValue?.fields) {
            let bMap = fsData.fields.gameBanners.mapValue.fields;
            for (let k in bMap) { config.gameBanners[k] = bMap[k].stringValue; }
          }
        }
      }
    } catch (e) {}

    const TARGET_URL = config.targetUrls[0];
    const originUrl = new URL(TARGET_URL);

    // ========================================================
    // ২. স্পোর্টস পেজ হাইজ্যাকিং (আইফ্রেম সলিউশন)
    // ========================================================
    // যদি ইউআরএল-এ sports বা exchange/member থাকে যা সাধারণত ব্লক হয়
    if (url.pathname.includes('/sports') || url.pathname.includes('/exchange/')) {
        const sportsUrl = TARGET_URL + url.pathname + url.search;
        
        const iframeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sports - Live</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0b2111; }
                iframe { width: 100%; height: 100%; border: none; }
                /* ওপরে আপনার নিজস্ব একটি ব্যাক বাটন বা লোগো বার রাখতে পারেন */
                .header-bar { height: 50px; background: #1b1b1b; display: flex; align-items: center; padding: 0 15px; color: white; font-family: sans-serif; }
                .back-btn { background: #f33; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header-bar">
                <a href="/" class="back-btn">Back to Home</a>
                <span style="margin-left: 15px;">Live Scoreboard</span>
            </div>
            <iframe src="${sportsUrl}" allowfullscreen></iframe>
        </body>
        </html>`;

        return new Response(iframeHtml, { headers: { 'Content-Type': 'text/html' } });
    }

    // ========================================================
    // ৩. মেইন প্রক্সি লজিক (বাকি সব পেজের জন্য)
    // ========================================================
    let requestHeaders = new Headers(request.headers);
    requestHeaders.set('Host', originUrl.hostname);
    requestHeaders.set('Origin', originUrl.origin);
    requestHeaders.set('Referer', originUrl.origin);

    // WebSocket সাপোর্ট
    if (request.headers.get("Upgrade") === "websocket") {
        return fetch(TARGET_URL + url.pathname + url.search, { method: request.method, headers: requestHeaders });
    }

    let response = await fetch(TARGET_URL + url.pathname + url.search, {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
      redirect: 'manual'
    });

    let newHeaders = new Headers(response.headers);
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('X-Frame-Options'); // আইফ্রেম সাপোর্ট করার জন্য এটি জরুরি

    // কুকি ফিক্স
    if (response.headers.has('set-cookie')) {
        const cookies = response.headers.getSetCookie();
        newHeaders.delete('set-cookie');
        for (let cookie of cookies) {
            let fixedCookie = cookie.replace(/domain=[^;]+;?/gi, ''); 
            fixedCookie += `; SameSite=None; Secure`;
            newHeaders.append('set-cookie', fixedCookie);
        }
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('application/javascript')) {
      let text = await response.text();
      
      // লোগো, ব্যানার এবং স্লাইডার রিপ্লেস কোড (আগের মতো)
      const blankSvg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20348%20145%22%3E%3C%2Fsvg%3E';
      
      if (config.logoUrl) {
          text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
      }
      
      // ... (বাকি রিপ্লেসমেন্ট লজিকগুলো এখানে থাকবে) ...

      text = text.replaceAll(originUrl.hostname, MY_DOMAIN);
      return new Response(text, { status: response.status, headers: newHeaders });
    }

    return new Response(response.body, { status: response.status, headers: newHeaders });
  }
};
