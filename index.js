const MY_DOMAIN = 'playpbu.com';
const FIRESTORE_PROJECT_ID = 'arfan-khan-e1f8f';
const COLLECTION_NAME = 'settings';
const DOCUMENT_ID = 'proxyConfig';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${DOCUMENT_ID}`;

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 3000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // API: লাইভ স্ট্যাটাস (অ্যাডমিন প্যানেলের জন্য)
    // ==========================================
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

    // ==========================================
    // মূল কনফিগারেশন এবং সাইট আনা
    // ==========================================
    let config = { 
        logoUrl: '', 
        signupLink: '', 
        targetUrls: ['https://tenx365x.live'],
        sliderImages: [] // নতুন: স্লাইডার ইমেজের জন্য
    };

    try {
      const fsResponse = await fetch(FIRESTORE_URL);
      if (fsResponse.ok) {
        const fsData = await fsResponse.json();
        if (fsData && fsData.fields) {
          if (fsData.fields.logoUrl) config.logoUrl = fsData.fields.logoUrl.stringValue;
          if (fsData.fields.signupLink) config.signupLink = fsData.fields.signupLink.stringValue;
          if (fsData.fields.targetUrls?.arrayValue?.values) {
            config.targetUrls = fsData.fields.targetUrls.arrayValue.values.map(v => v.stringValue);
          }
          if (fsData.fields.sliderImages?.arrayValue?.values) {
            config.sliderImages = fsData.fields.sliderImages.arrayValue.values.map(v => v.stringValue);
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
        requestHeaders.set('Host', originUrlObj.hostname);
        requestHeaders.set('Referer', target);
        requestHeaders.delete('Origin'); 

        let res = await fetchWithTimeout(url.toString(), {
          method: request.method,
          headers: requestHeaders,
          body: request.body,
          redirect: 'manual',
          timeout: 5000 
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
    
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('X-Frame-Options');

    const contentType = response.headers.get('content-type');
    
    if (contentType && (contentType.includes('text/html') || contentType.includes('application/javascript'))) {
      let text = await response.text();
      
      if (config.logoUrl) {
          text = text.replace(/(id="headLogo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
          text = text.replace(/(class="top-logo"[^>]*src=")([^"]+)(")/gi, `$1${config.logoUrl}$3`);
          text = text.replace(/https:\/\/imagedelivery\.net\/[^"']+/gi, (match) => {
              if(match.toLowerCase().includes('logo')) return config.logoUrl;
              return match;
          });
      }

      const isSignupDisabled = (!config.signupLink || config.signupLink.trim() === '');
      
      // =========================================================
      // React-সেফ ইনজেকশন (CSS + Capture Event + Slider Hijack)
      // =========================================================
      const scriptInjection = `
        <style>
          #signupButton, .btn-signup {
             display: inline-block !important;
             ${isSignupDisabled ? `opacity: 0.5 !important; cursor: not-allowed !important;` : ''}
          }
          /* মূল স্লাইডারগুলো লোড হওয়ার সাথে সাথে লুকিয়ে ফেলার ট্রিক */
          #carouselExampleControls .carousel-inner .carousel-item:not(.custom-slider) {
             display: none !important;
          }
        </style>
        <script>
          (function() {
            var customLink = "${config.signupLink}";
            var sliderImages = ${JSON.stringify(config.sliderImages)}; // অ্যাডমিন প্যানেলের ইমেজগুলো

            // ১. সাইন-আপ বাটন ক্লিক হাইজ্যাকার
            document.addEventListener('click', function(e) {
              var target = e.target;
              var isSignupClick = false;
              while(target && target !== document) {
                if (target.id === 'signupButton' || (target.className && typeof target.className === 'string' && target.className.includes('btn-signup'))) {
                  isSignupClick = true;
                  break;
                }
                target = target.parentNode;
              }
              if (isSignupClick) {
                e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                if (customLink && customLink.trim() !== '') { window.location.href = customLink; } 
                return false; 
              }
            }, true);

            // ২. স্লাইডার হাইজ্যাকার (MutationObserver দিয়ে)
            // React যখনই স্লাইডার লোড করবে, আমরা সেটা মুছে আমাদেরটা বসিয়ে দেবো
            var observer = new MutationObserver(function() {
              if (sliderImages && sliderImages.length > 0) {
                var carouselInner = document.querySelector('#carouselExampleControls .carousel-inner');
                // যদি স্লাইডার পাওয়া যায় এবং সেটাতে আমাদের ইমেজ না থাকে
                if (carouselInner && !carouselInner.dataset.hijacked) {
                  carouselInner.dataset.hijacked = "true"; // ট্যাগ করে দিলাম যাতে লুপ না হয়
                  carouselInner.innerHTML = ''; // মূল ইমেজগুলো ডিলিট!
                  
                  // আমাদের ইমেজগুলো বসানো
                  sliderImages.forEach(function(imgUrl, index) {
                    var itemDiv = document.createElement('div');
                    itemDiv.className = 'carousel-item custom-slider' + (index === 0 ? ' active' : '');
                    var img = document.createElement('img');
                    img.src = imgUrl;
                    img.className = 'd-block w-100';
                    itemDiv.appendChild(img);
                    carouselInner.appendChild(itemDiv);
                  });
                }
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });

          })();
        </script>
      </body>`;
      
      text = text.replace(/<\/body>/i, scriptInjection);
      text = text.replaceAll(originUrlObj.hostname, MY_DOMAIN);

      return new Response(text, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }

    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  }
};
