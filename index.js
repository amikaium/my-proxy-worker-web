const MAIN_TARGET = '7wickets.live'; 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. ব্রাউজার সিকিউরিটি বাইপাস
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

  // আমরা শুধুমাত্র মেইন ডোমেইনকেই প্রক্সি করবো
  url.hostname = MAIN_TARGET;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', MAIN_TARGET);
  proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
  proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);
  
  // সার্ভার থেকে ফ্রেশ ফাইল আনার জন্য
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
  // Iframe যেন ব্লক না হয় তার জন্য সব সিকিউরিটি রিমুভ করা হলো
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  // রিডাইরেক্ট ঠিক করা
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = responseHeaders.get('Location');
    if (location) {
        location = location.replace(`https://${MAIN_TARGET}`, `https://${myDomain}`);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ২. লিংক মডিফিকেশন (শুধুমাত্র মেইন ওয়েবসাইটের লিংকগুলো পরিবর্তন হবে, স্কোরবোর্ড অক্ষত থাকবে)
  if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('application/json')) {
    
    let text = await response.text();

    // শুধুমাত্র 7wickets.live লিংকগুলো আপনার ডোমেইনে কনভার্ট হবে
    text = text.replace(new RegExp(`https://${MAIN_TARGET}/?`, 'g'), `https://${myDomain}/`);
    text = text.replace(new RegExp(`//${MAIN_TARGET}/?`, 'g'), `//${myDomain}/`);

    // (বিঃদ্রঃ আমরা স্কোর এবং ভিডিওর লিংক পাল্টাবো না, যাতে সেগুলো তাদের অরিজিনাল সার্ভার থেকে সরাসরি লোড হতে পারে এবং ক্র্যাশ না করে)

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
