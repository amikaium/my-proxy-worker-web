// Configuration
const targetHost = 'tenx365x.live';
const themeColor = '#56BBD9'; // আপনার নতুন কালার
const oldColorHex = '#14805E';

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

    // ১. গ্লোবাল ডোমেইন রিপ্লেসমেন্ট
    body = body.replace(new RegExp(targetHost, 'g'), actualHost);

    // ২. আগের কালার (#14805E) পুরোপুরি মুছে আপনার কালার বসানো
    body = body.replace(new RegExp(oldColorHex, 'gi'), themeColor);

    // ৩. কাস্টম প্রফেশনাল স্টাইল ইনজেকশন
    if (contentType.includes('text/html')) {
      const customStyles = `
      <style>
        /* ১. হেডার ডার্ক গ্রেডিয়েন্ট লুক */
        header, .header-top, [class*="header"] {
          background: linear-gradient(180deg, #2c2c2c 0%, #000000 100%) !important;
          border-bottom: 1px solid ${themeColor}44 !important;
        }

        /* ২. লগইন বাটন কাস্টমাইজেশন */
        .login-index.ui-link, button.login, .login-btn {
          background-color: ${themeColor} !important;
          color: #ffffff !important;
          position: relative;
          overflow: hidden;
          border: none !important;
          font-weight: bold;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        /* ৩. লগইন বাটনের চারদিকে শাইনিং বর্ডার ইফেক্ট */
        .login-index.ui-link::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(transparent, transparent, transparent, ${themeColor}, #ffffff, ${themeColor});
          animation: rotate-border 4s linear infinite;
          z-index: -1;
        }

        .login-index.ui-link::after {
          content: '';
          position: absolute;
          inset: 2px;
          background: ${themeColor};
          border-radius: 3px;
          z-index: -1;
        }

        @keyframes rotate-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ৪. অতিরিক্ত সুরক্ষা: পুরনো কালার যেন কোথাও না থাকে */
        [style*="${oldColorHex}"] {
          background-color: ${themeColor} !important;
          border-color: ${themeColor} !important;
          color: white !important;
        }
      </style>
      `;
      body = body.replace('</head>', `${customStyles}</head>`);
    }

    const modifiedResponse = new Response(body, response);
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    // Security Header cleaning to ensure style injection works
    modifiedResponse.headers.delete('content-security-policy');
    
    return modifiedResponse;
  }

  return response;
}
