addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const TARGET_DOMAIN = "tenx365x.live";
  const url = new URL(request.url);

  // ১. মূল সাইট লোড (ক্যাশিং অফ করা হয়েছে যাতে ডিজাইন না ভাঙে)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return new Response(customHTML, {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
  }

  // ২. প্রক্সি রিকোয়েস্ট
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
  
  // ৩. HTMLRewriter দিয়ে মেইন সাইটের অপ্রয়োজনীয় জিনিস মুছে ফেলা
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
              header, footer, nav, .header, .footer, .bottom-nav, .mobile-nav, #header, #footer, .top-bar, .bottom-bar, .menu-wrap {
                  display: none !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  visibility: hidden !important;
              }
              body { padding-top: 0 !important; padding-bottom: 0 !important; background-color: #0f172a !important; }
            </style>
          `, { html: true });
        }
      })
      .transform(newResponse);
  }

  let newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.delete('X-Frame-Options');
  return newResponse;
}

// ==========================================
// 1XBDT HTML (Full Screen Iframe & Fixed Grid)
// ==========================================
const customHTML = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>1XBDT - Premium Gaming</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background-color: #0f172a; display: flex; justify-content: center; height: 100vh; }
        
        .app-container { width: 100%; max-width: 480px; background-color: #0f172a; height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; box-shadow: 0 0 40px rgba(0,0,0,0.6); }
        .header { background-color: #0b2246; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; height: 60px; flex-shrink: 0; z-index: 20; position: relative; }
        .logo { font-size: 26px; font-weight: 800; font-style: italic; display: flex; align-items: center; cursor: pointer; }
        .logo .part-1 { color: #ffffff; } .logo .part-2 { color: #2196f3; }
        
        .login-btn { background-color: #1e88e5; color: white; border: none; padding: 8px 18px; border-radius: 4px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
        
        /* =========================================
           FULL SCREEN IFRAME & BACK BUTTON
           ========================================= */
        #iframe-container { 
            display: none; 
            position: fixed; /* পুরো স্ক্রিন কভার করবে */
            top: 0; left: 0; right: 0; bottom: 0; 
            z-index: 99999; /* হেডার ও নেভিগেশনের ওপরে থাকবে */
            background-color: #000; 
        }
        #content-frame { width: 100%; height: 100%; border: none; }
        
        /* গেম থেকে বের হওয়ার বাটন */
        .floating-back-btn {
            position: absolute;
            top: 15px; left: 15px;
            z-index: 100000;
            background: rgba(15, 23, 42, 0.85);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.4);
        }
        
        /* ========================================= */
        
        #main-content-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        #main-content-area::-webkit-scrollbar { width: 0; }

        .slider-container { width: 100%; height: 120px; overflow: hidden; position: relative; flex-shrink: 0; background-color: #0b2246; }
        .slider-track { display: flex; width: 300%; height: 100%; transition: transform 0.5s ease-in-out; }
        .slide { width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding: 15px; color: white; text-align: right; }
        .slide-1 { background: linear-gradient(135deg, #004d40, #0d47a1); }
        .slide-2 { background: linear-gradient(135deg, #b71c1c, #4a148c); }
        .slide-3 { background: linear-gradient(135deg, #e65100, #1b5e20); }
        .slide-content h2 { font-size: 18px; margin-bottom: 4px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
        .slide-content h2 span { color: #ffeb3b; font-weight: 900;}
        .slide-content p { font-size: 11px; color: #e0f7fa; }
        
        .announcement-bar { background-color: #1a237e; color: white; display: flex; align-items: center; height: 32px; flex-shrink: 0; border-bottom: 1px solid #283593; }
        .megaphone-icon { background-color: #0b2246; width: 38px; height: 100%; display: flex; justify-content: center; align-items: center; color: #ffca28; z-index: 2; box-shadow: 2px 0 5px rgba(0,0,0,0.3); }
        .scrolling-text { flex: 1; overflow: hidden; font-size: 12px; font-weight: 500; }
        
        .main-layout { display: flex; flex: 1; overflow: hidden; background-color: #0f172a; }
        .sidebar { width: 72px; background-color: #061933; overflow-y: auto; flex-shrink: 0; }
        .sidebar::-webkit-scrollbar { width: 0; }
        .nav-item-left { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 4px; color: #64748b; border-bottom: 1px solid #0f172a; cursor: pointer; transition: 0.2s; }
        .nav-item-left i { font-size: 20px; margin-bottom: 6px; }
        .nav-item-left span { font-size: 10px; font-weight: 600; text-align: center; }
        .nav-item-left.active { background-color: #1e3a8a; color: #ffffff; position: relative; }
        .nav-item-left.active i { color: #3b82f6; }
        .nav-item-left.active::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 3px; background-color: #3b82f6; border-radius: 0 0 4px 4px; }
        
        /* গেম এরিয়া ഫিক্সড */
        .game-feed { flex: 1; overflow-y: auto; padding: 8px; padding-bottom: 80px; width: calc(100% - 72px); }
        .game-feed::-webkit-scrollbar { width: 0; }
        
        .tab-content { display: none; width: 100%; }
        .tab-content.active { display: block; animation: fadeIn 0.3s; }
        
        /* গ্রিড কন্টেইনার (এখানেই জাদু) */
        .tab-content.grid-layout.active { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 10px; 
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        
        /* স্কয়ার গ্রিড কার্ড */
        .img-card.grid {
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 8px;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: white;
            text-align: center;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            overflow: hidden;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.05);
            cursor: pointer;
            background-size: cover;
            background-position: center;
            transition: transform 0.2s;
        }
        .img-card.grid:hover { transform: translateY(-3px); }

        .img-card.grid::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%);
            z-index: 1;
        }

        .img-card.grid span { position: absolute; bottom: 25px; z-index: 2; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }

        .card-label {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
            font-size: 10px; padding: 5px; text-align: center; font-weight: 600; color: #ffca28; z-index: 2;
        }
        
        .bg-sports1 { background: linear-gradient(45deg, #020024, #00d4ff); }
        .bg-sports2 { background: linear-gradient(to right, #000428, #004e92); }
        .bg-roulette { background: radial-gradient(circle, #b71c1c, #212121); }
        .bg-baccarat { background: radial-gradient(circle, #004d40, #000000); }
        
        .bottom-nav { position: absolute; bottom: 0; width: 100%; height: 60px; background-color: #0b2246; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #1e3a8a; z-index: 20; }
        .bottom-nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; text-decoration: none; width: 20%; height: 100%; position: relative; transition: all 0.2s ease; cursor: pointer; }
        .bottom-nav-item i { font-size: 20px; margin-bottom: 4px; }
        .bottom-nav-item span { font-size: 11px; font-weight: 600; }
        .bottom-nav-item.active { color: #3b82f6; }
        .bottom-nav-item.active::after { content: ''; position: absolute; top: -1px; width: 35%; height: 3px; background-color: #3b82f6; border-radius: 0 0 4px 4px; }
    </style>
</head>
<body>
<div class="app-container">
    <header class="header">
        <div class="logo" onclick="closeIframe()">
            <span class="part-1">1X</span><span class="part-2">BDT</span>
        </div>
        <button class="login-btn" onclick="openIframe('/login')">
            <i class="fa-solid fa-user"></i> Login
        </button>
    </header>

    <div id="iframe-container">
        <div class="floating-back-btn" onclick="closeIframe()">
            <i class="fa-solid fa-arrow-left"></i> Back
        </div>
        <iframe id="content-frame" src=""></iframe>
    </div>

    <div id="main-content-area">
        <div class="slider-container">
            <div class="slider-track" id="sliderTrack">
                <div class="slide slide-1"><div class="slide-content"><h2>ফ্রি ২০৩ <span>JILI</span> স্পিন</h2></div></div>
                <div class="slide slide-2"><div class="slide-content"><h2>১০০% <span>ওয়েলকাম</span> বোনাস</h2></div></div>
            </div>
        </div>

        <div class="announcement-bar">
            <div class="megaphone-icon"><i class="fa-solid fa-bullhorn"></i></div>
            <div class="scrolling-text">
                <marquee scrollamount="5">নতুন সদস্যদের জন্য ৩ টি বোনাস , ১০০% ক্যাশব্যাক! ক্যাসিনো এবং স্লট গেমসে বিশাল প্রাইজ পুল!</marquee>
            </div>
        </div>

        <div class="main-layout">
            <aside class="sidebar">
                <div onclick="switchTab('hot', this)" class="nav-item-left"><i class="fa-solid fa-fire"></i><span>হট গেম</span></div>
                <div onclick="switchTab('sports', this)" class="nav-item-left"><i class="fa-solid fa-futbol"></i><span>স্পোর্টস</span></div>
                <div onclick="switchTab('casino', this)" class="nav-item-left active"><i class="fa-solid fa-diamond"></i><span>ক্যাসিনো</span></div>
                <div onclick="switchTab('table', this)" class="nav-item-left"><i class="fa-solid fa-table"></i><span>টেবিল</span></div>
            </aside>

            <main class="game-feed"> 
                
                <div id="casino" class="tab-content grid-layout active"> 
                    
                    <div class="img-card grid bg-baccarat" onclick="openIframe('/TABLE/SPRIBE/EGAME/SPRIBE-EGAME-001')">
                        <span>AVIATOR</span>
                        <div class="card-label">SPRIBE GAMING</div>
                    </div>
                    
                    <div class="img-card grid bg-sports1" onclick="openIframe('/TABLE/KINGMAKER/TABLE/KM-TABLE-046')">
                        <span>AVIATRIX</span>
                        <div class="card-label">KINGMAKER</div>
                    </div>

                    <div class="img-card grid" style="background-image: url('https://imagedelivery.net/DYQ-dtBEBlUVzYMqxn1p5A/tenx365.live-mega-sicbo.webp/ClassImage?v=0.53');" onclick="openIframe('/TABLE/PP/LIVE/PP-LIVE-025')">
                        <span>MEGA SIC BO</span>
                        <div class="card-label">PP LIVE</div>
                    </div>

                    <div class="img-card grid" style="background-image: url('https://imagedelivery.net/DYQ-dtBEBlUVzYMqxn1p5A/tenx365.live-baccarat.webp/ClassImage?v=0.53');" onclick="openIframe('/TABLE/KINGMAKER/TABLE/KM-TABLE-041')">
                        <span>BACCARAT</span>
                        <div class="card-label">KINGMAKER</div>
                    </div>

                    <div class="img-card grid" onclick="openIframe('/TABLE/KINGMAKER/TABLE/KM-TABLE-028')">
                        <span>7 UP DOWN</span>
                        <div class="card-label">KINGMAKER</div>
                    </div>
                    
                    <div class="img-card grid" onclick="openIframe('/TABLE/KINGMAKER/TABLE/KM-TABLE-015')">
                        <span>SIC BO</span>
                        <div class="card-label">KINGMAKER</div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <nav class="bottom-nav">
        <div class="bottom-nav-item" onclick="openIframe('/exchange/member/Matches/Inplay'); setActiveNav(this)"><i class="fa-solid fa-chart-line"></i><span>In-Play</span></div>
        <div class="bottom-nav-item active" onclick="closeIframe(); setActiveNav(this)"><i class="fa-solid fa-house"></i><span>Home</span></div>
        <div class="bottom-nav-item" onclick="openIframe('/sabaSports/1/3/gn001'); setActiveNav(this)"><i class="fa-solid fa-users"></i><span>Sports</span></div>
        <div class="bottom-nav-item" onclick="openIframe('/login'); setActiveNav(this)"><i class="fa-regular fa-circle-user"></i><span>Account</span></div>
    </nav>
</div>

<script>
    function openIframe(url) {
        document.getElementById('iframe-container').style.display = 'block';
        document.getElementById('content-frame').src = url;
    }

    function closeIframe() {
        document.getElementById('iframe-container').style.display = 'none';
        document.getElementById('content-frame').src = '';
    }

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
</script>
</body>
</html>
`;
