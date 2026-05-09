export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // ব্রাউজারের কুকি চেক করা (সিকিউরিটি পিন দেওয়া আছে কি না)
    const cookieString = request.headers.get('Cookie') || '';
    const isAuthenticated = cookieString.includes('secure_auth=73829'); // আপনার গোপন পিন: 73829

    // ========================================================
    // 🛡️ পার্ট ১: ফেক ওয়েবসাইট (যাদের কাছে পিন নেই তাদের জন্য)
    // ========================================================
    if (!isAuthenticated) {
      const dummyHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tech News Daily</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            h1 { color: #0056b3; user-select: none; cursor: default; }
            p { font-size: 16px; }
          </style>
        </head>
        <body>
          <h1 id="secretTrigger">Global Tech Updates</h1>
          <p>Welcome to our technology blog. Today we are discussing the latest advancements in AI and web development. Stay tuned for more updates on upcoming mobile technologies.</p>
          <p>Nothing else to see here. Have a great day!</p>

          <script>
            // 🔥 হিডেন ট্রিক: হেডলাইনের ওপর টানা ৫ বার ক্লিক করলে পিন চাইবে
            let clickCount = 0;
            let timer;
            
            document.getElementById('secretTrigger').addEventListener('click', function() {
              clickCount++;
              clearTimeout(timer);
              
              timer = setTimeout(function() { clickCount = 0; }, 2000); // ২ সেকেন্ডের মধ্যে ৫ বার ক্লিক করতে হবে
              
              if(clickCount === 5) {
                let pin = prompt("System Override:");
                if(pin === "73829") { // সঠিক পিন
                  // ৩০ দিনের জন্য ব্রাউজারে লগইন কুকি সেভ করে দেওয়া হলো
                  document.cookie = "secure_auth=73829; path=/; max-age=" + (30*24*60*60);
                  window.location.reload(); // পেজ রিলোড করে আসল প্যানেলে নিয়ে যাবে
                } else {
                  alert("Access Denied!");
                  clickCount = 0;
                }
              }
            });
          </script>
        </body>
        </html>
      `;
      
      return new Response(dummyHTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // ========================================================
    // 🚀 পার্ট ২: আসল প্যানেল (সঠিক পিন দেওয়ার পর যা লোড হবে)
    // ========================================================
    const targetHost = 'ag.tenx365x.live';
    const targetUrl = 'https://' + targetHost + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    modifiedRequest.headers.set('Host', targetHost);
    // সিকিউরিটি বাইপাস করার জন্য অরিজিনাল আইপি এবং হেডার হাইড করা
    modifiedRequest.headers.delete('X-Requested-With');

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    const contentType = newResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      
      // HTMLRewriter দিয়ে ওয়েবসাইটের ফালতু জিনিস হাইড এবং অটোমেশন করা
      return new HTMLRewriter()
        .on("head", {
          element(el) {
            el.append(`
              <style>
                /* ওয়েবসাইটের মেনু ও অন্যান্য অপশন হাইড করা */
                header:not(.header), .login-head, #supportWrap, #loginMessage, h4 { display: none !important; }
                .marquee-box, .footer_info, #paginationList { display: none !important; }
                #menuItems > li { display: none !important; }
                
                /* শুধু আপনার কাঙ্ক্ষিত অপশনগুলো শো করা */
                #menuItems > li:has(#menu_downline_list), 
                #menuItems > li:has(#menu_banking),
                #menuItems > li.logout { 
                  display: block !important; 
                  float: left !important; 
                }
              </style>
            `, { html: true });
          }
        })
        .on("body", {
          element(el) {
            el.append(`
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  
                  // লগইন পেজের ডিজাইন নেটিভ করা (শুধু আইডি, পাসওয়ার্ড ও বাটন রাখা)
                  if(document.getElementById('loginBtn')) {
                    var dds = document.querySelectorAll('dl.form-login > dd');
                    for(var i=0; i<dds.length; i++) { dds[i].style.display='none'; }
                    
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
                    
                    document.body.style.setProperty('background-color', '#ffffff', 'important');
                    var form = document.querySelector('form[name="loginForm"]');
                    if(form) { form.style.marginTop = '40%'; }
                  }

                  // 🔥 অটো-লগআউট বন্ধ করার জন্য Keep-Alive সিগন্যাল
                  setInterval(function() {
                    fetch(window.location.origin + '/favicon.ico', { method: 'HEAD', cache: 'no-store' });
                  }, 180000); // প্রতি ৩ মিনিটে পিং করবে
                  
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
