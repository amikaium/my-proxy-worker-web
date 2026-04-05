const TARGET_DOMAIN = 'www.baji11.live';
const TARGET_URL = `https://${TARGET_DOMAIN}`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientDomain = url.hostname;

    // ১. অরিজিনাল সার্ভারের জন্য URL পরিবর্তন
    url.hostname = TARGET_DOMAIN;

    // ২. রিকোয়েস্ট হেডারগুলো মডিফাই করা (যাতে অরিজিনাল সার্ভার বুঝতে না পারে ট্রাফিক কোথা থেকে আসছে)
    const modifiedRequestHeaders = new Headers(request.headers);
    modifiedRequestHeaders.set('Host', TARGET_DOMAIN);
    modifiedRequestHeaders.set('Referer', TARGET_URL + url.pathname);
    modifiedRequestHeaders.set('Origin', TARGET_URL);

    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: modifiedRequestHeaders,
      body: request.body,
      redirect: 'manual' // রিডাইরেক্ট নিজে হ্যান্ডেল করার জন্য
    });

    // ৩. অরিজিনাল সার্ভার থেকে ডেটা ফেচ করা
    let response = await fetch(modifiedRequest);
    const responseHeaders = new Headers(response.headers);

    // ৪. সিকিউরিটি এবং ফ্রেম ব্লকিং বাইপাস করার জন্য কিছু হেডার রিমুভ করা
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('Content-Security-Policy-Report-Only');
    responseHeaders.delete('Clear-Site-Data');
    responseHeaders.delete('X-Frame-Options');

    // যদি অরিজিনাল সার্ভার কোনো রিডাইরেক্ট (Location) পাঠায়, তবে সেটা আপনার ডোমেইনে কনভার্ট করা
    if (responseHeaders.has('Location')) {
      let location = responseHeaders.get('Location');
      location = location.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), `https://${clientDomain}`);
      responseHeaders.set('Location', location);
    }

    let modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

    // ৫. HTML Rewriter দিয়ে পেজের ভেতরের (href, src, action) লিংকগুলো পরিবর্তন করা
    const contentType = responseHeaders.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return new HTMLRewriter()
        .on('*', new AttributeRewriter(TARGET_DOMAIN, clientDomain))
        .transform(modifiedResponse);
    }

    return modifiedResponse;
  }
};

// HTML-এর ভেতরের অ্যাট্রিবিউট ডাইনামিকভাবে রিপ্লেস করার জন্য হেল্পার ক্লাস
class AttributeRewriter {
  constructor(targetDomain, clientDomain) {
    this.targetDomain = targetDomain;
    this.clientDomain = clientDomain;
  }
  element(element) {
    const attributesToRewrite = ['href', 'src', 'action'];
    for (const attr of attributesToRewrite) {
      const value = element.getAttribute(attr);
      if (value) {
        // অরিজিনাল ডোমেইন খুঁজে পেলে তা আপনার ডাইনামিক ডোমেইন দিয়ে রিপ্লেস করবে
        const newValue = value.replace(new RegExp(`https?://${this.targetDomain}`, 'g'), `https://${this.clientDomain}`);
        element.setAttribute(attr, newValue);
      }
    }
  }
}
