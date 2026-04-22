export default {
    async fetch(request) {
        const url = new URL(request.url);
        const myDomain = url.hostname;

        const cookieHeader = request.headers.get('Cookie') || '';
        const match = cookieHeader.match(/active_target=([^;]+)/);
        let targetSite = match ? match[1] : null;

        // পোর্টালে ফিরে যাওয়ার কমান্ড (Floating Button এটা ব্যবহার করবে)
        if (url.pathname === '/reset') {
            return new Response('Going back to portal...', {
                status: 302,
                headers: {
                    'Location': '/',
                    'Set-Cookie': 'active_target=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
                }
            });
        }

        // টার্গেট না থাকলে পোর্টাল লোড হবে
        if (!targetSite) {
            return this.servePortal();
        }

        // ==========================================
        // রিভার্স প্রক্সি লজিক
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
        
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(targetSite, myDomain));
        }
        
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(targetSite, 'g'), myDomain));
        }

        // ওয়েবসাইটের ভেতরে নিচে একটি Home বাটন বসানো হচ্ছে যাতে সহজেই মেনুতে ফেরা যায়
        const contentType = newResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return new HTMLRewriter().on('body', {
                element(el) {
                    el.append(`
                        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;">
                            <a href="/reset" style="background: rgba(28,28,30,0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #0A84FF; width: 50px; height: 50px; border-radius: 25px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-decoration: none; border: 1px solid rgba(255,255,255,0.1);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </a>
                        </div>
                    `, { html: true });
                }
            }).transform(newResponse);
        }

        return newResponse;
    },

    // পোর্টাল ডিজাইন এবং ডায়নামিক Add Site সিস্টেম
    servePortal() {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Gateway Portal</title>
            <style>
                body {
                    background-color: #000000;
                    color: #FFFFFF;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    margin: 0; padding: 0; -webkit-tap-highlight-color: transparent;
                }
                .app-container { max-width: 500px; margin: 0 auto; padding: 20px; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; margin-top: 10px; }
                h1 { font-size: 28px; font-weight: 700; margin: 0; }
                
                .add-btn {
                    background: rgba(10, 132, 255, 0.15); color: #0A84FF; border: none; padding: 8px 14px;
                    border-radius: 20px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer;
                }
                .add-btn:active { transform: scale(0.95); }
                
                .site-list { display: flex; flex-direction: column; gap: 12px; }
                .site-card {
                    background-color: #1C1C1E; border-radius: 14px; padding: 16px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .site-info { display: flex; align-items: center; gap: 12px; overflow: hidden; }
                
                .icon-globe { width: 20px; height: 20px; color: #0A84FF; flex-shrink: 0; }
                .site-name { font-size: 16px; font-weight: 500; color: #F2F2F7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .visit-btn {
                    background-color: #0A84FF; color: #FFFFFF; border: none; padding: 8px 16px;
                    border-radius: 20px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer;
                }
                .visit-btn:active { transform: scale(0.96); background-color: #007AFF; }
                .icon-arrow { width: 16px; height: 16px; }

                .delete-btn {
                    background: rgba(255, 69, 58, 0.15); border: none; border-radius: 50%;
                    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                <div class="header">
                    <h1>Platforms</h1>
                    <button class="add-btn" onclick="addNewSite()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Site
                    </button>
                </div>
                <div class="site-list" id="siteList"></div>
            </div>

            <script>
                // ডিফল্ট সাইটের লিস্ট
                const defaultSites = [
                    'ag.tenx365x.live', 'ag.all9x.com', 'ag.baji11.live',
                    'ag.baji365x.live', 'ag.velki123.win', 'ag.vellki365.app'
                ];

                // লোকাল স্টোরেজ থেকে ইউজারের যুক্ত করা সাইটগুলো আনা
                function getCustomSites() {
                    const sites = localStorage.getItem('my_custom_sites');
                    return sites ? JSON.parse(sites) : [];
                }

                function saveCustomSites(sites) {
                    localStorage.setItem('my_custom_sites', JSON.stringify(sites));
                }

                // নতুন সাইট যুক্ত করার ফাংশন
                function addNewSite() {
                    let site = prompt("Enter domain name (e.g., ag.example.com):");
                    if (site) {
                        site = site.trim().toLowerCase();
                        if (site === '') return;
                        
                        const customSites = getCustomSites();
                        if (!defaultSites.includes(site) && !customSites.includes(site)) {
                            customSites.push(site);
                            saveCustomSites(customSites);
                            renderSites();
                        } else {
                            alert("This site is already in the list!");
                        }
                    }
                }

                // কাস্টম সাইট ডিলিট করার ফাংশন
                function deleteSite(site, event) {
                    event.stopPropagation();
                    if(confirm("Remove this site from list?")) {
                        let customSites = getCustomSites();
                        customSites = customSites.filter(s => s !== site);
                        saveCustomSites(customSites);
                        renderSites();
                    }
                }

                // পোর্টালে সাইটের নাম দেখানোর সময় ag. মুছে ফেলা
                function formatDisplayName(domain) {
                    return domain.replace(/^ag\\./i, '');
                }

                // প্রক্সি টার্গেট সেট করা
                function setTarget(site) {
                    document.cookie = "active_target=" + site + "; path=/;";
                    window.location.href = "/";
                }

                // সাইটগুলো রেন্ডার করা
                function renderSites() {
                    const siteList = document.getElementById('siteList');
                    siteList.innerHTML = '';
                    
                    const allSites = [...defaultSites, ...getCustomSites()];
                    
                    allSites.forEach(site => {
                        const isCustom = !defaultSites.includes(site);
                        const displayName = formatDisplayName(site);
                        
                        // যদি কাস্টম সাইট হয় তবে ডিলিট বাটন থাকবে
                        let deleteBtnHtml = isCustom ? 
                            '<button class="delete-btn" onclick="deleteSite(\\'' + site + '\\', event)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' 
                            : '';

                        const card = document.createElement('div');
                        card.className = 'site-card';
                        
                        // ডাইনামিক কার্ড HTML
                        card.innerHTML = '<div class="site-info">' + deleteBtnHtml + '<svg class="icon-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg><span class="site-name">' + displayName + '</span></div><button class="visit-btn" onclick="setTarget(\\'' + site + '\\')">Visit Site <svg class="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>';
                        
                        siteList.appendChild(card);
                    });
                }

                // প্রথমবার পেইজ লোড হওয়ার সময় কল হবে
                window.onload = renderSites;
            </script>
        </body>
        </html>
        `;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}
