addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // এখানে আপনার মেইন সাইটের লিংকটি বসান (যেমন: https://tenx365x.live)
  const TARGET_URL = 'https://example.com'; 
  const targetUrlObj = new URL(TARGET_URL);

  // রিকোয়েস্ট থেকে বর্তমান ডাইনামিক ইউআরএল (প্রিভিউ লিংক বা আপনার ডোমেইন) বের করা
  const currentUrl = new URL(request.url);
  const dynamicOrigin = currentUrl.origin; 

  // রিকোয়েস্ট টার্গেট সাইটে পাঠানোর জন্য হোস্টনেম পরিবর্তন করা
  currentUrl.hostname = targetUrlObj.hostname;
  currentUrl.protocol = targetUrlObj.protocol;

  // অরিজিনাল রিকোয়েস্টের উপর ভিত্তি করে নতুন রিকোয়েস্ট তৈরি করা
  const modifiedRequest = new Request(currentUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual'
  });

  // হেডার আপডেট করা যাতে টার্গেট সার্ভার সঠিক রিকোয়েস্ট পায়
  modifiedRequest.headers.set('Host', targetUrlObj.hostname);
  
  if (request.headers.has('Origin')) {
    modifiedRequest.headers.set('Origin', targetUrlObj.origin);
  }
  if (request.headers.has('Referer')) {
    let referer = request.headers.get('Referer');
    referer = referer.replace(dynamicOrigin, targetUrlObj.origin);
    modifiedRequest.headers.set('Referer', referer);
  }

  const response = await fetch(modifiedRequest);

  // রেসপন্স হেডার থেকে ব্রাউজার রেস্ট্রিকশন বা সিকিউরিটি পলিসিগুলো রিমুভ করা
  // যাতে আপনার ডোমেইনে সাইটটি সুন্দরভাবে লোড হতে কোনো সমস্যা না হয়
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('Clear-Site-Data');

  // রেসপন্স যদি HTML হয়, তাহলে HTMLRewriter দিয়ে লিংকগুলো রিপ্লেস করা
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    const rewriter = new HTMLRewriter()
      .on('a', new AttributeRewriter('href', targetUrlObj.origin, dynamicOrigin))
      .on('img', new AttributeRewriter('src', targetUrlObj.origin, dynamicOrigin))
      .on('link', new AttributeRewriter('href', targetUrlObj.origin, dynamicOrigin))
      .on('script', new AttributeRewriter('src', targetUrlObj.origin, dynamicOrigin))
      .on('form', new AttributeRewriter('action', targetUrlObj.origin, dynamicOrigin));

    const transformedResponse = rewriter.transform(response);
    
    return new Response(transformedResponse.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }

  // HTML না হলে সরাসরি রেসপন্স রিটার্ন করা
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

// HTMLRewriter এর জন্য কাস্টম ক্লাস 
class AttributeRewriter {
  constructor(attributeName, targetOrigin, dynamicOrigin) {
    this.attributeName = attributeName;
    this.targetOrigin = targetOrigin;
    this.dynamicOrigin = dynamicOrigin;
  }
  
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (attribute) {
      // টার্গেট সাইটের লিংকের জায়গায় অটোমেটিক বর্তমান ডোমেইন বা প্রিভিউ লিংক বসিয়ে দেওয়া
      const newAttribute = attribute.replace(new RegExp(this.targetOrigin, 'g'), this.dynamicOrigin);
      element.setAttribute(this.attributeName, newAttribute);
    }
  }
}
