// Target URL setup
const targetHost = 'tenx365x.live';
const oldColor = '#14805E';
const newColor = '#56BBD9';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const actualHost = url.host; // আপনার নিজের ডোমেন অটোমেটিক ডিটেক্ট করবে

  // Change the host to the target host
  url.hostname = targetHost;

  // Clone headers and modify them to prevent blocking
  const newHeaders = new Headers(request.headers);
  newHeaders.set('Host', targetHost);
  newHeaders.set('Referer', `https://${targetHost}/`);
  newHeaders.set('Origin', `https://${targetHost}`);

  // Fetch the original response from the target site
  const response = await fetch(url.toString(), {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    redirect: 'follow'
  });

  const contentType = response.headers.get('content-type') || '';

  // Only modify text-based content (HTML, CSS, JS)
  if (
    contentType.includes('text/html') ||
    contentType.includes('text/css') ||
    contentType.includes('application/javascript') ||
    contentType.includes('application/x-javascript')
  ) {
    let body = await response.text();

    // 1. ডোমেইন পরিবর্তন (লিংক যেন অরিজিনাল সাইটে না চলে যায়)
    const hostRegex = new RegExp(targetHost, 'g');
    body = body.replace(hostRegex, actualHost);

    // 2. কালার পরিবর্তন (Case-insensitive replacement)
    // #14805E এবং #14805e উভয়কেই রিপ্লেস করবে
    const colorRegex = new RegExp(oldColor, 'gi');
    body = body.replace(colorRegex, newColor);

    // প্রোফেশনাল টাচ: ইনলাইন স্টাইল হিসেবে কালার ওভাররাইড করা (যদি দরকার হয়)
    if (contentType.includes('text/html')) {
      const customStyle = `<style>
        /* Force color replacement for any missed elements */
        [style*="${oldColor}"] { background-color: ${newColor} !important; color: ${newColor} !important; border-color: ${newColor} !important; }
      </style>`;
      body = body.replace('</head>', `${customStyle}</head>`);
    }

    // নতুন রেসপন্স তৈরি করা
    const modifiedResponse = new Response(body, response);
    
    // সিকিউরিটি বা ক্যাশ হেডার ঠিক করা
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.delete('content-security-policy');
    modifiedResponse.headers.delete('content-security-policy-report-only');
    modifiedResponse.headers.delete('clear-site-data');

    return modifiedResponse;
  }

  // ইমেজ বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স
  return response;
}
