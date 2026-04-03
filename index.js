/**
 * Ultimate HLS & SPA Reverse Proxy
 * Fixes: Empty Network Tab, CORS Block, WebSocket issues, and Video Domain Locks.
 */

const TARGET_DOMAIN = "vellki247.com";
const TARGET_URL = `https://${TARGET_DOMAIN}`;

export default {
    async fetch(request) {
        // 1. CORS Preflight Bypass (ভিডিও API যেন ব্লক না হয় তার জন্য)
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

        const url = new URL(request.url);
        const proxyUrl = new URL(request.url);
        proxyUrl.hostname = TARGET_DOMAIN;

        // 2. Request Clone & Hardcore Spoofing
        const proxyRequest = new Request(proxyUrl.toString(), {
            method: request.method,
            headers: new Headers(request.headers),
            // GET/HEAD মেথডে body থাকলে error দেয়, তাই চেক করে নিচ্ছি
            body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : null,
            redirect: 'manual'
        });

        // অরিজিনাল সার্ভারকে ধোকা দেওয়ার জন্য Headers সেট করা
        proxyRequest.headers.set("Host", TARGET_DOMAIN);
        proxyRequest.headers.set("Origin", TARGET_URL);
        proxyRequest.headers.set("Referer", TARGET_URL);
        
        // Cloudflare এর নিজস্ব হেডারগুলো রিমুভ করছি, যাতে অরিজিন সার্ভার বুঝতে না পারে এটি প্রক্সি
        ['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-forwarded-for', 'x-real-ip'].forEach(h => proxyRequest.headers.delete(h));
        
        // Response body এডিট করার জন্য Encoding রিমুভ করা বাধ্যতামূলক
        proxyRequest.headers.delete("Accept-Encoding"); 

        try {
            // Fetch from Original Server
            const response = await fetch(proxyRequest);
            const responseHeaders = new Headers(response.headers);

            // 3. Strip Security & Unlock Browser Blocks
            ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options'].forEach(h => responseHeaders.delete(h));
            
            // Forcefully allow our proxy domain to read the data
            responseHeaders.set("Access-Control-Allow-Origin", "*");

            // 4. Session & Cookie Rewrite
            const setCookies = responseHeaders.getSetCookie();
            if (setCookies && setCookies.length > 0) {
                responseHeaders.delete('Set-Cookie');
                for (let cookie of setCookies) {
                    let modifiedCookie = cookie.replace(new RegExp(TARGET_DOMAIN, 'gi'), url.hostname);
                    responseHeaders.append('Set-Cookie', modifiedCookie);
                }
            }

            // 5. Handle Redirects gracefully
            if (responseHeaders.has('Location')) {
                let location = responseHeaders.get('Location');
                location = location.replace(TARGET_URL, url.origin);
                responseHeaders.set('Location', location);
                return new Response(null, { status: response.status, headers: responseHeaders });
            }

            // 6. Deep Body Modification (The Magic Part)
            const contentType = responseHeaders.get("content-type") || "";
            
            if (contentType.includes("text/html") || 
                contentType.includes("application/javascript") || 
                contentType.includes("text/javascript") || 
                contentType.includes("application/json")) {
                
                let body = await response.text();
                
                // A. Rewrite Absolute URLs
                body = body.replace(new RegExp(TARGET_URL, 'g'), url.origin);
                
                // B. Rewrite WebSockets (লাইভ স্কোর এবং ভিডিও টোকেনের জন্য)
                body = body.replace(new RegExp(`wss://${TARGET_DOMAIN}`, 'g'), `wss://${url.hostname}`);
                body = body.replace(new RegExp(`ws://${TARGET_DOMAIN}`, 'g'), `ws://${url.hostname}`);
                
                // C. Rewrite Bare Domain Strings inside JS/JSON
                body = body.replace(new RegExp(TARGET_DOMAIN, 'g'), url.hostname);

                // D. Client-Side Domain Lock Bypass (JS Inject)
                if (contentType.includes("text/html")) {
                    const scriptInject = `
                    <script>
                        // Bypass strict JS domain checks for video players
                        window.ORIGINAL_DOMAIN = "${TARGET_DOMAIN}";
                        try {
                            Object.defineProperty(document, "domain", {
                                get: function() { return window.location.hostname; },
                                set: function(v) {}
                            });
                        } catch(e) {}
                    </script>
                    `;
                    body = body.replace('<head>', '<head>' + scriptInject);
                }

                return new Response(body, {
                    status: response.status,
                    headers: responseHeaders
                });
            }

            // 7. Video (.ts, .m3u8) & Assets direct pass-through (Fast Loading)
            return new Response(response.body, {
                status: response.status,
                headers: responseHeaders
            });

        } catch (err) {
            return new Response(`Error: ${err.message}`, { status: 500 });
        }
    }
};
