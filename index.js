const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

// ========================================================
// ১. Firebase Memory Cache (স্পিড ফাস্ট রাখার জন্য)
// ========================================================
let cachedConfig = null;
let lastFetchTime = 0;

async function getAppConfig() {
    if (cachedConfig && (Date.now() - lastFetchTime < 60000)) return cachedConfig;
    let config = { logoUrl: '', loginBannerUrl: '', signupLink: '', targetUrls: ['https://tenx365x.live'], sliderImages: [], gameBanners: {} };
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const fsRes = await fetch(FIRESTORE_URL, { signal: controller.signal });
        clearTimeout(id);
        if (fsRes.ok) {
            const fsData = await fsRes.json();
            if (fsData?.fields) {
                if (fsData.fields.logoUrl) config.logoUrl = fsData.fields.logoUrl.stringValue;
                if (fsData.fields.loginBannerUrl) config.loginBannerUrl = fsData.fields.loginBannerUrl.stringValue;
                if (fsData.fields.signupLink) config.signupLink = fsData.fields.signupLink.stringValue;
                if (fsData.fields.targetUrls?.arrayValue?.values) config.targetUrls = fsData.fields.targetUrls.arrayValue.values.map(v => v.stringValue);
                if (fsData.fields.sliderImages?.arrayValue?.values) config.sliderImages = fsData.fields.sliderImages.arrayValue.values.map(v => v.stringValue);
                if (fsData.fields.gameBanners?.mapValue?.fields) {
                    for (let k in fsData.fields.gameBanners.mapValue.fields) config.gameBanners[k] = fsData.fields.gameBanners.mapValue.fields[k].stringValue;
                }
            }
        }
        cachedConfig = config; lastFetchTime = Date.now();
    } catch (e) { if (cachedConfig) return cachedConfig; }
    return config;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const MY_DOMAIN = url.host;

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Max-Age": "86400" } });
        }

        if (url.pathname === '/api/live-status') {
            let conf = await getAppConfig();
            return new Response(JSON.stringify({ liveUrl: conf.targetUrls[0] }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        let config = await getAppConfig();
        let targetBase = new URL(config.targetUrls[0]);

        // ========================================================
        // ২. THE CLEAN TUNNEL (Scoreboard Fixer - No Login Page!)
        // ========================================================
        if (url.pathname.startsWith('/__tunnel__/')) {
            let actualUrl = request.url.substring(request.url.indexOf('/__tunnel__/') + 12);
            
            let tunnelHeaders = new Headers();
            // সার্ভারকে বোকা বানানোর জন্য একদম স্পেসিফিক হেডার
            tunnelHeaders.set('User-Agent', request.headers.get('User-Agent'));
            tunnelHeaders.set('Accept', '*/*');
            tunnelHeaders.set('Referer', targetBase.origin + '/'); // THE MAGIC KEY FOR 365CRIC
            tunnelHeaders.set('Origin', targetBase.origin);

            try {
                let tunnelRes = await fetch(actualUrl, { method: request.method, headers: tunnelHeaders, body: request.body });
                let newTunnelHeaders = new Headers(tunnelRes.headers);
                newTunnelHeaders.set('Access-Control-Allow-Origin', '*');
                newTunnelHeaders.delete('X-Frame-Options');
                newTunnelHeaders.delete('Content-Security-Policy');

                let type = tunnelRes.headers.get('content-type') || '';
                if (type.includes('text/html')) {
                    let text = await tunnelRes.text();
                    // আইফ্রেমের ভেতরের লিংকগুলো যেন টানেলেই থাকে
                    let parsedUrl = new URL(actualUrl);
                    let baseHtml = `<base href="/__tunnel__/${parsedUrl.protocol}//${parsedUrl.host}/">`;
                    text = text.replace(/<head>/i, `<head>\n${baseHtml}`);
                    return new Response(text, { status: tunnelRes.status, headers: newTunnelHeaders });
                }
                return new Response(tunnelRes.body, { status: tunnelRes.status, headers: newTunnelHeaders });
            } catch (e) {
                return new Response("Tunnel Error", { status: 502 });
            }
        }

        // ========================================================
        // ৩. Main Proxy & Live TV Router
        // ========================================================
        let reqTargetHost = request.headers.get('X-Proxy-Host') || targetBase.hostname;
        url.hostname = reqTargetHost;
        url.protocol = targetBase.protocol;

        let upstreamHeaders = new Headers();
        for (let [key, value] of request.headers.entries()) {
            let lowerKey = key.toLowerCase();
            if (lowerKey.startsWith('cf-') || lowerKey === 'host' || lowerKey === 'x-proxy-host') continue;
            upstreamHeaders.set(key, value);
        }

        upstreamHeaders.set('Host', reqTargetHost);
        upstreamHeaders.set('Referer', targetBase.origin + '/');
        upstreamHeaders.set('Origin', targetBase.origin);

        let clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
        upstreamHeaders.set('X-Forwarded-For', clientIP);
        upstreamHeaders.set('X-Real-IP', clientIP);

        if (request.headers.get("Upgrade") === "websocket") {
            let wsTarget = url.searchParams.get('__ws__');
            if (wsTarget) { url.hostname = wsTarget; url.searchParams.delete('__ws__'); }
            return fetch(url.toString(), { method: request.method, headers: upstreamHeaders });
        }

        let response;
        try {
            response = await fetch(url.toString(), { method: request.method, headers: upstreamHeaders, body: request.body, redirect: 'manual' });
        } catch (e) { return new Response("Server Down", { status: 502 }); }

        let newHeaders = new Headers(response.headers);
        if (newHeaders.has('location')) newHeaders.set('location', newHeaders.get('location').replaceAll(reqTargetHost, MY_DOMAIN));
        newHeaders.delete('Content-Security-Policy');
        newHeaders.delete('X-Frame-Options');
        newHeaders.set('Access-Control-Allow-Origin', '*');

        if (response.headers.has('set-cookie')) {
            const cookies = response.headers.getSetCookie();
            newHeaders.delete('set-cookie');
            for (let cookie of cookies) {
                let fixedCookie = cookie.replace(/domain=[^;]+;?/gi, '').replace(/SameSite=[^;]+;?/gi, '') + '; SameSite=None; Secure; Path=/';
                newHeaders.append('set-cookie', fixedCookie);
            }
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/') && !contentType.includes('application/javascript') && !contentType.includes('application/json')) {
            return new Response(response.body, { status: response.status, headers: newHeaders });
        }

        if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
            let text = await response.text();
            text = text.replace(/integrity="[^"]+"/gi, '');

            const blankSvg = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20348%20145%22%3E%3C%2Fsvg%3E';

            // Logo & Banners Fix
            let finalLoginBanner = (config.loginBannerUrl && config.loginBannerUrl.trim() !== '') ? config.loginBannerUrl : blankSvg;
            if (config.logoUrl) {
                text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/(class="top-logo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
                text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:logo|Logo)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return config.logoUrl.replace(/\//g, '\\/'); return config.logoUrl; });
            }
            text = text.replace(/(id="poupppLogo"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/(class="[^"]*login-head[^"]*"[^>]*src=")([^"]+)(")/gi, `$1${finalLoginBanner}$3`);
            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:\\\/|\/)[^"']*(?:MloginImage)[^"'\\]*/gi, (match) => { if (match.includes('\\/')) return finalLoginBanner.replace(/\//g, '\\/'); return finalLoginBanner; });

            text = text.replace(new RegExp(targetBase.hostname, 'gi'), MY_DOMAIN);
            text = text.replace(new RegExp(targetBase.hostname.replace(/\./g, '\\\\.'), 'gi'), MY_DOMAIN.replace(/\./g, '\\.'));

            const isHtml = contentType.includes('text/html');
            const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');
            
            if (isHtml) {
                // ========================================================
                // ৪. THE ULTIMATE FRONTEND INTERCEPTOR (Restored & Perfected)
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
                      var targetHost = "${targetBase.hostname}";
                      var proxyHost = window.location.host;

                      // 1. Iframe Scoreboard Redirector (The 365cric.com bypass)
                      var observer = new MutationObserver(function(mutations) {
                          mutations.forEach(function(m) {
                              if (m.type === 'childList') {
                                  m.addedNodes.forEach(function(node) {
                                      if (node.tagName === 'IFRAME') {
                                          let src = node.getAttribute('src');
                                          if (src && !src.includes(proxyHost) && src.startsWith('http')) {
                                              node.setAttribute('src', '/__tunnel__/' + src);
                                          }
                                      } else if (node.querySelectorAll) {
                                          node.querySelectorAll('iframe').forEach(ifr => {
                                              let src = ifr.getAttribute('src');
                                              if (src && !src.includes(proxyHost) && src.startsWith('http')) {
                                                  ifr.setAttribute('src', '/__tunnel__/' + src);
                                              }
                                          });
                                      }
                                  });
                              }
                          });
                      });
                      observer.observe(document.body, {childList: true, subtree: true});

                      // 2. Fetch & XHR Interceptor (Live TV Blob/HLS Fix)
                      var origFetch = window.fetch;
                      window.fetch = async function(...args) {
                          let reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : null);
                          let options = args[1] || {};
                          if (reqUrl) {
                              try {
                                  let u = new URL(reqUrl, window.location.origin);
                                  if (u.hostname.includes(targetHost)) {
                                      options.headers = options.headers || {};
                                      if (options.headers instanceof Headers) options.headers.set('X-Proxy-Host', u.hostname);
                                      else options.headers['X-Proxy-Host'] = u.hostname;
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
                              if (u.hostname.includes(targetHost)) {
                                  this._tHost = u.hostname; 
                                  u.hostname = proxyHost;
                                  url = u.toString();
                              }
                          } catch(e) {}
                          return origOpen.call(this, method, url, ...rest);
                      };
                      var origSend = XMLHttpRequest.prototype.send;
                      XMLHttpRequest.prototype.send = function(...args) {
                          if (this._tHost) this.setRequestHeader('X-Proxy-Host', this._tHost);
                          return origSend.apply(this, args);
                      };

                      // 3. WebSocket Interceptor
                      var OrigWS = window.WebSocket;
                      window.WebSocket = function(url, protocols) {
                          try {
                              let u = new URL(url);
                              if (u.hostname.includes(targetHost)) {
                                  u.searchParams.set('__ws__', u.hostname);
                                  u.hostname = proxyHost;
                                  url = u.toString();
                              }
                          } catch(e) {}
                          return protocols ? new OrigWS(url, protocols) : new OrigWS(url);
                      };

                      // Signup & Login Banners
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
                      
                      setInterval(function() {
                        document.querySelectorAll('#poupppLogo, img.login-head').forEach(function(img) { if (img.src !== forceLoginBannerUrl) img.src = forceLoginBannerUrl; });
                      }, 500);
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
