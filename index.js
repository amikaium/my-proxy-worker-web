const TARGET_DOMAIN = 'www.baji11.live';
const TARGET_URL = `https://${TARGET_DOMAIN}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientDomain = url.hostname;

    // ১. CORS Preflight (OPTIONS) হ্যান্ডেল করা - React API-এর জন্য জরুরি
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization",
        }
      });
    }

    url.hostname = TARGET_DOMAIN;

    const modifiedRequestHeaders = new Headers(request.headers);
    modifiedRequestHeaders.set('Host', TARGET_DOMAIN);
    modifiedRequestHeaders.set('Origin', TARGET_URL);
    modifiedRequestHeaders.set('Referer', TARGET_URL + url.pathname);

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: modifiedRequestHeaders,
      body: request.body,
      redirect: 'manual'
    });

    let response = await fetch(modifiedRequest);
    const responseHeaders = new Headers(response.headers);

    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('Content-Security-Policy-Report-Only');
    responseHeaders.delete('Clear-Site-Data');
    responseHeaders.delete('X-Frame-Options');

    // ২. কুকি রিরাইট (লগইন সেশন ধরে রাখার জন্য সবচেয়ে গুরুত্বপূর্ণ)
    if (responseHeaders.has('Set-Cookie')) {
       let cookies = responseHeaders.get('Set-Cookie');
       // অরিজিনাল ডোমেইনকে ক্লায়েন্ট ডোমেইন দিয়ে রিপ্লেস করা
       cookies = cookies.replace(new RegExp(TARGET_DOMAIN, 'gi'), clientDomain);
       // সাবডোমেইন কুকি ফরম্যাট ফিক্স করা
       cookies = cookies.replace(/domain=\.[^;]+/gi, `domain=.${clientDomain}`);
       responseHeaders.set('Set-Cookie', cookies);
    }

    if (responseHeaders.has('Location')) {
      let location = responseHeaders.get('Location');
      location = location.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), `https://${clientDomain}`);
      responseHeaders.set('Location', location);
    }

    const contentType = responseHeaders.get('content-type') || '';

    // ৩. HTML হলে HTMLRewriter ব্যবহার করবে
    if (contentType.includes('text/html')) {
      let modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

      return new HTMLRewriter()
        .on('*', new AttributeRewriter(TARGET_DOMAIN, clientDomain))
        .transform(modifiedResponse);
    }

    // ৪. JS বা JSON হলে ফাইলের ভেতরের টেক্সট/লিংক রিরাইট করবে (API কল ঠিক করার জন্য)
    if (contentType.includes('application/javascript') || 
        contentType.includes('text/javascript') || 
        contentType.includes('application/json')) {
        
        let bodyText = await response.text();
        // JS বা JSON এর ভেতরের অরিজিনাল ডোমেইন খুঁজে আপনার ডোমেইন বসিয়ে দেবে
        bodyText = bodyText.replace(new RegExp(TARGET_DOMAIN, 'g'), clientDomain);

        return new Response(bodyText, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
    }

    // ইমেজ বা অন্য ফাইলের জন্য সরাসরি রেসপন্স
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};

class AttributeRewriter {
  constructor(targetDomain, clientDomain) {
    this.targetDomain = targetDomain;
    this.clientDomain = clientDomain;
  }
  element(element) {
    // data-url বা অন্য কাস্টম অ্যাট্রিবিউটও যুক্ত করা হলো
    const attributesToRewrite = ['href', 'src', 'action', 'data-url'];
    for (const attr of attributesToRewrite) {
      const value = element.getAttribute(attr);
      if (value) {
        const newValue = value.replace(new RegExp(`https?://${this.targetDomain}`, 'g'), `https://${this.clientDomain}`);
        element.setAttribute(attr, newValue);
      }
    }
  }
}
