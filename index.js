/**
 * Ultimate Stealth Proxy for React SPA & Live Streaming
 * Features: Client-Side Fetch/XHR Interceptor, WebSocket Proxy, Iframe Catcher
 */

const TARGET_DOMAIN = "vellki247.com";
const TARGET_URL = `https://${TARGET_DOMAIN}`;

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // ==========================================
        // 1. CORS Preflight Bypass
        // ==========================================
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                }
            });
        }

        // ==========================================
        // 2. Third-Party Video Stream Proxy (CORS Fixer)
        // ==========================================
        // ভিডিও প্লেয়ার যদি অন্য কোনো ডোমেইন থেকে স্ট্রিম আনে, সেটা ব্রাউজার ব্লক করে দেয়।
        // তাই আমরা সেটাকে আমাদের Worker এর মাধ্যমে প্রক্সি করে নিবো।
        if (url.pathname.startsWith('/___stream_proxy___/')) {
            const targetStreamUrl = url.searchParams.get('url');
            if (!targetStreamUrl) return new Response('Missing stream URL', { status: 400 });

            const streamReq = new Request(targetStreamUrl, {
                method: request.method,
                headers: request.headers
            });
            // HLS ভিডিও সার্ভারকে ধোঁকা দেওয়ার জন্য অরিজিনাল সাইটের Referer সেট করা
            streamReq.headers.set('Origin', TARGET_URL);
            streamReq.headers.set('Referer', TARGET_URL + '/');
            streamReq.headers.delete('Host');

            const streamRes = await fetch(streamReq);
            const streamHeaders = new Headers(streamRes.headers);
            streamHeaders.set('Access-Control-Allow-Origin', '*');

            return new Response(streamRes.body, { status: streamRes.status, headers: streamHeaders });
        }

        // ==========================================
        // 3. Main Reverse Proxy Routing
        // ==========================================
        const proxyUrl = new URL(request.url);
        proxyUrl.hostname = TARGET_DOMAIN;

        const proxyRequest = new Request(proxyUrl.toString(), {
            method: request.method,
            headers: new Headers(request.headers),
            body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : null,
            redirect: 'manual'
        });

        // Headers Spoofing
        proxyRequest.headers.set("Host", TARGET_DOMAIN);
        proxyRequest.headers.set("Origin", TARGET_URL);
        proxyRequest.headers.set("Referer", TARGET_URL);
        proxyRequest.headers.delete("Accept-Encoding"); // Text edit করার জন্য

        try {
            const response = await fetch(proxyRequest);
            const responseHeaders = new Headers(response.headers);

            // Strip Security Blocks
            ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options'].forEach(h => responseHeaders.delete(h));
            responseHeaders.set("Access-Control-Allow-Origin", "*");

            // Session & Cookie Domain Rewrite
            const setCookies = responseHeaders.getSetCookie();
            if (setCookies && setCookies.length > 0) {
                responseHeaders.delete('Set-Cookie');
                for (let cookie of setCookies) {
                    responseHeaders.append('Set-Cookie', cookie.replace(new RegExp(TARGET_DOMAIN, 'gi'), url.hostname));
                }
            }

            // Redirect Handler
            if (responseHeaders.has('Location')) {
                let location = responseHeaders.get('Location');
                location = location.replace(TARGET_URL, url.origin);
                responseHeaders.set('Location', location);
                return new Response(null, { status: response.status, headers: responseHeaders });
            }

            // ==========================================
            // 4. Inject "Stealth Agent" into HTML ONLY
            // ==========================================
            const contentType = responseHeaders.get("content-type") || "";
            
            // আমরা ভুলেও .js বা .json ফাইল এডিট করবো না, যাতে React ক্র্যাশ না করে। 
            // শুধুমাত্র HTML-এ আমাদের Agent ঢুকিয়ে দিবো।
            if (contentType.includes("text/html")) {
                let html = await response.text();
                
                // HTML-এর বডিতে থাকা বেসিক URL রিপ্লেস
                html = html.replace(new RegExp(TARGET_URL, 'g'), url.origin);

                // 🔥 The Stealth Agent (Client-Side Interceptor)
                const injectScript = `
                <script>
                (function() {
                    const TARGET = '${TARGET_DOMAIN}';
                    const MY_DOMAIN = window.location.host;

                    // 1. Intercept Fetch API
                    const origFetch = window.fetch;
                    window.fetch = async function(...args) {
                        let req = args[0];
                        let fetchUrl = typeof req === 'string' ? req : (req && req.url ? req.url : '');
                        
                        if (fetchUrl) {
                            // Route API calls to our proxy domain
                            if (fetchUrl.includes(TARGET)) {
                                fetchUrl = fetchUrl.replace(new RegExp('https?://' + TARGET, 'gi'), window.location.origin);
                            }
                            // Route HLS Video (.m3u8/.ts) to stream proxy to bypass CORS
                            if ((fetchUrl.includes('.m3u8') || fetchUrl.includes('.ts')) && fetchUrl.startsWith('http') && !fetchUrl.includes(MY_DOMAIN)) {
                                fetchUrl = '/___stream_proxy___/?url=' + encodeURIComponent(fetchUrl);
                            }
                            
                            if (typeof req === 'string') {
                                args[0] = fetchUrl;
                            } else if (req instanceof Request) {
                                args[0] = new Request(fetchUrl, req);
                            }
                        }
                        return origFetch.apply(this, args);
                    };

                    // 2. Intercept XMLHttpRequest (XHR)
                    const origOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, xhrUrl, ...rest) {
                        if (typeof xhrUrl === 'string') {
                            if (xhrUrl.includes(TARGET)) {
                                xhrUrl = xhrUrl.replace(new RegExp('https?://' + TARGET, 'gi'), window.location.origin);
                            }
                            if ((xhrUrl.includes('.m3u8') || xhrUrl.includes('.ts')) && xhrUrl.startsWith('http') && !xhrUrl.includes(MY_DOMAIN)) {
                                xhrUrl = '/___stream_proxy___/?url=' + encodeURIComponent(xhrUrl);
                            }
                        }
                        return origOpen.call(this, method, xhrUrl, ...rest);
                    };

                    // 3. Intercept WebSockets (Live Score & Video Tokens)
                    const OrigWebSocket = window.WebSocket;
                    window.WebSocket = function(wsUrl, protocols) {
                        if (typeof wsUrl === 'string' && wsUrl.includes(TARGET)) {
                            wsUrl = wsUrl.replace(new RegExp('wss?://' + TARGET, 'gi'), 'wss://' + MY_DOMAIN);
                        }
                        return new OrigWebSocket(wsUrl, protocols);
                    };
                    window.WebSocket.prototype = OrigWebSocket.prototype;

                    // 4. Catch dynamically loaded Iframes (React Video Players)
                    const observer = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.tagName === 'IFRAME' && node.src && node.src.includes(TARGET)) {
                                    node.src = node.src.replace(new RegExp('https?://' + TARGET, 'gi'), window.location.origin);
                                }
                            });
                        });
                    });
                    document.addEventListener('DOMContentLoaded', () => {
                        observer.observe(document.body, { childList: true, subtree: true });
                    });
                })();
                </script>
                <meta name="referrer" content="no-referrer">
                `;
                
                // HTML Head এর ঠিক পরে স্ক্রিপ্ট বসিয়ে দিচ্ছি
                html = html.replace('<head>', '<head>' + injectScript);

                return new Response(html, {
                    status: response.status,
                    headers: responseHeaders
                });
            }

            // HTML বাদে বাকি সব ফাইল (JS, JSON, CSS, Images) হুবুহু অরিজিনালটাই সেন্ড হবে। 
            // এতে React এর কোনো কোড ব্রেক করবে না।
            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders
            });

        } catch (err) {
            return new Response(`Worker Error: ${err.message}`, { status: 500 });
        }
    }
};
