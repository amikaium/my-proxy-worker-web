/**
 * Professional Reverse Proxy Worker
 * Target: tenx365x.live
 */

const targetHost = 'tenx365x.live';
const myColor = '#56BBD9';      // আপনার আকাশী কালার
const oldColor = '#14805E';     // অরিজিনাল সবুজ কালার
const signUpURL = 'https://arfankhan.vip'; // সাইন আপ লিংক

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const actualHost = url.host;
  url.hostname = targetHost;

  const newHeaders = new Headers(request.headers);
  newHeaders.set('Host', targetHost);
  newHeaders.set('Referer', `https://${targetHost}/`);

  const response = await fetch(url.toString(), {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    redirect: 'follow'
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/html') || contentType.includes('text/css') || contentType.includes('application/javascript')) {
    let body = await response.text();

    // ১. গ্লোবাল ডোমেইন এবং হেক্স কালার রিপ্লেসমেন্ট
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);
    body = body.replace(new RegExp(oldColor, 'gi'), myColor);
    body = body.replace(/%2314805E/gi, '%2356BBD9'); // URL Encoded কালার রিপ্লেসমেন্ট

    if (contentType.includes('text/html')) {
      // ২. কাস্টম CSS (ডিজাইন এবং Play Now এর হেলানো শেপ ঠিক করার জন্য)
      const customStyles = `
      <style>
        /* হেডার প্রিমিয়াম ডার্ক লিনিয়ার গ্রেডিয়েন্ট */
        header, .header-top, [class*="header"] {
          background: linear-gradient(180deg, #252525 0%, #000000 100%) !important;
          border-bottom: 0.5px solid ${myColor}44 !important;
        }

        /* লগইন বাটন - সলিড ডিজাইন উইথ প্রিমিয়াম আইকন */
        .login-index.ui-link, .login-btn {
          background: ${myColor} !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 6px 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: bold !important;
          text-decoration: none !important;
        }

        /* লগইন বাটনের বামে মানুষের (User) আইকন */
        .login-index.ui-link::before {
          content: '';
          display: inline-block;
          width: 15px;
          height: 15px;
          margin-right: 6px;
          background-color: white;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
        }

        /* সাইন আপ বাটন - সলিড ক্লিন ডিজাইন */
        #signupButton, .btn-signup {
          display: inline-flex !important;
          visibility: visible !important;
          background-color: transparent !important;
          color: white !important;
          border: 1.5px solid ${myColor} !important;
          border-radius: 4px !important;
          padding: 6px 14px !important;
          text-decoration: none !important;
          font-weight: bold !important;
          align-items: center !important;
          justify-content: center !important;
          margin-right: 8px;
        }

        /* Play Now এর বাম দিকের হেলানো (Slanted) ডিজাইন তৈরি */
        dd {
          background-image: none !important; /* পুরনো ইমেজ মুছে দেওয়া হলো */
          background-color: ${myColor} !important; /* আপনার কালার দেওয়া হলো */
          clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%) !important; /* CSS দিয়ে হেলানো শেপ তৈরি */
          padding-left: 10px !important;
        }

        /* অন্যান্য যেকোনো সবুজের অবশিষ্টাংশ রিমুভ */
        [style*="background-color: ${oldColor}"], 
        [style*="background: ${oldColor}"],
        .play-now-btn, .ui-btn-active {
          background-color: ${myColor} !important;
          background: ${myColor} !important;
        }

        svg path[fill="${oldColor}"], svg [fill="${oldColor}"] {
          fill: ${myColor} !important;
        }
      </style>
      `;
      body = body.replace('</head>', `${customStyles}</head>`);

      // ৩. সাইন আপ বাটন ফোর্স রিডাইরেক্ট (জাভাস্ক্রিপ্ট ইনজেকশন)
      // সাইট নিজস্ব ইভেন্ট দিয়ে লিংক ব্লক করে দেয়, তাই এটা দিয়ে ফোর্স রিডাইরেক্ট করা হলো
      const forceRedirectScript = `
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          const signupButtons = document.querySelectorAll('#signupButton, .btn-signup, a[href*="Register"], a[href*="SignUp"]');
          
          signupButtons.forEach(button => {
            button.href = "${signUpURL}"; // লিংক চেঞ্জ
            button.target = "_self";
            
            // ক্লিক করলে যেন অন্য কোনো ইভেন্ট কাজ না করে সরাসরি আপনার লিংকে যায়
            button.addEventListener("click", function(e) {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = "${signUpURL}";
            }, true);
          });
        });
      </script>
      `;
      body = body.replace('</body>', `${forceRedirectScript}</body>`);
    }

    const modifiedResponse = new Response(body, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.delete('content-security-policy');
    
    return modifiedResponse;
  }

  return response;
}
