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
        const MY_DOMAIN = url.host; // ডাইনামিক ডোমেইন (পোর্ট সহ যদি থাকে)

        // ========================================================
        // ১. CORS & Preflight (API ব্লক ঠেকানোর জন্য)
        // ========================================================
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, x-requested-with",
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

                let requestHeaders = new Headers(request.headers);
                
                // ========================================================
                // ২. আল্টিমেট রিকোয়েস্ট স্পুফিং (Sports & API Authorization Fix)
                // ========================================================
                requestHeaders.set('Host', originUrlObj.host);
                requestHeaders.set('Origin', originUrlObj.origin);
                // Referer টাকে ডাইনামিক করা হলো যাতে অরিজিনাল সাইট বুঝতে না পারে
                requestHeaders.set('Referer', originUrlObj.origin + url.pathname + url.search);
                
                // প্রক্সির প্রমাণ মুছে ফেলা
                requestHeaders.delete('X-Forwarded-Host');
                requestHeaders.delete('X-Forwarded-Proto');
                requestHeaders.delete('X-Forwarded-For');
                requestHeaders.delete('CF-Connecting-IP');
                requestHeaders.delete('CF-Ray');
                requestHeaders.delete('CF-Visitor');

                // ========================================================
                // ৩. Powerful WebSocket Proxy (Live Score & Odds Fix)
                // ========================================================
                if (request.headers.get("Upgrade") === "websocket") {
                    return fetch(url.toString(), {
                        method: request.method,
                        headers: requestHeaders
                    });
                }

                let res = await fetchWithTimeout(url.toString(), {
                    method: request.method,
                    headers: requestHeaders,
                    body: request.body,
                    redirect: 'manual', // ডাইরেক্ট রিডাইরেক্ট ঠেকানো
                    timeout: 15000 
                });

                if (res.status < 500) { response = res; break; }
            } catch (err) {}
        }

        if (!response) return new Response("Error: Server Connection Failed.", { status: 502 });

        let newHeaders = new Headers(response.headers);
        
        // রিডাইরেক্ট ইউআরএল ফিক্স করা
        if (newHeaders.has('location')) {
            let location = newHeaders.get('location');
            newHeaders.set('location', location.replaceAll(originUrlObj.hostname, MY_DOMAIN));
        }

        // সিকিউরিটি হেডারগুলো রিমুভ করা (যাতে Iframe বা API ব্লক না করে)
        newHeaders.delete('Content-Security-Policy');
        newHeaders.delete('X-Frame-Options');
        newHeaders.delete('Strict-Transport-Security');
        newHeaders.delete('X-XSS-Protection');
        newHeaders.set('Access-Control-Allow-Origin', request.headers.get("Origin") || "*");
        newHeaders.set('Access-Control-Allow-Credentials', 'true');

        // ========================================================
        // ৪. Perfect Session/Cookie Management (লগআউট বা আনঅথোরাইজড হওয়া ঠেকানো)
        // ========================================================
        if (response.headers.has('set-cookie')) {
            const cookies = response.headers.getSetCookie();
            newHeaders.delete('set-cookie');
            for (let cookie of cookies) {
                // ডোমেইন ডিলিট করে দিচ্ছি যাতে ব্রাউজার শুধু প্রক্সি ডোমেইনেই কুকি সেভ করে
                let fixedCookie = cookie.replace(/domain=[^;]+;?/gi, ''); 
                // কুকির সিকিউরিটি বাইপাস
                fixedCookie = fixedCookie.replace(/SameSite=[^;]+;?/gi, '');
                fixedCookie = fixedCookie.replace(/Secure;?/gi, '');
                fixedCookie += '; Path=/'; // গ্লোবাল পাথ, সব পেইজে লগইন থাকবে
                newHeaders.append('set-cookie', fixedCookie);
            }
        }

        const contentType = response.headers.get('content-type') || '';

        // ========================================================
        // ৫. Deep Content Rewriting (HTML, JSON, JS এর ভেতর থেকে ডোমেইন গায়েব করা)
        // ========================================================
        if (contentType.includes('text/html') || 
            contentType.includes('application/javascript') || 
            contentType.includes('text/javascript') || 
            contentType.includes('application/json')) {
            
            let text = await response.text();
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

            // ========================================================
            // ৬. API/JSON এবং JS URL কনভার্সন (এটির জন্যই Sports Score ব্লক হয়)
            // ========================================================
            let originalHost = originUrlObj.host;
            let escapedHost = originalHost.replace(/\./g, '\\\\.'); 
            
            // নরমাল লিংক রিপ্লেস
            text = text.replaceAll(`https://${originalHost}`, `https://${MY_DOMAIN}`);
            text = text.replaceAll(`wss://${originalHost}`, `wss://${MY_DOMAIN}`);
            text = text.replaceAll(`//${originalHost}`, `//${MY_DOMAIN}`);
            
            // JSON/JS এর ভেতরের ব্যাকস্ল্যাশ যুক্ত লিংক রিপ্লেস (Super Important for APIs)
            text = text.replaceAll(`https:\\/\\/${escapedHost}`, `https:\\/\\/${MY_DOMAIN}`);
            text = text.replaceAll(`wss:\\/\\/${escapedHost}`, `wss:\\/\\/${MY_DOMAIN}`);

            // শুধু ডোমেইনের নাম যদি কোথাও একা থাকে
            text = text.replaceAll(`"${originalHost}"`, `"${MY_DOMAIN}"`);
            text = text.replaceAll(`'${originalHost}'`, `'${MY_DOMAIN}'`);

            return new Response(text, { status: response.status, statusText: response.statusText, headers: newHeaders });
        }

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
};
