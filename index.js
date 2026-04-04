const TARGET_DOMAIN = 'vellki247.com';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const workerDomain = url.hostname; // আপনার ডাইনামিক ডোমেইন বা প্রিভিউ লিংক

  // CORS প্রি-ফ্লাইট রিকোয়েস্ট হ্যান্ডেল করা
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

  // রিকোয়েস্টের টার্গেট পরিবর্তন করে vellki247.com করা
  url.hostname = TARGET_DOMAIN;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', TARGET_DOMAIN);
  proxyReqHeaders.set('Origin', `https://${TARGET_DOMAIN}`);
  proxyReqHeaders.set('Referer', `https://${TARGET_DOMAIN}/`);
  // কন্টেন্ট মডিফাই করার সুবিধার্থে এনকোডিং ডিলিট করা হচ্ছে
  proxyReqHeaders.delete('Accept-Encoding'); 

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: proxyReqHeaders,
    body: request.body,
    redirect: 'manual'
  });

  let response;
  try {
    response = await fetch(proxyRequest);
  } catch (err) {
    return new Response("Server Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  // ব্রাউজার সিকিউরিটি ব্লক এড়ানোর জন্য হেডার রিমুভ
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  // রিডাইরেক্ট হ্যান্ডেল করা (যাতে রিডাইরেক্ট হলে আপনার ডোমেইনেই থাকে)
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(new RegExp(TARGET_DOMAIN, 'g'), workerDomain);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // HTML, JS, JSON এবং CSS ফাইলগুলোতে vellki247.com এর জায়গায় আপনার ডোমেইন বসানো
  if (contentType.includes('text/html') || 
      contentType.includes('application/javascript') || 
      contentType.includes('application/json') || 
      contentType.includes('text/css')) {
      
    let text = await response.text();
    text = text.replace(new RegExp(TARGET_DOMAIN, 'g'), workerDomain);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ইমেজ বা অন্যান্য মিডিয়া ফাইলের জন্য সরাসরি রেসপন্স
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
