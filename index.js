// Cloudflare-সুরক্ষিত সাইটের জন্য প্রফেশনাল রিভার্স প্রক্সি ওয়ার্কার
// কোনো হার্ডকোডেড ডোমেইন নেই – নিজের ডোমেইন থেকে যেকোনো টার্গেট সাইটে ফরোয়ার্ড করে

const TARGET_BASE = 'https://velki123.win'; // শুধু এখানে টার্গেট দিলেই হবে

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingDomain = url.hostname;
  
  // 1. নতুন রিকোয়েস্ট তৈরি (কুকি, হেডার, বডি কপি করে)
  const targetUrl = new URL(TARGET_BASE + url.pathname + url.search);
  
  // 2. হেডার প্রস্তুত (মূল সাইটের Origin/Rererer সঠিকভাবে সেট)
  const headers = new Headers(request.headers);
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET_BASE);
  headers.set('Referer', TARGET_BASE + '/');
  headers.delete('CF-Access-Client-UID'); // ক্লাউডফ্লেয়ার অথ সাফ করা
  
  // 3. রিকোয়েস্ট ফরোয়ার্ড
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual'
  });
  
  // 4. ফেচ ও রেসপন্স প্রক্রিয়াকরণ
  let response = await fetch(modifiedRequest).catch(err => {
    return new Response(`Proxy Error: ${err.message}`, { status: 502 });
  });
  
  // 5. রেসপন্স কুকি/লোকেশন ঠিক করা (যাতে আপনার ডোমেনে আটকে থাকে)
  const responseHeaders = new Headers(response.headers);
  
  // লোকেশন রিডাইরেক্ট আপনার ডোমেইনে রিরাইট
  if (responseHeaders.has('location')) {
    let location = responseHeaders.get('location');
    try {
      let locationUrl = new URL(location, targetUrl);
      locationUrl.hostname = incomingDomain;
      locationUrl.protocol = url.protocol;
      responseHeaders.set('location', locationUrl.toString());
    } catch(e) {}
  }
  
  // কুকির ডোমেইন আপনার ডোমেইনে রিরাইট
  let setCookie = responseHeaders.get('set-cookie');
  if (setCookie) {
    let newCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${incomingDomain}`);
    newCookie = newCookie.replace(/secure;?\s*/gi, '');
    responseHeaders.set('set-cookie', newCookie);
  }
  
  // CORS হেডার (যদি AJAX API কল থাকে)
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  
  // 6. HTML থাকলে সেখানেও আপনার ডোমেইন বসানো (হার্ডকোডেড ইউআরএল রিরাইট)
  let body = response.body;
  const contentType = responseHeaders.get('content-type') || '';
  if (contentType.includes('text/html') || contentType.includes('text/javascript')) {
    let text = await response.text();
    // রেগেক্স দিয়ে সমস্ত সাবডোমেইন/পাথ রিরাইট (ডাইনামিক)
    const regex = new RegExp(`(https?://)?(\\S*\\.)?${TARGET_BASE.replace(/https?:\/\//, '').replace(/\./g, '\\.')}`, 'g');
    text = text.replace(regex, `${url.protocol}//${incomingDomain}`);
    text = text.replace(/\/\/(static|cdn|assets)[^\/\s"']+/g, `//${incomingDomain}/static_redirect`);
    body = text;
    responseHeaders.delete('content-length');
  }
  
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
