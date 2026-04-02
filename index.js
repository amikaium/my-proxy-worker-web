const TARGET_DOMAIN = 'tenx365x.live';
const TARGET_URL = 'https://' + TARGET_DOMAIN;
const PROXY_PREFIX = '/ext-proxy/';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const proxyOrigin = url.origin;

  // 1. Handle Preflight (CORS) Requests
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

  // 2. Handle External Proxied Requests (APIs, Iframes, Video chunks)
  if (url.pathname.startsWith(PROXY_PREFIX)) {
    return handleExternalProxy(request, url);
  }

  // 3. Handle Main Domain Requests
  url.hostname = TARGET_DOMAIN;
  const headers = new Headers(request.headers);
  
  // Forge headers for the origin
  headers.set('Host', TARGET_DOMAIN);
  if (headers.has('Origin')) headers.set('Origin', TARGET_URL);
  if (headers.has('Referer')) headers.set('Referer', TARGET_URL);

  // WebSocket support for live scores
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
  return processResponse(response, proxyOrigin);
}

// Function to handle 3rd-party APIs and Video Streams
async function handleExternalProxy(request, url) {
  // Extract the actual URL encoded in the proxy path
  const actualUrlStr = url.pathname.replace(PROXY_PREFIX, '') + url.search;
  
  if (!actualUrlStr.startsWith('http')) {
    return new Response('Invalid proxy URL', { status: 400 });
  }

  const actualUrl = new URL(actualUrlStr);
  const headers = new Headers(request.headers);
  
  // Crucial: Mask the proxy identity
  headers.set('Host', actualUrl.hostname);
  headers.set('Origin', TARGET_URL);       // Make it look like it's coming from main site
  headers.set('Referer', TARGET_URL + '/'); // Make it look like it's coming from main site
  
  // Remove headers that expose Cloudflare/Proxy IP
  headers.delete('X-Forwarded-For');
  headers.delete('CF-Connecting-IP');

  const modifiedRequest = new Request(actualUrl.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  });

  const response = await fetch(modifiedRequest);
  return processResponse(response, url.origin);
}

// Function to modify headers, HTML, and Video streams
async function processResponse(response, proxyOrigin) {
  const newHeaders = new Headers(response.headers);

  // Remove security restrictions that block iframes/scripts
  newHeaders.delete('X-Frame-Options');
  newHeaders.delete('Content-Security-Policy');
  newHeaders.delete('Report-To');
  newHeaders.delete('Clear-Site-Data');

  // Fix CORS for authenticated requests
  newHeaders.set('Access-Control-Allow-Origin', proxyOrigin);
  newHeaders.set('Access-Control-Allow-Credentials', 'true');

  // Modern Cookie handling (CF Workers now supports getSetCookie)
  const cookies = newHeaders.getSetCookie();
  if (cookies.length > 0) {
    newHeaders.delete('Set-Cookie');
    cookies.forEach(cookie => {
      // Strip domain restrictions from cookies so they save correctly on your domain
      let fixedCookie = cookie.replace(/Domain=[^;]+;/gi, '');
      newHeaders.append('Set-Cookie', fixedCookie);
    });
  }

  const contentType = response.headers.get('content-type') || '';

  // Handle M3U8 Video Streams (Rewrite inner chunks to go through proxy)
  if (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
    let text = await response.text();
    // Rewrite all http/https links in the m3u8 file
    text = text.replace(/(https?:\/\/[^\s]+)/g, `${proxyOrigin}${PROXY_PREFIX}$1`);
    return new Response(text, { status: response.status, headers: newHeaders });
  }

  // Handle HTML (Rewrite DOM and inject JS interceptor)
  if (contentType.includes('text/html')) {
    return new HTMLRewriter()
      .on('head', {
        element(e) {
          // Inject JS to intercept API fetches made by React/Vue/Vanilla JS
          e.append(`
            <script>
              (function() {
                const proxyPrefix = "${proxyOrigin}${PROXY_PREFIX}";
                const targetDomain = "${TARGET_DOMAIN}";
                
                function rewriteUrl(u) {
                  if (!u || u.startsWith('blob:') || u.startsWith('data:')) return u;
                  try {
                    let parsed = new URL(u, window.location.origin);
                    // If it's an external domain, route through proxy
                    if (parsed.hostname !== window.location.hostname && !parsed.hostname.includes(targetDomain)) {
                      return proxyPrefix + parsed.href;
                    }
                  } catch(e) {}
                  return u;
                }

                // Intercept Fetch API
                const originalFetch = window.fetch;
                window.fetch = async function() {
                  if (typeof arguments[0] === 'string') {
                    arguments[0] = rewriteUrl(arguments[0]);
                  } else if (arguments[0] instanceof Request) {
                    const newUrl = rewriteUrl(arguments[0].url);
                    arguments[0] = new Request(newUrl, arguments[0]);
                  }
                  return originalFetch.apply(this, arguments);
                };

                // Intercept XHR
                const originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                  arguments[1] = rewriteUrl(url);
                  return originalOpen.apply(this, arguments);
                };
              })();
            </script>
          `, { html: true });
        }
      })
      .on('[href]', new AttributeRewriter('href', proxyOrigin))
      .on('[src]', new AttributeRewriter('src', proxyOrigin))
      .on('[action]', new AttributeRewriter('action', proxyOrigin))
      .transform(new Response(response.body, {
        status: response.status,
        headers: newHeaders
      }));
  }

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}

// Universal Attribute Rewriter
class AttributeRewriter {
  constructor(attributeName, proxyOrigin) {
    this.attributeName = attributeName;
    this.proxyOrigin = proxyOrigin;
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName);
    if (!attribute || attribute.startsWith('data:') || attribute.startsWith('blob:') || attribute.startsWith('#')) return;

    try {
      // If it's the target domain, rewrite to relative
      if (attribute.includes(TARGET_DOMAIN)) {
        const newAttr = attribute.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), this.proxyOrigin);
        element.setAttribute(this.attributeName, newAttr);
      } 
      // If it's an external domain (like an iframe or external JS), route to ext-proxy
      else if (attribute.startsWith('http') && !attribute.includes(this.proxyOrigin)) {
        element.setAttribute(this.attributeName, `${this.proxyOrigin}${PROXY_PREFIX}${attribute}`);
      }
    } catch (e) {
      // Fail silently if URL parsing fails
    }
  }
}
