const TARGET_DOMAIN = 'tenx365x.live';
const TARGET_URL = 'https://' + TARGET_DOMAIN;
const PROXY_PREFIX = '/ext-proxy/';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // ১. CORS Preflight রিকোয়েস্ট বাইপাস
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ২. External Proxy রিকোয়েস্ট (365cric.com Iframe এবং API এর জন্য)
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    return handleExternalProxy(request, url);
  }

  // ৩. Main Domain রিকোয়েস্ট (tenx365x.live)
  url.hostname = TARGET_DOMAIN;
  const headers = new Headers(request.headers);
  
  // অরিজিনাল সাইটকে ধোঁকা দেওয়ার জন্য হেডার সেট করা
  headers.set('Host', TARGET_DOMAIN);
  if (headers.has('Origin')) headers.set('Origin', TARGET_URL);
  if (headers.has('Referer')) headers.set('Referer', TARGET_URL + '/');

  // লাইভ স্কোর আপডেটের জন্য WebSocket সাপোর্ট
  if (request.headers.get("Upgrade") === "websocket") {
    return fetch(url.toString(), { method: request.method, headers: headers });
  }

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  const response = await fetch(modifiedRequest);
  return processResponse(response, proxyOrigin, false, null);
}

// এক্সটার্নাল API এবং Iframe (Scoreboard) হ্যান্ডেল করার ফাংশন
async function handleExternalProxy(request, url) {
  const actualUrlStr = url.pathname.replace(PROXY_PREFIX, '') + url.search;
  
  if (!actualUrlStr.startsWith('http')) {
    return new Response('Invalid proxy URL', { status: 400 });
  }

  const actualUrl = new URL(actualUrlStr);
  const headers = new Headers(request.headers);
  
  // Scoreboard সার্ভারকে বোঝানো যে রিকোয়েস্টটি মূল সাইট থেকেই আসছে
  headers.set('Host', actualUrl.hostname);
  headers.set('Origin', TARGET_URL);
  headers.set('Referer', TARGET_URL + '/');
  
  headers.delete('X-Forwarded-For');
  headers.delete('CF-Connecting-IP');

  const modifiedRequest = new Request(actualUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  });

  const response = await fetch(modifiedRequest);
  return processResponse(response, url.origin, true, actualUrl);
}

// HTML, Video এবং Header মডিফাই করার মেইন ফাংশন
async function processResponse(response, proxyOrigin, isExternal, externalUrl) {
  const newHeaders = new Headers(response.headers);

  // ব্রাউজারের Security Restriction রিমুভ করা যাতে Iframe কাজ করে
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  newHeaders.delete('Report-To');

  newHeaders.set('Access-Control-Allow-Origin', proxyOrigin);
  newHeaders.set('Access-Control-Allow-Credentials', 'true');

  // কুকি ফিক্স
  const cookies = newHeaders.getSetCookie();
  if (cookies && cookies.length > 0) {
    newHeaders.delete('Set-Cookie');
    cookies.forEach(cookie => {
      let fixedCookie = cookie.replace(/Domain=[^;]+;/gi, '');
      newHeaders.append('Set-Cookie', fixedCookie);
    });
  }

  const contentType = response.headers.get('content-type') || '';

  // M3U8 Video Stream ফিক্স (আগের মতোই)
  if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
    let text = await response.text();
    text = text.replace(/(https?:\/\/[^\s]+)/g, `${proxyOrigin}${PROXY_PREFIX}$1`);
    return new Response(text, { status: response.status, headers: newHeaders });
  }

  // HTML পেজ (Main Site এবং Scoreboard Iframe উভয়ের জন্য)
  if (contentType.includes('text/html')) {
    let rewriter = new HTMLRewriter().on('head', {
      element(e) {
        // যদি এটি Scoreboard Iframe (External) হয়, তাহলে Base URL ইনজেক্ট করা
        // যাতে এর ভেতরের CSS/JS ফাইলগুলো প্রক্সির মাধ্যমে লোড হয়
        if (isExternal && externalUrl) {
          let baseUrl = `${externalUrl.origin}${externalUrl.pathname}`;
          if (!baseUrl.endsWith('/')) baseUrl += '/';
          e.prepend(`<base href="${proxyOrigin}${PROXY_PREFIX}${baseUrl}">`, { html: true });
        }

        // JS Injector: API কল বাইপাস করা এবং Referrer ফেইক করা
        e.append(`
          <script>
            (function() {
              const proxyPrefix = "${proxyOrigin}${PROXY_PREFIX}";
              const targetDomain = "${TARGET_DOMAIN}";
              
              // জাভাস্ক্রিপ্ট দিয়ে Referrer চেক করলে যেন মূল সাইটের নাম পায়
              try {
                Object.defineProperty(document, 'referrer', { get: function() { return "https://" + targetDomain + "/"; }});
              } catch(e) {}

              function rewriteUrl(u) {
                if (!u || u.startsWith('blob:') || u.startsWith('data:')) return u;
                try {
                  let parsed = new URL(u, window.location.origin);
                  if (parsed.hostname !== window.location.hostname && !parsed.hostname.includes(targetDomain)) {
                    return proxyPrefix + parsed.href;
                  }
                } catch(e) {}
                return u;
              }

              // Fetch API Intercept
              const originalFetch = window.fetch;
              window.fetch = async function() {
                if (typeof arguments[0] === 'string') {
                  arguments[0] = rewriteUrl(arguments[0]);
                } else if (arguments[0] instanceof Request) {
                  arguments[0] = new Request(rewriteUrl(arguments[0].url), arguments[0]);
                }
                return originalFetch.apply(this, arguments);
              };

              // XHR (Ajax) Intercept
              const originalOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                arguments[1] = rewriteUrl(url);
                return originalOpen.apply(this, arguments);
              };
            })();
          </script>
        `, { html: true });
      }
    });

    // লিংক এবং সোর্স রিপ্লেসমেন্ট
    rewriter = rewriter
      .on('[href]', new AttributeRewriter('href', proxyOrigin))
      .on('[src]', new AttributeRewriter('src', proxyOrigin))
      .on('[action]', new AttributeRewriter('action', proxyOrigin));

    return rewriter.transform(new Response(response.body, {
      status: response.status,
      headers: newHeaders
    }));
  }

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}

// HTML এর ভেতরের লিংক কনভার্ট করার ক্লাস
class AttributeRewriter {
  constructor(attributeName, proxyOrigin) {
    this.attributeName = attributeName;
    this.proxyOrigin = proxyOrigin;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (!attribute || attribute.startsWith('data:') || attribute.startsWith('blob:') || attribute.startsWith('#')) return;

    try {
      if (attribute.includes(TARGET_DOMAIN)) {
        const newAttr = attribute.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), this.proxyOrigin);
        element.setAttribute(this.attributeName, newAttr);
      } 
      else if (attribute.startsWith('http') && !attribute.includes(this.proxyOrigin)) {
        // Scoreboard বা অন্য এক্সটার্নাল লিংক হলে /ext-proxy/ যুক্ত করে দেওয়া
        element.setAttribute(this.attributeName, `${this.proxyOrigin}${PROXY_PREFIX}${attribute}`);
      }
    } catch (e) { }
  }
}
