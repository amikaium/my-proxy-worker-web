addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // এখানে 'example.com' এর জায়গায় আপনার মূল সাইটের লিংক হবে
  const TARGET_URL = 'https://example.com'; 
  // এখানে আপনার নিজের ডোমেইনের নাম বসাতে হবে
  const YOUR_DOMAIN = 'your-domain.com'; 

  const url = new URL(request.url);
  const targetUrlObj = new URL(TARGET_URL);
  
  // রিকোয়েস্টের হোস্টনেম পরিবর্তন করে টার্গেট সাইটের হোস্টনেম করা
  url.hostname = targetUrlObj.hostname;

  // অরিজিনাল রিকোয়েস্টের উপর ভিত্তি করে নতুন রিকোয়েস্ট তৈরি করা
  const modifiedRequest = new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual'
  });

  // হেডার আপডেট করা যাতে টার্গেট সার্ভার সঠিক রিকোয়েস্ট পায়
  modifiedRequest.headers.set('Host', url.hostname);
  modifiedRequest.headers.set('Referer', TARGET_URL);

  const response = await fetch(modifiedRequest);

  // রেসপন্স যদি HTML হয়, তাহলে HTMLRewriter দিয়ে লিংকগুলো রিপ্লেস করা
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    return new HTMLRewriter()
      .on('a', new AttributeRewriter('href', TARGET_URL, YOUR_DOMAIN))
      .on('img', new AttributeRewriter('src', TARGET_URL, YOUR_DOMAIN))
      .on('link', new AttributeRewriter('href', TARGET_URL, YOUR_DOMAIN))
      .on('script', new AttributeRewriter('src', TARGET_URL, YOUR_DOMAIN))
      .transform(response);
  }

  // HTML না হলে (যেমন ছবি বা সিএসএস) সরাসরি রেসপন্স রিটার্ন করা
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

// HTMLRewriter এর জন্য কাস্টম ক্লাস যা অ্যাট্রিবিউট পরিবর্তন করবে
class AttributeRewriter {
  constructor(attributeName, targetUrl, yourDomain) {
    this.attributeName = attributeName;
    this.targetUrl = targetUrl;
    this.yourDomain = yourDomain;
  }
  
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute) {
      // টার্গেট ইউআরএল পরিবর্তন করে নিজের ডোমেইন বসানো
      const newAttribute = attribute.replace(new RegExp(this.targetUrl, 'g'), `https://${this.yourDomain}`);
      element.setAttribute(this.attributeName, newAttribute);
    }
  }
}
