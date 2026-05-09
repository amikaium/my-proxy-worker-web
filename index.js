// ==========================================
// ⚙️ SECURE FIREBASE CONFIGURATION
// ==========================================
const CONFIG = {
    SESSION_SECRET: "nexus_enterprise_secure_tunnel_2026",
    // আপনার ফায়ারবেস ডাটাবেজ (কোডে কোনো অ্যাডমিন পিন নেই)
    FB_URL: "https://private-panel-916b4-default-rtdb.firebaseio.com",
    FB_KEY: "AIzaSyC5Ygv7umkM3LJ9XEDJUTcrn_DmJ19eY0c"
};

// ==========================================
// 🔐 CRYPTO ENGINE (Hides Proxy Targets)
// ==========================================
const encrypt = (text) => {
    let res = '';
    for(let i=0; i<text.length; i++) res += String.fromCharCode(text.charCodeAt(i) ^ CONFIG.SESSION_SECRET.charCodeAt(i % CONFIG.SESSION_SECRET.length));
    return btoa(res);
};
const decrypt = (b64) => {
    try {
        let text = atob(b64);
        let res = '';
        for(let i=0; i<text.length; i++) res += String.fromCharCode(text.charCodeAt(i) ^ CONFIG.SESSION_SECRET.charCodeAt(i % CONFIG.SESSION_SECRET.length));
        return res;
    } catch(e) { return null; }
};

// ==========================================
// 🎨 UI: PUBLIC DECOY LANDING PAGE
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
        .secure-input { -webkit-text-security: disc; font-family: 'Inter', sans-serif; }
        .feature-box { border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); }
    </style>
