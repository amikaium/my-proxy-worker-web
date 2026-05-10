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
// 🎨 UI: LANDING PAGE
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
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" id="main-search" placeholder="Enter tracking ID, project keyword or node number..." autocomplete="off" spellcheck="false" class="w-full bg-transparent text-white text-sm px-4 py-3 placeholder-gray-600 tracking-wide font-medium min-w-0">
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
            <span class="text-xl font-black tracking-tighter">CipherTech</span><span class="text-lg font-bold tracking-widest">NOVA NETWORKS</span><span class="text-xl font-light tracking-wide border-2 border-current px-2">ORBITAL</span><span class="text-lg font-serif italic font-bold">FinSecure Group</span><span class="text-xl font-bold uppercase tracking-widest">Apex Node</span>
        </div>
    </div>
    <footer class="pt-16 pb-10 px-6 bg-[#030303]">
        <div class="max-w-7xl mx-auto flex flex-col items-center gap-4"><p class="text-[10px] text-gray-600 uppercase tracking-widest">&copy; 2026 Nexus Digital Enterprise Security. All rights reserved.</p></div>
    </footer>
    <script>
        document.getElementById('search-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = document.getElementById('main-search').value.trim();
            if(!q) return;
            document.getElementById('btn-text').classList.add('hidden'); document.getElementById('search-spinner').classList.remove('hidden'); document.getElementById('main-search').disabled = true;
            try {
                const res = await fetch('/api/access', { method: 'POST', body: JSON.stringify({ code: q }) });
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('search-msg').style.color = '#4ade80'; document.getElementById('search-msg').innerText = 'RECORD FOUND. FETCHING DETAILS...'; document.getElementById('search-msg').style.opacity = '1';
                    setTimeout(() => window.location.href = data.role === 'admin' ? '/admin' : '/dashboard', 800);
                } else {
                    setTimeout(() => {
                        document.getElementById('btn-text').classList.remove('hidden'); document.getElementById('search-spinner').classList.add('hidden'); document.getElementById('main-search').disabled = false; document.getElementById('main-search').value = '';
                        document.getElementById('search-msg').style.color = '#ef4444'; document.getElementById('search-msg').innerText = 'NO RECORDS FOUND'; document.getElementById('search-msg').style.opacity = '1';
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

        // --- API PROXY ---
        if (path === "/__api_proxy") {
            let reqOrigin = request.headers.get("Origin") || url.origin;
            if (request.method === "OPTIONS") {
                return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": reqOrigin, "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, X-Requested-With, Accept, sid, Token, token, sid-x", "Access-Control-Allow-Credentials": "true", "Access-Control-Max-Age": "86400" } });
            }
            const targetUrlStr = url.searchParams.get("target");
            if(!targetUrlStr) return new Response("Bad Target", {status:400});
            const tObj = new URL(targetUrlStr);
            const proxyHeaders = new Headers(request.headers);
            let originSpoof = tObj.origin;
            if (isProxyActive) {
                let pDataString = decrypt(isProxyActive);
                if(pDataString){ try{ let pData=JSON.parse(pDataString); if(pData.t){ let o=new URL(pData.t); originSpoof=o.origin; } }catch(e){} }
            }
            proxyHeaders.set("Host", tObj.hostname); proxyHeaders.set("Origin", originSpoof); proxyHeaders.set("Referer", originSpoof+"/"); proxyHeaders.delete("Accept-Encoding");
            const cleanCookieStr = Object.entries(cookies).filter(([k]) => k!=='portal_session'&&k!=='proxy_active'&&k!=='admin_session').map(([k,v])=>`${k}=${v}`).join('; ');
            if(cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");
            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if(["POST","PUT","PATCH","DELETE"].includes(request.method)) fetchConfig.body = request.body;
            try{
                const proxyRes = await fetch(targetUrlStr, fetchConfig);
                const responseHeaders = new Headers();
                for(const[key,value] of proxyRes.headers.entries()){
                    if(key.toLowerCase()==='set-cookie'){ let mc=value.replace(/Domain=[^;]+;?\s*/gi,''); responseHeaders.append('Set-Cookie', mc); }
                    else if(key.toLowerCase()!=='access-control-allow-origin'){ responseHeaders.append(key, value); }
                }
                responseHeaders.set("Access-Control-Allow-Origin", reqOrigin); responseHeaders.set("Access-Control-Allow-Credentials", "true");
                return new Response(proxyRes.body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
            }catch(e){ return new Response("API Proxy Error", { status: 500 }); }
        }
        if (path === "/__ws_proxy" && request.headers.get("Upgrade") === "websocket") {
            const targetUrlStr = url.searchParams.get("target"); if(!targetUrlStr) return new Response("Bad Target",{status:400});
            const tObj = new URL(targetUrlStr); const wsHeaders = new Headers(request.headers);
            wsHeaders.set("Host", tObj.hostname); wsHeaders.set("Origin", tObj.origin);
            return fetch(targetUrlStr, { headers: wsHeaders });
        }

        // --- LOGIN ---
        if (path === "/api/access" && request.method === "POST") {
            const { code } = await request.json(); const strCode = String(code).trim();
            if (db.adminPin && db.adminPin !== "SET_YOUR_PIN_HERE" && strCode === String(db.adminPin).trim()) {
                const headers = new Headers(); headers.set("Content-Type", "application/json");
                headers.append("Set-Cookie", `admin_session=${CONFIG.SESSION_SECRET}; Path=/; HttpOnly; Max-Age=864000; SameSite=Lax`);
                return new Response(JSON.stringify({ success: true, role: 'admin' }), { headers });
            }
            if (db.pins && db.pins[strCode]) {
                const headers = new Headers(); headers.set("Content-Type", "application/json");
                headers.append("Set-Cookie", `portal_session=${strCode}; Path=/; HttpOnly; Max-Age=864000; SameSite=Lax`);
                return new Response(JSON.stringify({ success: true, role: 'user' }), { headers });
            }
            return new Response("Invalid", { status: 401 });
        }

        if (path === "/api/update-password" && request.method === "POST") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const { siteId, accIdx, newPassword } = await request.json();
            let confs = db.pins[userPin].siteConf[siteId];
            if (!Array.isArray(confs)) confs = [confs];
            if (confs[accIdx]) { confs[accIdx].p = newPassword; db.pins[userPin].siteConf[siteId] = confs; await updateDB(db); return new Response(JSON.stringify({ success: true })); }
            return new Response("Error", {status: 400});
        }

        if (path === "/logout" || path === "/api/stop-proxy") {
            return new Response("Logged out", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
        }

        const customModalScript = `
        <div id="c-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div class="bg-[#0a0a0a] border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col rounded-md">
                <h3 id="cm-title" class="text-white font-bold tracking-widest mb-3 uppercase text-sm"></h3>
                <p id="cm-text" class="text-gray-400 text-xs mb-6 leading-relaxed"></p>
                <input type="text" id="cm-input" class="hidden w-full bg-black border border-white/10 p-3 text-xs mb-5 outline-none focus:border-indigo-500 text-white rounded-sm" autocomplete="off">
                <div class="flex gap-3 justify-end">
                    <button id="cm-cancel" class="hidden px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-widest transition border border-white/5 rounded-sm">Cancel</button>
                    <button id="cm-confirm" class="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 text-[10px] font-bold uppercase tracking-widest transition shadow-[0_0_15px_rgba(99,102,241,0.4)] rounded-sm">Confirm</button>
                </div>
            </div>
        </div>
        <script>
            const CustomModal={show:function({type,title,text,placeholder,onConfirm}){
                const m=document.getElementById('c-modal'),tt=document.getElementById('cm-title'),tx=document.getElementById('cm-text'),inp=document.getElementById('cm-input'),bCan=document.getElementById('cm-cancel'),bCon=document.getElementById('cm-confirm');
                tt.innerHTML=title;tx.innerHTML=text;inp.value='';inp.placeholder=placeholder||'';
                inp.classList.add('hidden');bCan.classList.add('hidden');
                if(type==='prompt'){inp.classList.remove('hidden');bCan.classList.remove('hidden');setTimeout(()=>inp.focus(),100);}
                else if(type==='confirm'){bCan.classList.remove('hidden');}
                m.classList.remove('hidden');
                bCan.onclick=()=>{m.classList.add('hidden');if(type==='prompt')onConfirm(null);else onConfirm(false);};
                bCon.onclick=()=>{m.classList.add('hidden');if(type==='prompt')onConfirm(inp.value.trim());else onConfirm(true);};
                inp.onkeypress=(e)=>{if(e.key==='Enter')bCon.click();};
            }};
        </script>`;

        // --- 🛠️ ADMIN PANEL ---
        if (path.startsWith("/admin")) {
            if (!isAdmin) return Response.redirect(url.origin, 302);
            if (path === "/admin/api/data") return new Response(JSON.stringify(db));
            if (path === "/admin/api/save" && request.method === "POST") { const nd = await request.json(); await updateDB(nd); return new Response("Saved"); }

            const adminHTML = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Portal</title><script src="https://cdn.tailwindcss.com"></script>
            <style>body{background-color:#030303;color:white;font-family:'Inter',sans-serif}.square-card{background:#0a0a0a;border:1px solid rgba(255,255,255,0.05)}.active-tab{border-bottom:2px solid #818cf8;color:white}.square-checkbox{appearance:none;width:14px;height:14px;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);cursor:pointer;position:relative;transition:all 0.2s;border-radius:2px}.square-checkbox:checked{background:#6366f1;border-color:#6366f1}.square-checkbox:checked::after{content:'✓';position:absolute;color:white;font-size:10px;font-weight:bold;left:2px;top:-1px}.square-select{appearance:none;background:#000;border:1px solid rgba(255,255,255,0.2);outline:none;cursor:pointer;border-radius:2px}.square-select:focus{border-color:#6366f1}.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}</style></head>
            <body class="pb-28">${customModalScript}
                <header class="sticky top-0 z-40 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-4 md:p-6 shadow-md w-full"><div><h1 class="text-lg md:text-xl font-bold tracking-widest uppercase text-indigo-400">Master <span class="text-white">Admin</span></h1></div><a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition whitespace-nowrap rounded-sm">Logout</a></header>
                <div class="max-w-6xl mx-auto p-4 md:p-8" id="app"><div class="flex justify-center items-center h-40"><div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div></div>
                <div class="fixed bottom-0 left-0 w-full bg-[#050505] border-t border-white/10 p-4 z-50 flex justify-center backdrop-blur-md"><button id="save-btn" onclick="save()" class="w-full max-w-sm bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-sm">SAVE ALL CHANGES</button></div>
                <script>
                    let db={};let tab='pins';let openPins=new Set();let searchQuery='';
                    async function load(){const res=await fetch('/admin/api/data');db=await res.json();normalizeDB();render();}
                    function normalizeDB(){if(!db.sites)db.sites={};if(!db.pins)db.pins={};Object.keys(db.pins).forEach(pin=>{if(db.pins[pin].siteConf){Object.keys(db.pins[pin].siteConf).forEach(siteId=>{if(!Array.isArray(db.pins[pin].siteConf[siteId])){db.pins[pin].siteConf[siteId]=[db.pins[pin].siteConf[siteId]];}})}});}
                    async function save(){document.getElementById('save-btn').innerText='SAVING...';await fetch('/admin/api/save',{method:'POST',body:JSON.stringify(db)});setTimeout(()=>{document.getElementById('save-btn').innerText='SAVE ALL CHANGES';CustomModal.show({type:'alert',title:'<span class="text-green-500">✔</span> Success',text:'Database Successfully Updated!'});},500);}
                    function uPinSt(pin,val){db.pins[pin].status=val;render();}
                    function uPinF(pin,field,val){db.pins[pin][field]=val;}
                    function uSiteF(id,f,val){db.sites[id][f]=val;}
                    function uSet(f,val){db.settings[f]=val;}
                    function toggleSite(pin,siteId,chk){let list=db.pins[pin].sites||[];if(!db.pins[pin].siteConf)db.pins[pin].siteConf={};if(chk&&!list.includes(siteId)){list.push(siteId);db.pins[pin].siteConf[siteId]=[{u:'',r:'Admin',p:''}];}else if(!chk){list=list.filter(i=>i!==siteId);delete db.pins[pin].siteConf[siteId];}db.pins[pin].sites=list;render();}
                    function uPinSiteConf(pin,siteId,idx,field,val){db.pins[pin].siteConf[siteId][idx][field]=val;}
                    function addPinSiteAcc(pin,siteId){db.pins[pin].siteConf[siteId].push({u:'',r:'Admin',p:''});render();}
                    function delPinSiteAcc(pin,siteId,idx){db.pins[pin].siteConf[siteId].splice(idx,1);if(db.pins[pin].siteConf[siteId].length===0){let list=db.pins[pin].sites||[];db.pins[pin].sites=list.filter(i=>i!==siteId);delete db.pins[pin].siteConf[siteId];}render();}
                    function addSite(){db.sites['s_'+Date.now()]={name:'',agentLink:'',userLink:'',apiLink:''};tab='sites';render();}
                    function addPin(){CustomModal.show({type:'prompt',title:'New User',text:'Enter User Name:',onConfirm:(name)=>{if(!name)return;CustomModal.show({type:'prompt',title:'Set PIN',text:'Enter Secret PIN:',onConfirm:(p)=>{if(p&&!db.pins[p]){db.pins[p]={name:name,status:'active',sites:[],siteConf:{}};openPins.add(p);tab='pins';render();}else if(db.pins[p]){CustomModal.show({type:'alert',title:'<span class="text-red-500">✖</span> Error',text:'PIN already exists!'});}}});}});}
                    function delSite(id){CustomModal.show({type:'confirm',title:'<span class="text-red-500">⚠</span> Delete',text:'Sure?',onConfirm:(yes)=>{if(yes){delete db.sites[id];render();}}});}
                    function delPin(pin){CustomModal.show({type:'confirm',title:'<span class="text-red-500">⚠</span> Delete',text:'Sure?',onConfirm:(yes)=>{if(yes){delete db.pins[pin];render();}}});}
                    function toggleAdminPin(pin){if(openPins.has(pin))openPins.delete(pin);else openPins.add(pin);render();}
                    function render(){
                        if(!db.sites)db.sites={};if(!db.pins)db.pins={};if(!db.settings)db.settings={whatsapp:'',notification:{enabled:false,target:'all',specificUsers:[]}};
                        let h='<div class="flex gap-6 mb-8 border-b border-white/10 px-2 overflow-x-auto custom-scrollbar"><button onclick="tab=\\'pins\\';render()" class="pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors '+(tab==='pins'?'active-tab':'text-gray-500 hover:text-gray-300')+'">User Pins</button><button onclick="tab=\\'sites\\';render()" class="pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors '+(tab==='sites'?'active-tab':'text-gray-500 hover:text-gray-300')+'">Global Sites</button><button onclick="tab=\\'settings\\';render()" class="pb-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors '+(tab==='settings'?'active-tab':'text-gray-500 hover:text-gray-300')+'">Settings</button></div>';
                        if(tab==='pins'){
                            h+='<div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"><input type="text" placeholder="Search..." value="'+searchQuery+'" oninput="searchQuery=this.value.toLowerCase();render()" class="w-full md:w-1/2 bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-indigo-500 rounded-sm"><button onclick="addPin()" class="w-full md:w-auto bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition whitespace-nowrap rounded-sm">+ Add User</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-5">';
                            Object.keys(db.pins).filter(p=>p.toLowerCase().includes(searchQuery)||(db.pins[p].name||'').toLowerCase().includes(searchQuery)).forEach(pin=>{
                                let pData=db.pins[pin];let st=pData.status;let bg=st==='active'?'text-green-400 border-green-400/20 bg-green-400/10':'text-red-400 border-red-400/20 bg-red-400/10';let isOpen=openPins.has(pin);
                                h+='<div class="square-card flex flex-col rounded-md '+(st==='suspended'?'opacity-70 grayscale':'')+'"><div class="flex justify-between items-center p-5 cursor-pointer hover:bg-white/5 transition rounded-t-md" onclick="toggleAdminPin(\\''+pin+'\\')"><div class="flex flex-col truncate pr-4"><span class="text-lg font-bold text-white truncate">'+(pData.name||'Unnamed')+'</span><span class="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-1">PIN: '+pin+'</span></div><div class="flex items-center gap-4 flex-shrink-0"><select onclick="event.stopPropagation()" onchange="uPinSt(\\''+pin+'\\',this.value)" class="square-select text-[9px] font-bold uppercase tracking-widest px-2 py-1 '+bg+'"><option value="active" '+(st==='active'?'selected':'')+'>ACTIVE</option><option value="suspended" '+(st==='suspended'?'selected':'')+'>SUSPEND</option></select><svg class="w-4 h-4 text-gray-500 transition-transform duration-300 '+(isOpen?'rotate-180':'')+'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div></div><div class="'+(isOpen?'block':'hidden')+' p-5 border-t border-white/5 bg-black/40 rounded-b-md"><div class="mb-4"><label class="text-[8px] uppercase tracking-widest text-gray-500 mb-1 block">Edit Name</label><input value="'+(pData.name||'')+'" oninput="uPinF(\\''+pin+'\\',\\'name\\',this.value)" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-white outline-none focus:border-indigo-500 rounded-sm"></div><span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Assign Sites:</span><div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">';
                                Object.keys(db.sites).forEach(siteId=>{
                                    let hasSite=(pData.sites||[]).includes(siteId);
                                    h+='<div class="bg-[#0a0a0a] border border-white/10 p-3 rounded-sm mb-2"><label class="flex items-center gap-3 text-xs cursor-pointer mb-2"><input type="checkbox" '+(hasSite?'checked':'')+' onchange="toggleSite(\\''+pin+'\\',\\''+siteId+'\\',this.checked)" class="square-checkbox w-4 h-4"><span class="truncate text-gray-300 font-bold">'+(db.sites[siteId].name||'Unnamed')+'</span></label>';
                                    if(hasSite){
                                        let confs=pData.siteConf?.[siteId]||[];if(!Array.isArray(confs))confs=[confs];
                                        confs.forEach((conf,idx)=>{
                                            h+='<div class="mt-2 p-3 bg-white/5 border border-white/5 rounded-sm relative"><button onclick="delPinSiteAcc(\\''+pin+'\\',\\''+siteId+'\\','+idx+')" class="absolute top-2 right-2 text-red-500 hover:text-red-400 bg-red-500/10 w-5 h-5 flex items-center justify-center rounded-sm">✖</button><div class="flex gap-2 mb-2 pr-6"><select onchange="uPinSiteConf(\\''+pin+'\\',\\''+siteId+'\\','+idx+',\\'r\\',this.value)" class="square-select w-1/3 bg-black border border-white/10 p-2 text-[10px] text-gray-300 outline-none"><option value="Admin" '+(conf.r==='Admin'?'selected':'')+'>Admin</option><option value="Super Agent" '+(conf.r==='Super Agent'?'selected':'')+'>Super Ag</option><option value="Master Agent" '+(conf.r==='Master Agent'?'selected':'')+'>Master Ag</option><option value="User" '+(conf.r==='User'?'selected':'')+'>User</option></select><input value="'+(conf.u||'')+'" oninput="uPinSiteConf(\\''+pin+'\\',\\''+siteId+'\\','+idx+',\\'u\\',this.value)" placeholder="Username" class="w-2/3 bg-black border border-white/10 p-2 text-[10px] text-white outline-none rounded-sm"></div><input value="'+(conf.p||'')+'" oninput="uPinSiteConf(\\''+pin+'\\',\\''+siteId+'\\','+idx+',\\'p\\',this.value)" placeholder="Password" class="w-full bg-black border border-white/10 p-2 text-[10px] text-white outline-none rounded-sm"></div>';
                                        });
                                        h+='<button onclick="addPinSiteAcc(\\''+pin+'\\',\\''+siteId+'\\')" class="mt-3 w-full py-2 bg-indigo-500/10 text-[9px] text-indigo-400 font-bold uppercase tracking-widest hover:bg-indigo-500/20 hover:text-white transition rounded-sm border border-indigo-500/20">+ Add Account</button>';
                                    }
                                    h+='</div>';
                                });
                                h+='</div><button onclick="delPin(\\''+pin+'\\')" class="mt-5 w-full py-2.5 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition border border-red-900/30 rounded-sm">Delete User</button></div></div>';
                            });
                            h+='</div>';
                        }
                        if(tab==='sites'){
                            h+='<div class="flex justify-between items-center mb-6"><h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Website Directory</h3><button onclick="addSite()" class="bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition rounded-sm">+ Add Site</button></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">';
                            Object.keys(db.sites).forEach(id=>{
                                h+='<div class="square-card p-5 flex flex-col rounded-md"><div class="mb-4"><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">Site Name</span><input value="'+(db.sites[id].name||'')+'" oninput="uSiteF(\\''+id+'\\',\\'name\\',this.value)" placeholder="Enter Name..." class="w-full bg-transparent text-xl font-bold text-white border-b border-white/10 outline-none pb-1 focus:border-indigo-500"></div><div class="space-y-3 mb-5 flex-grow"><div><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">Agent Link</span><input value="'+(db.sites[id].agentLink||'')+'" oninput="uSiteF(\\''+id+'\\',\\'agentLink\\',this.value)" placeholder="https://..." class="w-full bg-black/50 border border-white/10 p-2 text-xs text-green-400 outline-none rounded-sm"></div><div><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">User Link</span><input value="'+(db.sites[id].userLink||'')+'" oninput="uSiteF(\\''+id+'\\',\\'userLink\\',this.value)" placeholder="ag.example.com" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-blue-400 outline-none rounded-sm"></div><div><span class="text-[8px] text-gray-500 uppercase tracking-widest mb-1 block">API Link</span><input value="'+(db.sites[id].apiLink||'')+'" oninput="uSiteF(\\''+id+'\\',\\'apiLink\\',this.value)" placeholder="https://liveapi247.live" class="w-full bg-black/50 border border-white/10 p-2 text-xs text-purple-400 outline-none rounded-sm"></div></div><button onclick="delSite(\\''+id+'\\')" class="w-full py-2.5 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition border border-red-900/30 rounded-sm">Delete Site</button></div>';
                            });
                            h+='</div>';
                        }
                        if(tab==='settings'){h+='<div class="square-card p-6 rounded-md max-w-md"><h2 class="text-sm font-bold tracking-widest uppercase mb-6 text-green-500">WhatsApp</h2><label class="text-[9px] uppercase tracking-widest text-gray-500 mb-1 block">Phone</label><input value="'+(db.settings.whatsapp||'')+'" oninput="uSet(\\'whatsapp\\',this.value)" placeholder="+8801..." class="w-full bg-black/50 border border-white/10 p-3 text-sm outline-none focus:border-green-500 text-green-400 rounded-sm"></div>';}
                        document.getElementById('app').innerHTML=h;
                    }
                    load();
                </script>
            </body></html>`;
            return new Response(adminHTML, { headers: { "Content-Type": "text/html" } });
        }

        // --- 💻 USER DASHBOARD ---
        if (path === "/dashboard") {
            if (!isUser) return Response.redirect(url.origin, 302);
            const userData = db.pins[userPin];
            let sitesHTML = '';
            if (userData.sites && userData.sites.length > 0) {
                userData.sites.forEach(siteId => {
                    const site = db.sites[siteId]; if (!site) return;
                    const isSuspended = userData.status === 'suspended';
                    const safeSiteName = (site.name || 'Unnamed').replace(/'/g, "\\'");
                    let confs = userData.siteConf?.[siteId] ||[]; if (!Array.isArray(confs)) confs = [confs];
                    let accountsHtml = '';
                    confs.forEach((conf, idx) => {
                        let roleColor = conf.r==='Admin'?'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300':conf.r==='Super Agent'?'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-300':'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-300';
                        const hasPwd = conf.p && conf.p.trim() !== '';
                        const loginAction = hasPwd ? `window.location.href='/api/start-proxy?id=${siteId}&acc=${idx}'` : `CustomModal.show({type:'alert',title:'<span style="color:#f87171">⚠</span> Error',text:'No password set.'})`;
                        accountsHtml += '<div class="border border-white/5 bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] rounded-lg p-5 relative shadow-sm group"><div class="flex justify-between items-center mb-4"><span class="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm bg-gradient-to-r '+roleColor+' border">'+conf.r+'</span></div><div class="space-y-3 mb-4"><div class="bg-black/50 border border-white/5 flex items-center rounded-md overflow-hidden"><div class="bg-white/5 px-3 py-2.5 border-r border-white/5"><svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2"/></svg></div><input type="text" readonly value="'+(conf.u||'')+'" class="flex-grow bg-transparent text-[12px] text-white px-3 py-2.5 outline-none truncate select-all font-mono"><button onclick="copyText(\\''+(conf.u||'').replace(/'/g,"\\\\'")+'\\',this)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all rounded-md m-1" title="Copy"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg></button></div><div class="bg-black/50 border border-white/5 flex items-center rounded-md overflow-hidden"><div class="bg-white/5 px-3 py-2.5 border-r border-white/5"><svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-width="2"/></svg></div><input type="text" readonly value="'+(conf.p||'')+'" id="pwd-disp-'+siteId+'-'+idx+'" class="flex-grow bg-transparent text-[12px] text-white px-3 py-2.5 outline-none truncate font-mono" style="-webkit-text-security:disc"><div class="flex gap-0.5 pr-1"><button onclick="toggleVis(\\'pwd-disp-'+siteId+'-'+idx+'\\',this)" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all rounded-md" title="Show"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-width="2"/></svg></button><button onclick="toggleEdit(\\''+siteId+'-'+idx+'\\')" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all rounded-md" title="Edit"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-width="2"/></svg></button></div></div><div id="pwd-edit-'+siteId+'-'+idx+'" class="hidden flex gap-2 pt-2 border-t border-white/5"><input type="text" id="pwd-in-'+siteId+'-'+idx+'" placeholder="New password..." class="flex-grow bg-black/50 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-yellow-500 rounded-md"><button onclick="savePwd(\\''+siteId+'\\','+idx+')" class="px-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black transition-all text-[9px] font-bold uppercase tracking-widest rounded-md">Save</button></div></div>'+(isSuspended?'<button disabled class="w-full py-3 bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] cursor-not-allowed border border-white/5 rounded-md">Suspended</button>':'<button onclick="'+loginAction+'" class="w-full py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] rounded-md group"><span>Launch Proxy</span><svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke-width="2"/></svg></button>')+'</div>';
                    });
                    sitesHTML += '<div class="border border-white/5 bg-gradient-to-br from-[#0a0a0a] to-[#060606] flex flex-col rounded-lg shadow-lg overflow-hidden '+(isSuspended?'opacity-60 grayscale':'')+'"><div class="flex justify-between items-center p-5 cursor-pointer hover:bg-white/[0.02] transition" onclick="toggleDetails(\\''+siteId+'\\')"><div class="flex items-center gap-4"><div class="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center rounded-lg"><svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" stroke-width="1.5"/></svg></div><div class="overflow-hidden"><h2 class="text-lg font-bold text-white truncate">'+safeSiteName+'</h2><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">'+confs.length+' Account'+(confs.length>1?'s':'')+'</p></div></div><div class="flex items-center gap-3"><span class="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border '+(isSuspended?'text-red-400 border-red-400/20 bg-red-400/10':'text-green-400 border-green-400/20 bg-green-400/10')+'">'+(isSuspended?'Suspended':'Active')+'</span><svg id="arrow-'+siteId+'" class="w-5 h-5 text-gray-500 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2"/></svg></div></div><div id="details-'+siteId+'" class="hidden border-t border-white/5 bg-black/20 p-5 space-y-4">'+accountsHtml+'</div></div>';
                });
            } else { sitesHTML = '<p class="text-gray-500 text-xs text-center w-full mt-10">No sites assigned.</p>'; }

            const html = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Core | Portal</title><link rel="icon" type="image/jpeg" href="https://i.postimg.cc/zXbrDz13/modern-security-logo-design-safe-your-internet-privacy-1017-51245.jpg"><script src="https://cdn.tailwindcss.com"></script><style>body{background-color:#030303;color:white;font-family:'Inter',sans-serif}</style></head><body class="pb-20">${customModalScript}<header class="sticky top-0 z-40 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a] p-4 md:p-6 shadow-md w-full"><div><h1 class="text-lg md:text-xl font-bold tracking-widest uppercase text-indigo-400">ID: <span class="text-white">${userPin}</span></h1><p class="text-[9px] text-gray-500 mt-0.5 uppercase tracking-[0.2em]">Secure Node</p></div><a href="/logout" class="px-5 py-2.5 bg-red-900/20 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition rounded-md">Terminate</a></header><div class="max-w-6xl mx-auto p-4 md:p-8"><h3 class="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 border-b border-white/10 pb-2">Your Environments</h3><div class="grid grid-cols-1 lg:grid-cols-2 gap-5">${sitesHTML}</div></div><script>
                function copyText(text,btn){if(!text)return;navigator.clipboard.writeText(text);const old=btn.innerHTML;btn.innerHTML='<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="2"/></svg>';btn.classList.add('text-green-400');setTimeout(()=>{btn.innerHTML=old;btn.classList.remove('text-green-400');},1500);}
                function toggleVis(id,btn){const el=document.getElementById(id);if(el.style.webkitTextSecurity==='disc'){el.style.webkitTextSecurity='none';btn.innerHTML='<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke-width="2"/></svg>';btn.classList.remove('text-gray-400');btn.classList.add('text-green-400');}else{el.style.webkitTextSecurity='disc';btn.innerHTML='<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-width="2"/></svg>';btn.classList.remove('text-green-400');btn.classList.add('text-gray-400');}}
                function toggleDetails(id){const el=document.getElementById('details-'+id),arrow=document.getElementById('arrow-'+id);if(el.classList.contains('hidden')){el.classList.remove('hidden');arrow.classList.add('rotate-180');}else{el.classList.add('hidden');arrow.classList.remove('rotate-180');}}
                function toggleEdit(id){document.getElementById('pwd-edit-'+id).classList.toggle('hidden');}
                async function savePwd(siteId,accIdx){const pwd=document.getElementById('pwd-in-'+siteId+'-'+accIdx).value;if(!pwd)return CustomModal.show({type:'alert',title:'<span style="color:#f87171">⚠</span> Error',text:'Password cannot be empty!'});try{const res=await fetch('/api/update-password',{method:'POST',body:JSON.stringify({siteId,accIdx,newPassword:pwd})});if(res.ok){document.getElementById('pwd-disp-'+siteId+'-'+accIdx).value=pwd;document.getElementById('pwd-edit-'+siteId+'-'+accIdx).classList.add('hidden');CustomModal.show({type:'alert',title:'<span style="color:#4ade80">✔</span> Success',text:'Updated!'});}}catch(e){}}
            </script></body></html>`;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        // --- 🚀 PROXY START ---
        if (path === "/api/start-proxy") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const siteId = url.searchParams.get("id");
            const accIdx = parseInt(url.searchParams.get("acc") || "0", 10);
            const userData = db.pins[userPin];
            if (userData.status === 'suspended' || !userData.sites.includes(siteId) || !db.sites[siteId]) return new Response("Access Denied", { status: 403 });
            let confs = userData.siteConf?.[siteId] ||[]; if (!Array.isArray(confs)) confs = [confs];
            const conf = confs[accIdx] || {};
            const proxyData = JSON.stringify({ t: db.sites[siteId].agentLink, a: db.sites[siteId].apiLink || '', u: conf.u || '', p: conf.p || '', siteName: db.sites[siteId].name || '', role: conf.r || 'User' });
            const encryptedData = encrypt(proxyData);
            return new Response("Starting...", { status: 302, headers: { "Location": "/", "Set-Cookie": `proxy_active=${encryptedData}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax` } });
        }
        if (path === "/api/stop-proxy") return new Response("Stopped", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });

        // --- 🌐 GLOBAL PROXY ENGINE ---
        if (isUser && isProxyActive) {
            const proxyDataString = decrypt(isProxyActive); if(!proxyDataString) return new Response("Invalid",{status:400});
            let proxyData; try{proxyData=JSON.parse(proxyDataString);}catch(e){proxyData={t:proxyDataString,a:'',u:'',p:'',siteName:'',role:'User'};}
            const targetDomain=proxyData.t, autoApi=proxyData.a, autoUser=proxyData.u, autoPwd=proxyData.p, siteName=proxyData.siteName||'Panel', roleName=proxyData.role||'User';
            const targetUrl=new URL(request.url); const tDomainObj=new URL(targetDomain);
            targetUrl.hostname=tDomainObj.hostname; targetUrl.protocol=tDomainObj.protocol; targetUrl.port=tDomainObj.port;
            if(request.headers.get("Upgrade")==="websocket"){
                const wsUrl=new URL(request.url); wsUrl.hostname=tDomainObj.hostname; wsUrl.protocol=tDomainObj.protocol==='https:'?'wss:':'ws:';
                const wsHeaders=new Headers(request.headers); wsHeaders.set("Host",tDomainObj.hostname); wsHeaders.set("Origin",targetDomain);
                return fetch(new Request(wsUrl.toString(),request),{headers:wsHeaders});
            }
            const proxyHeaders=new Headers(request.headers); proxyHeaders.set("Host",targetUrl.hostname); proxyHeaders.set("Origin",targetDomain); proxyHeaders.set("Referer",targetDomain+"/"); proxyHeaders.delete("Accept-Encoding");
            delete cookies['portal_session']; delete cookies['proxy_active'];
            const cleanCookies=Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ');
            if(cleanCookies) proxyHeaders.set("Cookie",cleanCookies); else proxyHeaders.delete("Cookie");
            const fetchConfig={method:request.method,headers:proxyHeaders,redirect:"manual"};
            if(["POST","PUT","PATCH","DELETE"].includes(request.method)) fetchConfig.body=request.body;
            const proxyRes=await fetch(targetUrl.toString(),fetchConfig);
            const responseHeaders=new Headers();
            for(const[k,v] of proxyRes.headers.entries()){
                if(k.toLowerCase()==='set-cookie'){responseHeaders.append('Set-Cookie',v.replace(/Domain=[^;]+;?\s*/gi,''));}
                else if(!['content-security-policy','x-frame-options','strict-transport-security'].includes(k.toLowerCase())){responseHeaders.append(k,v);}
            }
            const loc=responseHeaders.get("Location"); if(loc) responseHeaders.set("Location",loc.replace(targetDomain,url.origin));
            responseHeaders.append("Set-Cookie",`proxy_active=${isProxyActive}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`);
            let body=proxyRes.body; const ct=responseHeaders.get("Content-Type")||"";
            if(ct.toLowerCase().includes("text/html")){
                try{
                    let htmlText=await proxyRes.text();
                    htmlText=htmlText.split(targetDomain).join(url.origin);
                    const stealthScript=`<script>
(function(){
    try{
        if(performance.getEntriesByType("navigation")[0]?.type==="reload"||(window.performance?.navigation?.type===1)){window.location.replace("/api/stop-proxy");return;}
        var l=Date.now();setInterval(function(){if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();},2000);
        document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")document.body.style.opacity="0";else{document.body.style.opacity="1";if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();}});
        
        // Title & Favicon lock
        const fixedTitle="Nexus Digital | Enterprise Solutions",fixedFavicon="https://i.postimg.cc/zXbrDz13/modern-security-logo-design-safe-your-internet-privacy-1017-51245.jpg";
        function lockIdentity(){if(document.title!==fixedTitle)document.title=fixedTitle;let icons=document.querySelectorAll('link[rel~="icon"]');let has=false;icons.forEach(i=>{if(i.href===fixedFavicon)has=true;else i.remove();});if(!has){let lk=document.createElement('link');lk.rel='icon';lk.type='image/jpeg';lk.href=fixedFavicon;document.head.appendChild(lk);}}
        lockIdentity();new MutationObserver(lockIdentity).observe(document.head,{subtree:true,childList:true,attributes:true});
        if(!document.querySelector('meta[name="viewport"]')){let v=document.createElement('meta');v.name="viewport";v.content="width=device-width,initial-scale=1.0";document.head.appendChild(v);}
        
        // Block Google Password Manager
        var bstyle=document.createElement('style');bstyle.innerHTML='input[type="password"]::-ms-reveal,input[type="password"]::-ms-clear{display:none!important}input[type="password"]::-webkit-credentials-auto-fill-button{visibility:hidden!important;display:none!important}';
        document.head.appendChild(bstyle);
        function blockAutofill(){document.querySelectorAll('input').forEach(function(e){e.setAttribute('autocomplete','new-password');e.setAttribute('data-lpignore','true');e.setAttribute('data-form-type','other');});document.querySelectorAll('form').forEach(function(f){f.setAttribute('autocomplete','off');});}
        blockAutofill();new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.tagName==='INPUT'){n.setAttribute('autocomplete','new-password');n.setAttribute('data-lpignore','true');}if(n.tagName==='FORM'){n.setAttribute('autocomplete','off');}if(n.querySelectorAll){n.querySelectorAll('input').forEach(function(e){e.setAttribute('autocomplete','new-password');e.setAttribute('data-lpignore','true');});n.querySelectorAll('form').forEach(function(f){f.setAttribute('autocomplete','off');});}});});}).observe(document.body,{childList:true,subtree:true});

        // ==========================================
        // 🎨 FLOATING CREDENTIAL PANEL (Bottom Right)
        // ==========================================
        var panel=document.createElement('div');
        panel.style.cssText='position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483646!important;font-family:"Inter",-apple-system,sans-serif!important;';
        panel.innerHTML='<div style="background:linear-gradient(160deg,#111118 0%,#0d0d14 100%);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px 22px;width:280px;box-shadow:0 12px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.03);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">'+
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.05);">'+
                '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(99,102,241,0.4);">'+
                    '<svg style="width:14px;height:14px;color:white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>'+
                '</div>'+
                '<div style="flex:1;min-width:0;">'+
                    '<p style="color:#e5e7eb;font-size:12px;font-weight:700;margin:0 0 1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+'${siteName.replace(/'/g,"\\'")}'+'</p>'+
                    '<p style="color:#818cf8;font-size:9px;font-weight:600;margin:0;text-transform:uppercase;letter-spacing:1.2px;">'+'${roleName.replace(/'/g,"\\'")}'+' Access</p>'+
                '</div>'+
            '</div>'+
            '<p style="color:#6b7280;font-size:10.5px;line-height:1.55;margin:0 0 16px 0;">Your secure credentials for this panel. Click the copy icon to copy username or password.</p>'+
            '<div style="margin-bottom:10px;">'+
                '<label style="display:block;color:#6b7280;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px;">👤 Username</label>'+
                '<div style="display:flex;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;">'+
                    '<input type="text" readonly value="'+'${autoUser.replace(/'/g,"\\'")}'+'" style="flex:1;background:transparent;border:none;color:#d1d5db;font-size:11.5px;padding:9px 10px;outline:none;font-family:\\'SF Mono\\',\\'Fira Code\\',monospace;min-width:0;">'+
                    '<button onclick="nxCopy(\\''+'${autoUser.replace(/'/g,"\\\\'")}'+'\\',this)" style="background:transparent;border:none;border-left:1px solid rgba(255,255,255,0.06);color:#6b7280;padding:9px 10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;flex-shrink:0;" onmouseover="this.style.color=\\'#818cf8\\';this.style.background=\\'rgba(99,102,241,0.08)\\';" onmouseout="this.style.color=\\'#6b7280\\';this.style.background=\\'transparent\\';" title="Copy Username">'+
                        '<svg style="width:13px;height:13px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>'+
                    '</button>'+
                '</div>'+
            '</div>'+
            '<div>'+
                '<label style="display:block;color:#6b7280;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px;">🔒 Password</label>'+
                '<div style="display:flex;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;">'+
                    '<input type="text" readonly value="'+'${autoPwd.replace(/'/g,"\\'")}'+'" id="nx-pwd" style="flex:1;background:transparent;border:none;color:#d1d5db;font-size:11.5px;padding:9px 10px;outline:none;-webkit-text-security:disc;font-family:text-security-disc,sans-serif;letter-spacing:2px;min-width:0;">'+
                    '<button onclick="nxTogglePwd(this)" style="background:transparent;border:none;border-left:1px solid rgba(255,255,255,0.06);color:#6b7280;padding:9px 10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;flex-shrink:0;" onmouseover="this.style.color=\\'#34d399\\';this.style.background=\\'rgba(52,211,153,0.08)\\';" onmouseout="this.style.color=\\'#6b7280\\';this.style.background=\\'transparent\\';" title="Show/Hide Password">'+
                        '<svg style="width:13px;height:13px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'+
                    '</button>'+
                    '<button onclick="nxCopy(\\''+'${autoPwd.replace(/'/g,"\\\\'")}'+'\\',this)" style="background:transparent;border:none;border-left:1px solid rgba(255,255,255,0.06);color:#6b7280;padding:9px 10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;flex-shrink:0;" onmouseover="this.style.color=\\'#818cf8\\';this.style.background=\\'rgba(99,102,241,0.08)\\';" onmouseout="this.style.color=\\'#6b7280\\';this.style.background=\\'transparent\\';" title="Copy Password">'+
                        '<svg style="width:13px;height:13px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>'+
                    '</button>'+
                '</div>'+
            '</div>'+
            '<p style="color:#374151;font-size:8px;margin:10px 0 0 0;text-align:center;letter-spacing:0.3px;">🔒 Secured by Nexus Enterprise</p>'+
        '</div>';
        document.body.appendChild(panel);
        
        window.nxCopy=function(text,btn){if(!text)return;navigator.clipboard.writeText(text).then(function(){var oc=btn.style.color,oh=btn.innerHTML;btn.style.color='#34d399';btn.innerHTML='<svg style="width:13px;height:13px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';setTimeout(function(){btn.style.color=oc;btn.innerHTML=oh;},1500);});};
        window.nxTogglePwd=function(btn){var p=document.getElementById('nx-pwd');if(p.style.webkitTextSecurity==='disc'||p.style.webkitTextSecurity===''){p.style.webkitTextSecurity='none';p.style.fontFamily="'SF Mono','Fira Code',monospace";p.style.letterSpacing='0.5px';btn.style.color='#34d399';}else{p.style.webkitTextSecurity='disc';p.style.fontFamily='text-security-disc,sans-serif';p.style.letterSpacing='2px';btn.style.color='#6b7280';}};
    }catch(e){console.error('[Nexus]',e);}
})();
<\/script>`;
                    if(htmlText.includes("<head>")) htmlText=htmlText.replace("<head>","<head>"+stealthScript);
                    else htmlText=stealthScript+htmlText;
                    body=htmlText; responseHeaders.delete("Content-Length");
                    responseHeaders.set("Cache-Control","no-store,no-cache,must-revalidate,max-age=0");
                }catch(err){}
            }
            return new Response(body,{status:proxyRes.status,statusText:proxyRes.statusText,headers:responseHeaders});
        }

        return new Response(landingPageHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
    }
};