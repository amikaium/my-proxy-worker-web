const TARGET_DOMAIN = "1xbd.win";

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // আপনি যে ডোমেইন (velkix.live বা অন্য কিছু) থেকেই রিকোয়েস্ট করুন না কেন,
  // ওয়ার্কার সবসময় মেইন সাইট (1xbd.win) থেকে ডাটা নিয়ে আসবে।
  url.hostname = TARGET_DOMAIN;

  const modifiedRequest = new Request(url.toString(), {
    headers: new Headers(request.headers),
    method: request.method,
    body: request.body,
    redirect: 'follow'
  });

  // সিকিউরিটি এবং CORS বাইপাস করার জন্য অরিজিনাল হেডার সেট করা
  modifiedRequest.headers.set('Host', TARGET_DOMAIN);
  modifiedRequest.headers.set('Origin', `https://${TARGET_DOMAIN}`);
  modifiedRequest.headers.set('Referer', `https://${TARGET_DOMAIN}/`);

  const response = await fetch(modifiedRequest);
  const contentType = response.headers.get("Content-Type") || "";

  // API ব্লকিং এড়াতে নতুন রেসপন্সে CORS অ্যালাও করে দেওয়া হলো
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');

  // শুধুমাত্র HTML পেজ হলে আমরা আমাদের ডিজাইন বসাবো
  if (contentType.includes("text/html")) {
    return new HTMLRewriter()
      .on("head", new HeadRewriter())
      .on("body", new BodyRewriter())
      .transform(newResponse);
  }
  
  return newResponse;
}

// ==========================================
// ১. Head Rewriter: আগের ডিজাইন কভার করা (Angular Lazy-Load ঠিক রাখার জন্য)
// ==========================================
class HeadRewriter {
  element(element) {
    element.append(`
      <style>
        /* আগের সাইটটি যেন ব্যাকগ্রাউন্ডে লোড হতে পারে তাই সেটিকে ডিলিট না করে কভার করা হলো */
        body { margin: 0; padding: 0; overflow: hidden !important; }
        app-root, .mian-wrap {
            position: absolute !important;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1; /* একদম নিচে */
            opacity: 0.01 !important; /* প্রায় অদৃশ্য কিন্তু ব্রাউজার রেন্ডার করবে */
            pointer-events: none !important; /* কোনো ক্লিক লাগবে না */
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

        #new-ui-root {
            width: 100%;
            height: 100vh;
            background-color: var(--bg-dark);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 999999999; /* সবার উপরে */
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        header { background-color: var(--bg-header); height: 50px; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; flex-shrink: 0; border-bottom: 1px solid #111;}
        .logo { color: var(--text-white); font-size: 24px; font-weight: 900; font-style: italic; }
        .logo span { color: #5bc0de; }
        .login-btn { background-color: var(--primary-blue); color: var(--text-white); border: none; padding: 6px 15px; border-radius: 4px; font-weight: bold; display: flex; align-items: center; gap: 5px; font-size: 14px; cursor: pointer; transition: 0.3s; }
        
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
        
        .games-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; }
        .game-card { background-color: var(--card-bg); border-radius: 4px; overflow: hidden; border: 1px solid #2a4365; cursor: pointer; transition: transform 0.3s ease; display: flex; flex-direction: column;}
        .game-card:hover { transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.4); border-color: var(--primary-blue); }
        .game-img-placeholder { width: 100%; height: 100px; background-color: #2c3e50; background-size: cover; background-position: center; background-repeat: no-repeat; }
        .game-info { padding: 8px; display: flex; justify-content: space-between; align-items: center; background: #0b5394; flex: 1;}
        .game-name { color: var(--text-white); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%; font-weight: bold;}
        .heart-icon { color: var(--text-white); font-size: 12px; transition: 0.2s; }

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
// ২. Body Rewriter: কাস্টম UI এবং স্মার্ট স্ক্র্যাপার 
// ==========================================
class BodyRewriter {
  element(element) {
    const scriptContent = `
      <div id="new-ui-root">
          <div id="loading-screen">
              <div class="spinner"></div>
              <p style="margin-top: 15px; font-size: 14px; color: #ffc107;" id="load-text">ডেটা লোড হচ্ছে...</p>
          </div>
          
          <div id="app-container" style="display: none; height: 100%; flex-direction: column; width: 100%; max-width: 480px; margin: 0 auto;">
              <header>
                  <div class="logo">1X<span>BDT</span></div>
                  <button class="login-btn" onclick="triggerLogin()"><i class="fa-solid fa-user"></i> Login</button>
              </header>
              <div class="top-banner" id="main-banner"></div>
              <div class="marquee-container">
                  <i class="fa-solid fa-bullhorn"></i>
                  <marquee scrollamount="4">সব গেম এখন নতুন ডিজাইনে। খেলুন এবং উপভোগ করুন!</marquee>
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
                { id: 'sports', icon: 'fa-futbol', text: 'স্পোর্টস' },
                { id: 'casino', icon: 'fa-box', text: 'ক্যাসিনো' },
                { id: 'slot', fallbackIcon: 'fa-7', icon: 'fa-slot-machine', text: 'স্লট' },
                { id: 'table', icon: 'fa-layer-group', text: 'টেবিল' },
                { id: 'crash', icon: 'fa-rocket', text: 'ক্র্যাশ' }
            ]
        };

