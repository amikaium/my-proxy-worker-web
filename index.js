addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const TARGET_DOMAIN = 'tenx365x.live';
  const TARGET_URL = 'https://' + TARGET_DOMAIN;

  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // রিকোয়েস্টের হোস্টনেম পরিবর্তন করে মেইন সাইটে পাঠানো
  url.hostname = TARGET_DOMAIN;

  const headers = new Headers(request.headers);
  headers.set('Host', TARGET_DOMAIN);
  
  // API ব্লক যেন না হয়, সেজন্য Origin এবং Referer হেডার অরিজিনাল সাইটের মতো করে দেওয়া
  if (headers.has('Origin')) {
    headers.set('Origin', TARGET_URL);
  }
  if (headers.has('Referer')) {
    let referer = headers.get('Referer');
    headers.set('Referer', referer.replace(proxyOrigin, TARGET_URL));
  }

  // লাইভ টিভি এবং স্কোর আপডেটের জন্য WebSocket কানেকশন বাইপাস করা (খুবই গুরুত্বপূর্ণ)
  if (request.headers.get("Upgrade") === "websocket") {
    return fetch(url.toString(), {
      method: request.method,
      headers: headers,
    });
  }

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  const response = await fetch(modifiedRequest);
  const newHeaders = new Headers(response.headers);

  // ব্রাউজার যাতে সাইটটিকে ব্লক না করে সেজন্য সিকিউরিটি হেডারগুলো ডিলিট করা
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  newHeaders.delete('Clear-Site-Data');
  
  // API যেন আপনার ডোমেইনে কাজ করে সেজন্য CORS পারমিশন দেওয়া
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', '*');
  newHeaders.set('Access-Control-Allow-Headers', '*');

  // লগইন বা সেশন যেন ডিসকানেক্ট না হয়, সেজন্য কুকি (Cookie) ফিক্স করা
  const cookies = newHeaders.get('Set-Cookie');
  if (cookies) {
     // মেইন সাইটের ডোমেইন রেস্ট্রিকশন মুছে ফেলা যাতে কুকি আপনার ডোমেইনে কাজ করে
     newHeaders.set('Set-Cookie', cookies.replace(/Domain=[^;]+;/gi, ''));
  }

  // পেজের ভেতরের সব লিংক আপনার ডোমেইনে কনভার্ট করা
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    return new HTMLRewriter()
      .on('[href]', new AttributeRewriter('href', TARGET_DOMAIN, proxyOrigin))
      .on('[src]', new AttributeRewriter('src', TARGET_DOMAIN, proxyOrigin))
      .on('[action]', new AttributeRewriter('action', TARGET_DOMAIN, proxyOrigin))
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      }));
  }

  // অন্যান্য ফাইল (ছবি, ভিডিও, সিএসএস) সরাসরি রিটার্ন করা
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// লিংক রিপ্লেস করার ক্লাস
class AttributeRewriter {
  constructor(attributeName, targetDomain, proxyOrigin) {
    this.attributeName = attributeName;
    this.targetDomain = targetDomain;
    this.proxyOrigin = proxyOrigin;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    // যদি লিংকের ভেতরে মেইন ডোমেইনের নাম থাকে, তবে সেটি পরিবর্তন করে আপনার ডোমেইন বসিয়ে দেবে
    if (attribute && attribute.includes(this.targetDomain)) {
      const newAttribute = attribute.replace(new RegExp(`https?://${this.targetDomain}`, 'g'), this.proxyOrigin);
      element.setAttribute(this.attributeName, newAttribute);
    }
  }
}
