// ==========================================
// ⚙️ CONFIGURATION (আপনার ডাটা দিন)
// ==========================================
const CONFIG = {
    SECRET_CODE: "381168", // ড্যাশবোর্ডে ঢোকার সিক্রেট কোড
    SESSION_SECRET: "secure_random_key_998877", // পোর্টাল কুকি সিক্রেট
    TARGET_DOMAIN: "https://ag.tenx365x.live" // যে সাইটটি হাইড করে প্রক্সি করবেন
};

// ==========================================
// 🎨 UI: PUBLIC LANDING PAGE (DECOY)
// ==========================================
const landingPageHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Digital | Creative Agency</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #09090b; color: white; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .hidden-modal { opacity: 0; pointer-events: none; transition: all 0.4s ease; transform: scale(0.95); }
        .hidden-modal.active { opacity: 1; pointer-events: auto; transform: scale(1); }
        /* Browser Password Manager Bypass CSS */
        .secure-input { -webkit-text-security: disc; font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="antialiased selection:bg-indigo-500 selection:text-white">
    <nav class="fixed w-full z-50 glass border-b-0">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <!-- Hidden Trigger: Click 3 times -->
            <div id="logo-trigger" class="text-xl font-bold tracking-tighter cursor-pointer select-none">NEXUS<span class="text-indigo-500">.</span></div>
            <div class="hidden md:flex space-x-8 text-sm text-gray-400">
                <a href="#" class="hover:text-white transition">Services</a>
                <a href="#" class="hover:text-white transition">Work</a>
                <a href="#" class="hover:text-white transition">About</a>
            </div>
            <button class="px-5 py-2 text-sm bg-white text-black font-medium rounded-full hover:bg-gray-200 transition">Get in touch</button>
        </div>
    </nav>

    <main class="h-screen flex items-center justify-center relative">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b]"></div>
        <div class="text-center z-10 px-4">
            <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">Crafting Digital <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Experiences</span></h1>
            <p class="text-gray-400 max-w-lg mx-auto text-lg mb-8">We build premium, highly secure and scalable web applications for enterprise clients worldwide.</p>
        </div>
    </main>

    <!-- Secret Access Modal -->
    <div id="access-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden-modal">
        <div class="glass p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
            <h2 class="text-xs tracking-[0.2em] text-gray-500 mb-6 text-center uppercase">Secure Authentication</h2>
            <div class="space-y-4">
                <!-- Changed to type="text" with secure-input class to bypass browser password saving -->
                <input type="text" id="secret-code" inputmode="numeric" placeholder="Enter Access Code" 
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    class="secure-input w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-3 text-center tracking-[0.5em] text-white focus:outline-none focus:border-indigo-500 transition shadow-inner">
                
                <button id="verify-btn" class="w-full bg-white text-black py-3 rounded-lg font-medium text-sm hover:bg-gray-200 transition flex justify-center items-center">
                    <span id="btn-text">Authenticate</span>
                </button>
                <p id="error-msg" class="text-red-500 text-xs text-center hidden pt-2">Authentication Failed</p>
            </div>
        </div>
    </div>

    <script>
        let clickCount = 0, clickTimer;
        const logo = document.getElementById('logo-trigger');
        const modal = document.getElementById('access-modal');
        const codeInput = document.getElementById('secret-code');
        const verifyBtn = document.getElementById('verify-btn');
        const errorMsg = document.getElementById('error-msg');

        logo.addEventListener('click', () => {
            clickCount++; clearTimeout(clickTimer);
            if (clickCount === 3) { modal.classList.add('active'); codeInput.focus(); clickCount = 0; }
            else { clickTimer = setTimeout(() => { clickCount = 0; }, 1000); }
        });

        modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });

        verifyBtn.addEventListener('click', async () => {
            const code = codeInput.value;
            verifyBtn.innerHTML = 'Verifying...';
            try {
                const res = await fetch('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
                if (res.ok) { window.location.href = '/dashboard'; } 
                else {
                    errorMsg.classList.remove('hidden'); codeInput.classList.add('border-red-500');
                    setTimeout(() => { errorMsg.classList.add('hidden'); codeInput.classList.remove('border-red-500'); }, 2000);
                }
            } catch (err) {} finally { verifyBtn.innerHTML = 'Authenticate'; codeInput.value = ''; }
        });

        codeInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') verifyBtn.click(); });
    </script>
</body>
</html>
`;

// ==========================================
// 🎨 UI: PRIVATE DASHBOARD
// ==========================================
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System | Secure Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #050505; color: white; font-family: 'Inter', sans-serif; }
        .glass-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.3s ease; }
        .glass-card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255, 255, 255, 0.04); transform: translateY(-2px); }
    </style>
</head>
<body class="antialiased min-h-screen p-6 md:p-12">
    <div class="max-w-4xl mx-auto">
        <header class="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
            <div>
                <h1 class="text-2xl font-light tracking-wide text-gray-200">System <span class="font-bold text-white">Access</span></h1>
                <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">End-to-End Encrypted Session</p>
            </div>
            <a href="/logout" class="px-4 py-2 text-xs font-medium border border-red-900/50 text-red-400 rounded-md hover:bg-red-900/20 transition">Terminate Portal Session</a>
        </header>

        <div class="space-y-4">
            <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">Available Environments</h3>
            
            <div class="glass-card rounded-xl p-5 flex items-center justify-between group">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-lg font-medium text-gray-200">Tenx365x Core</h2>
                        <p class="text-xs text-gray-500 mt-0.5">Secure Global Proxy Routing</p>
                    </div>
                </div>
                <!-- Start Proxy Route -->
                <a href="/api/start-proxy" class="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-200 transition duration-300 flex items-center space-x-2">
                    <span>Open Link</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>
        </div>
    </div>
</body>
</html>
`;

// ==========================================
// 🚀 BACKEND & ADVANCED REVERSE PROXY
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
        const isProxyActive = cookies['proxy_active'] === 'true';

        // 1. Auth Login Route
        if (path === "/api/access" && request.method === "POST") {
            try {
                const { code } = await request.json();
                if (code === CONFIG.SECRET_CODE) {
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Set-Cookie": `portal_session=${CONFIG.SESSION_SECRET}; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Lax`
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
                    "Set-Cookie": "proxy_active=true; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Lax"
                }
            });
        }

        // 4. Stop Proxy Mode
        if (path === "/api/stop-proxy") {
            return new Response("Stopping Proxy...", {
                status: 302,
                headers: {
                    "Location": "/dashboard",
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

            let body = proxyRes.body;
            const contentType = responseHeaders.get("Content-Type") || "";
            
            if (contentType.includes("text/html")) {
                let htmlText = await proxyRes.text();
                const exitButton = `
                    <div style="position:fixed; bottom:20px; right:20px; z-index:2147483647;">
                        <a href="/api/stop-proxy" style="background:rgba(220, 38, 38, 0.8); color:white; padding:8px 16px; border-radius:99px; font-family:sans-serif; font-size:12px; font-weight:bold; text-decoration:none; backdrop-filter:blur(5px); transition:all 0.3s;" onmouseover="this.style.background='rgba(220,38,38,1)'" onmouseout="this.style.background='rgba(220,38,38,0.8)'">
                            Exit Proxy &rarr;
                        </a>
                    </div>
                `;
                if (htmlText.includes("</body>")) {
                    htmlText = htmlText.replace("</body>", exitButton + "</body>");
                } else {
                    htmlText += exitButton; 
                }
                body = htmlText;
                responseHeaders.delete("Content-Length");
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
            headers: { "Content-Type": "text/html;charset=UTF-8" },
        });
    }
};