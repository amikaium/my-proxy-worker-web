/**
 * Professional Reverse Proxy Worker - Final Stable Version
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

    // ১. গ্লোবাল ডোমেইন এবং কালার রিপ্লেসমেন্ট
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);
    body = body.replace(new RegExp(oldColor, 'gi'), myColor);
    body = body.replace(/%2314805E/gi, '%2356BBD9');

    if (contentType.includes('text/html')) {
      const customStyles = `
      <style>
        /* হেডার প্রিমিয়াম ডার্ক গ্রেডিয়েন্ট */
        header, .header-top {
          background: linear-gradient(180deg, #252525 0%, #000000 100%) !important;
          border-bottom: 0.5px solid ${myColor}44 !important;
        }

        /* লগইন বাটন - সলিড ডিজাইন উইথ আইকন */
        .login-index.ui-link {
          background: ${myColor} !important;
          color: #ffffff !important;
          border-radius: 4px !important;
          padding: 6px 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: bold !important;
        }
        .login-index.ui-link::before {
          content: '';
          display: inline-block;
          width: 15px; height: 15px;
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
          padding: 5px 14px !important;
          font-weight: bold !important;
          margin-right: 8px;
        }

        /* সমাধান ১: শুধুমাত্র হোমপেজের "Play Now" এর জন্য হেলানো ডিজাইন */
        /* এখানে `.marketbox` ক্লাস ব্যবহার করে নির্দিষ্ট করা হয়েছে */
        .marketbox dd, .game-list dd {
          background-image: none !important;
          background-color: ${myColor} !important;
          clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%) !important;
          padding-left: 10px !important;
        }

        /* সমাধান ২: ভেতরের পেইজে স্কোরবোর্ডের রঙ পরিবর্তন */
        /* এখানে `.odds-box` ক্লাস দিয়ে নির্দিষ্ট করা হয়েছে */
        .odds-box, .back-cell, [class*="back-"] {
          background-color: ${myColor} !important;
        }
        .odds-box span, .odds-box .odds, .back-cell span {
          color: #000 !important; /* লেখার রঙ কালো করা হলো যেন দেখা যায় */
        }
        
        /* সমাধান ৩: ইন-প্লে লিস্টের ভাঙা ডিজাইন ঠিক করা */
        .match-info, .ui-block-a, .ui-block-b, .match-row {
            background: transparent !important; /* অতিরিক্ত রঙ মুছে দেওয়া হলো */
        }
        
        /* বাকি সব সবুজ কালারকে আপনার কালার করা */
        .ui-btn-active, .active {
            background: ${myColor} !important;
        }
      </style>
      `;
      body = body.replace('</head>', `${customStyles}</head>`);

      const forceRedirectScript = `
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          const signupButton = document.querySelector('#signupButton, .btn-signup');
          if (signupButton) {
            signupButton.onclick = function(e) {
              e.preventDefault();
              window.location.href = "${signUpURL}";
            };
          }
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
