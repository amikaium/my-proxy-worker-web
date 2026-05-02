export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetHostname = 'tenx365x.live'; // মেইন সাইটের ডোমেইন

    // ১. শুধুমাত্র হোমপেজের জন্য আমাদের কাস্টম ডিজাইন লোড হবে
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getNativeUI(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // ২. অন্যান্য সব রিকোয়েস্ট (লগইন, গেম প্লে) মেইন সাইটে প্রক্সি হবে
    url.hostname = targetHostname;
    const proxyRequest = new Request(url.toString(), request);
    
    // মেইন সার্ভারকে বোঝানোর জন্য হেডার পরিবর্তন
    proxyRequest.headers.set('Host', targetHostname);
    proxyRequest.headers.set('Origin', `https://${targetHostname}`);
    proxyRequest.headers.set('Referer', `https://${targetHostname}/`);

    const response = await fetch(proxyRequest);
    const proxyResponse = new Response(response.body, response);
    
    // ফ্রেম সাপোর্ট এবং সিকিউরিটি ইস্যু বাইপাস
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.delete('X-Frame-Options');

    return proxyResponse;
  }
};

// ৩. হোমপেজের প্রফেশনাল নেটিভ UI ডিজাইন (HTML + CSS)
function getNativeUI() {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Professional Native Casino</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #0a192f;
            --bg-panel: #112240;
            --primary-blue: #007bff;
            --primary-blue-hover: #0056b3;
            --text-white: #ffffff;
            --text-gray: #a8b2d1;
            --sidebar-bg: #0d2546;
            --card-bg: #1e293b;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Roboto', sans-serif; user-select: none; -webkit-tap-highlight-color: transparent; }
        body { background-color: var(--bg-dark); color: var(--text-white); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        /* Top Header */
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background-color: var(--sidebar-bg); border-bottom: 1px solid #1a365d; }
        .logo { font-size: 24px; font-weight: 700; color: #48cae4; font-style: italic; }
        .login-btn { background-color: var(--primary-blue); color: white; border: none; padding: 8px 20px; border-radius: 4px; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
        
        /* Main Layout */
        .main-layout { display: flex; flex: 1; overflow: hidden; }
        
        /* Sidebar Menu */
        .sidebar { width: 70px; background-color: var(--sidebar-bg); overflow-y: auto; border-right: 1px solid #1a365d; padding-top: 10px; }
        .sidebar::-webkit-scrollbar { display: none; }
        .menu-item { display: flex; flex-direction: column; align-items: center; padding: 15px 5px; color: var(--text-gray); font-size: 11px; cursor: pointer; border-left: 3px solid transparent; transition: 0.2s; }
        .menu-item i { font-size: 20px; margin-bottom: 5px; }
        .menu-item.active { background-color: #1a365d; color: var(--text-white); border-left: 3px solid #e11d48; }
        
        /* Content Area */
        .content-area { flex: 1; overflow-y: auto; background-color: var(--bg-dark); }
        .content-area::-webkit-scrollbar { width: 0px; }
        
        /* Banner */
        .banner { height: 160px; background-color: #1a365d; display: flex; justify-content: center; align-items: center; color: var(--text-gray); font-size: 18px; }
        
        /* Marquee Notice */
        .notice-bar { display: flex; background-color: #1a2a40; align-items: center; border-bottom: 1px solid #2a4365; border-top: 1px solid #2a4365; }
        .notice-icon { background-color: #d97706; padding: 8px 12px; color: white; }
        .marquee { flex: 1; overflow: hidden; white-space: nowrap; padding: 0 10px; font-size: 13px; color: #e2e8f0; }
        
        /* Section Title */
        .section-header { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .section-title { font-size: 16px; font-weight: 700; border-left: 3px solid var(--text-white); padding-left: 10px; }
        .filter-btn { background-color: #1e293b; border: 1px solid #334155; color: white; padding: 5px 12px; border-radius: 4px; font-size: 12px; }
        
        /* Game Grid */
        .game-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 15px 20px 15px; }
        .game-card { background-color: var(--card-bg); border-radius: 6px; overflow: hidden; text-decoration: none; display: block; }
        .game-thumb { height: 110px; display: flex; justify-content: center; align-items: center; color: #475569; font-size: 14px; }
        .game-info { background-color: #0f172a; padding: 10px; display: flex; justify-content: space-between; align-items: center; color: white; font-size: 12px; }
        .heart-icon { color: white; font-size: 14px; }
        
    </style>
</head>
<body>

    <div class="header">
        <div class="logo">1XBET</div>
        <button class="login-btn"><i class="fas fa-user"></i> Login</button>
    </div>

    <div class="main-layout">
        <div class="sidebar">
            <div class="menu-item"><i class="fas fa-gamepad"></i>হট গেম</div>
            <div class="menu-item"><i class="fas fa-futbol"></i>স্পোর্টস</div>
            <div class="menu-item active"><i class="fas fa-box"></i>ক্যাসিনো</div>
            <div class="menu-item"><i class="fas fa-7"></i>স্লট</div>
            <div class="menu-item"><i class="fas fa-rocket"></i>ক্র্যাশ</div>
            <div class="menu-item"><i class="fas fa-layer-group"></i>টেবিল</div>
            <div class="menu-item"><i class="fas fa-fish"></i>ফিশিং</div>
        </div>

        <div class="content-area">
            <div class="banner">[ Main Banner / No Image ]</div>
            
            <div class="notice-bar">
                <div class="notice-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="marquee">
                    <marquee scrollamount="4">নতুন সদস্যদের জন্য ৩ টি বোনাস, প্রথম ডিপোজিটে ১০০% বোনাস!</marquee>
                </div>
            </div>

            <div class="section-header">
                <div class="section-title">লাইভ ক্যাসিনো</div>
                <button class="filter-btn">Filter <i class="fas fa-chevron-down"></i></button>
            </div>

            <div class="game-grid">
                <a href="/TABLE/SPRIBE/EGAME/SPRIBE-EGAME-001" class="game-card">
                    <div class="game-thumb">[ Aviator Logo ]</div>
                    <div class="game-info">
                        <span>Aviator (Spribe)</span>
                        <i class="far fa-heart heart-icon"></i>
                    </div>
                </a>

                <a href="#" class="game-card">
                    <div class="game-thumb">[ No Image ]</div>
                    <div class="game-info">
                        <span>EVO Game Lobb...</span>
                        <i class="far fa-heart heart-icon"></i>
                    </div>
                </a>
                <a href="#" class="game-card">
                    <div class="game-thumb">[ No Image ]</div>
                    <div class="game-info">
                        <span>EVO Game Lobb...</span>
                        <i class="far fa-heart heart-icon"></i>
                    </div>
                </a>
                <a href="#" class="game-card">
                    <div class="game-thumb">[ No Image ]</div>
                    <div class="game-info">
                        <span>EVO Game Lobb...</span>
                        <i class="far fa-heart heart-icon"></i>
                    </div>
                </a>
            </div>
        </div>
    </div>

</body>
</html>`;
}
