addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const TARGET_DOMAIN = 'tenx365x.live';
  const TARGET_URL = 'https://' + TARGET_DOMAIN;
  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // ভিডিও স্ট্রিমিং এবং API এর জন্য CORS Preflight রিকোয়েস্ট বাইপাস করা
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // রিকোয়েস্ট টার্গেট সাইটে পাঠানো
  url.hostname = TARGET_DOMAIN;
  const headers = new Headers(request.headers);
  headers.set('Host', TARGET_DOMAIN);
  
  if (headers.has('Origin')) headers.set('Origin', TARGET_URL);
  if (headers.has('Referer')) headers.set('Referer', TARGET_URL);

  // লাইভ স্কোর আপডেটের জন্য WebSocket পারমিশন
  if (request.headers.get("Upgrade") === "websocket") {
    return fetch(url.toString(), { method: request.method, headers: headers });
  }

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  const response = await fetch(modifiedRequest);
  const newHeaders = new Headers(response.headers);

  // ব্রাউজার রেস্ট্রিকশন সরানো
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  
  // স্ট্রিমিং যেন না আটকায় সেজন্য CORS অ্যালাউ করা
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Headers', '*');

  // সেশন ও কুকি ফিক্স
  const cookies = newHeaders.get('Set-Cookie');
  if (cookies) {
     newHeaders.set('Set-Cookie', cookies.replace(/Domain=[^;]+;/gi, ''));
  }

  const contentType = response.headers.get('content-type') || '';
  
  // HTML পেজ হলে কিছু স্পেশাল মডিফিকেশন করা
  if (contentType.includes('text/html')) {
    return new HTMLRewriter()
      // স্কোরবোর্ড আইফ্রেমের (365cric.com) কাছে আপনার ডোমেইন হাইড করার জন্য মেটা ট্যাগ ইনজেক্ট করা
      .on('head', {
        element(e) {
          e.append('<meta name="referrer" content="no-referrer" />', { html: true });
        }
      })
      // সাইটের ভেতরের লিংকগুলো আপনার ডোমেইনে কনভার্ট করা
      .on('[href]', new AttributeRewriter('href', TARGET_DOMAIN, proxyOrigin))
      .on('[src]', new AttributeRewriter('src', TARGET_DOMAIN, proxyOrigin))
      .on('[action]', new AttributeRewriter('action', TARGET_DOMAIN, proxyOrigin))
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      }));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

class AttributeRewriter {
  constructor(attributeName, targetDomain, proxyOrigin) {
    this.attributeName = attributeName;
    this.targetDomain = targetDomain;
    this.proxyOrigin = proxyOrigin;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute && attribute.includes(this.targetDomain)) {
      const newAttribute = attribute.replace(new RegExp(`https?://${this.targetDomain}`, 'g'), this.proxyOrigin);
      element.setAttribute(this.attributeName, newAttribute);
    }
  }
}
