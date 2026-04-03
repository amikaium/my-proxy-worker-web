const MAIN_DOMAIN = '7wickets.live';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const myDomain = url.hostname;

    // ১. WebSocket সাপোর্ট (Live Odds এর জন্য)
    if (request.headers.get('Upgrade') === 'websocket') {
      url.hostname = MAIN_DOMAIN;
      const wsReq = new Request(url, request);
      wsReq.headers.set('Host', MAIN_DOMAIN);
      wsReq.headers.set('Origin', `https://${MAIN_DOMAIN}`);
      return fetch(wsReq);
    }

    // ২. রিকোয়েস্ট তৈরি করা এবং স্পুফিং (সার্ভারকে ধোঁকা দেওয়া)
    url.hostname = MAIN_DOMAIN;
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set('Host', MAIN_DOMAIN);
    reqHeaders.set('Origin', `https://${MAIN_DOMAIN}`);
    reqHeaders.set('Referer', `https://${MAIN_DOMAIN}${url.pathname}`);
    
    // ক্লাউডফ্লেয়ারের আইডেন্টিটি লুকিয়ে ফেলা
    reqHeaders.delete('cf-ray');
    reqHeaders.delete('cf-connecting-ip');
    reqHeaders.delete('cf-visitor');
    reqHeaders.delete('x-forwarded-for');

    const newReq = new Request(url, {
      method: request.method,
      headers: reqHeaders,
      body: request.body,
      redirect: 'manual'
    });

    // ৩. মেইন সার্ভার থেকে ডেটা আনা
    const res = await fetch(newReq);
    const resHeaders = new Headers(res.headers);

    // ৪. সিকিউরিটি হেডার মুছে ফেলা (ভিডিও ব্লক ঠেকানোর জন্য)
    resHeaders.delete('content-security-policy');
    resHeaders.delete('x-frame-options');
    resHeaders.delete('strict-transport-security');
    resHeaders.set('access-control-allow-origin', '*');

    // ৫. রিডাইরেক্ট এবং কুকি ফিক্স
    if (resHeaders.has('location')) {
      resHeaders.set('location', resHeaders.get('location').replace(new RegExp(MAIN_DOMAIN, 'gi'), myDomain));
    }
    if (resHeaders.has('set-cookie')) {
      const cookies = resHeaders.get('set-cookie');
      resHeaders.set('set-cookie', cookies.replace(new RegExp(MAIN_DOMAIN, 'gi'), myDomain));
    }

    const contentType = (resHeaders.get('content-type') || '').toLowerCase();

    // ৬. জাদুকরী অংশ: HTML, JS, JSON ফাইলের ভেতর ডোমেইন রিপ্লেস করা
    const isTextFile = contentType.includes('text/') || 
                       contentType.includes('application/javascript') || 
                       contentType.includes('application/x-javascript') || 
                       contentType.includes('application/json') || 
                       contentType.includes('mpegurl');

    if (isTextFile) {
      let bodyText = await res.text();

      // সাধারণ ডোমেইন রিপ্লেস
      bodyText = bodyText.replace(new RegExp(MAIN_DOMAIN, 'gi'), myDomain);
      
      // URL Encoded ডোমেইন রিপ্লেস (যেমন: 7wickets%2Elive)
      bodyText = bodyText.replace(new RegExp(encodeURIComponent(MAIN_DOMAIN), 'gi'), encodeURIComponent(myDomain));
      
      // Escaped ডোমেইন রিপ্লেস (JSON ফাইলের ভেতর যেমন থাকে: 7wickets\.live)
      bodyText = bodyText.replace(new RegExp('7wickets\\\\.live', 'gi'), myDomain);

      // HTML এর ভেতর অতিরিক্ত ইন্টারসেপ্টর স্ক্রিপ্ট ঢুকিয়ে দেওয়া (নিরাপত্তার জন্য)
      if (contentType.includes('text/html')) {
        const interceptScript = `
        <script>
          const originalFetch = window.fetch;
          window.fetch = function() {
            if (typeof arguments[0] === 'string') {
              arguments[0] = arguments[0].replace('${MAIN_DOMAIN}', window.location.hostname);
            }
            return originalFetch.apply(this, arguments);
          };
        </script>
        `;
        bodyText = bodyText.replace('<head>', '<head>' + interceptScript);
      }

      resHeaders.delete('content-length');
      return new Response(bodyText, { status: res.status, headers: resHeaders });
    }

    // ৭. ভিডিও (.ts) বা ইমেজ সরাসরি ব্রাউজারে পাঠানো
    return new Response(res.body, { status: res.status, headers: resHeaders });
  }
}
