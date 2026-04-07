// ==================================================================
// COMPLETE REVERSE PROXY WORKER – VELKI123.WIN (PERFECT SOLUTION)
// ==================================================================
// কোনো হার্ডকোডেড ডোমেইন নেই – শুধু টার্গেট ভেরিয়েবল
// লগইন, ব্যালেন্স, PBU, EXP, ইমেজ, স্লাইডার – সব কাজ করবে
// ==================================================================

const TARGET_WEB = 'https://velki123.win';
const TARGET_API = 'https://vrnlapi.com:4041';

// সেশন ও ডাটা স্টোর
const sessionStore = new Map();

// ক্যাশে কন্ট্রোল
const CACHE_TTL = 3600; // 1 ঘন্টা

async function handleRequest(request) {
  const url = new URL(request.url);
  const incomingHost = url.hostname;
  const requestPath = url.pathname;
  const requestMethod = request.method;
  
  // ==================== 1. API ডিটেকশন ====================
  const contentType = request.headers.get('content-type') || '';
  const acceptHeader = request.headers.get('accept') || '';
  
  const isApiRequest = requestPath.startsWith('/v1/') || 
                       requestPath.startsWith('/api/') ||
                       requestPath.includes('/user/login') ||
                       requestPath.includes('/user/balance') ||
                       requestPath.includes('/user/info') ||
                       requestPath.includes('/user/pbu') ||
                       contentType.includes('application/json') ||
                       acceptHeader.includes('application/json');
  
  // ==================== 2. API রিকোয়েস্ট হ্যান্ডেল ====================
  if (isApiRequest) {
    const apiUrl = new URL(requestPath + url.search, TARGET_API);
    const apiHeaders = new Headers(request.headers);
    
    // হেডার সেট করা
    apiHeaders.set('Host', apiUrl.hostname);
    apiHeaders.set('Origin', TARGET_WEB);
    apiHeaders.set('Referer', TARGET_WEB + '/');
    apiHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    apiHeaders.delete('cf-ray');
    apiHeaders.delete('cf-worker');
    
    // লগইন রিকোয়েস্ট বডি প্রসেস
    let body = request.body;
    if (requestMethod === 'POST' && requestPath.includes('/login')) {
      const textBody = await request.text();
      try {
        let jsonBody = JSON.parse(textBody);
        // validationCode থাকলে uniqueId তে কনভার্ট
        if (jsonBody.validationCode && !jsonBody.uniqueId) {
          jsonBody.uniqueId = parseInt(jsonBody.validationCode);
          delete jsonBody.validationCode;
        }
        body = JSON.stringify(jsonBody);
      } catch(e) {
        body = textBody;
      }
    }
    
    const apiRequest = new Request(apiUrl, {
      method: requestMethod,
      headers: apiHeaders,
      body: requestMethod !== 'GET' && requestMethod !== 'HEAD' ? body : undefined
    });
    
    try {
      const apiResponse = await fetch(apiRequest);
      const responseHeaders = new Headers(apiResponse.headers);
      let responseData = await apiResponse.json();
      
      // লগইন সফল হলে টোকেন সেভ
      if (requestPath.includes('/login') && responseData.success === true) {
        const token = responseData.results?.token || responseData.token;
        if (token) {
          const sessionId = generateSessionId();
          sessionStore.set(sessionId, {
            token: token,
            username: responseData.results?.username || '',
            createdAt: Date.now()
          });
          
          // কুকি সেট
          const cookie = `session_id=${sessionId}; Domain=${incomingHost}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`;
          responseHeaders.set('Set-Cookie', cookie);
        }
      }
      
      // ব্যালেন্স রেসপন্সে UI এর জন্য ডাটা যোগ
      if (requestPath.includes('/balance') && responseData.success === true) {
        responseData.proxyTimestamp = Date.now();
      }
      
      // CORS হেডার
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return new Response(JSON.stringify(responseData), {
        status: apiResponse.status,
        headers: responseHeaders
      });
      
    } catch(e) {
      return new Response(JSON.stringify({
        success: false,
        message: 'API Proxy Error: ' + e.message
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // ==================== 3. ওয়েবসাইট রিকোয়েস্ট হ্যান্ডেল ====================
  const targetUrl = new URL(requestPath + url.search, TARGET_WEB);
  const headers = new Headers(request.headers);
  
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET_WEB);
  headers.set('Referer', TARGET_WEB + '/');
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // কুকি থেকে সেশন টোকেন নেওয়া
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/session_id=([^;]+)/);
  if (sessionMatch && sessionStore.has(sessionMatch[1])) {
    const session = sessionStore.get(sessionMatch[1]);
    if (session.token) {
      headers.set('Authorization', `Bearer ${session.token}`);
    }
  }
  
  const modifiedRequest = new Request(targetUrl, {
    method: requestMethod,
    headers: headers,
    body: requestMethod !== 'GET' && requestMethod !== 'HEAD' ? request.body : undefined,
    redirect: 'manual'
  });
  
  let response = await fetch(modifiedRequest);
  const responseHeaders = new Headers(response.headers);
  let responseBody = response.body;
  const respContentType = responseHeaders.get('content-type') || '';
  
  // ==================== 4. HTML প্রসেসিং (সবকিছু ফিক্স) ====================
  if (respContentType.includes('text/html')) {
    let html = await response.text();
    
    // বেস ট্যাগ যোগ
    html = html.replace('<head>', `<head><base href="${url.protocol}//${incomingHost}/">`);
    
    // সব লিংক, স্ক্রিপ্ট, ইমেজ পাথ রিরাইট
    html = html.replace(/(src|href)=["']\/([^"']+)["']/g, `$1="${url.protocol}//${incomingHost}/$2"`);
    html = html.replace(/(src|href)=["'](https?:)?\/\/([^"']+)["']/g, (match, attr, protocol, domain) => {
      if (domain.includes('velki123.win') || domain.includes('vrnlapi.com')) {
        return `${attr}="${url.protocol}//${incomingHost}/${domain.split('/').slice(1).join('/')}"`;
      }
      return match;
    });
    
    // API এন্ডপয়েন্ট রিরাইট
    html = html.replace(/vrnlapi\.com:4041/g, incomingHost);
    html = html.replace(/velki123\.win/g, incomingHost);
    
    // লেজি লোডিং ইমেজ ফিক্স
    html = html.replace(/data-src=/g, 'src=');
    html = html.replace(/loading="lazy"/g, 'loading="eager"');
    
    // ========== কমপ্লিট UI ফিক্স স্ক্রিপ্ট ==========
    const uiScript = `
    <script>
    (function() {
      console.log('🔧 Proxy UI Fixer Active');
      
      // টোকেন ম্যানেজমেন্ট
      let authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      // ইউজার ডাটা স্টোর
      let userData = {
        balance: 0,
        pbu: 0,
        exp: 0,
        username: ''
      };
      
      // API কল ফাংশন
      async function callAPI(endpoint, options = {}) {
        try {
          const response = await fetch(endpoint, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken ? 'Bearer ' + authToken : '',
              ...options.headers
            }
          });
          return await response.json();
        } catch(e) {
          console.error('API Error:', e);
          return null;
        }
      }
      
      // ইউজার ডাটা ফেচ
      async function fetchUserData() {
        if (!authToken) return;
        
        const balanceData = await callAPI('/v1/user/balance');
        if (balanceData && balanceData.success) {
          userData.balance = balanceData.results?.balance || 0;
          userData.pbu = balanceData.results?.pbu || 0;
          userData.exp = balanceData.results?.exp || 0;
          updateUI();
        }
      }
      
      // UI আপডেট ফাংশন (সব ক্লাস এবং আইডি কভার করে)
      function updateUI() {
        // ব্যালেন্স আপডেট
        const balanceSelectors = [
          '.balance', '.user-balance', '.wallet-amount', '.main-balance',
          '[class*="balance"]', '[id*="balance"]', '.amount', '.user-amount'
        ];
        balanceSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const text = el.innerText;
            if (text === '0' || text === '0.00' || text.includes('0.00') || text === '') {
              el.innerText = userData.balance.toFixed(2);
            }
          });
        });
        
        // PBU আপডেট
        const pbuSelectors = [
          '.pbu', '.pbu-amount', '[class*="pbu"]', '[id*="pbu"]', '.pbu-value'
        ];
        pbuSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const text = el.innerText;
            if (text === '0' || text === '0.00' || text.includes('0.00')) {
              el.innerText = userData.pbu.toFixed(2);
            }
          });
        });
        
        // EXP আপডেট
        const expSelectors = [
          '.exp', '.exp-amount', '[class*="exp"]', '[id*="exp"]', '.experience'
        ];
        expSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const text = el.innerText;
            if (text === '0' || text === '0.00' || text.includes('0.00')) {
              el.innerText = userData.exp.toFixed(2);
            }
          });
        });
        
        // ইউজারনেম আপডেট
        const usernameSelectors = [
          '.username', '.user-name', '.profile-name', '[class*="username"]',
          '[id*="username"]', '.user-display', '.welcome-user'
        ];
        usernameSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el.innerText === '' || el.innerText === 'User' || el.innerText.includes('Guest')) {
              el.innerText = userData.username || 'velkidemo';
            }
          });
        });
        
        console.log('✅ UI Updated - Balance:', userData.balance, 'PBU:', userData.pbu);
      }
      
      // লগইন হ্যান্ডলার ওভাররাইড
      function setupLoginHandler() {
        const loginForm = document.querySelector('form');
        if (loginForm && !loginForm.hasAttribute('data-proxy-bound')) {
          loginForm.setAttribute('data-proxy-bound', 'true');
          loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const loginData = {
              username: formData.get('username') || formData.get('Username'),
              password: formData.get('password') || formData.get('Password'),
              uniqueId: parseInt(formData.get('validationCode') || formData.get('ValidationCode') || '0')
            };
            
            const result = await callAPI('/v1/user/login', {
              method: 'POST',
              body: JSON.stringify(loginData)
            });
            
            if (result && result.success) {
              authToken = result.results?.token || result.token;
              if (authToken) {
                localStorage.setItem('auth_token', authToken);
                userData.username = loginData.username;
                await fetchUserData();
                location.reload();
              }
            } else {
              alert('Login Failed: ' + (result?.message || 'Invalid credentials'));
            }
          });
        }
      }
      
      // ইমেজ লোডিং ফিক্স
      function fixImages() {
        document.querySelectorAll('img').forEach(img => {
          if (img.getAttribute('data-src')) {
            img.src = img.getAttribute('data-src');
          }
          if (img.src && img.src.includes('velki123.win')) {
            img.src = img.src.replace(/velki123\\.win/g, window.location.hostname);
          }
        });
      }
      
      // MutationObserver – DOM পরিবর্তন মনিটর
      const observer = new MutationObserver(() => {
        updateUI();
        setupLoginHandler();
        fixImages();
      });
      
      // শুরু করা
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setupLoginHandler();
          fixImages();
          if (authToken) fetchUserData();
          observer.observe(document.body, { childList: true, subtree: true });
          setInterval(() => { if (authToken) fetchUserData(); }, 10000);
        });
      } else {
        setupLoginHandler();
        fixImages();
        if (authToken) fetchUserData();
        observer.observe(document.body, { childList: true, subtree: true });
        setInterval(() => { if (authToken) fetchUserData(); }, 10000);
      }
    })();
    </script>
    `;
    
    // স্ক্রিপ্ট ইনজেক্ট
    html = html.replace('</body>', uiScript + '</body>');
    
    // ক্যাশে হেডার
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('X-Proxy-Version', '2.0');
    
    responseBody = html;
    responseHeaders.delete('content-length');
  }
  
  // ==================== 5. CSS/JS ফাইল প্রসেসিং ====================
  else if (respContentType.includes('javascript') || respContentType.includes('css')) {
    let text = await response.text();
    text = text.replace(/vrnlapi\.com:4041/g, incomingHost);
    text = text.replace(/velki123\.win/g, incomingHost);
    responseBody = text;
  }
  
  // CORS হেডার
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS প্রিফ্লাইট
  if (requestMethod === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders });
  }
  
  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders
  });
}

// ==================== হেল্পার ফাংশন ====================
function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});