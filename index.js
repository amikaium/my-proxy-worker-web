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
        const MY_DOMAIN = url.hostname; 

        // ========================================================
        // ১. গ্লোবাল CORS বাইপাস (API এবং Sports Iframe ব্লক ঠেকানোর জন্য)
        // ========================================================
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
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

                let requestHeaders = new Headers(request.headers);
                
                // ========================================================
                // ২. আল্টিমেট রিকোয়েস্ট স্পুফিং (Sports Not Authorized Fix)
                // ========================================================
                requestHeaders.set('Host', originUrlObj.hostname);
                requestHeaders.set('Origin', originUrlObj.origin);
                requestHeaders.set('Referer', originUrlObj.origin + url.pathname + url.search);
                
                // ব্রাউজারের অরিজিনাল বিহেভিয়ার নকল করা হচ্ছে (Sec-Fetch)
                requestHeaders.set('Sec-Fetch-Site', 'same-origin');
                if (requestHeaders.has('Sec-Fetch-Mode') && requestHeaders.get('Sec-Fetch-Mode') === 'cors') {
                    requestHeaders.set('Sec-Fetch-Mode', 'cors');
                }

                // প্রক্সি সিগনেচার মুছে ফেলা হচ্ছে
                requestHeaders.delete('X-Forwarded-Host');
                requestHeaders.delete('X-Forwarded-Proto');
                requestHeaders.delete('X-Forwarded-For');
                requestHeaders.delete('CF-Connecting-IP');
                requestHeaders.delete('CF-Ray');

                // ========================================================
                // ৩. Advanced WebSocket Support (Sports Live Score Fix)
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
                    redirect: 'manual',
                    timeout: 15000 
                });

                if (res.status < 500) { response = res; break; }
            } catch (err) {}
        }

        if (!response) return new Response("Error: All target servers are down.", { status: 502 });

        let newHeaders = new Headers(response.headers);
        if (newHeaders.has('location')) {
            let location = newHeaders.get('location');
            newHeaders.set('location', location.replace(originUrlObj.hostname, MY_DOMAIN));
        }

        // সিকিউরিটি হেডার মুছে ফেলা হচ্ছে যাতে স্পোর্টস আইফ্রেম/এপিআই ব্লক না হয়
        newHeaders.delete('Content-Security-Policy');
        newHeaders.delete('X-Frame-Options');
        newHeaders.delete('Strict-Transport-Security');
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Credentials', 'true');

        // ========================================================
        // ৪. Aggressive Cookie Stripping (লগ-ইন ও অথোরাইজেশন ফিক্স)
        // ========================================================
        if (response.headers.has('set-cookie')) {
            const cookies = response.headers.getSetCookie();
            newHeaders.delete('set-cookie');
            for (let cookie of cookies) {
                let fixedCookie = cookie.replace(/domain=[^;]+;?/gi, ''); 
                fixedCookie = fixedCookie.replace(/SameSite=[^;]+;?/gi, '');
                // Path=/ অ্যাড করা হয়েছে যাতে ওয়েবসাইটের যেকোনো পেইজে কুকি কাজ করে
                fixedCookie += '; SameSite=None; Secure; Path=/'; 
                newHeaders.append('set-cookie', fixedCookie);
            }
        }

        const contentType = response.headers.get('content-type') || '';

        // ========================================================
        // ৫. Deep URL Forging (HTML, JS, এবং JSON এর ভেতর থেকে ডোমেইন রিমুভ)
        // ========================================================
        if (contentType.includes('text/html') || contentType.includes('application/javascript') || contentType.includes('application/json')) {
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

            // HTML এর জন্য কাস্টম স্ক্রিপ্ট
            const isHtml = contentType.includes('text/html');
            const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');
            
            if (isHtml) {
                text = text.replace(/<head>/i, `<head>\n<meta name="referrer" content="no-referrer">\n`);

                const scriptInjection = `
                  <style>
                    #signupButton, .btn-signup {
                       display: inline-block !important;
                       ${isSignupDisabled ? `opacity: 0.5 !important; cursor: not-allowed !important;` : `opacity: 1 !important; cursor: pointer !important;`}
                    }
                    
                    #poupppLogo, img.login-head {
                       content: url("${finalLoginBanner}") !important;
                       ${(!config.loginBannerUrl || config.loginBannerUrl.trim() === '') ? `background: transparent !important; box-shadow: none !important;` : ''}
                    }

                    #carouselExampleControls, .carousel.slide { display: none !important; visibility: hidden !important; }
                    #my-custom-slider { width: 100%; height: 100%; position: relative; z-index: 1; overflow: hidden; margin-top: 2px; }
                    .slider-track { display: flex; height: 100%; transition: transform 0.5s ease-in-out; width: 100%; }
                    .slider-track img { width: 100%; height: 100%; flex-shrink: 0; display: block; object-fit: fill; }
                  </style>
                  
                  <script>
                    (function() {
                      var customLink = "${config.signupLink}";
                      var sliderImages = ${JSON.stringify(config.sliderImages || [])};
                      var forceLoginBannerUrl = "${finalLoginBanner}";

                      document.addEventListener('click', function(e) {
                        var target = e.target;
                        var isSignupClick = false;
                        while(target && target !== document) {
                          if (target.id === 'signupButton' || (target.className && typeof target.className === 'string' && target.className.includes('btn-signup'))) {
                            isSignupClick = true; break;
                          }
                          target = target.parentNode;
                        }
                        if (isSignupClick) {
                          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                          if (customLink && customLink.trim() !== '') { window.location.href = customLink; } 
                          return false; 
                        }
                      }, true);

                      var observer = new MutationObserver(function() {
                        var loginImgs = document.querySelectorAll('#poupppLogo, img.login-head');
                        loginImgs.forEach(function(img) {
                          if (img.src !== forceLoginBannerUrl) {
                              img.src = forceLoginBannerUrl;
                          }
                        });

                        if (sliderImages && sliderImages.length > 0) {
                          var originalSlider = document.querySelector('#carouselExampleControls') || document.querySelector('.carousel.slide');
                          if (originalSlider && !document.getElementById('my-custom-slider')) {
                            var customContainer = document.createElement('div');
                            customContainer.id = 'my-custom-slider';
                            customContainer.className = 'carousel';
                            var track = document.createElement('div');
                            track.className = 'slider-track';

                            sliderImages.forEach(function(imgUrl) {
                              var img = document.createElement('img');
                              img.src = imgUrl;
                              track.appendChild(img);
                            });
                            customContainer.appendChild(track);

                            if (sliderImages.length > 1) {
                              var prevBtn = document.createElement('button');
                              prevBtn.className = 'carousel-control-prev';
                              prevBtn.type = 'button';
                              prevBtn.style.zIndex = '10'; prevBtn.style.border = 'none'; prevBtn.style.background = 'transparent';
                              prevBtn.innerHTML = '<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>';
                              
                              var nextBtn = document.createElement('button');
                              nextBtn.className = 'carousel-control-next';
                              nextBtn.type = 'button';
                              nextBtn.style.zIndex = '10'; nextBtn.style.border = 'none'; nextBtn.style.background = 'transparent';
                              nextBtn.innerHTML = '<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>';

                              customContainer.appendChild(prevBtn); customContainer.appendChild(nextBtn);

                              var currentIdx = 0; var slideInterval;
                              function goToSlide(idx) {
                                  currentIdx = idx;
                                  if (currentIdx < 0) currentIdx = sliderImages.length - 1;
                                  if (currentIdx >= sliderImages.length) currentIdx = 0;
                                  track.style.transform = 'translateX(-' + (currentIdx * 100) + '%)';
                              }
                              function startAutoSlide() { slideInterval = setInterval(function() { goToSlide(currentIdx + 1); }, 3000); }

                              prevBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); clearInterval(slideInterval); goToSlide(currentIdx - 1); startAutoSlide(); };
                              nextBtn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); clearInterval(slideInterval); goToSlide(currentIdx + 1); startAutoSlide(); };
                              startAutoSlide();
                            }
                            originalSlider.parentNode.insertBefore(customContainer, originalSlider);
                          }
                        }
                      });
                      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
                    })();
                  </script>
                </body>`;
                text = text.replace(/<\/body>/i, scriptInjection);
            }

            // ========================================================
            // ৬. API/JSON URL কনভার্সন (এটির জন্যই Sports Score ব্লক হয়)
            // ========================================================
            // সকল ডোমেইন রেফারেন্স কে প্রক্সি ডোমেইন দিয়ে রিপ্লেস করা
            text = text.replaceAll(originUrlObj.hostname, MY_DOMAIN);
            // JSON বা JS এর ভেতরের ব্যাকস্ল্যাশ যুক্ত ডোমেইন রিপ্লেস
            text = text.replace(new RegExp(originUrlObj.hostname.replace(/\./g, '\\\\.'), 'g'), MY_DOMAIN);

            return new Response(text, { status: response.status, statusText: response.statusText, headers: newHeaders });
        }

        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }
};
