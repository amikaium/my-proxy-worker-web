const TARGET_HOSTNAME = 'all9x.com';
const TARGET_URL = `https://${TARGET_HOSTNAME}`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname; // আপনার ডাইনামিক ডোমেইন বা প্রিভিউ ডোমেইন

  // রিকোয়েস্টের URL পরিবর্তন করে মেইন সাইটের দিকে পয়েন্ট করা
  url.hostname = TARGET_HOSTNAME;

  // নতুন রিকোয়েস্ট তৈরি করা
  const proxyRequest = new Request(url.toString(), request);
  
  // Header মডিফাই করা যাতে মেইন সার্ভার বুঝতে না পারে এটি প্রক্সি
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  
  if (request.headers.has('Origin')) {
    proxyRequest.headers.set('Origin', request.headers.get('Origin').replace(myDomain, TARGET_HOSTNAME));
  }
  if (request.headers.has('Referer')) {
    proxyRequest.headers.set('Referer', request.headers.get('Referer').replace(myDomain, TARGET_HOSTNAME));
  }

  // মেইন সাইট থেকে রেসপন্স নিয়ে আসা
  let response = await fetch(proxyRequest);
  
  // রেসপন্স মডিফাই করার জন্য নতুন রেসপন্স অবজেক্ট তৈরি
  let modifiedResponse = new Response(response.body, response);

  // CORS পলিসি বাইপাস করা (API ও অন্যান্য ডাটা লোড হওয়ার জন্য)
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // রিডাইরেক্ট (Location header) ফিক্স করা
  const location = modifiedResponse.headers.get('Location');
  if (location) {
    modifiedResponse.headers.set('Location', location.replace(TARGET_HOSTNAME, myDomain));
  }

  // HTML কন্টেন্টের ভেতরের হার্ডকোডেড লিংকগুলো কনভার্ট করা
  const contentType = modifiedResponse.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    return new HTMLRewriter()
      .on('a', new AttributeRewriter('href', myDomain))
      .on('img', new AttributeRewriter('src', myDomain))
      .on('link', new AttributeRewriter('href', myDomain))
      .on('script', new AttributeRewriter('src', myDomain))
      .on('form', new AttributeRewriter('action', myDomain))
      .on('iframe', new AttributeRewriter('src', myDomain))
      .transform(modifiedResponse);
  }

  return modifiedResponse;
}

// HTML Rewriter ক্লাস - এটি মেইন ডোমেইনের নাম রিপ্লেস করে আপনার ডোমেইন বসিয়ে দেবে
class AttributeRewriter {
  constructor(attributeName, proxyDomain) {
    this.attributeName = attributeName;
    this.proxyDomain = proxyDomain;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute && attribute.includes(TARGET_HOSTNAME)) {
      // সব জায়গায় all9x.com কে আপনার ডোমেইন দিয়ে রিপ্লেস করবে
      const newValue = attribute.replace(new RegExp(TARGET_HOSTNAME, 'g'), this.proxyDomain);
      element.setAttribute(this.attributeName, newValue);
    }
  }
}
