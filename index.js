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

    // ১. গ্লোবাল ডোমেইন এবং কালার রিপ্লেসমেন্ট
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);
    body = body.replace(new RegExp(oldColor, 'gi'), myColor);
    
    // ২. সাইন আপ বাটন লিংক পরিবর্তন (Regex use করা হয়েছে যাতে সব ভেরিয়েশন পায়)
    body = body.replace(/href="\/exchange\/member\/Mobile\/Register[^"]*"/gi, `href="${signUpURL}"`);

    if (contentType.includes('text/html')) {
      const customStyles = `
      <style>
        /* ১. হেডার প্রিমিয়াম ডার্ক লিনিয়ার গ্রেডিয়েন্ট */
        header, .header-top, [class*="header"] {
          background: linear-gradient(180deg, #252525 0%, #000000 100%) !important;
          border-bottom: 0.5px solid ${myColor}44 !important;
        }

        /* ২. লগইন ও সাইন আপ বাটন কমন স্টাইল (Ultra-thin Shining Border) */
        .login-index.ui-link, .btn-signup, #signupButton {
          position: relative !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          border: none !important;
          border-radius: 4px !important;
          z-index: 1 !important;
          padding: 6px 15px !important;
          text-decoration: none !important;
          font-weight: 600 !important;
          color: white !important;
          visibility: visible !important;
        }

        /* সাইন আপ ও লগইন বাটনের ব্যাকগ্রাউন্ড */
        .login-index.ui-link { background: ${myColor} !important; }
        .btn-signup, #signupButton { background: #333 !important; }

        /* লগইন বাটনের বামে মানুষের আইকন */
        .login-index.ui-link::before {
          content: '';
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-right: 5px;
          background-color: white;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
        }

        /* ৩. চিকন শাইনিং বর্ডার এনিমেশন (0.5px to 1px thickness) */
        .login-index.ui-link::after, .btn-signup::after, #signupButton::after {
          content: '';
          position: absolute;
          inset: -150%;
          background: conic-gradient(from 0deg, transparent, ${myColor}, #ffffff, transparent 30%);
          animation: rotate-border 4s linear infinite;
          z-index: -1;
        }

        /* বাটনের ভেতরের মূল অংশ (বর্ডার যেন চিকন দেখায়) */
        .login-index.ui-link span, .btn-signup span {
          display: block;
          background: inherit;
          width: 100%;
          height: 100%;
          border-radius: 3px;
        }
        
        /* Inner fill to create the thin border effect */
        .login-index.ui-link, .btn-signup, #signupButton {
          box-shadow: inset 0 0 0 1px ${myColor} !important;
        }

        @keyframes rotate-border {
          100% { transform: rotate(360deg); }
        }

        /* ৪. "Play Now" এবং অন্যান্য ছোট ছোট সবুজ এলিমেন্ট ফিক্স */
        /* এটি স্ক্রিনশটে থাকা সেই সবুজ ট্রায়াঙ্গেল বা ব্যাকগ্রাউন্ড রিমুভ করবে */
        [style*="background-color: ${oldColor}"], 
        [style*="background: ${oldColor}"],
        .play-now-btn, .ui-btn-active, .active, .play-now::before, [class*="play"]::after {
          background-color: ${myColor} !important;
          background: ${myColor} !important;
          border-color: ${myColor} !important;
        }

        /* ইমেজ বা সুডো এলিমেন্টের মাধ্যমে আসা সবুজ কালার রিপ্লেস */
        div[class*="play-now"], a[class*="play-now"], .play-now-icon {
          filter: hue-rotate(150deg) saturate(1.5); /* এটি সবুজকে নীল করে দেবে */
        }

        svg path[fill="${oldColor}"], svg [fill="${oldColor}"] {
          fill: ${myColor} !important;
        }

        /* ৫. সাইন আপ বাটন ফিক্স */
        #signupButton {
            display: inline-flex !important;
            visibility: visible !important;
        }
      </style>
      `;
      body = body.replace('</head>', `${customStyles}</head>`);
    }

    const modifiedResponse = new Response(body, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.delete('content-security-policy');
    
    return modifiedResponse;
  }

  return response;
}
