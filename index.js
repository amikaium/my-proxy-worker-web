export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // ব্রাউজারের কুকি চেক করা (সিকিউরিটি আনলক করা আছে কি না)
    const cookieString = request.headers.get('Cookie') || '';
    const isAuthenticated = cookieString.includes('secure_auth=73829'); // গোপন কোড: 73829

    // ========================================================
    // 🛡️ পার্ট ১: ফেক ব্রাউজার হোমপেজ (১০০% রিয়েলিস্টিক সার্চ ইঞ্জিন)
    // ========================================================
    if (!isAuthenticated) {
      const dummyHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Web Search</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            body { background-color: #f8f9fa; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding-top: 15vh; }
            .logo { font-size: 42px; font-weight: 700; color: #4285f4; margin-bottom: 30px; letter-spacing: -1px; }
            .logo span:nth-child(2) { color: #ea4335; }
            .logo span:nth-child(3) { color: #fbbc05; }
            .logo span:nth-child(4) { color: #4285f4; }
            .logo span:nth-child(5) { color: #34a853; }
            .search-container { width: 90%; max-width: 584px; position: relative; }
            .search-box { width: 100%; padding: 15px 45px 15px 20px; border-radius: 24px; border: 1px solid #dfe1e5; font-size: 16px; outline: none; box-shadow: 0 1px 6px rgba(32,33,36,.28); transition: all 0.2s; }
            .search-box:focus { box-shadow: 0 1px 6px rgba(32,33,36,.4); }
            .search-icon { position: absolute; right: 15px; top: 15px; color: #9aa0a6; }
            .quick-links { display: flex; gap: 20px; margin-top: 40px; justify-content: center; flex-wrap: wrap; }
            .link-item { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #5f6368; font-size: 12px; }
            .icon-circle { width: 48px; height: 48px; background: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-bottom: 8px; font-weight: bold; font-size: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); color: #fff;}
          </style>
        </head>
        <body>
          <div class="logo">
            <span>S</span><span>e</span><span>a</span><span>r</span><span>c</span><span>h</span>
          </div>
          
          <div class="search-container">
            <form id="searchForm">
              <input type="text" id="searchInput" class="search-box" placeholder="Search the web or type URL" autocomplete="off">
              <svg class="search-icon" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
            </form>
          </div>

          <div class="quick-links">
            <a href="https://www.youtube.com" class="link-item"><div class="icon-circle" style="background:#ff0000;">Y</div>YouTube</a>
            <a href="https://www.facebook.com" class="link-item"><div class="icon-circle" style="background:#1877f2;">F</div>Facebook</a>
            <a href="https://www.wikipedia.org" class="link-item"><div class="icon-circle" style="background:#000000;">W</div>Wiki</a>
            <a href="https://www.amazon.com" class="link-item"><div class="icon-circle" style="background:#ff9900;">A</div>Amazon</a>
          </div>

          <script>
            // 🔥 ম্যাজিক সার্চ লজিক
            document.getElementById('searchForm').addEventListener('submit', function(e) {
              e.preventDefault();
              const query = document.getElementById('searchInput').value.trim();
              
              if(query === '*#73829#') { 
                // আপনার গোপন কোড দিলে সিস্টেম আনলক হবে
                document.cookie = "secure_auth=73829; path=/; max-age=" + (30*24*60*60);
                document.body.innerHTML = '<h2 style="margin-top:20px; color:#5f6368;">Authenticating...</h2>';
                setTimeout(() => window.location.reload(), 800);
              } 
              else if(query !== '') {
                // অন্য কিছু লিখলে একদম সত্যিকারের গুগলে সার্চ হবে!
                window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(query);
              }
            });
          </script>
        </body>
        </html>
      `;
      
      return new Response(dummyHTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // ========================================================
    // 🚀 পার্ট ২: আসল প্যানেল (মেইন ওয়েবসাইটে কোনো কিছু হাইড হবে না)
    // ========================================================
    const targetHost = 'ag.tenx365x.live';
    const targetUrl = 'https://' + targetHost + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    modifiedRequest.headers.set('Host', targetHost);
    modifiedRequest.headers.delete('X-Requested-With');

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    // ওয়েবসাইটের ভেতরের কোনো ডিজাইন বা মেনু হাইড করা হচ্ছে না, 
    // শুধু ব্যাকগ্রাউন্ডে অ্যান্টি-লগআউট (Keep-Alive) সিস্টেম ইনজেক্ট করা হচ্ছে।
    const contentType = newResponse.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return new HTMLRewriter()
        .on("body", {
          element(el) {
            el.append(`
              <script>
                // 🔥 অটো-লগআউট বা সিজন এক্সপায়ার বন্ধ করার জন্য Keep-Alive সিগন্যাল
                // এটি প্রতি ৩ মিনিটে (১৮০,০০০ মিলি-সেকেন্ড) সার্ভারকে নক করবে
                setInterval(function() {
                  fetch(window.location.origin + '/favicon.ico', { method: 'HEAD', cache: 'no-store' });
                }, 180000); 
              </script>
            `, { html: true });
          }
        })
        .transform(newResponse);
    }

    return newResponse;
  }
};
