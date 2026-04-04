/**
 * Professional Cloudflare Worker Proxy
 * Target: tenx365x.live
 */

const targetHost = 'tenx365x.live';
const myColor = '#56BBD9';      // আপনার নতুন কালার
const oldColor = '#14805E';     // অরিজিনাল সবুজ কালার

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

    // ১. ডোমেইন এবং কালার গ্লোবাল রিপ্লেসমেন্ট (নিখুঁতভাবে)
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);
    body = body.replace(new RegExp(oldColor, 'gi'), myColor);

    if (contentType.includes('text/html')) {
      const customStyles = `
      <style>
        /* ১. হেডার ডার্ক লিনিয়ার গ্রেডিয়েন্ট */
        header, .header-top, [class*="header"] {
          background: linear-gradient(180deg, #222222 0%, #000000 100%) !important;
          border-bottom: 1px solid ${myColor}55 !important;
        }

        /* ২. সাইন আপ বাটন ভিজিবল করা */
        #signupButton, .btn-signup {
          display: inline-flex !important;
          visibility: visible !important;
          background-color: transparent !important;
          border: 1px solid ${myColor} !important;
          color: white !important;
          margin-right: 8px;
        }

        /* ৩. প্রফেশনাল শাইনিং বর্ডার এনিমেশন (লগইন বাটন) */
        .login-index.ui-link, .login-btn {
          position: relative;
          background: ${myColor} !important;
          color: white !important;
          z-index: 1;
          overflow: hidden;
          padding: 2px; /* বর্ডারের থিকনেস */
          border-radius: 5px;
          border: none !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
        }

        /* চিকন লাইনের শাইনিং ইফেক্ট যা চারদিকে ঘুরবে */
        .login-index.ui-link::before {
          content: '';
          position: absolute;
          z-index: -2;
          left: -50%;
          top: -50%;
          width: 200%;
          height: 200%;
          background-color: transparent;
          background-image: conic-gradient(transparent, ${myColor}, #ffffff, transparent 30%);
          animation: rotate-border 3s linear infinite;
        }

        .login-index.ui-link::after {
          content: '';
          position: absolute;
          z-index: -1;
          left: 1px;
          top: 1px;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          background: ${myColor}; /* বাটনের মূল কালার */
          border-radius: 4px;
        }

        @keyframes rotate-border {
          100% { transform: rotate(360deg); }
        }

        /* ৪. সাইটের অন্য সব সবুজ অংশ আপনার কালারে পরিবর্তন */
        svg path[fill="${oldColor}"], svg [fill="${oldColor}"] { fill: ${myColor} !important; }
        [style*="background-color: ${oldColor}"] { background-color: ${myColor} !important; }
        .ui-btn-active { background-color: ${myColor} !important; border-color: ${myColor} !important; }
      </style>
      `;
      body = body.replace('</head>', `${customStyles}</head>`);
    }

    const modifiedResponse = new Response(body, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.delete('content-security-policy'); // স্টাইল কাজ করার জন্য জরুরি
    
    return modifiedResponse;
  }

  return response;
}
