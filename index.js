// ==========================================
// ⚙️ CONFIGURATION (আপনার ডাটা দিন)
// ==========================================
const CONFIG = {
    SECRET_CODE: "381168", // ড্যাশবোর্ডে ঢোকার সিক্রেট কোড (সার্চ বারে এটা লিখে এন্টার দিতে হবে)
    SESSION_SECRET: "secure_random_key_998877", // পোর্টাল কুকি সিক্রেট
    TARGET_DOMAIN: "https://ag.tenx365x.live" // যে সাইটটি হাইড করে প্রক্সি করবেন
};

// ==========================================
// 🎨 UI: PUBLIC LANDING PAGE (DECOY & SEARCH TRIGGER)
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
        body { background-color: #050505; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .square-box { border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(10px); }
        .loader { border: 2px solid transparent; border-top-color: #fff; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Remove default input styles */
        input:focus { outline: none; box-shadow: none; border-color: rgba(255,255,255,0.4); }
    </style>
</head>
<body class="antialiased selection:bg-white selection:text-black">
    <!-- Navbar -->
    <nav class="fixed w-full z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div class="text-xl font-bold tracking-widest uppercase cursor-default select-none">Nexus<span class="text-gray-500">.</span></div>
            <div class="hidden md:flex space-x-10 text-xs font-medium tracking-widest uppercase text-gray-400">
                <a href="#" class="hover:text-white transition">Projects</a>
                <a href="#" class="hover:text-white transition">Services</a>
                <a href="#" class="hover:text-white transition">Company</a>
            </div>
            <button class="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition">Contact</button>
        </div>
    </nav>

    <!-- Hero Section with Stealth Search -->
    <main class="h-screen flex flex-col items-center justify-center relative px-4">
        <!-- Background Gradients -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="text-center z-10 w-full max-w-2xl">
            <h1 class="text-4xl md:text-6xl font-light tracking-tight mb-4">Enterprise <span class="font-bold">Digital</span> Assets</h1>
            <p class="text-gray-400 text-sm md:text-base tracking-wide mb-10">Search through our global registry of secure projects, case studies, and documentation.</p>
            
            <!-- The Stealth Search Bar -->
            <form id="search-form" class="relative w-full group">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg id="search-icon" class="w-5 h-5 text-gray-500 group-focus-within:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <div id="search-spinner" class="loader hidden"></div>
                </div>
                <!-- Action Input -->
                <input type="text" id="main-search" placeholder="Search projects by ID or keyword..." autocomplete="off" spellcheck="false"
                    class="w-full bg-[#0a0a0a] border border-white/10 text-white text-sm px-12 py-5 focus:border-white/30 transition-all placeholder-gray-600 tracking-wide font-medium">
                
                <button type="submit" class="absolute inset-y-2 right-2 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition">
                    Search
                </button>
            </form>
            
            <!-- Fake Results Notification -->
            <p id="search-msg" class="text-xs text-gray-500 mt-4 tracking-widest uppercase opacity-0 transition-opacity h-4"></p>
        </div>

        <!-- Fake Data Row to look real -->
        <div class="absolute bottom-10 w-full max-w-4xl px-6 grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-8">
            <div><p class="text-2xl font-bold">142</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Active Nodes</p></div>
            <div><p class="text-2xl font-bold">99.9%</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Uptime SLA</p></div>
            <div><p class="text-2xl font-bold">AES</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Encryption</p></div>
        </div>
    </main>

    <script>
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('main-search');
        const searchIcon = document.getElementById('search-icon');
        const spinner = document.getElementById('search-spinner');
        const searchMsg = document.getElementById('search-msg');

        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if(!query) return;

            // UI Loading state
            searchIcon.classList.add('hidden');
            spinner.classList.remove('hidden');
            searchMsg.style.opacity = '0';
            searchInput.disabled = true;

            try {
                // Try Auth API
                const res = await fetch('/api/access', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ code: query }) 
                });

                if (res.ok) {
                    searchMsg.style.color = '#4ade80'; // Green
                    searchMsg.innerText = 'ACCESS GRANTED. DECRYPTING...';
                    searchMsg.style.opacity = '1';
                    setTimeout(() => { window.location.href = '/dashboard'; }, 800);
                } else {
                    // Normal fake search behavior
                    setTimeout(() => {
                        searchIcon.classList.remove('hidden');
                        spinner.classList.add('hidden');
                        searchInput.disabled = false;
                        searchInput.value = '';
                        searchInput.focus();
                        searchMsg.style.color = '#ef4444'; // Red
                        searchMsg.innerText = '0 RESULTS FOUND FOR "' + query + '"';
                        searchMsg.style.opacity = '1';
                    }, 1200);
                }
            } catch (err) {
                // Network error
            }
        });
    </script>
