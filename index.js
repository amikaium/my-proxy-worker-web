// ==========================================
// ⚙️ CONFIGURATION (আপনার ডাটা দিন)
// ==========================================
const CONFIG = {
    SECRET_CODE: "381168", 
    SESSION_SECRET: "secure_random_key_998877", 
    TARGET_DOMAIN: "https://ag.tenx365x.live" 
};

// ==========================================
// 🎨 UI: PUBLIC LANDING PAGE (COMPLETE WEBSITE)
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
        body { background-color: #050505; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; scroll-behavior: smooth; }
        .loader { border: 2px solid transparent; border-top-color: #000; border-radius: 50%; width: 14px; height: 14px; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        input:focus { outline: none; box-shadow: none; }
        .secure-input { -webkit-text-security: disc; font-family: 'Inter', sans-serif; }
        /* Premium Box Styles */
        .feature-box { border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); transition: all 0.3s; }
        .feature-box:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); }
    </style>
</head>
<body class="antialiased selection:bg-white selection:text-black">
    
    <!-- Navbar -->
    <nav class="fixed w-full z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div class="text-xl font-bold tracking-widest uppercase cursor-default select-none">Nexus<span class="text-gray-500">.</span></div>
            <div class="hidden md:flex space-x-10 text-xs font-bold tracking-widest uppercase text-gray-400">
                <a href="#solutions" class="hover:text-white transition">Solutions</a>
                <a href="#network" class="hover:text-white transition">Network</a>
                <a href="#security" class="hover:text-white transition">Security</a>
            </div>
            <button class="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition">Contact Sales</button>
        </div>
    </nav>

    <!-- Hero Section with Premium Search Bar -->
    <header class="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center justify-center border-b border-white/5">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="text-center z-10 w-full max-w-xl mx-auto">
            <h1 class="text-5xl md:text-6xl font-light tracking-tight mb-4">Enterprise <span class="font-bold">Assets</span></h1>
            <p class="text-gray-400 text-sm md:text-base tracking-wide mb-10">Secure infrastructure registry for our global network.</p>
            
            <!-- FIXED: Premium Search Box with Inner Padding -->
            <form id="search-form" class="w-full flex items-center p-1.5 border border-white/10 bg-[#0a0a0a] focus-within:border-white/30 transition-all">
                <div class="pl-4 flex items-center justify-center pointer-events-none">
                    <svg id="search-icon" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                
                <input type="text" id="main-search" placeholder="Search by Project ID..." autocomplete="off" spellcheck="false"
                    class="w-full bg-transparent text-white text-sm px-4 py-3 placeholder-gray-600 tracking-wide font-medium secure-input">
                
                <button type="submit" id="search-btn" class="px-6 py-3 bg-white hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest transition whitespace-nowrap flex items-center justify-center min-w-[100px]">
                    <span id="btn-text">Search</span>
                    <div id="search-spinner" class="loader hidden"></div>
                </button>
            </form>
            <p id="search-msg" class="text-[10px] font-bold text-gray-500 mt-4 tracking-widest uppercase opacity-0 transition-opacity h-4"></p>
        </div>

        <!-- Moved Stats Right Below Search -->
        <div class="mt-12 w-full max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center z-10">
            <div><p class="text-xl md:text-2xl font-bold">142</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Active Nodes</p></div>
            <div><p class="text-xl md:text-2xl font-bold">99.9%</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Uptime SLA</p></div>
            <div><p class="text-xl md:text-2xl font-bold">AES-256</p><p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Encryption</p></div>
        </div>
    </header>

    <!-- NEW SECTION: Core Features (Makes the site look complete) -->
    <section id="solutions" class="py-24 px-6 max-w-7xl mx-auto border-b border-white/5">
        <h2 class="text-2xl font-bold mb-12 text-center tracking-wide">Infrastructure <span class="text-gray-500 font-light">Solutions</span></h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Feature 1 -->
            <div class="feature-box p-8">
                <svg class="w-8 h-8 text-white mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
                <h3 class="text-lg font-bold mb-2">Zero-Trust Vaults</h3>
                <p class="text-xs text-gray-500 leading-relaxed">End-to-end encrypted architecture ensuring no unauthorized access to enterprise data components.</p>
            </div>
            <!-- Feature 2 -->
            <div class="feature-box p-8">
                <svg class="w-8 h-8 text-white mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 class="text-lg font-bold mb-2">Global Edge Proxy</h3>
                <p class="text-xs text-gray-500 leading-relaxed">Traffic routed through advanced edge networks to mask origin IP and provide DDoS mitigation.</p>
            </div>
            <!-- Feature 3 -->
            <div class="feature-box p-8">
                <svg class="w-8 h-8 text-white mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <h3 class="text-lg font-bold mb-2">High Performance</h3>
                <p class="text-xs text-gray-500 leading-relaxed">Lightning-fast content delivery deployed worldwide. Latency reduced to mere milliseconds.</p>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6 text-center text-gray-600 text-[10px] tracking-widest uppercase">
        <p>&copy; 2026 Nexus Digital Enterprise. All rights reserved.</p>
    </footer>

    <script>
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('main-search');
        const btnText = document.getElementById('btn-text');
        const spinner = document.getElementById('search-spinner');
        const searchMsg = document.getElementById('search-msg');

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if(!query) return;

            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            searchMsg.style.opacity = '0';
            searchInput.disabled = true;

            try {
                const res = await fetch('/api/access', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ code: query }) 
                });

                if (res.ok) {
                    searchMsg.style.color = '#4ade80'; 
                    searchMsg.innerText = 'ACCESS GRANTED. DECRYPTING...';
                    searchMsg.style.opacity = '1';
                    setTimeout(() => { window.location.href = '/dashboard'; }, 800);
                } else {
                    setTimeout(() => {
                        btnText.classList.remove('hidden');
                        spinner.classList.add('hidden');
                        searchInput.disabled = false;
                        searchInput.value = '';
                        searchInput.focus();
                        searchMsg.style.color = '#ef4444'; 
                        searchMsg.innerText = '0 RESULTS FOUND FOR "' + query + '"';
                        searchMsg.style.opacity = '1';
                    }, 1200);
                }
            } catch (err) {}
        });
    </script>
