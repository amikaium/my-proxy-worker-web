addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // ডাইনামিক্যালি অরিজিনাল সাইট থেকে রেসপন্স আনবে (কোনো ডোমেইন হার্ডকোড করা নেই)
  const response = await fetch(request);
  const contentType = response.headers.get("Content-Type");
  
  // যদি রেসপন্সটি HTML পেজ হয়, তবেই আমরা ডিজাইন পরিবর্তন করবো
  if (contentType && contentType.includes("text/html")) {
    return new HTMLRewriter()
      .on("head", new HeadRewriter())
      .on("body", new BodyRewriter())
      .transform(response);
  }
  return response;
}

// ==========================================
// ১. Head Rewriter: আগের ডিজাইন পুরোপুরি হাইড করবে
// ==========================================
class HeadRewriter {
  element(element) {
    // CSS ইনজেক্ট করে অরিজিনাল সাইটের সবকিছু অদৃশ্য করে দিচ্ছি, যাতে এক মুহূর্তের জন্যও দেখা না যায়
    element.append(`
      <style>
        /* HIDE OLD SITE COMPLETELY WITHOUT FLICKERING */
        app-root, .mian-wrap, body > *:not(#new-ui-root) {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
        }

        /* NEW UI CSS VARIABLES & STYLES */
        :root {
            --bg-dark: #001529;
            --bg-header: #022b5e;
            --bg-sidebar: #013a7a;
            --bg-sidebar-hover: #034b9e;
            --primary-blue: #1e88e5;
            --text-white: #ffffff;
            --text-gray: #a0b2c6;
            --border-color: #0b4585;
            --accent-red: #d32f2f;
            --accent-yellow: #ffc107;
            --card-bg: #002244;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #000 !important;
            display: flex;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        #new-ui-root {
            width: 100%;
            max-width: 480px;
            height: 100vh;
            background-color: var(--bg-dark);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            z-index: 999999999;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(255,255,255,0.1);
        }
        
        header { background-color: var(--bg-header); height: 50px; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; flex-shrink: 0; }
        .logo { color: var(--text-white); font-size: 24px; font-weight: 900; font-style: italic; }
        .logo span { color: #5bc0de; }
        .login-btn { background-color: var(--primary-blue); color: var(--text-white); border: none; padding: 6px 15px; border-radius: 4px; font-weight: bold; display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer; }
        
        .top-banner { width: 100%; height: 120px; background-color: #0f3966; display: flex; justify-content: center; align-items: center; color: #ccc; flex-shrink: 0; border-bottom: 2px solid var(--accent-yellow); background-size: cover; background-position: center; }
        .marquee-container { background-color: #0d1b2a; color: var(--text-white); padding: 5px 10px; display: flex; align-items: center; gap: 10px; font-size: 12px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
        .marquee-container i { color: var(--accent-yellow); font-size: 16px; }
        
        .main-body { display: flex; flex: 1; overflow: hidden; }
        
        .sidebar::-webkit-scrollbar, .content-area::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: var(--bg-header); }
        .content-area::-webkit-scrollbar-track { background: var(--bg-dark); }
        .sidebar::-webkit-scrollbar-thumb, .content-area::-webkit-scrollbar-thumb { background: var(--primary-blue); border-radius: 10px; }
        
        .sidebar { width: 70px; background-color: var(--bg-header); display: flex; flex-direction: column; overflow-y: auto; border-right: 1px solid var(--border-color); scroll-behavior: smooth; }
        .sidebar-item { padding: 12px 5px; display: flex; flex-direction: column; align-items: center; color: var(--text-gray); font-size: 11px; border-bottom: 1px solid var(--border-color); cursor: pointer; text-align: center; gap: 5px; border-left: 3px solid transparent; transition: all 0.3s ease; }
        .sidebar-item.active { background-color: var(--bg-sidebar-hover); border-left: 3px solid var(--accent-red); color: var(--text-white); }
        .sidebar-item.active i { color: #5bc0de; }
        
        .content-area { flex: 1; background-color: var(--bg-dark); overflow-y: auto; display: flex; flex-direction: column; scroll-behavior: smooth; }
        .fade-enter { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        
        .section-header { display: flex; justify-content: space-between; align-items: center; padding: 10px; color: var(--text-white); background: #001b3a; }
        .section-title { font-weight: bold; font-size: 14px; border-left: 3px solid var(--text-white); padding-left: 5px; }
        .filter-select { background: #1a365d; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; outline: none; }
        
        .games-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; }
        .game-card { background-color: var(--card-bg); border-radius: 4px; overflow: hidden; border: 1px solid #2a4365; cursor: pointer; transition: transform 0.3s ease; }
        .game-card:hover { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.4); border-color: var(--primary-blue); }
        .game-img-placeholder { width: 100%; height: 100px; background-color: #2c3e50; background-size: cover; background-position: center; }
        .game-info { padding: 8px; display: flex; justify-content: space-between; align-items: center; background: #0b5394; }
        .game-name { color: var(--text-white); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%; }
        .heart-icon { color: var(--text-white); font-size: 12px; }

        /* Loading Screen Style */
        #loading-screen { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg-dark); z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--primary-blue); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    `, { html: true });
  }
}