</head>
<body class="antialiased selection:bg-white selection:text-black">
    <nav class="fixed w-full z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="text-xl font-bold tracking-widest uppercase cursor-default select-none">Nexus<span class="text-gray-500">.</span></div>
            <button class="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition">Contact Sales</button>
        </div>
    </nav>
    <header class="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center border-b border-white/5">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="text-center z-10 w-full max-w-xl mx-auto">
            <h1 class="text-5xl md:text-6xl font-light tracking-tight mb-4">Enterprise <span class="font-bold">Assets</span></h1>
            <p class="text-gray-400 text-sm md:text-base tracking-wide mb-10">Secure infrastructure registry for our global network.</p>
            <form id="search-form" class="w-full flex items-center p-1.5 border border-white/10 bg-[#0a0a0a] focus-within:border-white/30 transition-all">
                <div class="pl-4 flex items-center justify-center pointer-events-none">
                    <svg id="search-icon" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" id="main-search" placeholder="Search by Project ID..." autocomplete="off" spellcheck="false"
                    class="w-full bg-transparent text-white text-sm px-4 py-3 placeholder-gray-600 tracking-wide font-medium secure-input">
                <button type="submit" id="search-btn" class="px-6 py-3 bg-white hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest transition flex items-center justify-center min-w-[100px]">
                    <span id="btn-text">Search</span><div id="search-spinner" class="loader hidden"></div>
                </button>
            </form>
            <p id="search-msg" class="text-[10px] font-bold text-gray-500 mt-4 tracking-widest uppercase opacity-0 transition-opacity h-4"></p>
        </div>
        <div class="mt-12 w-full max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center z-10">
            <div><p class="text-xl md:text-2xl font-bold">142</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Active Nodes</p></div>
            <div><p class="text-xl md:text-2xl font-bold">99.9%</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Uptime SLA</p></div>
            <div><p class="text-xl md:text-2xl font-bold">AES-256</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Encryption</p></div>
        </div>
    </header>
    <section class="py-24 px-6 max-w-7xl mx-auto border-b border-white/5">
        <h2 class="text-2xl font-bold mb-12 text-center tracking-wide">Infrastructure <span class="text-gray-500 font-light">Solutions</span></h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="feature-box p-8"><h3 class="text-lg font-bold mb-2">Zero-Trust Vaults</h3><p class="text-xs text-gray-500">End-to-end encrypted architecture.</p></div>
            <div class="feature-box p-8"><h3 class="text-lg font-bold mb-2">Global Edge Proxy</h3><p class="text-xs text-gray-500">Traffic routed to mask origin IP.</p></div>
            <div class="feature-box p-8"><h3 class="text-lg font-bold mb-2">High Performance</h3><p class="text-xs text-gray-500">Lightning-fast content delivery.</p></div>
        </div>
    </section>
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
                    document.getElementById('search-msg').innerText = 'ACCESS GRANTED...';
                    document.getElementById('search-msg').style.opacity = '1';
                    setTimeout(() => window.location.href = data.role === 'admin' ? '/admin' : '/dashboard', 800);
                } else {
                    setTimeout(() => {
                        document.getElementById('btn-text').classList.remove('hidden');
                        document.getElementById('search-spinner').classList.add('hidden');
                        document.getElementById('main-search').disabled = false;
                        document.getElementById('main-search').value = '';
                        document.getElementById('search-msg').style.color = '#ef4444'; 
                        document.getElementById('search-msg').innerText = '0 RESULTS FOUND';
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

        // --- Helper: Cookie Parser ---
        const cookies = Object.fromEntries((request.headers.get("Cookie") || "").split(';').map(c => {
            const parts = c.split('='); return [parts[0].trim(), parts.slice(1).join('=')];
        }));

        // --- Helper: Fetch DB from Firebase ---
        const getDB = async () => {
            try {
                const res = await fetch(`${CONFIG.FB_URL}/.json?key=${CONFIG.FB_KEY}`);
                return await res.json();
            } catch(e) { return null; }
        };
        const updateDB = async (data) => {
            await fetch(`${CONFIG.FB_URL}/.json?key=${CONFIG.FB_KEY}`, { method: 'PUT', body: JSON.stringify(data) });
        };

        let db = await getDB() || {};
        // Initialize defaults if empty
        if (!db.sites) db.sites = {};
        if (!db.pins) db.pins = {};
        if (!db.settings) db.settings = { whatsapp: "", notification: { enabled: false, text: "", image: "", btnText: "", btnLink: "" } };

        const isAdmin = cookies['admin_session'] === CONFIG.SESSION_SECRET;
        const userPin = cookies['portal_session'];
        const isUser = !!(userPin && db.pins && db.pins[userPin]);
        let isProxyActive = cookies['proxy_active'];

        // --- 🕵️ Direct Navigation Trap ---
        if (isProxyActive && request.method === "GET" && !path.startsWith("/api/")) {
            const secFetchSite = request.headers.get("Sec-Fetch-Site");
            const referer = request.headers.get("Referer");
            if (secFetchSite === "none" || (!secFetchSite && !referer)) {
                return new Response("Killed", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });
            }
        }

        // --- 🔑 Authentication API ---
        if (path === "/api/access" && request.method === "POST") {
            const { code } = await request.json();
            
            // Check Admin PIN (Only works if adminPin exists in Firebase)
            if (db.adminPin && code === String(db.adminPin)) {
                return new Response(JSON.stringify({ success: true, role: 'admin' }), { headers: { "Set-Cookie": `admin_session=${CONFIG.SESSION_SECRET}; HttpOnly; Secure; Path=/` } });
            }
            // Check User PIN
            if (db.pins && db.pins[code]) {
                return new Response(JSON.stringify({ success: true, role: 'user' }), { headers: { "Set-Cookie": `portal_session=${code}; HttpOnly; Secure; Path=/` } });
            }
            return new Response("Invalid", { status: 401 });
        }

        // --- 🚪 Logout ---
        if (path === "/logout") {
            return new Response("Logged out", { status: 302, headers: { "Location": "/", "Set-Cookie": "portal_session=; Max-Age=0; Path=/; admin_session=; Max-Age=0; Path=/" } });
        }

        // --- 🛠️ ADMIN PANEL (UI & API) ---
        if (path.startsWith("/admin")) {
            if (!isAdmin) return Response.redirect(url.origin, 302);
            
            if (path === "/admin/api/data") return new Response(JSON.stringify(db));
            if (path === "/admin/api/save" && request.method === "POST") {
                const newData = await request.json();
                await updateDB(newData);
                return new Response("Saved");
            }

            const adminHTML = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><title>Admin Portal</title><script src="https://cdn.tailwindcss.com"></script></head>
            <body class="bg-[#050505] text-white p-8"><div class="max-w-6xl mx-auto" id="app">Loading Dashboard...</div>
            <script>
                let db = {};
                async function load(){ const res = await fetch('/admin/api/data'); db = await res.json(); render(); }
                async function save(){ 
                    await fetch('/admin/api/save', {method:'POST', body:JSON.stringify(db)}); 
                    alert('Database Synced Successfully!'); load(); 
                }
                function render(){
                    if(!db.sites) db.sites = {}; if(!db.pins) db.pins = {};
                    let html = \`<div class="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                        <h1 class="text-2xl font-bold uppercase tracking-widest text-indigo-500">Master Admin</h1>
                        <a href="/logout" class="bg-red-900/50 text-red-500 px-4 py-2 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition">Logout</a>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h2 class="text-lg font-bold mb-4 border-b border-white/10 pb-2">Global Sites Directory</h2>
                            <div class="space-y-3 mb-6">\`;
                            Object.keys(db.sites).forEach(id => {
                                html += \`<div class="bg-[#0a0a0a] p-4 border border-white/10 relative">
                                    <input value="\${db.sites[id].name}" onchange="db.sites['\${id}'].name=this.value" placeholder="Site Name" class="bg-black text-sm p-2 mb-2 w-full border border-white/20 outline-none focus:border-indigo-500">
                                    <input value="\${db.sites[id].agentLink}" onchange="db.sites['\${id}'].agentLink=this.value" placeholder="Agent/Panel Login Link (https://...)" class="bg-black text-xs p-2 mb-2 w-full border border-white/20 outline-none text-green-400">
                                    <input value="\${db.sites[id].userLink}" onchange="db.sites['\${id}'].userLink=this.value" placeholder="User Link (e.g. ag.tenx365.com)" class="bg-black text-xs p-2 w-full border border-white/20 outline-none text-blue-400">
                                    <button onclick="delete db.sites['\${id}']; render()" class="absolute top-4 right-4 text-red-500 text-xs font-bold uppercase">Delete</button>
                                </div>\`;
                            });
                            html += \`<button onclick="db.sites['site_'+Date.now()]={name:'', agentLink:'', userLink:''}; render()" class="bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-600 hover:text-white transition px-4 py-3 text-xs font-bold uppercase tracking-widest w-full">+ Add New Site</button>
                            
                            <h2 class="text-lg font-bold mt-10 mb-4 border-b border-white/10 pb-2">User Pins Management</h2>
                            <div class="space-y-3 mb-6">\`;
                            Object.keys(db.pins).forEach(pin => {
                                html += \`<div class="bg-[#0a0a0a] p-4 border border-white/10 relative">
                                    <div class="flex gap-4 items-center mb-3 border-b border-white/5 pb-2">
                                        <span class="font-bold text-xl tracking-widest text-indigo-400">\${pin}</span>
                                        <select onchange="db.pins['\${pin}'].status=this.value" class="\${db.pins[pin].status=='suspended'?'bg-red-900/50 text-red-400':'bg-green-900/50 text-green-400'} text-xs border-none p-1 font-bold uppercase outline-none">
                                            <option value="active" \${db.pins[pin].status=='active'?'selected':''}>Active</option>
                                            <option value="suspended" \${db.pins[pin].status=='suspended'?'selected':''}>Suspended</option>
                                        </select>
                                    </div>
                                    <div class="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Assign Sites:</div>
                                    <div class="grid grid-cols-2 gap-2">\`;
                                    Object.keys(db.sites).forEach(siteId => {
                                        let checked = (db.pins[pin].sites ||[]).includes(siteId) ? 'checked' : '';
                                        html += \`<label class="text-xs flex items-center gap-2 bg-black p-2 border border-white/10 cursor-pointer hover:border-white/30"><input type="checkbox" \${checked} onchange="toggleSite('\${pin}', '\${siteId}', this.checked)"> <span class="truncate">\${db.sites[siteId].name || 'Unnamed'}</span></label>\`;
                                    });
                                html += \`</div><button onclick="delete db.pins['\${pin}']; render()" class="absolute top-4 right-4 text-red-500 text-xs font-bold uppercase">Delete</button></div>\`;
                            });
                            html += \`<button onclick="let p=prompt('Enter new 6 digit PIN:'); if(p){ db.pins[p]={status:'active', sites:[]}; render();}" class="bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600 hover:text-white transition px-4 py-3 text-xs font-bold uppercase tracking-widest w-full">+ Create User Pin</button>
                        </div>
                        
                        <div>
                            <h2 class="text-lg font-bold mb-4 border-b border-white/10 pb-2">System Settings</h2>
                            <div class="bg-[#0a0a0a] p-6 border border-white/10 space-y-5">
                                <!-- Note: Admin PIN input removed for security -->
                                <div><label class="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">WhatsApp Floating Number</label><input value="\${db.settings.whatsapp||''}" onchange="db.settings.whatsapp=this.value" placeholder="+88017..." class="w-full bg-black border border-white/20 p-3 text-sm outline-none focus:border-green-500 text-green-400"></div>
                                
                                <div class="mt-6 border-t border-white/10 pt-5">
                                    <div class="flex justify-between items-center mb-4">
                                        <h3 class="text-sm font-bold uppercase tracking-widest text-indigo-400">Popup Notification</h3>
                                        <label class="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer"><input type="checkbox" \${db.settings.notification.enabled?'checked':''} onchange="db.settings.notification.enabled=this.checked"> Enable</label>
                                    </div>
                                    <textarea onchange="db.settings.notification.text=this.value" placeholder="Notification Message..." class="w-full bg-black border border-white/20 p-3 text-sm mb-3 outline-none min-h-[80px]">\${db.settings.notification.text||''}</textarea>
                                    <input value="\${db.settings.notification.image||''}" onchange="db.settings.notification.image=this.value" placeholder="Image URL (Optional)" class="w-full bg-black border border-white/20 p-3 text-sm mb-3 outline-none">
                                    <div class="flex gap-3">
                                        <input value="\${db.settings.notification.btnText||''}" onchange="db.settings.notification.btnText=this.value" placeholder="Button Text (e.g. JOIN NOW)" class="w-1/2 bg-black border border-white/20 p-3 text-sm outline-none">
                                        <input value="\${db.settings.notification.btnLink||''}" onchange="db.settings.notification.btnLink=this.value" placeholder="Button Link" class="w-1/2 bg-black border border-white/20 p-3 text-sm outline-none">
                                    </div>
                                </div>
                            </div>
                            <button onclick="save()" class="mt-8 bg-white text-black font-bold uppercase tracking-widest py-4 w-full hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">Save Database Changes</button>
                        </div>
                    </div>\`;
                    document.getElementById('app').innerHTML = html;
                }
                function toggleSite(pin, siteId, checked){
                    let list = db.pins[pin].sites ||[];
                    if(checked && !list.includes(siteId)) list.push(siteId);
                    else if(!checked) list = list.filter(id => id !== siteId);
                    db.pins[pin].sites = list;
                }
                load();
            </script></body></html>`;
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
                    const connectBtn = isSuspended 
                        ? `<button disabled class="w-full py-3 bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] cursor-not-allowed">Suspended</button>`
                        : `<a href="/api/start-proxy?id=${siteId}" class="w-full py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"><span>Login Your Panel</span><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></a>`;

                    sitesHTML += `
                    <div class="border border-white/5 bg-[#0a0a0a] p-5 flex flex-col justify-between ${isSuspended ? 'opacity-60 grayscale' : ''}">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg></div>
                            <span class="text-[8px] font-bold uppercase tracking-widest px-2 py-1 border ${statusColor}">${statusText}</span>
                        </div>
                        <div class="mb-5 flex-grow">
                            <h2 class="text-xl font-bold text-white tracking-wide truncate mb-3">${site.name}</h2>
                            <div class="bg-white/5 border border-white/10 flex items-center p-1 w-full mb-2">
                                <span class="text-[8px] font-bold text-gray-500 uppercase px-2 whitespace-nowrap">User Link</span>
                                <input type="text" readonly value="${site.userLink}" class="flex-grow bg-transparent text-[11px] text-gray-300 px-2 outline-none w-full truncate select-all">
                                <button onclick="copyLink('${site.userLink}', this)" class="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0">
                                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                            </div>
                        </div>
                        ${connectBtn}
                    </div>`;
                });
            } else {
                sitesHTML = `<p class="text-gray-500 text-xs">No sites assigned to this PIN.</p>`;
            }

            let waHTML = '';
            if (db.settings.whatsapp) {
                waHTML = `<a href="https://wa.me/${db.settings.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-110 transition z-40">
                    <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.55 4.195 1.597 6.012L.15 24l6.104-1.602a11.96 11.96 0 005.777 1.488h.005c6.645 0 12.031-5.385 12.031-12.031S18.676 0 12.031 0zm0 21.884c-1.785 0-3.535-.48-5.07-1.386l-.364-.215-3.766.988.996-3.668-.236-.376a9.998 9.998 0 01-1.528-5.342c0-5.523 4.494-10.017 10.017-10.017 5.522 0 10.016 4.494 10.016 10.017 0 5.523-4.494 10.017-10.016 10.017zm5.503-7.518c-.302-.152-1.785-.882-2.062-.982-.277-.101-.48-.152-.682.152-.202.302-.782.982-.958 1.183-.176.202-.353.227-.655.075-1.677-.822-2.825-1.73-3.92-3.623-.177-.303.176-.277.625-1.182.075-.152.038-.278-.038-.429-.075-.152-.682-1.642-.934-2.247-.245-.588-.496-.51-.682-.52h-.58c-.202 0-.53.076-.807.378-.277.303-1.06 1.035-1.06 2.525s1.085 2.928 1.236 3.13c.151.202 2.133 3.257 5.17 4.57 1.956.845 2.76.907 3.754.764.935-.136 2.875-1.176 3.279-2.311.404-1.136.404-2.108.277-2.311-.126-.203-.454-.303-.757-.454z"></path></svg>
                </a>`;
            }

            let notifHTML = '';
            if (db.settings.notification && db.settings.notification.enabled) {
                const n = db.settings.notification;
                notifHTML = `
                <div id="notif-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div class="bg-[#0a0a0a] border border-white/10 p-6 max-w-sm w-full mx-4 relative shadow-2xl">
                        <button onclick="document.getElementById('notif-modal').remove()" class="absolute top-3 right-3 text-gray-500 hover:text-white"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        ${n.image ? `<img src="${n.image}" class="w-full h-32 object-cover mb-4 border border-white/5">` : ''}
                        <h3 class="text-white font-bold tracking-wide mb-2 uppercase text-sm">System Notice</h3>
                        <p class="text-gray-400 text-xs mb-6 leading-relaxed whitespace-pre-wrap">${n.text}</p>
                        ${(n.btnText && n.btnLink) ? `<a href="${n.btnLink}" target="_blank" class="block w-full text-center bg-white hover:bg-gray-200 transition text-black py-3 text-[10px] font-bold uppercase tracking-widest">${n.btnText}</a>` : ''}
                    </div>
                </div>`;
            }

            const html = `<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Core | Portal</title><script src="https://cdn.tailwindcss.com"></script><style>body { background-color: #030303; color: white; font-family: 'Inter', sans-serif; }</style></head>
            <body class="p-4 md:p-8">
                ${notifHTML} ${waHTML}
                <div class="max-w-6xl mx-auto">
                    <header class="flex justify-between items-center mb-8 border border-white/10 bg-[#0a0a0a] p-5">
                        <div><h1 class="text-lg font-bold tracking-widest uppercase">System <span class="text-gray-500">Core</span></h1></div>
                        <a href="/logout" class="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition">Terminate</a>
                    </header>
                    <h3 class="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 border-b border-white/10 pb-2">Your Environments</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${sitesHTML}</div>
                </div>
                <script>
                    function copyLink(text, btn) {
                        navigator.clipboard.writeText(text);
                        const old = btn.innerHTML;
                        btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                        setTimeout(() => btn.innerHTML = old, 1500);
                    }
                </script>
            </body></html>`;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        // --- 🚀 PROXY START (Server-side hiding) ---
        if (path === "/api/start-proxy") {
            if (!isUser) return new Response("Denied", { status: 403 });
            const siteId = url.searchParams.get("id");
            const userData = db.pins[userPin];
            if (userData.status === 'suspended' || !userData.sites.includes(siteId) || !db.sites[siteId]) return new Response("Access Denied", { status: 403 });
            
            // Encrypt Target URL for the cookie
            const encryptedTarget = encrypt(db.sites[siteId].agentLink);

            return new Response("Starting...", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": `proxy_active=${encryptedTarget}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`
                }
            });
        }
        if (path === "/api/stop-proxy") return new Response("Stopped", { status: 302, headers: { "Location": "/", "Set-Cookie": "proxy_active=; Max-Age=0; Path=/" } });

        // --- 🌐 GLOBAL PROXY ENGINE ---
        if (isUser && isProxyActive) {
            const targetDomain = decrypt(isProxyActive);
            if(!targetDomain) return new Response("Invalid Proxy", { status: 400 });

            const targetUrl = new URL(request.url);
            const tDomainObj = new URL(targetDomain);
            targetUrl.hostname = tDomainObj.hostname;
            targetUrl.protocol = tDomainObj.protocol;
            targetUrl.port = tDomainObj.port;

            const proxyHeaders = new Headers(request.headers);
            proxyHeaders.set("Host", targetUrl.hostname);
            proxyHeaders.set("Origin", targetDomain);
            proxyHeaders.set("Referer", targetDomain + targetUrl.pathname);

            delete cookies['portal_session'];
            delete cookies['proxy_active'];
            const cleanCookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) proxyHeaders.set("Cookie", cleanCookieStr); else proxyHeaders.delete("Cookie");

            const fetchConfig = { method: request.method, headers: proxyHeaders, redirect: "manual" };
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) fetchConfig.body = request.body;

            const proxyRes = await fetch(targetUrl.toString(), fetchConfig);
            const responseHeaders = new Headers(proxyRes.headers);

            const locationHeader = responseHeaders.get("Location");
            if (locationHeader) responseHeaders.set("Location", locationHeader.replace(targetDomain, url.origin));

            responseHeaders.append("Set-Cookie", `proxy_active=${isProxyActive}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Lax`);

            let body = proxyRes.body;
            const contentType = responseHeaders.get("Content-Type") || "";
            if (contentType.includes("text/html")) {
                let htmlText = await proxyRes.text();
                
                // Form Isolation Script (Password Manager Trick)
                const stealthScript = `<script>
                (function(){
                    try{
                        var p=performance.getEntriesByType("navigation")[0];
                        if(p&&(p.type==="reload"||p.type==="back_forward")){window.location.replace("/api/stop-proxy");return;}
                        var l=Date.now();
                        setInterval(function(){if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();},2000);
                        document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")document.body.style.opacity="0";else{document.body.style.opacity="1";if(Date.now()-l>60000)window.location.replace("/api/stop-proxy");l=Date.now();}});
                        
                        // Trick to separate passwords in some browsers
                        window.addEventListener('DOMContentLoaded', () => {
                            document.querySelectorAll('form').forEach(f => {
                                if(f.action && !f.action.includes('realm=')) {
                                    f.action = f.action + (f.action.includes('?') ? '&' : '?') + 'realm=' + encodeURIComponent(document.title);
                                }
                            });
                        });
                    }catch(e){}
                })();
                </script>`;
                if (htmlText.includes("<head>")) htmlText = htmlText.replace("<head>", "<head>" + stealthScript); else htmlText = stealthScript + htmlText;
                body = htmlText;
                responseHeaders.delete("Content-Length");
                responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            }
            return new Response(body, { status: proxyRes.status, statusText: proxyRes.statusText, headers: responseHeaders });
        }

        return new Response(landingPageHTML, { headers: { "Content-Type": "text/html;charset=UTF-8", "Cache-Control": "no-store" } });
    }
};