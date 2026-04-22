export default {
    async fetch(request) {
        const url = new URL(request.url);
        const myDomain = url.hostname;

        // ইউজারের ব্রাউজারে কোনো সাইট সিলেক্ট করা আছে কিনা তা কুকি থেকে চেক করা
        const cookieHeader = request.headers.get('Cookie') || '';
        const match = cookieHeader.match(/active_target=([^;]+)/);
        let targetSite = match ? match[1] : null;

        // যদি ইউজার পোর্টাল মেনুতে ফিরে আসতে চায় (yourdomain.com/reset)
        if (url.pathname === '/reset') {
            return new Response('Resetting and going back to menu...', {
                status: 302,
                headers: {
                    'Location': '/',
                    // কুকি ক্লিয়ার করে দেওয়া হচ্ছে
                    'Set-Cookie': 'active_target=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
                }
            });
        }

        // যদি কোনো সাইট সিলেক্ট করা না থাকে, তাহলে আমাদের পোর্টাল/মেনু পেজ দেখাবে
        if (!targetSite) {
            return this.servePortal(myDomain);
        }

        // ==========================================
        // রিভার্স প্রক্সি লজিক (অরিজিনাল সাইট লোড করা)
        // ==========================================
        url.hostname = targetSite;
        
        const newRequest = new Request(url.toString(), new Request(request, {
            redirect: 'manual' 
        }));
        
        newRequest.headers.set('Host', targetSite);
        newRequest.headers.set('Origin', `https://${targetSite}`);
        newRequest.headers.set('Referer', `https://${targetSite}${url.pathname}`);
        
        const response = await fetch(newRequest);
        let newResponse = new Response(response.body, response);
        
        // রিডাইরেক্ট ঠিক করা
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(targetSite, myDomain));
        }
        
        // কুকিজ ঠিক করা
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(targetSite, 'g'), myDomain));
        }

        return newResponse;
    },

    // পোর্টাল বা ড্যাশবোর্ড ডিজাইন
    servePortal(myDomain) {
        const sites = [
            'ag.tenx365x.live',
            'ag.all9x.com',
            'ag.baji11.live',
            'ag.baji365x.live',
            'ag.velki123.win',
            'ag.vellki365.app'
        ];

        let buttonsHtml = '';
        sites.forEach(site => {
            buttonsHtml += `<button onclick="setTarget('${site}')">🌐 ${site} <span style="float:right;">➜ GO</span></button>`;
        });

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Secure Gateway</title>
            <style>
                body {
                    background-color: #0f172a;
                    color: #f8fafc;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .container {
                    background: #1e293b;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    width: 90%;
                    max-width: 400px;
                }
                h2 { margin-top: 0; color: #38bdf8; text-align: center; margin-bottom: 25px; }
                button {
                    width: 100%;
                    padding: 15px 20px;
                    margin: 8px 0;
                    background-color: #334155;
                    color: white;
                    border: 1px solid #475569;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    display: block;
                }
                button:hover { 
                    background-color: #0ea5e9; 
                    border-color: #0ea5e9;
                    transform: translateY(-2px);
                }
                .note { 
                    font-size: 13px; 
                    color: #94a3b8; 
                    margin-top: 25px; 
                    text-align: center;
                    line-height: 1.5;
                    background: #0f172a;
                    padding: 10px;
                    border-radius: 6px;
                }
                .highlight { color: #facc15; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Select Platform</h2>
                ${buttonsHtml}
                
                <div class="note">
                    যেকোনো সময় এই মেনুতে ফিরে আসতে ব্রাউজারের লিংকের শেষে <br> <span class="highlight">/reset</span> লিখে এন্টার দিন। <br>
                    (যেমন: ${myDomain}/reset)
                </div>
            </div>

            <script>
                // জাভাস্ক্রিপ্ট দিয়ে কুকি সেট করা হচ্ছে যাতে ব্রাউজারের URL History তে সাইটের নাম না যায়
                function setTarget(site) {
                    document.cookie = "active_target=" + site + "; path=/; max-age=86400;";
                    window.location.href = "/";
                }
            </script>
        </body>
        </html>
        `;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}
