/**
 * Professional Cloudflare Worker Proxy - Ultimate Edition
 */

const targetHost = 'tenx365x.live';
const myColor = '#56BBD9';      // আপনার থিম কালার
const oldColor = '#14805E';     // অরিজিনাল গ্রিন
const signUpLink = 'https://arfankhan.vip'; // সাইন আপ লিংক

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

    // ১. গ্লোবাল রিপ্লেসমেন্ট (ডোমেইন, কালার এবং সাইন আপ লিংক)
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);
    body = body.replace(new RegExp(oldColor, 'gi'), myColor);
    
    // সাইন আপ লিংকের হার্ডকোডেড পাথ পরিবর্তন
    body = body.replace(/href="\/exchange\/member\/Mobile\/Register[^"]*"/gi, `href="${signUpLink}"`);
    body = body.replace(/id="signupButton"/gi, `id="signupButton" href="${signUpLink}"`);

    if (contentType.includes('text/html')) {
      const customStyles = `
      <style>
        /* ১. হেডার প্রিমিয়াম ডার্ক লুক */
        header, .header-top, [class*="header"] {
          background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%) !important;
          border-bottom: 1px solid ${myColor}33 !important;
        }

        /* ২. সাইন আপ বাটন ভিজিবল ও কাস্টমাইজ */
        #signupButton, .btn-signup {
          display: inline-flex !important;
          visibility: visible !important;
          background: transparent !important;
          border: 1.5px solid ${myColor} !important;
          color: white !important;
          border-radius: 4px !important;
          padding: 5px 15px !important;
          text-decoration: none !important;
        }

        /* ৩. লগইন বাটন উইথ শাইনিং বর্ডার ও আইকন */
        .login-index.ui-link, .login-btn {
          position: relative;
          background: ${myColor} !important;
          color: white !important;
          z-index: 1;
          overflow: hidden;
          border-radius: 5px;
          border: none !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          padding: 6px 16px !important;
          font-weight: 600 !important;
        }

        /* লগইন টেক্সটের আগে মানুষের (User) আইকন */
        .login-index.ui-link::before {
          content: '';
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-right: 6px;
          background-color: white;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
        }

        /* প্রফেশনাল মুভিং বর্ডার এনিমেশন */
        .login-index.ui-link::after {
          content: '';
          position: absolute;
          inset: -2px;
          background: conic-gradient(from 0deg, transparent, ${myColor}, #ffffff, transparent 40%);
          animation: rotate-border 3s linear infinite;
          z-index: -1;
        }

        /* বাটনের ভেতরের সলিড কালার বজায় রাখা */
        .login-index.ui-link span, .login-index.ui-link {
          background: ${myColor} !important;
        }

        @keyframes rotate-border {
          100% { transform: rotate(360deg); }
        }

        /* ৪. সবুজ কালার পুরোপুরি রিমুভ করার মাস্টার রুল */
        [style*="background-color: ${oldColor}"], 
        [style*="background: ${oldColor}"],
        .ui-btn-active, .active-tab, .play-now-btn {
          background-color: ${myColor} !important;
          background: ${myColor} !important;
        }

        svg path[fill="${oldColor}"], svg [fill="${oldColor}"] {
          fill: ${myColor} !important;
        }

        /* ছোট ছোট সবুজ বর্ডার বা লাইন ফিক্স */
        div, span, a, section {
          border-color: ${myColor}33; 
        }
        
        .play-now { color: ${myColor} !important; }
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