</body>
</html>
`;

// ==========================================
// 🎨 UI: PRIVATE DASHBOARD (UPDATED)
// ==========================================
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Core | Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #030303; color: white; font-family: 'Inter', sans-serif; }
        .square-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
        .square-card:hover { border-color: rgba(255,255,255,0.2); background: #0d0d0d; }
        .copy-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body class="antialiased min-h-screen p-4 md:p-8 flex flex-col items-center">
    
    <div class="w-full max-w-6xl">
        
        <!-- Header -->
        <header class="flex justify-between items-center mb-8 border border-white/10 bg-[#0a0a0a] p-5">
            <div>
                <h1 class="text-lg font-bold tracking-widest uppercase text-white">System <span class="text-gray-500">Core</span></h1>
                <p class="text-[9px] text-gray-500 mt-0.5 uppercase tracking-[0.2em]">End-to-End Encrypted Tunnel</p>
            </div>
            <a href="/logout" class="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span>Terminate</span>
            </a>
        </header>

        <h3 class="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 border-b border-white/10 pb-2">Active Environments</h3>
        
        <!-- Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <!-- Site Box Item 1 -->
            <div class="square-card p-5 flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </div>
                    <span class="text-[8px] font-bold uppercase tracking-widest text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-1">Online</span>
                </div>
                
                <div class="mb-5 flex-grow flex flex-col justify-center">
                    <!-- Website Name (Without 'Main') -->
                    <h2 class="text-xl font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis mb-3">Tenx365x</h2>
                    
                    <!-- NEW: User Link & Copy Box -->
                    <div class="copy-box flex items-center p-1 w-full mt-1 mb-2">
                        <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-2 whitespace-nowrap">User Link</span>
                        <input type="text" readonly value="ag.tenx365x.live" class="flex-grow bg-transparent text-[11px] text-gray-300 font-medium px-2 outline-none w-full min-w-0 truncate select-all">
                        
                        <button onclick="copyToClipboard('https://ag.tenx365x.live', this)" class="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer flex-shrink-0">
                            <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                    <p class="text-[10px] text-gray-500 leading-relaxed truncate mt-1">Secure reverse proxy routing via Edge.</p>
                </div>
                
                <!-- NEW: Login Your Panel Button -->
                <a href="/api/start-proxy" class="w-full py-3 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <span>Login Your Panel</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>

            <!-- Site Box Item 2 (Demo Template) -->
            <div class="square-card p-5 flex flex-col justify-between opacity-50 grayscale">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
                    </div>
                    <span class="text-[8px] font-bold uppercase tracking-widest text-gray-400 border border-gray-400/20 bg-gray-400/10 px-2 py-1">Standby</span>
                </div>
                
                <div class="mb-5 flex-grow flex flex-col justify-center">
                    <h2 class="text-xl font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis mb-3">Backup Vault</h2>
                    <div class="copy-box flex items-center p-1 w-full mt-1 mb-2">
                        <span class="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-2 whitespace-nowrap">User Link</span>
                        <input type="text" readonly value="vault.example.com" class="flex-grow bg-transparent text-[11px] text-gray-300 font-medium px-2 outline-none w-full min-w-0 truncate">
                        <button class="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/5 cursor-not-allowed flex-shrink-0">
                            <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                </div>
                
                <button disabled class="w-full py-3 bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center gap-2">
                    <span>Login Your Panel</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>

        </div>
    </div>

    <!-- Script for Copy Button Action -->
    <script>
        function copyToClipboard(text, btn) {
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = btn.innerHTML;
                // Show green checkmark icon
                btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                btn.classList.add('border-green-500/50');
                
                // Revert back after 1.5s
                setTimeout(() => { 
                    btn.innerHTML = originalHTML; 
                    btn.classList.remove('border-green-500/50');
                }, 1500);
            });
        }
    </script>
</body>
</html>
`;

