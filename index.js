const TARGET_HOSTNAME = '7wickets.live';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. WebSocket সাপোর্ট
  if (request.headers.get('Upgrade') === 'websocket') {
    url.hostname = TARGET_HOSTNAME;
    const wsRequest = new Request(url.toString(), request);
    wsRequest.headers.set('Host', TARGET_HOSTNAME);
    wsRequest.headers.set('Origin', `https://${TARGET_HOSTNAME}`);
    return fetch(wsRequest);
  }

  // ২. CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ৩. রিকোয়েস্ট রেডি করা
  url.hostname = TARGET_HOSTNAME;
  const proxyRequest = new Request(url.toString(), request);
  proxyRequest.headers.set('Host', TARGET_HOSTNAME);
  
  if (request.headers.has('Origin')) {
    proxyRequest.headers.set('Origin', request.headers.get('Origin').replace(myDomain, TARGET_HOSTNAME));
  }
  if (request.headers.has('Referer')) {
    proxyRequest.headers.set('Referer', request.headers.get('Referer').replace(myDomain, TARGET_HOSTNAME));
  }

  proxyRequest.headers.delete('cf-ray');
  proxyRequest.headers.delete('cf-connecting-ip');
  proxyRequest.headers.delete('cf-ipcountry');

  // ৪. অরিজিনাল সার্ভার থেকে ডেটা আনা
  let response = await fetch(proxyRequest);
  let responseHeaders = new Headers(response.headers);

  // ৫. Security Headers রিমুভ (খুব জরুরি)
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('Content-Security-Policy-Report-Only');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Strict-Transport-Security');

  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');

  if (responseHeaders.has('Location')) {
    responseHeaders.set('Location', responseHeaders.get('Location').replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain));
  }

  const setCookies = responseHeaders.get('Set-Cookie');
  if (setCookies) {
    responseHeaders.set('Set-Cookie', setCookies.replace(new RegExp(TARGET_HOSTNAME, 'ig'), myDomain));
  }

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ৬. HTML মডিফাই করা এবং Interceptor Script যুক্ত করা (এই অংশটি ভিডিও প্লে করার মূল জাদুকর)
  if (contentType.includes('text/html')) {
    let html = await response.text();
    
    // ব্রাউজারের নেটওয়ার্ক রিকোয়েস্ট হাইজ্যাক করার স্ক্রিপ্ট
    const interceptorScript = `
    <script>
      (function() {
        const targetDomain = '${TARGET_HOSTNAME}';
        const proxyDomain = window.location.hostname;

        // Fetch API Intercept
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          if (typeof args[0] === 'string' && args[0].includes(targetDomain)) {
            args[0] = args[0].replace(new RegExp(targetDomain, 'g'), proxyDomain);
          } else if (args[0] instanceof Request && args[0].url.includes(targetDomain)) {
            args[0] = new Request(args[0].url.replace(new RegExp(targetDomain, 'g'), proxyDomain), args[0]);
          }
          return originalFetch.apply(this, args);
        };

        // XMLHttpRequest (XHR) Intercept (Video.js অনেক সময় এটি ব্যবহার করে)
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
          if (typeof url === 'string' && url.includes(targetDomain)) {
            url = url.replace(new RegExp(targetDomain, 'g'), proxyDomain);
          }
          return originalOpen.call(this, method, url, ...rest);
        };

        // WebSocket Intercept (Live Odds/Score এর জন্য)
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
          if (typeof url === 'string' && url.includes(targetDomain)) {
            url = url.replace(new RegExp(targetDomain, 'g'), proxyDomain);
          }
          return new OriginalWebSocket(url, protocols);
        };
      })();
    </script>
    `;

    // <head> ট্যাগের ঠিক পরেই আমাদের স্ক্রিপ্টটি বসিয়ে দেওয়া
    html = html.replace('<head>', '<head>' + interceptorScript);
    
    // সাধারণ টেক্সট রিপ্লেস
    html = html.replace(new RegExp(`https://${TARGET_HOSTNAME}`, 'g'), `https://${myDomain}`)
               .replace(new RegExp(`http://${TARGET_HOSTNAME}`, 'g'), `http://${myDomain}`)
               .replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain);

    responseHeaders.delete('Content-Length');
    return new Response(html, { status: response.status, headers: responseHeaders });
  }

  // ৭. JS এবং অন্যান্য টেক্সট ফাইল রিপ্লেস
  const isTextContent = contentType.includes('application/json') || 
                        contentType.includes('application/javascript') ||
                        contentType.includes('application/x-javascript') ||
                        contentType.includes('text/css') ||
                        contentType.includes('application/vnd.apple.mpegurl') ||
                        contentType.includes('audio/mpegurl');

  if (isTextContent) {
    let text = await response.text();
    text = text.replace(new RegExp(`https://${TARGET_HOSTNAME}`, 'g'), `https://${myDomain}`)
               .replace(new RegExp(`http://${TARGET_HOSTNAME}`, 'g'), `http://${myDomain}`)
               .replace(new RegExp(TARGET_HOSTNAME, 'g'), myDomain);

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // ৮. ভিডিও, ইমেজ সরাসরি স্ট্রিম করা
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
