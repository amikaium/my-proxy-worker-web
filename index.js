/**
 * Advanced Hybrid Reverse Proxy Worker
 * Author: Senior Cloudflare Developer
 * Target Origin: vellki247.com
 */

const TARGET_DOMAIN = "vellki247.com";
const TARGET_URL = `https://${TARGET_DOMAIN}`;

// যেসব route-এ Iframe লোড হবে (Live TV, Sports, Scoreboard)
const IFRAME_ROUTES = [
    '/live', '/match', '/event', '/tv', '/stream', '/score', '/scoreboard'
];

export default {
    async fetch(request, env, ctx) {
        try {
            return await handleRequest(request);
        } catch (err) {
            // Fallback system in case of fatal error
            return new Response(`Proxy Error: ${err.message}`, { status: 500 });
        }
    }
};

async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    // 1. Smart Detection for Live/Score Routes
    // আমরা শুধুমাত্র 'document' (HTML page) রিকোয়েস্ট হলে Iframe দিবো।
    // API বা Asset রিকোয়েস্ট হলে Iframe দিবো না, যাতে ভিতরের কলগুলো ব্রেক না হয়।
    const isDocumentRequest = request.headers.get('Sec-Fetch-Dest') === 'document' || 
                              (request.headers.get('Accept') || '').includes('text/html');

    const isIframeRoute = IFRAME_ROUTES.some(route => pathname.startsWith(route) || pathname.includes(route));

    // যদি Live Route হয় এবং সেটা HTML page request হয়, তবে Iframe serve করো
    if (isIframeRoute && isDocumentRequest) {
        return serveIframePage(url.pathname + url.search);
    }

    // ==========================================
    // 2. Full Proxy System Start
    // ==========================================
    const proxyUrl = new URL(request.url);
    proxyUrl.hostname = TARGET_DOMAIN;
    proxyUrl.protocol = 'https:';

    // অরিজিনাল রিকোয়েস্ট ক্লোন করা এবং Headers মডিফাই করা
    const proxyRequest = new Request(proxyUrl.toString(), {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
        redirect: 'manual' // Redirect নিজে হ্যান্ডেল করার জন্য
    });

    // 3. Headers & Security (Spoofing)
    proxyRequest.headers.set('Host', TARGET_DOMAIN);
    proxyRequest.headers.set('Origin', TARGET_URL);
    proxyRequest.headers.set('Referer', TARGET_URL);
    
    // Accept-Encoding রিমুভ করছি কারণ response body মডিফাই (rewrite) করতে হলে uncompressed ডাটা লাগবে
    proxyRequest.headers.delete('Accept-Encoding');

    // Origin থেকে ডাটা ফেচ করা
    const response = await fetch(proxyRequest);
    const responseHeaders = new Headers(response.headers);

    // 4. Security Headers Remove (Iframe & Mixed Content issue fix)
    responseHeaders.delete('X-Frame-Options');
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('Strict-Transport-Security');
    responseHeaders.delete('Clear-Site-Data');

    // 5. Cookie Handling (Session Fix)
    // Cloudflare Worker-এ getSetCookie() array রিটার্ন করে, যা মাল্টিপল কুকি হ্যান্ডেল করতে পারফেক্ট
    const setCookies = responseHeaders.getSetCookie();
    if (setCookies && setCookies.length > 0) {
        responseHeaders.delete('Set-Cookie');
        for (let cookie of setCookies) {
            // অরিজিনাল ডোমেইন চেঞ্জ করে আমাদের ওয়ার্কার ডোমেইন বসিয়ে দিচ্ছি
            let modifiedCookie = cookie.replace(new RegExp(`domain=${TARGET_DOMAIN}`, 'gi'), `domain=${url.hostname}`);
            responseHeaders.append('Set-Cookie', modifiedCookie);
        }
    }

    // Redirect (301/302) হ্যান্ডেলিং
    if (responseHeaders.has('Location')) {
        let location = responseHeaders.get('Location');
        location = location.replace(TARGET_URL, url.origin);
        responseHeaders.set('Location', location);
        return new Response(null, { status: response.status, headers: responseHeaders });
    }

    // 6. Performance & Body Rewrite
    const contentType = responseHeaders.get('Content-Type') || '';
    
    // শুধুমাত্র HTML, JSON, এবং JS ফাইলে ডোমেইন রিপ্লেস করবো (API ঠিক রাখার জন্য)
    // Image, Video, CSS, Fonts সরাসরি pass-through হবে (অযথা প্রসেস করবো না)
    if (contentType.includes('text/html') || 
        contentType.includes('application/json') || 
        contentType.includes('application/javascript') || 
        contentType.includes('text/javascript')) {
        
        let text = await response.text();
        
        // Absolute URLs rewrite
        const urlRegex = new RegExp(TARGET_URL, 'g');
        text = text.replace(urlRegex, url.origin);

        // Bare hostname (API calls inside JS) rewrite
        const hostRegex = new RegExp(TARGET_DOMAIN, 'g');
        text = text.replace(hostRegex, url.hostname);

        return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
    }

    // Streaming content / Assets direct return (Performance boost)
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
    });
}

// ==========================================
// 7. Iframe Generator Logic for Live/Sports
// ==========================================
function serveIframePage(path) {
    const targetIframeUrl = `${TARGET_URL}${path}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Live Stream & Match Center</title>
        <style>
            /* Reset CSS */
            * { box-sizing: border-box; }
            body, html { 
                margin: 0; 
                padding: 0; 
                width: 100vw; 
                height: 100vh; 
                overflow: hidden; /* Hide scrollbars outside iframe */
                background-color: #000; /* Black background for video feel */
            }
            
            /* Fullscreen Responsive Iframe */
            #live-frame { 
                width: 100%; 
                height: 100%; 
                border: none; 
                display: block;
            }

            /* Loading overlay */
            #loader {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-family: Arial, sans-serif;
                z-index: -1; /* Goes behind iframe once loaded */
            }
        </style>
    </head>
    <body>
        <div id="loader">Loading Live Stream...</div>
        <!-- Iframe with all necessary permissions for video/HLS/WebSockets -->
        <iframe 
            id="live-frame" 
            src="${targetIframeUrl}" 
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
            allowfullscreen>
        </iframe>
    </body>
    </html>
    `;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            // Prevent search engines from indexing the iframe wrapper pages
            'X-Robots-Tag': 'noindex, nofollow'
        }
    });
}