// ==========================================
// ২. Body Rewriter: নতুন ডিজাইন এবং ডাইনামিক স্ক্র্যাপার ইনজেক্ট করবে
// ==========================================
class BodyRewriter {
  element(element) {
    const scriptContent = `
      <div id="new-ui-root">
          <!-- গেম লোড না হওয়া পর্যন্ত এই লোডিং স্ক্রিন দেখাবে -->
          <div id="loading-screen">
              <div class="spinner"></div>
              <p style="margin-top: 15px; font-size: 14px; color: #ffc107;">অপেক্ষা করুন...</p>
          </div>
          
          <!-- মেইন অ্যাপ কন্টেইনার -->
          <div id="app-container" style="display: none; height: 100%; flex-direction: column;">
              <header>
                  <div class="logo">1X<span>BET</span></div>
                  <button class="login-btn" onclick="triggerLogin()"><i class="fa-solid fa-user"></i> Login</button>
              </header>
              <div class="top-banner" id="main-banner"></div>
              <div class="marquee-container">
                  <i class="fa-solid fa-bullhorn"></i>
                  <marquee scrollamount="4">নতুন সদস্যদের জন্য ৩ টি বোনাস , প্রথম ডিপোজিটে ১০০% বোনাস</marquee>
              </div>
              <div class="main-body">
                  <div class="sidebar" id="sidebar"></div>
                  <div class="content-area" id="content-area"></div>
              </div>
          </div>
      </div>

      <script>
        let scrapedGames =[];
        let isAppReady = false;

        const appData = {
            sidebar:[
                { id: 'all', icon: 'fa-gamepad', text: 'সব গেম' },
                { id: 'sports', icon: 'fa-futbol', text: 'স্পোর্ট' },
                { id: 'casino', icon: 'fa-box', text: 'ক্যাসিনো' },
                { id: 'slot', icon: 'fa-slot-machine', fallbackIcon: 'fa-7', text: 'স্লট' },
                { id: 'crash', icon: 'fa-rocket', text: 'ক্র্যাশ' }
            ]
        };

        let currentState = { activeSidebar: 'all' };

        // ডাইনামিক স্ক্র্যাপিং (যেহেতু মূল সাইটটি এঙ্গুলার/JS দিয়ে ডাটা লোড করে, তাই আমরা MutationObserver ব্যবহার করেছি)
        function startScraping() {
            const observer = new MutationObserver((mutations, obs) => {
                // আপনার স্ক্রিনশট অনুযায়ী গেমগুলো a#casinoLoginBtn এর ভেতরে থাকে
                const gameNodes = document.querySelectorAll('a#casinoLoginBtn, a[id^="casinoLoginBtn"]');
                
                if (gameNodes.length > 0 && !isAppReady) {
                    
                    // টপ ব্যানার ইমেজ খোঁজার চেষ্টা
                    const firstImg = document.querySelector('img[src*="banner"]');
                    if(firstImg) document.getElementById('main-banner').style.backgroundImage = 'url(' + firstImg.src + ')';

                    let tempGames =[];
                    gameNodes.forEach((node, index) => {
                        const img = node.querySelector('img');
                        const imgSrc = img ? img.src : '';
                        
                        const dl = node.querySelector('dl, .entrance-title');
                        const title = dl ? dl.innerText.trim() : ('Game ' + (index + 1));
                        
                        // নামের উপর ভিত্তি করে ক্যাটাগরি তৈরি করা
                        let cat = 'casino';
                        if(title.toLowerCase().includes('sport')) cat = 'sports';
                        else if(title.toLowerCase().includes('aviator') || title.toLowerCase().includes('crash')) cat = 'crash';
                        else if(title.toLowerCase().includes('slot') || title.toLowerCase().includes('jili')) cat = 'slot';

                        if(imgSrc && title) {
                            tempGames.push({
                                id: index,
                                name: title,
                                image: imgSrc,
                                category: cat,
                                originalNode: node  // ক্লিক কাজ করানোর জন্য অরিজিনাল নোড সেভ রাখা হলো
                            });
                        }
                    });

                    if (tempGames.length > 0) {
                        scrapedGames = tempGames;
                        isAppReady = true;
                        
                        // ডাটা পাওয়া গেলে লোডিং স্ক্রিন বন্ধ করে নতুন অ্যাপ দেখানো
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('app-container').style.display = 'flex';
                        
                        renderSidebar();
                        updateContent();
                    }
                }
            });

            // বডি অবজেক্ট অবজার্ভ করা শুরু
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // অরিজিনাল সাইটের লগিন বাটন ট্রিগার করা
        function triggerLogin() {
            const oldLogin = document.querySelector('button, a[href*="login"]');
            if(oldLogin) oldLogin.click();
            else alert('Login Feature will be triggered here!');
        }

        // গেম প্লে বাটন (ম্যাজিক ট্রিক: নতুন ডিজাইনে ক্লিক করলে অরিজিনাল ডিজাইনে হিডেন অবস্থায় ক্লিক পড়বে)
        window.playGame = function(gameId) {
            const game = scrapedGames.find(g => g.id === gameId);
            if(game && game.originalNode) {
                game.originalNode.click(); 
            }
        };

        function renderSidebar() {
            const sidebar = document.getElementById('sidebar');
            let html = '';
            appData.sidebar.forEach(item => {
                let activeClass = currentState.activeSidebar === item.id ? 'active' : '';
                let iconClass = item.fallbackIcon || item.icon;
                html += '<div class="sidebar-item ' + activeClass + '" onclick="changeSidebar(\\'' + item.id + '\\')">';
                html += '<i class="fa-solid ' + iconClass + '"></i>';
                html += '<span>' + item.text + '</span>';
                html += '</div>';
            });
            sidebar.innerHTML = html;
        }

        window.changeSidebar = function(id) {
            if(currentState.activeSidebar !== id) {
                currentState.activeSidebar = id;
                renderSidebar();
                updateContent();
            }
        };

        function updateContent() {
            const contentArea = document.getElementById('content-area');
            
            // সাইডবারের ক্যাটাগরি অনুযায়ী গেম ফিল্টার
            let displayGames = scrapedGames;
            if(currentState.activeSidebar !== 'all') {
                displayGames = scrapedGames.filter(g => g.category === currentState.activeSidebar);
            }
            if(displayGames.length === 0) displayGames = scrapedGames;

            let sectionTitle = appData.sidebar.find(s => s.id === currentState.activeSidebar).text;
            
            let html = '<div class="fade-enter">';
            html += '<div class="section-header">';
            html += '<div class="section-title">| ' + sectionTitle + '</div>';
            html += '<select class="filter-select"><option>Filter</option></select>';
            html += '</div>';

            html += '<div class="games-grid">';
            displayGames.forEach(game => {
                html += '<div class="game-card" onclick="playGame(' + game.id + ')">';
                html += '<div class="game-img-placeholder" style="background-image: url(\\'' + game.image + '\\');"></div>';
                html += '<div class="game-info">';
                html += '<span class="game-name">' + game.name + '</span>';
                html += '<i class="fa-regular fa-heart heart-icon" onclick="event.stopPropagation(); this.classList.toggle(\\'fa-regular\\'); this.classList.toggle(\\'fa-solid\\'); this.style.color = this.classList.contains(\\'fa-solid\\') ? \\'var(--accent-red)\\' : \\'var(--text-white)\\';"></i>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div></div>';

            contentArea.innerHTML = html;
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // স্ক্রিপ্ট চালু করা
        document.addEventListener('DOMContentLoaded', startScraping);
      </script>
    `;
    element.append(scriptContent, { html: true });
  }
}