const TARGET_DOMAIN = 'www.baji11.live';
const TARGET_URL = `https://${TARGET_DOMAIN}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientDomain = url.hostname;

    // ১. WebSocket (WSS) হ্যান্ডেল করা - বেটিং সাইটের জন্য খুবই জরুরি
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      url.hostname = TARGET_DOMAIN;
      const wsRequest = new Request(url.toString(), {
        headers: request.headers,
        method: request.method,
      });
      return fetch(wsRequest);
    }

    // ২. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }

    url.hostname = TARGET_DOMAIN;

    const modifiedRequestHeaders = new Headers(request.headers);
    modifiedRequestHeaders.set('Host', TARGET_DOMAIN);
    modifiedRequestHeaders.set('Origin', TARGET_URL);
    modifiedRequestHeaders.set('Referer', TARGET_URL + url.pathname);
    
    // কিছু বাড়তি সিকিউরিটি হেডার মুছে ফেলা যা প্রক্সিকে ব্লক করতে পারে
    modifiedRequestHeaders.delete('CF-Connecting-IP');
    modifiedRequestHeaders.delete('X-Forwarded-For');

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
    responseHeaders.delete('Strict-Transport-Security'); // HSTS ব্লক এড়াতে

    // ৩. কুকি পলিসি শিথিল করা
    if (responseHeaders.has('Set-Cookie')) {
       const cookies = responseHeaders.get('Set-Cookie');
       const updatedCookies = cookies.split(', ').map(cookie => {
           let c = cookie.replace(new RegExp(TARGET_DOMAIN, 'gi'), clientDomain);
           c = c.replace(/domain=\.[^;]+/gi, `domain=.${clientDomain}`);
           // SameSite পলিসিকে None করে দেওয়া যাতে থার্ড-পার্টি কন্টেক্সটেও কাজ করে
           c = c.replace(/SameSite=(Lax|Strict)/gi, 'SameSite=None');
           if (!c.includes('Secure')) {
               c += '; Secure'; // SameSite=None এর সাথে Secure থাকা বাধ্যতামূলক
           }
           return c;
       }).join(', ');
       
       responseHeaders.set('Set-Cookie', updatedCookies);
    }

    if (responseHeaders.has('Location')) {
      let location = responseHeaders.get('Location');
      location = location.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), `https://${clientDomain}`);
      responseHeaders.set('Location', location);
    }

    const contentType = responseHeaders.get('content-type') || '';

    // ৪. HTML Rewriter
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

    // ৫. JS/JSON Rewrite
    if (contentType.includes('application/javascript') || 
        contentType.includes('text/javascript') || 
        contentType.includes('application/json')) {
        
        let bodyText = await response.text();
        // ডোমেইন রিপ্লেস করার পাশাপাশি এস্কেপড ডোমেইনও (যেমন www\.baji11\.live) রিপ্লেস করা
        bodyText = bodyText.replace(new RegExp(TARGET_DOMAIN, 'g'), clientDomain);
        bodyText = bodyText.replace(new RegExp('www\\\\.baji11\\\\.live', 'g'), clientDomain); 

        return new Response(bodyText, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
    }

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
    const attributesToRewrite = ['href', 'src', 'action', 'data-url', 'data-src', 'content'];
    for (const attr of attributesToRewrite) {
      const value = element.getAttribute(attr);
      if (value) {
        const newValue = value.replace(new RegExp(`https?://${this.targetDomain}`, 'g'), `https://${this.clientDomain}`);
        element.setAttribute(attr, newValue);
      }
    }
  }
}
