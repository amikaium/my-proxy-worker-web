export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // আপনার মূল ওয়েবসাইটের লিংক
    const targetHost = 'ag.tenx365x.live';
    const targetUrl = 'https://' + targetHost + url.pathname + url.search;

    // ওয়েবসাইটের সার্ভারকে ধোঁকা দেওয়ার জন্য হেডার মডিফাই করা
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    // অ্যাপের পরিচয় গোপন করা এবং অরিজিনাল হোস্ট সেট করা
    modifiedRequest.headers.set('Host', targetHost);
    modifiedRequest.headers.delete('X-Requested-With');

    // ওয়েবসাইট থেকে ডেটা ফেচ করা
    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    // ==========================================
    // 🔥 HTMLRewriter: পার্মানেন্ট হাইড এবং অটোমেশন ম্যাজিক
    // ==========================================
    class DocumentHandler {
      element(element) {
        // এই স্ক্রিপ্টটি সার্ভার থেকে আসার সময়ই পেজের সাথে যুক্ত হয়ে যাবে
        element.append(`
          <style>
            /* ১. অপ্রয়োজনীয় সব সেকশন সার্ভার-সাইড থেকেই হাইড করা */
            header, .login-head, #supportWrap, #loginMessage, h4 { display: none !important; }
            dl.form-login > dd { display: none !important; }
            body { background-color: #ffffff !important; }
          </style>

          <script>
            document.addEventListener('DOMContentLoaded', function() {
              // ২. শুধুমাত্র আপনার প্রয়োজনীয় ৩টি জিনিস শো করানো
              if(document.getElementById('loginBtn')) {
                var targets = ['userid', 'password', 'loginBtn'];
                targets.forEach(function(id) {
                  var el = document.getElementById(id);
                  if(el) {
                    var parent = el.closest('dd');
                    if(parent) {
                      parent.style.display = (id === 'password') ? 'flex' : 'block';
                      parent.style.setProperty('display', parent.style.display, 'important');
                    }
                  }
                });
                
                // নেটিভ লুক দেওয়ার জন্য ফর্মটিকে মাঝে আনা
                var form = document.querySelector('form[name="loginForm"]');
                if(form) { form.style.marginTop = '40%'; }
              }
            });

            // ৩. 🔥 আল্টিমেট অ্যান্টি-লগআউট সিস্টেম (Keep-Alive)
            // এটি প্রতি ৩ মিনিট (১৮০,০০০ মিলি-সেকেন্ড) পর পর ব্যাকগ্রাউন্ডে সার্ভারকে একটি সাইলেন্ট রিকোয়েস্ট পাঠাবে।
            // ফলে সার্ভার মনে করবে ইউজার অ্যাকটিভ আছে এবং সিজন এক্সপায়ার করবে না।
            setInterval(function() {
              fetch(window.location.origin + '/favicon.ico', { method: 'HEAD', cache: 'no-store' });
            }, 180000);
          </script>
        `, { html: true });
      }
    }

    // রেসপন্স যদি HTML হয়, তবেই আমাদের ম্যাজিক কোড ইনজেক্ট করবে
    const contentType = newResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return new HTMLRewriter().on("body", new DocumentHandler()).transform(newResponse);
    }

    return newResponse;
  }
};
