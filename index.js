const TARGET_DOMAIN = 'tenx365x.live';
const TARGET_URL = 'https://' + TARGET_DOMAIN;
const PROXY_PREFIX = '/p/';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // ১. CORS Preflight (সবকিছুর জন্য অ্যালাউ করা)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ২. External Proxy (Scoreboard Iframe এবং ৩য় পক্ষের API/Video এর জন্য)
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    // /p/ এর পরের মূল লিংকটি বের করে আনা
    const actualUrlStr = request.url.substring(request.url.indexOf(PROXY_PREFIX) + PROXY_PREFIX.length);
    
    if (!actualUrlStr.startsWith('http')) {
      return new Response('Invalid URL', { status: 400 });
    }
    
    const actualUrl = new URL(actualUrlStr);
    const headers = new Headers(request.headers);
    
    // ৩য় পক্ষের সার্ভারকে ধোঁকা দিয়ে মূল সাইটের নাম পাঠানো
    headers.set('Host', actualUrl.hostname);
    headers.set('Origin', TARGET_URL);
    headers.set('Referer', TARGET_URL + '/');
    headers.delete('X-Forwarded-For');
    headers.delete('CF-Connecting-IP');

    const modifiedReq = new Request(actualUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    });

    const response = await fetch(modifiedReq);
    return processResponse(response, proxyOrigin, true, actualUrlStr);
  }

  // ৩. Main Domain Request (tenx365x.live এর জন্য)
  url.hostname = TARGET_DOMAIN;
  const headers = new Headers(request.headers);
  headers.set('Host', TARGET_DOMAIN);
  if (headers.has('Origin')) headers.set('Origin', TARGET_URL);
  if (headers.has('Referer')) headers.set('Referer', TARGET_URL + '/');

  if (request.headers.get("Upgrade") === "websocket") {
    return fetch(url.toString(), { method: request.method, headers: headers });
  }

  const modifiedReq = new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual'
  });

  const response = await fetch(modifiedReq);
  return processResponse(response, proxyOrigin, false, request.url);
}

// রেসপন্স মডিফাই করার ফাংশন
async function processResponse(response, proxyOrigin, isExternal, originalUrlStr) {
  const newHeaders = new Headers(response.headers);
  
  // Iframe যেন ব্লক না হয়
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  newHeaders.set('Access-Control-Allow-Origin', '*');

  const cookies = newHeaders.getSetCookie();
  if (cookies && cookies.length > 0) {
    newHeaders.delete('Set-Cookie');
    cookies.forEach(cookie => {
      newHeaders.append('Set-Cookie', cookie.replace(/Domain=[^;]+;/gi, ''));
    });
  }

  const contentType = response.headers.get('content-type') || '';

  // Video Streaming (M3U8) লিংক রিপ্লেসমেন্ট
  if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
    let text = await response.text();
    text = text.replace(/(https?:\/\/[^\s]+)/g, `${proxyOrigin}${PROXY_PREFIX}$1`);
    return new Response(text, { status: response.status, headers: newHeaders });
  }

  // HTML পেজ মডিফিকেশন
  if (contentType.includes('text/html')) {
    let rewriter = new HTMLRewriter().on('head', {
      element(e) {
        // Iframe এর ভেতরের ফাইলগুলো যেন ঠিকমতো লোড হয়
        if (isExternal) {
          try {
            let u = new URL(originalUrlStr);
            e.prepend(`<base href="${u.origin}/">`, { html: true });
          } catch(err){}
        }

        // মাস্টার JS Injector (Live TV এবং Scoreboard উভয়ের জন্য)
        e.append(`
          <script>
            (function() {
              const proxyPrefix = "${proxyOrigin}${PROXY_PREFIX}";
              const targetDomain = "${TARGET_DOMAIN}";

              // লিংক প্রক্সিতে কনভার্ট করার ফাংশন
              function rewrite(url) {
                if (!url || typeof url !== 'string') return url;
                if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('javascript:')) return url;
                if (url.includes(proxyPrefix)) return url; // আগে থেকেই প্রক্সি করা থাকলে বাদ

                try {
                  const u = new URL(url, window.location.origin);
                  // যদি এক্সটার্নাল লিংক হয় (যেমন 365cric বা Video API)
                  if (u.hostname !== window.location.hostname && !u.hostname.includes(targetDomain)) {
                     return proxyPrefix + u.href;
                  }
                } catch(e) {}
                return url;
              }

              // ১. Fetch API Intercept (Live TV এর জন্য জরুরি)
              const origFetch = window.fetch;
              window.fetch = async function() {
                if (typeof arguments[0] === 'string') {
                  arguments[0] = rewrite(arguments[0]);
                } else if (arguments[0] instanceof Request) {
                  arguments[0] = new Request(rewrite(arguments[0].url), arguments[0]);
                }
                return origFetch.apply(this, arguments);
              };

              // ২. Ajax Intercept (Live TV এবং ডাটা লোডের জন্য জরুরি)
              const origOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                arguments[1] = rewrite(url);
                return origOpen.apply(this, arguments);
              };

              // ৩. Iframe তৈরি হওয়া Intercept (Scoreboard এর জন্য জরুরি)
              const origSetAttr = Element.prototype.setAttribute;
              Element.prototype.setAttribute = function(name, value) {
                if (name === 'src' && this.tagName === 'IFRAME') {
                  value = rewrite(value);
                }
                return origSetAttr.call(this, name, value);
              };

              // ৪. Angular ডায়নামিক Iframe Intercept
              const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                  m.addedNodes.forEach(node => {
                    if (node.tagName === 'IFRAME' && node.src) {
                      const newSrc = rewrite(node.src);
                      if (newSrc !== node.src) node.src = newSrc;
                    }
                  });
                });
              });
              document.addEventListener("DOMContentLoaded", () => {
                observer.observe(document.body, { childList: true, subtree: true });
              });

              // ৫. জাভাস্ক্রিপ্টে ফেইক Referrer সেট করা
              try {
                Object.defineProperty(document, 'referrer', { get: () => "https://" + targetDomain + "/" });
              } catch(e){}

            })();
          </script>
        `, { html: true });
      }
    });

    rewriter = rewriter
      .on('[href]', new AttributeRewriter('href', proxyOrigin, PROXY_PREFIX))
      .on('[src]', new AttributeRewriter('src', proxyOrigin, PROXY_PREFIX));

    return rewriter.transform(new Response(response.body, {
      status: response.status,
      headers: newHeaders
    }));
  }

  return new Response(response.body, { status: response.status, headers: newHeaders });
}

class AttributeRewriter {
  constructor(attributeName, proxyOrigin, proxyPrefix) {
    this.attributeName = attributeName;
    this.proxyOrigin = proxyOrigin;
    this.proxyPrefix = proxyPrefix;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (!attribute || attribute.startsWith('data:') || attribute.startsWith('blob:') || attribute.startsWith('#')) return;

    try {
      if (attribute.includes(TARGET_DOMAIN)) {
         element.setAttribute(this.attributeName, attribute.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), this.proxyOrigin));
      } else if (attribute.startsWith('http') && !attribute.includes(this.proxyOrigin)) {
         element.setAttribute(this.attributeName, `${this.proxyOrigin}${this.proxyPrefix}${attribute}`);
      }
    } catch (e) { }
  }
}