</body>
</html>
`;

// ==========================================
// 🎨 UI: PRIVATE DASHBOARD (SQUARE/PIXEL PERFECT)
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
        .square-card:hover { border-color: rgba(255,255,255,0.3); background: #0f0f0f; transform: translateY(-4px); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
    </style>
</head>
<body class="antialiased min-h-screen p-4 md:p-10 flex flex-col items-center">
    
    <div class="w-full max-w-5xl">
        <!-- Square Header -->
        <header class="flex justify-between items-center mb-10 border border-white/10 bg-[#0a0a0a] p-6">
            <div>
                <h1 class="text-xl font-bold tracking-widest uppercase text-white">System <span class="text-gray-500">Core</span></h1>
                <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.3em]">End-to-End Encrypted Tunnel</p>
            </div>
            <a href="/logout" class="px-5 py-3 text-xs font-bold tracking-widest uppercase border border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span>Terminate</span>
            </a>
        </header>

        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 border-b border-white/10 pb-2">Active Environments</h3>
        
        <!-- Square Grid Layout -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            <!-- Site Box Item 1 -->
            <div class="square-card p-6 flex flex-col justify-between aspect-square">
                <!-- Top Header of Card -->
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </div>
                    <span class="text-[9px] font-bold uppercase tracking-widest text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-1">Online</span>
                </div>
                
                <!-- Center Info -->
                <div class="flex-grow flex flex-col justify-center">
                    <!-- whitespace-nowrap & truncate ensures no line breaks -->
                    <h2 class="text-2xl font-bold text-white tracking-wide whitespace-nowrap overflow-hidden text-ellipsis mb-2">Tenx365x Main</h2>
                    <p class="text-xs text-gray-500 leading-relaxed">Secure reverse proxy routing via Cloudflare Edge Network. Undetectable origin.</p>
                </div>
                
                <!-- Bottom Action Button -->
                <a href="/api/start-proxy" class="mt-6 w-full py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <span>Connect</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>

            <!-- You can easily add more Square Cards here by copy-pasting the div above -->

        </div>
    </div>
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

        // Direct Navigation Trap
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

        // 1. Auth Login Route
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

        // 2. Private Dashboard
        if (path === "/dashboard") {
            if (!isAuthorized) return Response.redirect(url.origin, 302);
            return new Response(dashboardHTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
        }

        // 3. Start Proxy Mode
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

        // 4. Stop Proxy Mode
        if (path === "/api/stop-proxy") {
            return new Response("Self Destructing...", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": "proxy_active=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"
                }
            });
        }

        // 5. Logout Portal
        if (path === "/logout") {
            return new Response("Logged out", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": "portal_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"
                }
            });
        }

        // ==========================================
        // 🌐 GLOBAL PROXY ENGINE
        // ==========================================
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

        // ==========================================
        // 🔒 DEFAULT: PUBLIC DECOY ROUTE
        // ==========================================
        return new Response(landingPageHTML, {
            headers: { 
                "Content-Type": "text/html;charset=UTF-8",
                "Cache-Control": "no-store, no-cache" 
            },
        });
    }
};