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

                // ========================================================
                // ১. Total Header Sanitization (সার্ভারকে বোকা বানানোর মূল অস্ত্র)
                // ========================================================
                let requestHeaders = new Headers();
                
                // ক্লায়েন্টের অরিজিনাল হেডারগুলো ফিল্টার করে নিচ্ছি
                for (let [key, value] of request.headers.entries()) {
                    let lowerKey = key.toLowerCase();
                    // ক্লাউডফ্লেয়ার বা প্রক্সির কোনো চিহ্ন রাখা যাবে না
                    if (lowerKey.startsWith('cf-') || 
                        lowerKey.startsWith('x-forwarded-') || 
                        lowerKey === 'host' || 
                        lowerKey === 'origin' || 
                        lowerKey === 'referer' || 
                        lowerKey === 'sec-fetch-site') {
                        continue; 
                    }
                    requestHeaders.set(key, value);
                }

                // একদম অরিজিনাল সাইটের মতো রিকোয়েস্ট তৈরি করা হচ্ছে
                requestHeaders.set('Host', originUrlObj.hostname);
                requestHeaders.set('Origin', originUrlObj.origin);
                requestHeaders.set('Referer', originUrlObj.origin + url.pathname + url.search);
                requestHeaders.set('Sec-Fetch-Site', 'same-origin');

                // আপনার আসল আইপি সেট করা (সেশন ব্লক ঠেকানোর জন্য)
                let clientIP = request.headers.get('CF-Connecting-IP');
                if (clientIP) {
                    requestHeaders.set('X-Forwarded-For', clientIP);
                }

                if (request.headers.get("Upgrade") === "websocket") {
                    return fetch(url.toString(), {
                        method: request.method,
                        headers: requestHeaders
                    });
                }

                let res = await fetchWithTimeout(url.toString(), {
                    method: request.method,
                    headers: requestHeaders,
                    body: request.body, // POST/AJAX রিকোয়েস্ট বডি ঠিক রাখা হলো
                    redirect: 'manual',
                    timeout: 15000 
                });

                if (res.status < 500) { response = res; break; }
            } catch (err) {}
        }

        if (!response) return new Response("Error: Server Connection Failed.", { status: 502 });

        let newHeaders = new Headers(response.headers);
        
        if (newHeaders.has('location')) {
            let location = newHeaders.get('location');
            // সাবডোমেইন সহ রিডাইরেক্ট ফিক্স
            let redirectRegex = new RegExp(`https?://([a-zA-Z0-9-.]*\\.)?${originUrlObj.hostname.replace(/\./g, '\\.')}`, 'gi');
            newHeaders.set('location', location.replace(redirectRegex, `https://${MY_DOMAIN}`));
        }

        // ব্রাউজার সিকিউরিটি ক্লিয়ার করা
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
                // কুকির ডোমেইন পুরোপুরি মুছে ফেলা হলো
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
                let replacement = (config.gameBanners && config.gameBanners[keyword] && config.gameBanners[keyword].trim() !== '') 
                                  ? config.gameBanners[keyword] 
                                  : blankSvg; 
                if (match.includes('\\/')) return replacement.replace(/\//g, '\\/');
                return replacement;
            });

            text = text.replace(/https:(?:\\\/\\\/|\/\/)imagedelivery\.net(?:\\\/|\/)[^"']+(?:Slider|Banner|Promo|popup|Popup)[^"'\\]*/gi, (match) => {
                if (match.includes('\\/')) return blankSvg.replace(/\//g, '\\/');
                return blankSvg;
            });

            // ========================================================
            // ২. Wildcard Subdomain & Deep API Rewriting (The Main Fix)
            // ========================================================
            let baseHost = originUrlObj.hostname;
            let escapedHost = baseHost.replace(/\./g, '\\\\.');
            
            // এটি api.tenx365x.live, sports.tenx365x.live ইত্যাদি সব সাবডোমেইনকে আপনার ডোমেইনে কনভার্ট করবে
            let wildcardRegex = new RegExp(`https?://([a-zA-Z0-9-.]*\\.)?${escapedHost}`, 'gi');
            text = text.replace(wildcardRegex, `https://${MY_DOMAIN}`);

            let wildcardWssRegex = new RegExp(`wss?://([a-zA-Z0-9-.]*\\.)?${escapedHost}`, 'gi');
            text = text.replace(wildcardWssRegex, `wss://${MY_DOMAIN}`);

            let wildcardJsonRegex = new RegExp(`https?:\\\\/\\\\/([a-zA-Z0-9-.]*\\.)?${escapedHost}`, 'gi');
            text = text.replace(wildcardJsonRegex, `https:\\/\\/${MY_DOMAIN}`);

            // সাধারণ ডোমেইন নাম রিপ্লেস (URL ছাড়া শুধু নাম থাকলে)
            text = text.replaceAll(`"${baseHost}"`, `"${MY_DOMAIN}"`);
            text = text.replaceAll(`'${baseHost}'`, `'${MY_DOMAIN}'`);

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
                      
                      var observer = new MutationObserver(function() {
                        document.querySelectorAll('#poupppLogo, img.login-head').forEach(function(img) { if (img.src !== forceLoginBannerUrl) { img.src = forceLoginBannerUrl; } });
                      });
                      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
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
