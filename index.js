// ============================================
// প্রফেশনাল রিভার্স প্রক্সি – API + ওয়েবসাইট
// ============================================
// কোনো হার্ডকোডেড ডোমেইন নেই – শুধু টার্গেট বেস URL
// ============================================

const TARGET_WEB = 'https://velki123.win';      // মূল ওয়েবসাইট
const TARGET_API = 'https://vrnlapi.com:4041';  // ব্যাকএন্ড API

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingDomain = url.hostname;
  const requestPath = url.pathname;
  
  // 1. API রিকোয়েস্ট চিহ্নিত করা (যেকোনো /api/ বা /v1/ পাথ)
  const isApiRequest = requestPath.startsWith('/api/') || 
                       requestPath.startsWith('/v1/') ||
                       requestPath.includes('/user/login') ||
                       requestPath.includes('/user/balance') ||
                       request.headers.get('content-type')?.includes('application/json');
  
  // 2. টার্গেট বেস নির্বাচন
  const targetBase = isApiRequest ? TARGET_API : TARGET_WEB;
  const targetUrl = new URL(requestPath + url.search, targetBase);
  
  // 3. হেডার তৈরি – আসল API হেডার ঠিক রাখা
  const headers = new Headers(request.headers);
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', targetBase);
  headers.set('Referer', TARGET_WEB + '/');
  
  // API-র জন্য স্পেশাল হেডার
  if (isApiRequest) {
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Content-Type', 'application/json');
    headers.delete('CF-Access-Client-UID');
  }
  
  // 4. রিকোয়েস্ট ফরোয়ার্ড
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual'
  });
  
  // 5. ফেচ রেসপন্স
  let response = await fetch(modifiedRequest).catch(err => {
    return new Response(JSON.stringify({
      success: false,
      message: `Proxy connection error: ${err.message}`,
      results: {}
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  });
  
  // 6. রেসপন্স প্রসেসিং
  const responseHeaders = new Headers(response.headers);
  let responseBody = response.body;
  let status = response.status;
  
  // লোকেশন রিরাইট
  if (responseHeaders.has('location')) {
    let location = responseHeaders.get('location');
    try {
      let locationUrl = new URL(location, targetUrl);
      locationUrl.hostname = incomingDomain;
      locationUrl.protocol = url.protocol;
      responseHeaders.set('location', locationUrl.toString());
    } catch(e) {}
  }
  
  // কুকি রিরাইট
  let setCookie = responseHeaders.get('set-cookie');
  if (setCookie) {
    let newCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${incomingDomain}`);
    newCookie = newCookie.replace(/secure;\s*/gi, '');
    responseHeaders.set('set-cookie', newCookie);
  }
  
  // CORS হেডার (AJAX API কলের জন্য)
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // OPTIONS প্রিফ্লাইট হ্যান্ডেল
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }
  
  // 7. HTML/JS স্ট্রিং রিরাইট (ওয়েবসাইট রেসপন্সের জন্য)
  const contentType = responseHeaders.get('content-type') || '';
  if (!isApiRequest && (contentType.includes('text/html') || contentType.includes('javascript'))) {
    let text = await response.text();
    
    // ওয়েবসাইটের সব URL আপনার ডোমেইনে রিরাইট
    const webDomain = TARGET_WEB.replace(/https?:\/\//, '').replace(/\./g, '\\.');
    const apiDomain = TARGET_API.replace(/https?:\/\//, '').replace(/\./g, '\\.');
    
    const webRegex = new RegExp(`(https?://)?${webDomain}`, 'g');
    const apiRegex = new RegExp(`(https?://)?${apiDomain}`, 'g');
    
    text = text.replace(webRegex, `${url.protocol}//${incomingDomain}`);
    text = text.replace(apiRegex, `${url.protocol}//${incomingDomain}`);
    
    // API কলগুলো রিরাইট (জাভাস্ক্রিপ্টের মধ্যে)
    text = text.replace(/vrnlapi\.com:4041/g, incomingDomain);
    text = text.replace(/velki123\.win/g, incomingDomain);
    
    responseBody = text;
    responseHeaders.delete('content-length');
  }
  
  // 8. API রেসপন্স লগিং (ডিবাগের জন্য – প্রোডাকশনে মুছে দিন)
  if (isApiRequest && response.status !== 200) {
    console.log(`API ${request.method} ${requestPath} -> ${response.status}`);
  }
  
  return new Response(responseBody, {
    status: status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

// ওয়েবসকেট (WebSocket) সাপোর্ট – যদি প্রয়োজন হয়
function handleWebSocket(request) {
  // ওয়েবসকেট হ্যান্ডলিং এখানে যুক্ত করা যেতে পারে
  return null;
}

addEventListener('fetch', event => {
  const request = event.request;
  
  // ওয়েবসকেট চেক
  if (request.headers.get('upgrade') === 'websocket') {
    const wsResponse = handleWebSocket(request);
    if (wsResponse) return event.respondWith(wsResponse);
  }
  
  event.respondWith(handleRequest(request));
});
