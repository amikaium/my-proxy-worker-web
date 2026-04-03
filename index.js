const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. ব্রাউজার সিকিউরিটি বাইপাস
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  let targetHost = MAIN_TARGET;
  let isStream = false;

  // ভিডিও প্রক্সি (এটি রেখেছি যাতে সাইটের লাইভ টিভি অপশনটা সচল থাকে)
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    isStream = true;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  proxyReqHeaders.set('Origin', `https://${targetHost}`);
  proxyReqHeaders.set('Referer', `https://${targetHost}/`);
  proxyReqHeaders.delete('Accept-Encoding');

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: proxyReqHeaders,
    body: request.body,
    redirect: 'manual'
  });

  let response;
  try {
    response = await fetch(proxyRequest);
  } catch (err) {
    return new Response("Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // ২. HTML মডিফিকেশন এবং বক্স হাইড করার স্ক্রিপ্ট ইনজেকশন
  if (contentType.includes('text/html')) {
    let text = await response.text();

    // ডোমেইন রিপ্লেসমেন্ট
    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // ==========================================
    // THE CLEANER: Hide myIframe & Score Area
    // ==========================================
    const hideBoxScript = `
    <script>
      // পেজ লোড হওয়ার সাথে সাথে এবং লোড হওয়ার পরেও বারবার চেক করবে যেন বক্সটি না আসে
      const hideAllScoreBoxes = () => {
        const selectors = [
          '#myIframe',          // আপনার বলা সেই আইডি
          '.score_area',        // স্কোরবোর্ডের মূল বক্স
          '#animScore',         // অ্যানিমেশন এরিয়া
          'iframe[src*="score1.365cric.com"]' // স্কোরবোর্ডের যেকোনো আইফ্রেম
        ];
        
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('height', '0px', 'important');
            el.style.setProperty('margin', '0px', 'important');
          });
        });
      };

      // সাথে সাথে রান করবে
      hideAllScoreBoxes();
      // পরবর্তী ৫ সেকেন্ড পর্যন্ত বারবার চেক করবে (যাতে সাইটের নিজস্ব JS ওটা ওপেন করতে না পারে)
      let count = 0;
      let interval = setInterval(() => {
        hideAllScoreBoxes();
        if (count++ > 20) clearInterval(interval);
      }, 250);
    </script>
    `;

    // </body> ট্যাগের ঠিক আগে স্ক্রিপ্টটি ঢুকিয়ে দেওয়া হচ্ছে
    text = text.replace('</body>', hideBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
