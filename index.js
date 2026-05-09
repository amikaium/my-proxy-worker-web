export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // আপনার অরিজিনাল ওয়েবসাইটের লিংক
    const targetHost = 'ag.tenx365x.live';
    const targetUrl = 'https://' + targetHost + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    // অ্যাপের পরিচয় গোপন করে ব্রাউজারের মতো রিকোয়েস্ট পাঠানো
    modifiedRequest.headers.set('Host', targetHost);
    modifiedRequest.headers.delete('X-Requested-With');

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    const contentType = newResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      
      return new HTMLRewriter()
        // ==========================================
        // 🎨 HEAD: CSS দিয়ে পেজ লোডের আগেই সব হাইড করা (No Flash)
        // ==========================================
        .on("head", {
          element(el) {
            el.append(`
              <style>
                /* --- ১. লগইন পেজের হিডেন আইটেম --- */
                header:not(.header), .login-head, #supportWrap, #loginMessage, h4 { display: none !important; }
                
                /* --- ২. ড্যাশবোর্ডের হিডেন আইটেম --- */
                /* ফুটার এবং দৌড়ানো নোটিশ (Marquee) হাইড করা */
                .marquee-box, .footer_info, #paginationList { display: none !important; }
                
                /* সব মেনু আইটেম ডিফল্টভাবে হাইড করা */
                #menuItems > li { display: none !important; }
                
                /* শুধুমাত্র আপনার দেওয়া নির্দিষ্ট মেনু এবং লগআউট বাটন শো করা */
                #menuItems > li:has(#menu_downline_list), 
                #menuItems > li:has(#menu_banking),
                #menuItems > li.logout { 
                  display: block !important; 
                  float: left !important; /* মেনুর ডিজাইন ঠিক রাখার জন্য */
                }
              </style>
            `, { html: true });
          }
        })
        // ==========================================
        // ⚙️ BODY: JavaScript দিয়ে ফর্ম কন্ট্রোল ও অটোমেশন
        // ==========================================
        .on("body", {
          element(el) {
            el.append(`
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  
                  // --- লগইন পেজের শুধুমাত্র ৩টি ইনপুট শো করা ---
                  if(document.getElementById('loginBtn')) {
                    
                    // ফর্মের সব <dd> বক্স হাইড করা
                    var dds = document.querySelectorAll('dl.form-login > dd');
                    for(var i=0; i<dds.length; i++) { dds[i].style.display='none'; }
                    
                    // শুধু কাঙ্ক্ষিত ৩টি বক্স দৃশ্যমান করা
                    var targets = ['userid', 'password', 'loginBtn'];
                    targets.forEach(function(id) {
                      var elem = document.getElementById(id);
                      if(elem) {
                        var parent = elem.closest('dd');
                        if(parent) {
                          parent.style.setProperty('display', (id === 'password') ? 'flex' : 'block', 'important');
                        }
                      }
                    });
                    
                    // লগইন পেজকে প্রফেশনাল সাদা লুক দেওয়া
                    document.body.style.setProperty('background-color', '#ffffff', 'important');
                    var form = document.querySelector('form[name="loginForm"]');
                    if(form) { form.style.marginTop = '40%'; }
                  }

                  // --- 🔥 আল্টিমেট অ্যান্টি-লগআউট (Keep-Alive) ---
                  // প্রতি ৩ মিনিট পর পর ব্যাকগ্রাউন্ডে সার্ভারকে পিং করবে, ফলে সেশন এক্সপায়ার হবে না
                  setInterval(function() {
                    fetch(window.location.origin + '/favicon.ico', { method: 'HEAD', cache: 'no-store' });
                  }, 180000); 
                  
                });
              </script>
            `, { html: true });
          }
        })
        .transform(newResponse);
    }

    return newResponse;
  }
};