// ==========================================
// 🛡️ STEALTH JAVASCRIPT INJECTION
// ==========================================
const stealthScript = `
<script>
(function(){
    try {
        var perf = performance.getEntriesByType("navigation")[0];
        if (perf && (perf.type === "reload" || perf.type === "back_forward")) {
            window.location.replace("/api/stop-proxy"); 
            return;
        }

        var lastTick = Date.now();
        setInterval(function(){
            if (Date.now() - lastTick > 60000) { 
                window.location.replace("/api/stop-proxy");
            }
            lastTick = Date.now();
        }, 2000);

        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState === "hidden") {
                document.body.style.opacity = "0"; 
            } else {
                document.body.style.opacity = "1"; 
                if (Date.now() - lastTick > 60000) { window.location.replace("/api/stop-proxy"); }
                lastTick = Date.now();
            }
        });
    } catch(e){}
})();
</script>
`;

// ==========================================
// 🚀 BACKEND & PROXY ENGINE
// ==========================================
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const getCookies = (req) => {
            const header = req.headers.get("Cookie");
            if (!header) return {};
            return Object.fromEntries(header.split(';').map(c => {
                const parts = c.split('=');
                return [parts[0].trim(), parts.slice(1).join('=')];
            }));
        };

        const cookies = getCookies(request);
        const isAuthorized = cookies['portal_session'] === CONFIG.SESSION_SECRET;
        let isProxyActive = cookies['proxy_active'] === 'true';

        if (isProxyActive && request.method === "GET") {
            const secFetchSite = request.headers.get("Sec-Fetch-Site");
            const referer = request.headers.get("Referer");
            const isDirectSearch = (secFetchSite === "none") || (!secFetchSite && !referer);

            if (isDirectSearch) {
                return new Response("Killed Proxy", {
                    status: 302,
                    headers: {
                        "Location": "/",
                        "Set-Cookie": "proxy_active=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"
                    }
                });
            }
        }

        if (path === "/api/access" && request.method === "POST") {
            try {
                const { code } = await request.json();
                if (code === CONFIG.SECRET_CODE) {
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Set-Cookie": `portal_session=${CONFIG.SESSION_SECRET}; HttpOnly; Secure; Path=/; SameSite=Lax`
                        }
                    });
                }
                return new Response(JSON.stringify({ error: "Invalid Code" }), { status: 401 });
            } catch (e) {
                return new Response("Bad Request", { status: 400 });
            }
        }

        if (path === "/dashboard") {
            if (!isAuthorized) return Response.redirect(url.origin, 302);
            return new Response(dashboardHTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        if (path === "/api/start-proxy") {
            if (!isAuthorized) return new Response("Access Denied", { status: 403 });
            return new Response("Starting Proxy...", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": "proxy_active=true; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax"
                }
            });
        }

        if (path === "/api/stop-proxy") {
            return new Response("Self Destructing...", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": "proxy_active=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"
                }
            });
        }

        if (path === "/logout") {
            return new Response("Logged out", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": "portal_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"
                }
            });
        }

        if (isAuthorized && isProxyActive) {
            const targetUrl = new URL(request.url);
            targetUrl.hostname = new URL(CONFIG.TARGET_DOMAIN).hostname;
            targetUrl.protocol = new URL(CONFIG.TARGET_DOMAIN).protocol;
            targetUrl.port = new URL(CONFIG.TARGET_DOMAIN).port;

            const proxyHeaders = new Headers(request.headers);
            proxyHeaders.set("Host", targetUrl.hostname);
            proxyHeaders.set("Origin", CONFIG.TARGET_DOMAIN);
            proxyHeaders.set("Referer", CONFIG.TARGET_DOMAIN + targetUrl.pathname);

            delete cookies['portal_session'];
            delete cookies['proxy_active'];
            const cleanCookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
            if (cleanCookieStr) {
                proxyHeaders.set("Cookie", cleanCookieStr);
            } else {
                proxyHeaders.delete("Cookie");
            }

            const fetchConfig = {
                method: request.method,
                headers: proxyHeaders,
                redirect: "manual"
            };
            
            if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
                fetchConfig.body = request.body;
            }

            const proxyRes = await fetch(targetUrl.toString(), fetchConfig);
            const responseHeaders = new Headers(proxyRes.headers);

            const locationHeader = responseHeaders.get("Location");
            if (locationHeader) {
                const newLocation = locationHeader.replace(CONFIG.TARGET_DOMAIN, url.origin);
                responseHeaders.set("Location", newLocation);
            }

            responseHeaders.append("Set-Cookie", "proxy_active=true; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax");

            let body = proxyRes.body;
            const contentType = responseHeaders.get("Content-Type") || "";
            
            if (contentType.includes("text/html")) {
                let htmlText = await proxyRes.text();
                if (htmlText.includes("<head>")) {
                    htmlText = htmlText.replace("<head>", "<head>" + stealthScript);
                } else {
                    htmlText = stealthScript + htmlText;
                }
                body = htmlText;
                responseHeaders.delete("Content-Length");
                
                responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
                responseHeaders.set("Pragma", "no-cache");
                responseHeaders.set("Expires", "0");
            }

            return new Response(body, {
                status: proxyRes.status,
                statusText: proxyRes.statusText,
                headers: responseHeaders
            });
        }

        return new Response(landingPageHTML, {
            headers: { 
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "no-store, no-cache" 
            },
        });
    }
};