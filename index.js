const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 
const SCORE_TARGET = 'score1.365cric.com';    
const LMT_TARGET = 'live.ckex.xyz';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;
  const referer = request.headers.get('Referer') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  let targetHost = MAIN_TARGET;
  
  // রাউটিং (কোন রিকোয়েস্ট কোন সার্ভারে যাবে)
  if (url.pathname.startsWith('/__score_proxy__')) {
    targetHost = SCORE_TARGET;
    url.pathname = url.pathname.replace('/__score_proxy__', '') || '/';
  } else if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  } else if (url.pathname.startsWith('/__lmt_proxy__')) {
    targetHost = LMT_TARGET;
    url.pathname = url.pathname.replace('/__lmt_proxy__', '') || '/';
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  
  // সার্ভারকে ধোঁকা দিয়ে 'Not Authorized' ঠেকানোর মূল চাবিকাঠি
  proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
  proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`); 
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
    return new Response("Server Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  // HTML মডিফিকেশন এবং আপনার দেওয়া নতুন লজিক ইনজেকশন
  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(/integrity="[^"]*"/ig, '');
    text = text.replace(/crossorigin="[^"]*"/ig, '');
    
    // ভিডিওর লিংকগুলো ঠিক রাখা
    text = text.replace(new RegExp(`https://${MAIN_TARGET}/?`, 'g'), `https://${myDomain}/`);
    text = text.replace(new RegExp(`https://${STREAM_TARGET}/?`, 'g'), `https://${myDomain}/__video_proxy__/`);

    // ==========================================
    // আপনার মাস্টার লজিক: Clear Box & Inject Dynamic Link
    // ==========================================
    const dynamicScoreScript = `
    <script>
      document.addEventListener("DOMContentLoaded", function() {
          setInterval(() => {
              try {
                  // ১. ইউআরএল এর একেবারে লাস্ট স্ল্যাশের পরের ডিজিট (Match ID) বের করা
                  const pathParts = window.location.pathname.split('/').filter(Boolean);
                  const matchId = pathParts[pathParts.length - 1]; 

                  // চেক করা হচ্ছে এটা আসলেই শুধুমাত্র সংখ্যা কিনা
                  if (matchId && /^\\d+$/.test(matchId)) {
                      
                      // ২. স্কোরবোর্ডের বক্সটা (Area) খুঁজে বের করা
                      const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');

                      // data-fixed চেক করছি যাতে বারবার লোড হয়ে স্ক্রিন ব্লিংক না করে
                      if (scoreArea && !scoreArea.getAttribute('data-fixed')) {
                          
                          // ৩. বক্সের ভেতরের পুরোনো সব আবর্জনা (আগের ভুল আইফ্রেম) পুরোপুরি ডিলিট!
                          scoreArea.innerHTML = '';

                          // ৪. আপনার কথামতো বক্সটাকে গ্রে (Gray) কালার এবং ফিক্সড সাইজ দেওয়া
                          scoreArea.style.setProperty('display', 'block', 'important');
                          scoreArea.style.setProperty('visibility', 'visible', 'important');
                          scoreArea.style.setProperty('width', '100%', 'important');
                          scoreArea.style.setProperty('height', '190px', 'important');
                          scoreArea.style.setProperty('background-color', '#e0e0e0', 'important'); // গ্রে কালার

                          // ৫. সম্পূর্ণ নতুন একটি আইফ্রেম তৈরি করা
                          const newIframe = document.createElement('iframe');
                          newIframe.id = 'myIframe';
                          
                          // আমাদের প্রক্সি করা লিংক বসানো হচ্ছে যাতে Not Authorized না দেখায়
                          newIframe.src = '/__score_proxy__/#/score1/' + matchId;

                          newIframe.style.setProperty('width', '100%', 'important');
                          newIframe.style.setProperty('height', '190px', 'important');
                          newIframe.style.setProperty('border', 'none', 'important');
                          newIframe.setAttribute('allowfullscreen', 'true');

                          // ৬. নতুন ফ্রেমটাকে গ্রে বক্সের ভেতর বসিয়ে দেওয়া
                          scoreArea.appendChild(newIframe);

                          // মার্ক করে দেওয়া হলো যাতে এই লজিক এই পেজের জন্য আর রান না হয়
                          scoreArea.setAttribute('data-fixed', 'true');
                          console.log('✅ Old Trash Cleared & New Dynamic Scoreboard Loaded for Match ID:', matchId);
                      }
                  }
              } catch(e) {}
          }, 500); 
      });
    </script>
    `;

    text = text.replace('</body>', dynamicScoreScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  // JS/JSON ফাইলের জন্য
  else if (contentType.includes('application/javascript') || contentType.includes('application/json')) {
    let text = await response.text();
    text = text.replace(new RegExp(`https://${MAIN_TARGET}`, 'g'), `https://${myDomain}`);
    
    // স্কোর এবং LMT সার্ভারের ডেটা প্রক্সি রুট দিয়ে পাস করা
    text = text.replace(new RegExp(`https://${SCORE_TARGET}`, 'g'), `https://${myDomain}/__score_proxy__`);
    text = text.replace(new RegExp(`https://${LMT_TARGET}`, 'g'), `https://${myDomain}/__lmt_proxy__`);
    
    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
