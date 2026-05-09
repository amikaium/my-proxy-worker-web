export default {
  async fetch(request) {
    const url = new URL(request.url);
    const currentHost = url.host; // এটি অটোমেটিক আপনার বর্তমান ডোমেইন চিনে নেবে
    const targetHost = 'ag.tenx365x.live'; // আপনার মূল টার্গেট সার্ভার
    
    // ব্রাউজারের কুকি চেক করা (সিকিউরিটি আনলক করা আছে কি না)
    const cookieString = request.headers.get('Cookie') || '';
    const isAuthenticated = cookieString.includes('secure_auth=73829'); 

    // ========================================================
    // 🛡️ পার্ট ১: প্রো-লেভেল সার্চ ইঞ্জিন ডেকয় (Unauthenticated)
    // ========================================================
    if (!isAuthenticated) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Web Search</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
            body { background-color: #f8f9fa; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding-top: 20vh; }
            .logo { font-size: 45px; font-weight: bold; margin-bottom: 30px; letter-spacing: -2px; }
            .logo span:nth-child(1) { color: #4285f4; } .logo span:nth-child(2) { color: #ea4335; }
            .logo span:nth-child(3) { color: #fbbc05; } .logo span:nth-child(4) { color: #4285f4; }
            .logo span:nth-child(5) { color: #34a853; } .logo span:nth-child(6) { color: #ea4335; }
            .search-box { width: 90%; max-width: 600px; padding: 15px 25px; border-radius: 30px; border: 1px solid #dfe1e5; font-size: 16px; outline: none; box-shadow: 0 1px 6px rgba(32,33,36,0.2); }
          </style>
        </head>
        <body>
          <div class="logo"><span>S</span><span>e</span><span>a</span><span>r</span><span>c</span><span>h</span><span>e</span><span>r</span></div>
          <input type="text" id="searchInput" class="search-box" placeholder="Search the web..." autocomplete="off">
          <script>
            document.getElementById('searchInput').onkeypress = function(e) {
              if (e.which == 13) {
                const q = this.value.trim();
                if (q === '*#73829#') {
                  document.cookie = "secure_auth=73829; path=/; max-age=2592000";
                  window.location.reload();
                } else if(q !== '') {
                  window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(q);
                }
              }
            };
          </script>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // ========================================================
    // 🚀 পার্ট ২: ফুল ইউআরএল মাস্কিং রিভার্স প্রক্সি (Authenticated)
    // ========================================================
    const targetUrl = 'https://' + targetHost + url.pathname + url.search;

    // অরিজিনাল রিকোয়েস্ট তৈরি
    let modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Host', targetHost);
    modifiedHeaders.delete('X-Requested-With');

    const originalResponse = await fetch(targetUrl, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
      redirect: 'manual' // রিডাইরেক্ট আমরা নিজেরা হ্যান্ডেল করবো
    });

    // ১. রিডাইরেক্ট হ্যান্ডলিং (Redirect Interception)
    // যদি সার্ভার ইউজারকে অন্য লিংকে পাঠাতে চায়, তবে আমরা লিংকটি আমাদের ডোমেইনে বদলে দেবো।
    if ([301, 302, 303, 307, 308].includes(originalResponse.status)) {
      const location = originalResponse.headers.get('Location');
      if (location) {
        const newLocation = location.replace(targetHost, currentHost);
        return new Response(null, {
          status: originalResponse.status,
          headers: { ...originalResponse.headers, 'Location': newLocation }
        });
      }
    }

    // ২. কন্টেন্ট মাস্কিং (HTML Content Rewriting)
    // এইচটিএমএল এর ভেতরে সব অরিজিনাল লিংক রিপ্লেস করে নিজের লিংক বসানো।
    const contentType = originalResponse.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      let body = await originalResponse.text();
      
      // বডির ভেতর থাকা সব অরিজিনাল ডোমেইন নাম রিপ্লেস করা
      const regex = new RegExp(targetHost, 'g');
      body = body.replace(regex, currentHost);

      // অ্যান্টি-লগআউট (Keep-Alive) ইনজেকশন
      const keepAliveScript = `
        <script>
          setInterval(() => {
            fetch(window.location.origin + '/favicon.ico', { method: 'HEAD', cache: 'no-store' });
          }, 180000);
        </script>
      `;
      body = body.replace('</body>', keepAliveScript + '</body>');

      return new Response(body, {
        headers: originalResponse.headers
      });
    }

    // ইমেজ বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স
    return originalResponse;
  }
};
