// =====================================================
// স্মার্ট রিভার্স প্রক্সি + ডাটা ইঞ্জেক্টর (UI ফিক্স)
// =====================================================

const TARGET = 'https://velki123.win';
const API_TARGET = 'https://vrnlapi.com:4041';

// ইউজার ডাটা স্টোর
let userDataCache = new Map();

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingHost = url.hostname;
  const requestPath = url.pathname;
  
  // 1. API ডিটেকশন
  const isApiCall = requestPath.startsWith('/v1/') || 
                    requestPath.startsWith('/api/') ||
                    request.headers.get('content-type')?.includes('application/json');
  
  // ========== API হ্যান্ডলিং ==========
  if (isApiCall) {
    const apiUrl = new URL(requestPath + url.search, API_TARGET);
    const apiHeaders = new Headers(request.headers);
    
    apiHeaders.set('Host', apiUrl.hostname);
    apiHeaders.set('Origin', TARGET);
    apiHeaders.set('Referer', TARGET + '/');
    
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: apiHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
    
    const apiResponse = await fetch(apiRequest);
    const responseHeaders = new Headers(apiResponse.headers);
    let responseData = await apiResponse.json();
    
    // ইউজার ডাটা ক্যাশে (ব্যালেন্স, PBU, Exp)
    if (requestPath.includes('/user/balance') || requestPath.includes('/user/info')) {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      if (token) {
        userDataCache.set(token, {
          balance: responseData.results?.balance || 0,
          pbu: responseData.results?.pbu || 0,
          exp: responseData.results?.exp || 0,
          username: responseData.results?.username || 'velkidemo',
          lastUpdate: Date.now()
        });
      }
    }
    
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(JSON.stringify(responseData), {
      status: apiResponse.status,
      headers: responseHeaders
    });
  }
  
  // ========== ওয়েবসাইট হ্যান্ডলিং ==========
  const targetUrl = new URL(requestPath + url.search, TARGET);
  const headers = new Headers(request.headers);
  
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET);
  headers.set('Referer', TARGET + '/');
  
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
  });
  
  const response = await fetch(modifiedRequest);
  const responseHeaders = new Headers(response.headers);
  let responseBody = response.body;
  const contentType = responseHeaders.get('content-type') || '';
  
  // ========== HTML প্রসেসিং + UI ইঞ্জেক্ট ==========
  if (contentType.includes('text/html')) {
    let html = await response.text();
    
    // 1. বেস ট্যাগ যোগ
    html = html.replace('<head>', `<head><base href="${url.protocol}//${incomingHost}/">`);
    
    // 2. ইমেজ পাথ ফিক্স
    html = html.replace(/(src|href)=["']\/([^"']+)["']/g, `$1="${url.protocol}//${incomingHost}/$2"`);
    html = html.replace(/https?:\/\/[^\/]+\.win/g, `${url.protocol}//${incomingHost}`);
    
    // 3. **UI ফিক্স – ইউজারনেম, ব্যালেন্স, PBU, Exp দেখানোর জন্য জাভাস্ক্রিপ্ট ইঞ্জেক্ট**
    const uiFixScript = `
    <script>
    (function() {
      console.log('Proxy UI Fixer Loaded');
      
      // ফাংশন: ডাটা ফেচ করে UI আপডেট
      async function fetchAndUpdateUserData() {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (!token) {
            console.log('No token found');
            return;
          }
          
          // ব্যালেন্স ফেচ
          const balanceRes = await fetch('/v1/user/balance', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const balanceData = await balanceRes.json();
          
          if (balanceData.success) {
            // ক্লাস বা আইডি অনুযায়ী আপডেট – আপনি যেটা বলবেন সেটা বসাবো
            const balanceElements = document.querySelectorAll('[class*="balance"], [id*="balance"], .user-balance, .wallet-amount');
            balanceElements.forEach(el => {
              if (el.innerText.includes('0.00') || el.innerText === '0') {
                el.innerText = balanceData.results?.balance || '0.00';
              }
            });
            
            // PBU আপডেট
            const pbuElements = document.querySelectorAll('[class*="pbu"], [id*="pbu"], .pbu-amount');
            pbuElements.forEach(el => {
              el.innerText = balanceData.results?.pbu || '0.00';
            });
            
            // Exp আপডেট
            const expElements = document.querySelectorAll('[class*="exp"], [id*="exp"], .exp-amount');
            expElements.forEach(el => {
              el.innerText = balanceData.results?.exp || '0.00';
            });
          }
          
          // ইউজারনেম আপডেট
          const username = localStorage.getItem('username') || 'velkidemo';
          const usernameElements = document.querySelectorAll('[class*="username"], [class*="user-name"], .user-name, .profile-name');
          usernameElements.forEach(el => {
            if (el.innerText === '' || el.innerText === 'User') {
              el.innerText = username;
            }
          });
          
        } catch(e) {
          console.error('UI Update Error:', e);
        }
      }
      
      // DOM লোড হলে রান
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fetchAndUpdateUserData);
      } else {
        fetchAndUpdateUserData();
      }
      
      // প্রতি 5 সেকেন্ডে আপডেট
      setInterval(fetchAndUpdateUserData, 5000);
      
      // MutationObserver – DOM পরিবর্তন হলে আপডেট
      const observer = new MutationObserver(() => fetchAndUpdateUserData());
      observer.observe(document.body, { childList: true, subtree: true });
      
    })();
    </script>
    `;
    
    // স্ক্রিপ্ট ইনজেক্ট (body এর শেষে)
    html = html.replace('</body>', uiFixScript + '</body>');
    
    // স্লাইডার ইমেজ ফিক্স (যদি lazy loading থাকে)
    html = html.replace(/data-src=/g, 'src=');
    html = html.replace(/loading="lazy"/g, 'loading="eager"');
    
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseBody = html;
    responseHeaders.delete('content-length');
  }
  
  // ========== CSS/JS ফিক্স ==========
  else if (contentType.includes('javascript')) {
    let js = await response.text();
    // API এন্ডপয়েন্ট রিরাইট
    js = js.replace(/vrnlapi\.com:4041/g, incomingHost);
    js = js.replace(/velki123\.win/g, incomingHost);
    responseBody = js;
  }
  
  // CORS হেডার
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }
  
  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});