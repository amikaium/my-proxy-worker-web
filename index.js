const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 25000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const MY_DOMAIN = url.hostname;

        // ========================================================
        // ১. গ্লোবাল CORS বাইপাস (API ব্লক ঠেকানোর জন্য)
        // ========================================================
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",
                }
            });
        }

        // লাইভ স্ট্যাটাস API (অ্যাডমিন প্যানেলের জন্য)
        if (url.pathname === '/api/live-status') {
            let targetUrls = [];
            try {
                const fsResponse = await fetch(FIRESTORE_URL);
                if (fsResponse.ok) {
                    const fsData = await fsResponse.json();
                    if (fsData?.fields?.targetUrls?.arrayValue?.values) {
                        targetUrls = fsData.fields.targetUrls.arrayValue.values.map(v => v.stringValue);
                    }
                }
            } catch (e) { }

            let liveUrl = null;
            for (let target of targetUrls) {
                try {
                    let res = await fetchWithTimeout(target, { method: 'GET', timeout: 2000 });
                    if (res.status < 500) { liveUrl = target; break; }
                } catch (e) { }
            }
            return new Response(JSON.stringify({ liveUrl: liveUrl }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ফায়ারবেস থেকে কনফিগারেশন লোড (ডিফল্ট টার্গেট 1xbdt.site)
        let config = {
            logoUrl: '', loginBannerUrl: '', signupLink: '', targetUrls: ['https://1xbdt.site'], sliderImages: [], gameBanners: {}
        };

        try {
            const fsResponse = await fetch(FIRESTORE_URL);
            if (fsResponse.ok) {
                const fsData = await fsResponse.json();
                if (fsData && fsData.fields) {
                    if (fsData.fields.logoUrl) config.logoUrl = fsData.fields.logoUrl.stringValue;
                    if (fsData.fields.loginBannerUrl) config.loginBannerUrl = fsData.fields.loginBannerUrl.stringValue;
                    if (fsData.fields.signupLink) config.signupLink = fsData.fields.signupLink.stringValue;
                    if (fsData.fields.targetUrls?.arrayValue?.values) config.targetUrls = fsData.fields.targetUrls.arrayValue.values.map(v => v.stringValue);
                    if (fsData.fields.sliderImages?.arrayValue?.values) config.sliderImages = fsData.fields.sliderImages.arrayValue.values.map(v => v.stringValue);
                    if (fsData.fields.gameBanners?.mapValue?.fields) {
                        let bMap = fsData.fields.gameBanners.mapValue.fields;
                        for (let k in bMap) { config.gameBanners[k] = bMap[k].stringValue; }
                    }
                }
            }
        } catch (e) { }

        let originUrlObj = new URL(config.targetUrls[0]);

        // ========================================================
        // ২. EXTERNAL IFRAME TUNNEL (Scoreboard Fixer)
        // ========================================================
        if (url.pathname.startsWith('/__ext__/')) {
            let parts = url.pathname.split('/');
            let proto = parts[2];
            let host = parts[3];
            let restPath = parts.slice(4).join('/');
            let targetExtUrl = `${proto}://${host}/${restPath}${url.search}`;

            let extHeaders = new Headers();
            for (let [key, value] of request.headers.entries()) {
                if (!key.toLowerCase().startsWith('cf-') && key.toLowerCase() !== 'host') {
                    extHeaders.set(key, value);
                }
            }

            extHeaders.set('Host', host);
            extHeaders.set('Referer', originUrlObj.origin + '/');
            extHeaders.set('Origin', originUrlObj.origin);

            let extRes = await fetchWithTimeout(targetExtUrl, {
                method: request.method,
                headers: extHeaders,
                body: request.body,
                redirect: 'follow',
                timeout: 20000
            });

            let outExtHeaders = new Headers(extRes.headers);
            outExtHeaders.set('Access-Control-Allow-Origin', '*');
            outExtHeaders.delete('X-Frame-Options');
            outExtHeaders.delete('Content-Security-Policy');

            let extType = extRes.headers.get('content-type') || '';
            if (extType.includes('text/html')) {
                let text = await extRes.text();
                let baseTag = `<base href="/__ext__/${proto}/${host}/">`;
                text = text.replace(/<head>/i, `<head>\n${baseTag}`);
                return new Response(text, { status: extRes.status, headers: outExtHeaders });
            }
            return new Response(extRes.body, { status: extRes.status, headers: outExtHeaders });
        }

        // ========================================================
        // ৩. DYNAMIC SUBDOMAIN ROUTER (Live TV & Data Fixer)
        // ========================================================
        let targetHostname = request.headers.get('X-Proxy-Target-Host') || originUrlObj.hostname;
        url.hostname = targetHostname;
        url.protocol = originUrlObj.protocol;

        let upstreamHeaders = new Headers();
        for (let [key, value] of request.headers.entries()) {
            let lowerKey = key.toLowerCase();
            if (lowerKey.startsWith('cf-') || lowerKey === 'host' || lowerKey === 'x-proxy-target-host') {
                continue;
            }
            upstreamHeaders.set(key, value);
        }

        upstreamHeaders.set('Host', targetHostname);
        upstreamHeaders.set('Referer', originUrlObj.origin + '/');
        upstreamHeaders.set('Origin', originUrlObj.origin);

        let clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
        upstreamHeaders.set('X-Forwarded-For', clientIP);
        upstreamHeaders.set('X-Real-IP', clientIP);

        if (request.headers.get("Upgrade") === "websocket") {
            let wsTarget = url.searchParams.get('__ws_target__');
            if (wsTarget) {
                url.hostname = wsTarget;
                url.searchParams.delete('__ws_target__');
            }
            return fetch(url.toString(), { method: request.method, headers: upstreamHeaders });
        }

        let response = null;
        try {
            response = await fetchWithTimeout(url.toString(), {
                method: request.method,
                headers: upstreamHeaders,
                body: request.body,
                redirect: 'follow',
                timeout: 25000
            });
        } catch (err) {
            return new Response("Error: Server Offline.", { status: 502 });
        }

        let newHeaders = new Headers(response.headers);
        newHeaders.delete('Content-Security-Policy');
        newHeaders.delete('X-Frame-Options');
        newHeaders.delete('Strict-Transport-Security');
        newHeaders.set('Access-Control-Allow-Origin', '*');

        if (response.headers.has('set-cookie')) {
            const cookies = response.headers.getSetCookie();
            newHeaders.delete('set-cookie');
            for (let cookie of cookies) {
                let fixedCookie = cookie.replace(/domain=[^;]+;?/gi, '');
                fixedCookie = fixedCookie.replace(/SameSite=[^;]+;?/gi, '');
                fixedCookie += '; SameSite=None; Secure; Path=/';
                newHeaders.append('set-cookie', fixedCookie);
            }
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('text/html') || contentType.includes('application/javascript')) {
            let text = await response.text();
            text = text.replace(/integrity="[^"]+"/gi, '');

            const blankSvg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20348%20145%22%3E%3C%2Fsvg%3E';

            // লোগো রিপ্লেস
            if (config.logoUrl) {
                text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/(class="top-logo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:logo|Logo)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return config.logoUrl.replace(/\//g, '\\/'); return config.logoUrl; });
            }

            // লগইন ব্যানার রিপ্লেস
            let finalLoginBanner = (config.loginBannerUrl && config.loginBannerUrl.trim() !== '') ? config.loginBannerUrl : blankSvg;
            text = text.replace(/(id="poupppLogo"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/(class="[^"]*login-head[^"]*"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:MloginImage)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return finalLoginBanner.replace(/\//g, '\\/'); return finalLoginBanner; });

            // গেম ব্যানার রিপ্লেস (নিখুঁত ও এরর-ফ্রি করা হয়েছে)
            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']+\.webp(?:\\\/|\/)MainImage[^"'\\]*/gi, (match) => {
                let replacement = blankSvg; 
                if (config.gameBanners) {
                    for (const key in config.gameBanners) {
                        if (match.includes(key) && config.gameBanners[key].trim() !== '') {
                            replacement = config.gameBanners[key];
                            break;
                        }
                    }
                }
                if (match.includes('\\/')) return replacement.replace(/\//g, '\\/'); return replacement;
            });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:Slider|Banner|Promo|popup|Popup)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return blankSvg.replace(/\//g, '\\/'); return blankSvg; });

            // বেসিক রিরাইট যাতে মেইন স্ট্রাকচার না ভাঙে
            text = text.replace(new RegExp(`https://${originUrlObj.hostname}`, 'gi'), `https://${MY_DOMAIN}`);

            const isHtml = contentType.includes('text/html');
            const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');

            if (isHtml) {
                text = text.replace(/<head>/i, `<head>\n<meta name="referrer" content="no-referrer">\n`);

                // ========================================================
                // ৪. THE GOD-MODE FRONTEND ENGINE (Iframe & Video Manager)
                // ========================================================
                const scriptInjection = `
              <style>
                #signupButton, .btn-signup { display: inline-block !important; ${isSignupDisabled ? `opacity: 0.5 !important; cursor: not-allowed !important;` : `opacity: 1 !important; cursor: pointer !important;`} }
                #poupppLogo, img.login-head { content: url("${finalLoginBanner}") !important; ${(!config.loginBannerUrl || config.loginBannerUrl.trim() === '') ? `background: transparent !important; box-shadow: none !important;` : ''} }
                #carouselExampleControls, .carousel.slide { display: none !important; visibility: hidden !important; }
                #my-custom-slider { width: 100%; height: 100%; position: relative; z-index: 1; overflow: hidden; margin-top: 2px; }
                .slider-track { display: flex; height: 100%; transition: transform 0.5s ease-in-out; width: 100%; }
                .slider-track img { width: 100%; height: 100%; flex-shrink: 0; display: block; object-fit: fill; }
              </style>
              <script>
                (function() {
                  // অটোমেটিক অরিজিনাল সার্ভারের নাম ট্র্যাক করবে
                  var targetBase = "${originUrlObj.hostname}";
                  var proxyHost = window.location.host;

                  // থার্ড-পার্টি Iframe (স্কোরবোর্ড) কে টানেলের ভেতর দিয়ে নেয়ার ফাংশন
                  function buildExtUrl(originalUrl) {
                      try {
                          let u = new URL(originalUrl);
                          if (!u.hostname.includes(targetBase) && u.hostname !== proxyHost) {
                              return window.location.origin + '/__ext__/' + u.protocol.replace(':','') + '/' + u.hostname + u.pathname + u.search;
                          }
                      } catch(e) {}
                      return originalUrl;
                  }

                  // Iframe Mutation Observer (স্কোরবোর্ড ফিক্স)
                  var observer = new MutationObserver(function(mutations) {
                      mutations.forEach(function(m) {
                          if (m.type === 'childList') {
                              m.addedNodes.forEach(function(node) {
                                  if (node.tagName === 'IFRAME') {
                                      let src = node.getAttribute('src');
                                      if (src && src.startsWith('http')) node.setAttribute('src', buildExtUrl(src));
                                  } else if (node.querySelectorAll) {
                                      node.querySelectorAll('iframe').forEach(ifr => {
                                          let src = ifr.getAttribute('src');
                                          if (src && src.startsWith('http')) ifr.setAttribute('src', buildExtUrl(src));
                                      });
                                  }
                              });
                          } else if (m.type === 'attributes' && m.attributeName === 'src' && m.target.tagName === 'IFRAME') {
                              let src = m.target.getAttribute('src');
                              if (src && src.startsWith('http') && !src.includes('__ext__')) {
                                  m.target.setAttribute('src', buildExtUrl(src));
                              }
                          }
                      });
                  });
                  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['src']});

                  // Fetch Interceptor (লাইভ টিভির সাবডোমেইন ফিক্স)
                  var origFetch = window.fetch;
                  window.fetch = async function(...args) {
                      let reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : null);
                      let options = args[1] || {};
                      if (reqUrl) {
                          try {
                              let u = new URL(reqUrl, window.location.origin);
                              if (u.hostname.includes(targetBase)) {
                                  options.headers = options.headers || {};
                                  if (options.headers instanceof Headers) options.headers.set('X-Proxy-Target-Host', u.hostname);
                                  else options.headers['X-Proxy-Target-Host'] = u.hostname;
                                  
                                  u.hostname = proxyHost;
                                  reqUrl = u.toString();
                              } else if (u.hostname !== proxyHost) {
                                  reqUrl = buildExtUrl(u.href);
                              }
                          } catch(e) {}
                      }
                      if (typeof args[0] === 'string') args[0] = reqUrl;
                      else if (args[0]) args[0] = new Request(reqUrl, { ...args[0], ...options });
                      return origFetch.apply(this, args);
                  };

                  // XHR Interceptor (ভিডিও স্ট্রিম ডাটা ফিক্স)
                  var origOpen = XMLHttpRequest.prototype.open;
                  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                      this._extUrl = url;
                      try {
                          let u = new URL(url, window.location.origin);
                          if (u.hostname.includes(targetBase)) {
                              this._targetHost = u.hostname; 
                              u.hostname = proxyHost;
                              url = u.toString();
                          } else if (u.hostname !== proxyHost) {
                              url = buildExtUrl(u.href);
                          }
                      } catch(e) {}
                      return origOpen.call(this, method, url, ...rest);
                  };
                  
                  var origSend = XMLHttpRequest.prototype.send;
                  XMLHttpRequest.prototype.send = function(...args) {
                      if (this._targetHost) {
                          this.setRequestHeader('X-Proxy-Target-Host', this._targetHost);
                      }
                      return origSend.apply(this, args);
                  };

                  // WebSocket Protocol Fix (নিখুঁত কানেকশন)
                  var OrigWS = window.WebSocket;
                  window.WebSocket = function(url, protocols) {
                      try {
                          let u = new URL(url);
                          if (u.hostname.includes(targetBase)) {
                              let realHost = u.hostname;
                              u.hostname = proxyHost;
                              u.searchParams.set('__ws_target__', realHost);
                              url = u.toString();
                          } else if (u.hostname !== proxyHost) {
                              url = 'wss://' + proxyHost + '/__ext__/wss/' + u.hostname + u.pathname + u.search;
                          }
                      } catch(e) {}
                      return protocols !== undefined ? new OrigWS(url, protocols) : new OrigWS(url);
                  };

                  // Custom Link
                  var customLink = "${config.signupLink}";
                  var forceLoginBannerUrl = "${finalLoginBanner}";
                  document.addEventListener('click', function(e) {
                    var target = e.target; var isSignupClick = false;
                    while(target && target !== document) {
                      if (target.id === 'signupButton' || (target.className && typeof target.className === 'string' && target.className.includes('btn-signup'))) {
                        isSignupClick = true; break;
                      } target = target.parentNode;
                    }
                    if (isSignupClick) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); if (customLink && customLink.trim() !== '') { window.location.href = customLink; } return false; }
                  }, true);
                  
                  var observerImages = new MutationObserver(function() {
                    document.querySelectorAll('#poupppLogo, img.login-head').forEach(function(img) { if (img.src !== forceLoginBannerUrl) { img.src = forceLoginBannerUrl; } });
                  });
                  observerImages.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
                })();
              </script>
            </body>`;
                text = text.replace(/<\/body>/i, scriptInjection);
            }

            return new Response(text, { status: response.status, statusText: response.statusText, headers: newHeaders });
        }

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
};