        let currentState = { activeSidebar: 'all' };

        function startScraping() {
            const observer = new MutationObserver((mutations, obs) => {
                
                // স্ক্র্যাপ করার জন্য সম্ভাব্য সকল গেম লিংক খোঁজা হচ্ছে
                const allLinks = Array.from(document.querySelectorAll('a'));
                const gameNodes = allLinks.filter(a => a.id === 'casinoLoginBtn' || a.querySelector('.entrance-title') || a.querySelector('img[src*="Image"]'));
                
                // অন্তত ৪টি গেম পেলেই আমরা কাস্টম সাইট ওপেন করে দেবো
                if (gameNodes.length >= 4 && !isAppReady) {
                    
                    const firstImg = document.querySelector('img[src*="banner"]');
                    if(firstImg && firstImg.src) {
                        document.getElementById('main-banner').style.backgroundImage = 'url(' + firstImg.src + ')';
                    }

                    let tempGames =[];
                    gameNodes.forEach((node, index) => {
                        const img = node.querySelector('img');
                        const imgSrc = img ? img.src : '';
                        
                        const titleNode = node.querySelector('.entrance-title, dl');
                        const title = titleNode ? titleNode.innerText.trim() : ('গেম ' + (index + 1));
                        
                        let cat = 'casino';
                        let titleLower = title.toLowerCase();
                        if(titleLower.includes('sport') || titleLower.includes('race')) cat = 'sports';
                        else if(titleLower.includes('aviator') || titleLower.includes('crash')) cat = 'crash';
                        else if(titleLower.includes('slot') || titleLower.includes('jili') || titleLower.includes('spin')) cat = 'slot';
                        else if(titleLower.includes('poker') || titleLower.includes('roulette') || titleLower.includes('matka')) cat = 'table';

                        if(imgSrc && title) {
                            tempGames.push({
                                id: index,
                                name: title,
                                image: imgSrc,
                                category: cat,
                                originalNode: node 
                            });
                        }
                    });

                    if (tempGames.length > 0) {
                        scrapedGames = tempGames;
                        isAppReady = true;
                        obs.disconnect(); 
                        
                        document.getElementById('loading-screen').style.display = 'none';
                        document.getElementById('app-container').style.display = 'flex';
                        
                        renderSidebar();
                        updateContent();
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // যদি ১২ সেকেন্ড পরও ডাটা না পায় তবে মেসেজ চেঞ্জ হবে
            setTimeout(() => {
                if(!isAppReady) {
                    document.getElementById('load-text').innerText = "অনুগ্রহ করে আরেকটু অপেক্ষা করুন...";
                }
            }, 12000);
        }

        window.triggerLogin = function() {
            const oldLogin = document.querySelector('.login-btn, button[class*="login"], a[href*="login"]');
            if(oldLogin) oldLogin.click();
            else alert('Login Triggered!');
        };

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
            
            let displayGames = scrapedGames;
            if(currentState.activeSidebar !== 'all') {
                displayGames = scrapedGames.filter(g => g.category === currentState.activeSidebar);
            }
            if(displayGames.length === 0) displayGames = scrapedGames;

            let sectionTitle = appData.sidebar.find(s => s.id === currentState.activeSidebar).text;
            
            let html = '<div class="fade-enter">';
            html += '<div class="section-header">';
            html += '<div class="section-title">| ' + sectionTitle + '</div>';
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

        document.addEventListener('DOMContentLoaded', startScraping);
      </script>
    `;
    element.append(scriptContent, { html: true });
  }
}