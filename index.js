// ===================================================
// প্রোডাকশন-রেডি রিভার্স প্রক্সি – হোয়াইট স্ক্রিন ফিক্স + API সাপোর্ট
// ===================================================

const TARGET = 'https://velki123.win';
const API_TARGET = 'https://vrnlapi.com:4041';

// ক্যাশে কন্ট্রোল (হোয়াইট স্ক্রিন ঠিক করার জন্য)
const CACHE_CONTROL = 'public, max-age=3600, must-revalidate';

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingHost = url.hostname;
  const requestPath = url.pathname;
  
  // 1. API ডিটেকশন – সঠিকভাবে চিহ্নিত করা
  const isApiCall = requestPath.startsWith('/v1/') || 
                    requestPath.startsWith('/api/') ||
                    requestPath.includes('/user/login') ||
                    requestPath.includes('/user/balance') ||
                    request.headers.get('content-type')?.includes('application/json') ||
                    request.headers.get('accept')?.includes('application/json');
  
  // 2. API কল হ্যান্ডেল (vrnlapi.com:4041)
  if (isApiCall) {
    const apiUrl = new URL(requestPath + url.search, API_TARGET);
    const apiHeaders = new Headers(request.headers);
    
    // হেডার ঠিক করা
    apiHeaders.set('Host', apiUrl.hostname);
    apiHeaders.set('Origin', TARGET);
    apiHeaders.set('Referer', TARGET + '/');
    apiHeaders.delete('cf-ray');
    apiHeaders.delete('cf-worker');
    
    // API রিকোয়েস্ট ফরোয়ার্ড
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: apiHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
    
    try {
      const apiResponse = await fetch(apiRequest);
      const responseHeaders = new Headers(apiResponse.headers);
      
      // CORS হেডার
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      
      // কুকি ডোমেইন রিরাইট
      const setCookie = responseHeaders.get('set-cookie');
      if (setCookie) {
        const newCookie = setCookie.replace(/domain=[^;]+/gi, `domain=${incomingHost}`);
        responseHeaders.set('set-cookie', newCookie);
      }
      
      return new Response(apiResponse.body, {
        status: apiResponse.status,
        headers: responseHeaders
      });
    } catch(e) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API connection failed: ' + e.message
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 3. ওয়েবসাইট কল হ্যান্ডেল (velki123.win)
  const targetUrl = new URL(requestPath + url.search, TARGET);
  const headers = new Headers(request.headers);
  
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET);
  headers.set('Referer', TARGET + '/');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
  });
  
  const response = await fetch(modifiedRequest);
  const responseHeaders = new Headers(response.headers);
  let responseBody = response.body;
  
  // 4. HTML প্রসেসিং – হোয়াইট স্ক্রিন ঠিক করা
  const contentType = responseHeaders.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    let html = await response.text();
    
    // বেস ট্যাগ যোগ করা (সব রিলেটিভ পাথ ঠিক করার জন্য)
    html = html.replace('<head>', `<head><base href="${url.protocol}//${incomingHost}/">`);
    
    // সব লিংক, স্ক্রিপ্ট, ইমেজ পাথ রিরাইট
    html = html.replace(/(src|href)=["']\/([^"']+)["']/g, `$1="${url.protocol}//${incomingHost}/$2"`);
    html = html.replace(/(src|href)=["'](https?:)?\/\/([^"']+)["']/g, (match, attr, protocol, domain) => {
      if (domain.includes('velki123.win') || domain.includes('vrnlapi.com')) {
        return `${attr}="${url.protocol}//${incomingHost}/${domain.split('/').slice(1).join('/')}"`;
      }
      return match;
    });
    
    // API এন্ডপয়েন্ট রিরাইট (জাভাস্ক্রিপ্টে)
    html = html.replace(/vrnlapi\.com:4041/g, incomingHost);
    html = html.replace(/velki123\.win/g, incomingHost);
    
    // ক্যাশে কন্ট্রোল যোগ করা
    responseHeaders.set('Cache-Control', CACHE_CONTROL);
    responseHeaders.set('X-Proxy-By', 'Cloudflare-Worker');
    
    responseBody = html;
    responseHeaders.delete('content-length');
  }
  
  // 5. CSS/JS ফাইলের জন্য (হোয়াইট স্ক্রিন ঠিক করতে)
  else if (contentType.includes('javascript') || contentType.includes('css')) {
    let text = await response.text();
    
    // JS এর মধ্যে থাকা API কল রিরাইট
    text = text.replace(/vrnlapi\.com:4041/g, incomingHost);
    text = text.replace(/velki123\.win/g, incomingHost);
    text = text.replace(/https?:\/\/[^/]+\/v1\//g, `${url.protocol}//${incomingHost}/v1/`);
    
    responseHeaders.set('Cache-Control', CACHE_CONTROL);
    responseBody = text;
    responseHeaders.delete('content-length');
  }
  
  // 6. CORS হেডার
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
