const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
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
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",
                }
            });
        }

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
            } catch (e) {}

            let liveUrl = null;
            for (let target of targetUrls) {
                try {
                    let res = await fetchWithTimeout(target, { method: 'GET', timeout: 2000 });
                    if (res.status < 500) { liveUrl = target; break; }
                } catch (e) {}
            }
            return new Response(JSON.stringify({ liveUrl: liveUrl }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        let config = { 
            logoUrl: '', loginBannerUrl: '', signupLink: '', targetUrls: ['https://tenx365x.live'], sliderImages: [], gameBanners: {} 
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
        } catch (e) {}

        let response = null;
        let originUrlObj = null;

        for (let target of config.targetUrls) {
            try {
                originUrlObj = new URL(target);
                url.hostname = originUrlObj.hostname;
                url.protocol = originUrlObj.protocol;

                let upstreamHeaders = new Headers();
                for (let [key, value] of request.headers.entries()) {
                    let lowerKey = key.toLowerCase();
                    if (lowerKey.startsWith('cf-') || lowerKey === 'host' || lowerKey === 'origin' || lowerKey === 'referer') {
                        continue; 
                    }
                    upstreamHeaders.set(key, value);
                }

                upstreamHeaders.set('Host', originUrlObj.hostname);
                
                let clientReferer = request.headers.get('Referer');
                if (clientReferer) {
                    let refUrl = new URL(clientReferer);
                    upstreamHeaders.set('Referer', originUrlObj.origin + refUrl.pathname + refUrl.search);
                } else {
                    upstreamHeaders.set('Referer', originUrlObj.origin + url.pathname + url.search);
                }

                if (request.headers.get('Origin')) {
                    upstreamHeaders.set('Origin', originUrlObj.origin);
                }

                let clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
                upstreamHeaders.set('X-Forwarded-For', clientIP);
                upstreamHeaders.set('X-Real-IP', clientIP);
                upstreamHeaders.set('Sec-Fetch-Site', 'same-origin');

                if (request.headers.get("Upgrade") === "websocket") {
                    return fetch(url.toString(), { method: request.method, headers: upstreamHeaders });
                }

                let res = await fetchWithTimeout(url.toString(), {
                    method: request.method,
                    headers: upstreamHeaders,
                    body: request.body,
                    redirect: 'manual',
                    timeout: 20000 
                });

                if (res.status < 500) { response = res; break; }
            } catch (err) {}
        }

        if (!response) return new Response("Error: Target Server Down or Unreachable.", { status: 502 });

        let newHeaders = new Headers(response.headers);
        if (newHeaders.has('location')) {
            let location = newHeaders.get('location');
            newHeaders.set('location', location.replaceAll(originUrlObj.hostname, MY_DOMAIN));
        }

        // সিকিউরিটি হেডারগুলো রিমুভ (নাহলে থার্ড-পার্টি স্পোর্টস ভিডিও ব্লক হবে)
        newHeaders.delete('Content-Security-Policy');
        newHeaders.delete('X-Frame-Options');
        newHeaders.delete('Strict-Transport-Security');
        newHeaders.delete('X-XSS-Protection');
        newHeaders.set('Access-Control-Allow-Origin', request.headers.get("Origin") || "*");
        newHeaders.set('Access-Control-Allow-Credentials', 'true');

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

        if (contentType.includes('text/html') || 
            contentType.includes('application/javascript') || 
            contentType.includes('text/javascript') || 
            contentType.includes('application/json')) {
            
            let text = await response.text();
            text = text.replace(/integrity="[^"]+"/gi, '');

            const blankSvg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20348%20145%22%3E%3C%2Fsvg%3E';

            if (config.logoUrl) {
                text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/(class="top-logo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:logo|Logo)[^"'\\]*/gi, (match) => {
                    if (match.includes('\\/')) return config.logoUrl.replace(/\//g, '\\/');
                    return config.logoUrl;
                });
            }

            let finalLoginBanner = (config.loginBannerUrl && config.loginBannerUrl.trim() !== '') ? config.loginBannerUrl : blankSvg;
            text = text.replace(/(id="poupppLogo"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/(class="[^"]*login-head[^"]*"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:MloginImage)[^"'\\]*/gi, (match) => {
                if (match.includes('\\/')) return finalLoginBanner.replace(/\//g, '\\/');
                return finalLoginBanner;
            });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)tenx365\.live-([a-zA-Z0-9_-]+)\.webp(?:\\\/|\/)MainImage[^"'\\]*/gi, (match, keyword) => {
                let replacement = (config.gameBanners && config.gameBanners[keyword] && config.gameBanners[keyword].trim() !== '') ? config.gameBanners[keyword] : blankSvg; 
                if (match.includes('\\/')) return replacement.replace(/\//g, '\\/');
                return replacement;
            });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:Slider|Banner|Promo|popup|Popup)[^"'\\]*/gi, (match) => {
                if (match.includes('\\/')) return blankSvg.replace(/\//g, '\\/');
                return blankSvg;
            });

            let originalHost = originUrlObj.host;
            let escapedHost = originalHost.replace(/\./g, '\\\\.');
            let escapedHost2 = originalHost.replace(/\./g, '%2E');

            text = text.replace(new RegExp(originalHost, 'gi'), MY_DOMAIN);
            text = text.replace(new RegExp(escapedHost, 'gi'), MY_DOMAIN.replace(/\./g, '\\.'));
            text = text.replace(new RegExp(escapedHost2, 'gi'), MY_DOMAIN.replace(/\./g, '%2E'));

            const isHtml = contentType.includes('text/html');
            const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');
            
            if (isHtml) {
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
                      var targetHost = "${originalHost}";
                      var proxyHost = window.location.host;

                      // ========================================================
                      // LIVE TV & SCOREBOARD FIXER (The Missing Magic)
                      // ========================================================
                      function fixExternalNode(node) {
                          if (node.tagName === 'IFRAME') {
                              // থার্ড-পার্টির কাছে আমাদের প্রক্সি ডোমেইন হাইড করা হচ্ছে
                              node.setAttribute('referrerpolicy', 'no-referrer');
                              
                              if (node.src) {
                                  try {
                                      var u = new URL(node.src);
                                      // যদি এটি থার্ড-পার্টি লাইভ টিভি বা স্কোরের লিংক হয়
                                      if (u.hostname !== proxyHost && !u.hostname.includes(targetHost)) {
                                          // ভিডিও লিংকের ভেতরে থাকা প্রক্সি ডোমেইনকে সরিয়ে আবার অরিজিনাল ডোমেইন বসানো হচ্ছে
                                          var fixedSrc = node.src.replace(new RegExp(proxyHost, 'gi'), targetHost);
                                          if (node.src !== fixedSrc) { 
                                              node.src = fixedSrc; 
                                          }
                                      }
                                  } catch(e) {}
                              }
                          }
                      }

                      var observer = new MutationObserver(function(mutations) {
                          mutations.forEach(function(mutation) {
                              mutation.addedNodes.forEach(function(node) {
                                  if (node.nodeType === 1) { 
                                      fixExternalNode(node);
                                      node.querySelectorAll('iframe').forEach(fixExternalNode);
                                  }
                              });
                          });
                      });
                      observer.observe(document.body, { childList: true, subtree: true });

                      window.addEventListener('DOMContentLoaded', function() {
                          document.querySelectorAll('iframe').forEach(fixExternalNode);
                      });

                      // Network Interceptors
                      var origFetch = window.fetch;
                      window.fetch = async function(...args) {
                          if (typeof args[0] === 'string') {
                              args[0] = args[0].replace(new RegExp(targetHost, 'gi'), proxyHost);
                          } else if (args[0] && args[0].url) {
                              args[0] = new Request(args[0].url.replace(new RegExp(targetHost, 'gi'), proxyHost), args[0]);
                          }
                          return origFetch.apply(this, args);
                      };

                      var origOpen = XMLHttpRequest.prototype.open;
                      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                          if (typeof url === 'string') {
                              url = url.replace(new RegExp(targetHost, 'gi'), proxyHost);
                          }
                          return origOpen.call(this, method, url, ...rest);
                      };

                      var OrigWS = window.WebSocket;
                      window.WebSocket = function(url, protocols) {
                          if (typeof url === 'string') {
                              url = url.replace(new RegExp(targetHost, 'gi'), proxyHost);
                          }
                          return protocols ? new OrigWS(url, protocols) : new OrigWS(url);
                      };

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
