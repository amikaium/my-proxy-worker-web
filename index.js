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
        logoUrl: '', 
        signupLink: '', 
        targetUrls: ['https://tenx365x.live'],
        sliderImages: [] 
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
      // অনুভূমিক (Horizontal) স্লাইডার, ২ পিক্সেল মার্জিন ও অ্যারো
      // =========================================================
      const scriptInjection = `
        <style>
          #signupButton, .btn-signup {
             display: inline-block !important;
             ${isSignupDisabled ? `opacity: 0.5 !important; cursor: not-allowed !important;` : ''}
          }
          
          /* মূল স্লাইডার হাইড করা */
          #carouselExampleControls, .carousel.slide {
             display: none !important;
             visibility: hidden !important;
             height: 0 !important;
          }
          
          /* নতুন স্লাইডার কন্টেইনার */
          #my-custom-slider {
              width: 100%;
              position: relative;
              z-index: 99;
              overflow: hidden;
              margin: 2px 0; /* ওপরে এবং নিচে ২ পিক্সেল মার্জিন */
          }
          
          /* ইমেজের ট্র্যাক (ডানে-বামে সরার জন্য) */
          .slider-track {
              display: flex;
              transition: transform 0.5s ease-in-out;
              width: 100%;
          }
          
          .slider-track img {
              width: 100%;
              flex-shrink: 0;
              display: block;
              object-fit: cover;
          }

          /* নেভিগেশন অ্যারো (Arrows) ডিজাইন */
          .slider-arrow {
              position: absolute;
              top: 50%;
              transform: translateY(-50%);
              background-color: rgba(0, 0, 0, 0.4);
              color: white;
              border: none;
              cursor: pointer;
              width: 35px;
              height: 35px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              border-radius: 50%;
              z-index: 100;
              user-select: none;
              transition: background 0.3s;
          }
          .slider-arrow:hover { background-color: rgba(0, 0, 0, 0.8); }
          .slider-arrow.prev { left: 10px; }
          .slider-arrow.next { right: 10px; }
        </style>
        
        <script>
          (function() {
            var customLink = "${config.signupLink}";
            var sliderImages = ${JSON.stringify(config.sliderImages || [])};

            // সাইন-আপ বাটন ফিক্স
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

            // কাস্টম অনুভূমিক স্লাইডার তৈরি
            if (sliderImages && sliderImages.length > 0) {
              var observer = new MutationObserver(function() {
                var originalSlider = document.querySelector('#carouselExampleControls') || document.querySelector('.carousel.slide');
                
                if (originalSlider && !document.getElementById('my-custom-slider')) {
                  
                  var customContainer = document.createElement('div');
                  customContainer.id = 'my-custom-slider';

                  var track = document.createElement('div');
                  track.className = 'slider-track';

                  sliderImages.forEach(function(imgUrl) {
                    var img = document.createElement('img');
                    img.src = imgUrl;
                    track.appendChild(img);
                  });
                  
                  customContainer.appendChild(track);

                  // যদি ১টার বেশি ইমেজ থাকে, তবেই অ্যারো এবং অটো-স্লাইড কাজ করবে
                  if (sliderImages.length > 1) {
                    var prevBtn = document.createElement('button');
                    prevBtn.className = 'slider-arrow prev';
                    prevBtn.innerHTML = '&#10094;'; // Left Arrow (❮)
                    
                    var nextBtn = document.createElement('button');
                    nextBtn.className = 'slider-arrow next';
                    nextBtn.innerHTML = '&#10095;'; // Right Arrow (❯)

                    customContainer.appendChild(prevBtn);
                    customContainer.appendChild(nextBtn);

                    var currentIdx = 0;
                    var slideInterval;

                    function goToSlide(idx) {
                        currentIdx = idx;
                        if (currentIdx < 0) currentIdx = sliderImages.length - 1;
                        if (currentIdx >= sliderImages.length) currentIdx = 0;
                        track.style.transform = 'translateX(-' + (currentIdx * 100) + '%)';
                    }

                    function startAutoSlide() {
                        slideInterval = setInterval(function() {
                            goToSlide(currentIdx + 1);
                        }, 3000); // ৩ সেকেন্ড পর পর স্লাইড হবে
                    }

                    // অ্যারো বাটনে ক্লিক ইভেন্ট
                    prevBtn.onclick = function(e) {
                        e.preventDefault(); e.stopPropagation();
                        clearInterval(slideInterval);
                        goToSlide(currentIdx - 1);
                        startAutoSlide();
                    };

                    nextBtn.onclick = function(e) {
                        e.preventDefault(); e.stopPropagation();
                        clearInterval(slideInterval);
                        goToSlide(currentIdx + 1);
                        startAutoSlide();
                    };

                    startAutoSlide();
                  }

                  originalSlider.parentNode.insertBefore(customContainer, originalSlider);
                }
              });
              observer.observe(document.body, { childList: true, subtree: true });
            }

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
