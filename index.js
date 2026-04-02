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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ২. External Proxy (Scoreboard Iframe ও Video M3U8 এর জন্য)
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    return handleExternalProxy(request, url);
  }

  // ৩. Main Site Request
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

// এক্সটার্নাল রিকোয়েস্ট হ্যান্ডেলার
async function handleExternalProxy(request, url) {
  let targetUrlStr = url.searchParams.get('url'); // Base64 URL for iframes
  
  if (targetUrlStr) {
    // Iframe এর Base64 ডিকোড করা
    targetUrlStr = atob(targetUrlStr);
  } else {
    // Live TV / M3U8 এর জন্য পাথ ফিক্স (URL Normalization fix)
    targetUrlStr = url.pathname.replace(PROXY_PREFIX, '') + url.search;
    if (targetUrlStr.startsWith('https:/') && !targetUrlStr.startsWith('https://')) {
      targetUrlStr = targetUrlStr.replace('https:/', 'https://');
    }
  }

  if (!targetUrlStr.startsWith('http')) {
    return new Response('Invalid target URL', { status: 400 });
  }

  const targetUrl = new URL(targetUrlStr);
  const headers = new Headers(request.headers);
  
  // 365cric সার্ভারকে ধোঁকা দেওয়ার জন্য অরিজিনাল সাইটের নাম পাঠানো
  headers.set('Host', targetUrl.hostname);
  headers.set('Origin', TARGET_URL);
  headers.set('Referer', TARGET_URL + '/');
  headers.delete('X-Forwarded-For');
  headers.delete('CF-Connecting-IP');

  const response = await fetch(new Request(targetUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  }));

  return processResponse(response, url.origin, true, targetUrl);
}

// Response প্রসেসিং ও মডিফিকেশন
async function processResponse(response, proxyOrigin, isExternal, externalUrl) {
  const newHeaders = new Headers(response.headers);

  // Iframe ব্লক যেন না হয় সেজন্য সিকিউরিটি হেডার মুছে ফেলা
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

  // Live TV (M3U8) ফিক্স (যেহেতু এটি আগে কাজ করেছিল, তাই আগের নিয়মেই রাখা হলো)
  if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
    let text = await response.text();
    text = text.replace(/(https?:\/\/[^\s]+)/g, `${proxyOrigin}${PROXY_PREFIX}$1`);
    return new Response(text, { status: response.status, headers: newHeaders });
  }

  // HTML পেজ
  if (contentType.includes('text/html')) {
    let rewriter = new HTMLRewriter().on('head', {
      element(e) {
        // যদি এটি Scoreboard এর ভেতরের HTML হয়, তবে Base URL সেট করা
        // যাতে এর ভেতরের CSS/JS ফাইলগুলো কোনো এরর ছাড়াই 365cric থেকে লোড হয়
        if (isExternal && externalUrl) {
          e.prepend(`<base href="${externalUrl.origin}/">`, { html: true });
        }

        // মেইন পেজের Iframe ইন্টারসেপ্ট করার স্ক্রিপ্ট (Live TV কে ডিস্টার্ব করবে না)
        if (!isExternal) {
          e.append(`
            <script>
              (function() {
                const proxyPrefix = "${proxyOrigin}${PROXY_PREFIX}";
                
                function encodeIframeUrl(url) {
                  if (!url || url.includes(proxyPrefix) || url.startsWith('blob:') || url.startsWith('data:')) return url;
                  try {
                    const u = new URL(url, window.location.origin);
                    // শুধুমাত্র 365cric এর স্কোরবোর্ড Iframe প্রক্সি করবে
                    if (u.hostname.includes('365cric')) {
                      let hash = u.hash; // #/score1/35436387 অংশটুকু আলাদা করা
                      u.hash = ''; // এনকোড করার আগে Hash মুছে ফেলা
                      let base64 = btoa(u.href);
                      // প্রক্সির লিংকের শেষে Hash বসিয়ে দেওয়া যাতে Angular App কাজ করে
                      return proxyPrefix + "?url=" + base64 + hash;
                    }
                  } catch(e) {}
                  return url;
                }

                // Angular ডাইনামিক Iframe তৈরি করা ধরবে
                const observer = new MutationObserver(mutations => {
                  mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                      if (node.tagName === 'IFRAME' && node.src) {
                        const newSrc = encodeIframeUrl(node.src);
                        if (newSrc !== node.src) node.src = newSrc;
                      }
                    });
                  });
                });
                
                document.addEventListener("DOMContentLoaded", () => {
                   observer.observe(document.body, { childList: true, subtree: true });
                });

                const origSetAttr = Element.prototype.setAttribute;
                Element.prototype.setAttribute = function(name, value) {
                  if (name === 'src' && this.tagName === 'IFRAME') {
                    value = encodeIframeUrl(value);
                  }
                  return origSetAttr.call(this, name, value);
                };
              })();
            </script>
          `, { html: true });
        }
      }
    });

    // মেইন সাইটের লিংক কনভার্ট
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
      }
    } catch (e) { }
  }
}
