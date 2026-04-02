const TARGET_DOMAIN = 'tenx365x.live';
const TARGET_URL = 'https://' + TARGET_DOMAIN;
const PROXY_PREFIX = '/ext-proxy/';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // ১. CORS Preflight
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

  // ২. External Proxy (365cric.com Scoreboard Iframe এর জন্য)
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    return handleExternalProxy(request, url);
  }

  // ৩. Main Domain Request
  url.hostname = TARGET_DOMAIN;
  const headers = new Headers(request.headers);
  
  headers.set('Host', TARGET_DOMAIN);
  if (headers.has('Origin')) headers.set('Origin', TARGET_URL);
  if (headers.has('Referer')) headers.set('Referer', TARGET_URL + '/');

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

// এক্সটার্নাল API এবং Scoreboard Iframe প্রক্সি ফাংশন
async function handleExternalProxy(request, url) {
  const actualUrlStr = url.pathname.replace(PROXY_PREFIX, '') + url.search;
  if (!actualUrlStr.startsWith('http')) {
    return new Response('Invalid proxy URL', { status: 400 });
  }

  const actualUrl = new URL(actualUrlStr);
  const headers = new Headers(request.headers);
  
  // সবচেয়ে গুরুত্বপূর্ণ: 365cric সার্ভারকে বোঝানো যে রিকোয়েস্ট মূল সাইট থেকে আসছে
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

// Response Modification
async function processResponse(response, proxyOrigin, isExternal, externalUrl) {
  const newHeaders = new Headers(response.headers);

  // Security headers রিমুভ যাতে Iframe ব্লক না হয়
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');

  newHeaders.set('Access-Control-Allow-Origin', proxyOrigin);
  newHeaders.set('Access-Control-Allow-Credentials', 'true');

  const cookies = newHeaders.getSetCookie();
  if (cookies && cookies.length > 0) {
    newHeaders.delete('Set-Cookie');
    cookies.forEach(cookie => {
      newHeaders.append('Set-Cookie', cookie.replace(/Domain=[^;]+;/gi, ''));
    });
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
    let text = await response.text();
    text = text.replace(/(https?:\/\/[^\s]+)/g, `${proxyOrigin}${PROXY_PREFIX}$1`);
    return new Response(text, { status: response.status, headers: newHeaders });
  }

  // HTML পেজে Advanced JS Inject করা
  if (contentType.includes('text/html')) {
    let rewriter = new HTMLRewriter().on('head', {
      element(e) {
        if (isExternal && externalUrl) {
          let baseUrl = `${externalUrl.origin}${externalUrl.pathname}`;
          if (!baseUrl.endsWith('/')) baseUrl += '/';
          e.prepend(`<base href="${proxyOrigin}${PROXY_PREFIX}${baseUrl}">`, { html: true });
        }

        // এই স্ক্রিপ্টটি Angular এর ডায়নামিক Iframe তৈরিকে ইন্টারসেপ্ট করবে
        e.append(`
          <script>
            (function() {
              const proxyPrefix = "${proxyOrigin}${PROXY_PREFIX}";
              
              function rewriteIframeUrl(url) {
                if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('javascript:')) return url;
                try {
                  // যদি লিংকটি 365cric.com এর হয়, তাহলে প্রক্সিতে কনভার্ট করো
                  if (url.includes('365cric.com')) {
                    if (url.startsWith('http')) return proxyPrefix + url;
                    if (url.startsWith('//')) return proxyPrefix + 'https:' + url;
                  }
                } catch(e) {}
                return url;
              }

              // ১. Intercept Iframe attribute changes (Angular uses this)
              const originalSetAttribute = Element.prototype.setAttribute;
              Element.prototype.setAttribute = function(name, value) {
                if (name === 'src' && this.tagName === 'IFRAME') {
                  value = rewriteIframeUrl(value);
                }
                return originalSetAttribute.call(this, name, value);
              };

              // ২. Intercept Iframe src property assignment
              const iframeDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
              if (iframeDesc) {
                Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
                  set: function(val) {
                    return iframeDesc.set.call(this, rewriteIframeUrl(val));
                  },
                  get: iframeDesc.get
                });
              }

              // ৩. Fallback: MutationObserver (যদি উপরোক্ত ২ টা পদ্ধতি ফেইল করে)
              const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                  mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'IFRAME' && node.src) {
                      const newSrc = rewriteIframeUrl(node.src);
                      if (newSrc !== node.src) node.src = newSrc;
                    }
                  });
                });
              });
              
              document.addEventListener("DOMContentLoaded", function() {
                 observer.observe(document.body, { childList: true, subtree: true });
              });

            })();
          </script>
        `, { html: true });
      }
    });

    rewriter = rewriter
      .on('[href]', new AttributeRewriter('href', proxyOrigin))
      .on('[src]', new AttributeRewriter('src', proxyOrigin));

    return rewriter.transform(new Response(response.body, {
      status: response.status,
      headers: newHeaders
    }));
  }

  return new Response(response.body, { status: response.status, headers: newHeaders });
}

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
        element.setAttribute(this.attributeName, attribute.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), this.proxyOrigin));
      } else if (attribute.includes('365cric.com') && attribute.startsWith('http')) {
        element.setAttribute(this.attributeName, `${this.proxyOrigin}${PROXY_PREFIX}${attribute}`);
      }
    } catch (e) { }
  }
}
