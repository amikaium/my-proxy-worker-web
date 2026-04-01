const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

// ========================================================
// ১. Memory Cache (ওয়েবসাইট ফাস্ট এবং বাফারিং ফ্রি করার জন্য)
// ========================================================
let cachedConfig = null;
let lastFetchTime = 0;

async function getAppConfig() {
    // প্রতি ৬০ সেকেন্ডে একবার ফায়ারবেস চেক করবে, ফলে ভিডিও আর স্লো হবে না
    if (cachedConfig && (Date.now() - lastFetchTime < 60000)) {
        return cachedConfig;
    }
    
    let config = { logoUrl: '', loginBannerUrl: '', signupLink: '', targetUrls: ['https://tenx365x.live'], sliderImages: [], gameBanners: {} };
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const fsResponse = await fetch(FIRESTORE_URL, { signal: controller.signal });
        clearTimeout(id);
        
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
        cachedConfig = config;
        lastFetchTime = Date.now();
    } catch (e) {
        if (cachedConfig) return cachedConfig; // ফায়ারবেস ডাউন থাকলেও ক্যাশ থেকে সাইট চলবে
    }
    return config;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const MY_DOMAIN = url.host;

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

        if (url.pathname === '/api/live-status') {
            let config = await getAppConfig();
            return new Response(JSON.stringify({ liveUrl: config.targetUrls[0] }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        let config = await getAppConfig();
        let originUrlObj = new URL(config.targetUrls[0]);

        // ========================================================
        // ২. Dynamic Subdomain Router (Live TV & Video Streaming)
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
            response = await fetch(url.toString(), {
                method: request.method,
                headers: upstreamHeaders,
                body: request.body,
                redirect: 'manual'
            });
        } catch (err) {
            return new Response("Error: Target Server Down.", { status: 502 });
        }

        let newHeaders = new Headers(response.headers);
        if (newHeaders.has('location')) {
            let location = newHeaders.get('location');
            newHeaders.set('location', location.replaceAll(targetHostname, MY_DOMAIN));
        }

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

        // ========================================================
        // ৩. Media & Video Streaming Optimizer (ভিডিও স্পিড ১০০ গুণ ফাস্ট করবে)
        // ========================================================
        // যদি রিকোয়েস্টটি ভিডিও বা ইমেজ হয়, তাহলে কোনো প্রসেস ছাড়া সরাসরি ব্রাউজারে পাঠিয়ে দেওয়া হবে
        if (!contentType.includes('text/') && !contentType.includes('application/javascript') && !contentType.includes('application/json')) {
            return new Response(response.body, { status: response.status, headers: newHeaders });
        }

        // ========================================================
        // ৪. HTML & JS Rewriting
        // ========================================================
        if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
            let text = await response.text();
            text = text.replace(/integrity="[^"]+"/gi, '');

            const blankSvg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20348%20145%22%3E%3C%2Fsvg%3E';

            if (config.logoUrl) {
                text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/(class="top-logo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:logo|Logo)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return config.logoUrl.replace(/\//g, '\\/'); return config.logoUrl; });
            }

            let finalLoginBanner = (config.loginBannerUrl && config.loginBannerUrl.trim() !== '') ? config.loginBannerUrl : blankSvg;
            text = text.replace(/(id="poupppLogo"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/(class="[^"]*login-head[^"]*"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:MloginImage)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return finalLoginBanner.replace(/\//g, '\\/'); return finalLoginBanner; });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)tenx365\.live-([a-zA-Z0-9_-]+)\.webp(?:\\\/|\/)MainImage[^"'\\]*/gi, (match, keyword) => {
                let replacement = (config.gameBanners && config.gameBanners[keyword] && config.gameBanners[keyword].trim() !== '') ? config.gameBanners[keyword] : blankSvg; 
                if (match.includes('\\/')) return replacement.replace(/\//g, '\\/'); return replacement;
            });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:Slider|Banner|Promo|popup|Popup)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return blankSvg.replace(/\//g, '\\/'); return blankSvg; });

            let originalHost = originUrlObj.hostname;
            let escapedHost = originalHost.replace(/\./g, '\\\\.');
            
            // সাধারণ লিংক রিপ্লেস
            text = text.replace(new RegExp(originalHost, 'gi'), MY_DOMAIN);
            text = text.replace(new RegExp(escapedHost, 'gi'), MY_DOMAIN.replace(/\./g, '\\.'));

            const isHtml = contentType.includes('text/html');
            const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');
            
            if (isHtml) {
                // Scoreboard এর জন্য no-referrer পলিসি অ্যাড করা হলো
                text = text.replace(/<head>/i, `<head>\n<meta name="referrer" content="no-referrer">\n`);

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
                      var targetBase = "tenx365x.live";
                      var proxyHost = window.location.host;

                      // Scoreboard Iframe Protector (লগইন স্ক্রিন ফিক্স)
                      // থার্ড-পার্টি Iframe (যেমন 365cric.com) গুলোকে আমরা আর মডিফাই করবো না, সরাসরি চলতে দেব
                      var observer = new MutationObserver(function(mutations) {
                          mutations.forEach(function(m) {
                              if (m.type === 'childList') {
                                  m.addedNodes.forEach(function(node) {
                                      if (node.tagName === 'IFRAME') {
                                          node.setAttribute('referrerpolicy', 'no-referrer');
                                      } else if (node.querySelectorAll) {
                                          node.querySelectorAll('iframe').forEach(ifr => {
                                              ifr.setAttribute('referrerpolicy', 'no-referrer');
                                          });
                                      }
                                  });
                              }
                          });
                      });
                      observer.observe(document.body, {childList: true, subtree: true});

                      // Live TV Video Optimizer
                      var origFetch = window.fetch;
                      window.fetch = async function(...args) {
                          let reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : null);
                          let options = args[1] || {};
                          
                          if (reqUrl) {
                              try {
                                  let u = new URL(reqUrl, window.location.origin);
                                  // শুধু tenx365x এর সাবডোমেইনগুলোকে প্রক্সিতে টানবে, 365cric.com কে ধরবে না
                                  if (u.hostname.includes(targetBase)) {
                                      options.headers = options.headers || {};
                                      if (options.headers instanceof Headers) options.headers.set('X-Proxy-Target-Host', u.hostname);
                                      else options.headers['X-Proxy-Target-Host'] = u.hostname;
                                      
                                      u.hostname = proxyHost;
                                      reqUrl = u.toString();
                                  }
                              } catch(e) {}
                          }
                          
                          if (typeof args[0] === 'string') args[0] = reqUrl;
                          else if (args[0]) args[0] = new Request(reqUrl, { ...args[0], ...options });
                          return origFetch.apply(this, args);
                      };

                      var origOpen = XMLHttpRequest.prototype.open;
                      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                          try {
                              let u = new URL(url, window.location.origin);
                              if (u.hostname.includes(targetBase)) {
                                  this._targetHost = u.hostname; 
                                  u.hostname = proxyHost;
                                  url = u.toString();
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

                      var OrigWS = window.WebSocket;
                      window.WebSocket = function(url, protocols) {
                          try {
                              let u = new URL(url);
                              if (u.hostname.includes(targetBase)) {
                                  let realHost = u.hostname;
                                  u.hostname = proxyHost;
                                  u.searchParams.set('__ws_target__', realHost);
                                  url = u.toString();
                              }
                          } catch(e) {}
                          return protocols ? new OrigWS(url, protocols) : new OrigWS(url);
                      };

                      // Click Observer logic
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
