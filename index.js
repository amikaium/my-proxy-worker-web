export default {
    async fetch(request) {
        // সোর্স ওয়েবসাইট: যার ডেটা আপনি প্রক্সি করে আনবেন (এটা আপনার ডোমেইন না)
        const TARGET_WEBSITE = 'ag.tenx365x.live'; 
        
        // আপনার ডোমেইন: আপনি যেই ডোমেইনে বা প্রিভিউ মোডে চালাবেন (সম্পূর্ণ ডায়নামিক)
        const url = new URL(request.url);
        const myDomain = url.hostname;
        
        // সোর্স ওয়েবসাইটে রিকোয়েস্ট পাঠানোর জন্য URL আপডেট
        url.hostname = TARGET_WEBSITE;
        
        const newRequest = new Request(url.toString(), new Request(request, {
            redirect: 'manual' 
        }));
        
        // অরিজিনাল ওয়েবসাইটের কাছে রিকোয়েস্ট ভ্যালিড করার জন্য হেডার
        newRequest.headers.set('Host', TARGET_WEBSITE);
        newRequest.headers.set('Origin', `https://${TARGET_WEBSITE}`);
        newRequest.headers.set('Referer', `https://${TARGET_WEBSITE}${url.pathname}`);
        newRequest.headers.set('Cache-Control', 'no-cache'); 
        
        const response = await fetch(newRequest);
        let newResponse = new Response(response.body, response);
        
        // রিডাইরেক্ট (Location) ঠিক করা যাতে আপনার ডোমেইনেই থাকে
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(TARGET_WEBSITE, myDomain));
        }
        
        // কুকিজ (Cookies) ঠিক করা
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(TARGET_WEBSITE, 'g'), myDomain));
        }

        const contentType = newResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return new HTMLRewriter()
                // লেয়ার ১: সার্ভার লেভেল থেকে লগইন পেজের ইলিমেন্ট রিমুভ
                .on('header.login-head', { element(el) { el.remove(); } })
                .on('div#supportWrap', { element(el) { el.remove(); } })
                .on('button#appDesign', { element(el) { el.remove(); } })
                .on('button#links', { element(el) { el.remove(); } })
                .on('head', {
                    element(el) {
                        el.append(`
                            <style>
                                /* অবাঞ্ছিত লগইন ইলিমেন্ট ফোর্স হাইড করা */
                                header, .login-head, #supportWrap, .support-wrap, .support-service, .support-info, #appDesign, #links, h4#loginMessage {
                                    display: none !important;
                                    opacity: 0 !important;
                                    visibility: hidden !important;
                                    position: absolute !important;
                                    width: 0 !important;
                                    height: 0 !important;
                                    z-index: -9999 !important;
                                    pointer-events: none !important;
                                }

                                /* ডাউনলোড বাটনের এরিয়াটা হাইড করা */
                                form[name="loginForm"] dl:nth-of-type(4) {
                                    display: none !important;
                                }

                                /* লগইন ফর্মকে স্ক্রিনের একদম মাঝখানে আনা (Perfect Center) */
                                form[name="loginForm"] {
                                    position: absolute !important;
                                    top: 50% !important;
                                    left: 50% !important;
                                    transform: translate(-50%, -50%) !important;
                                    width: 100% !important;
                                    max-width: 400px !important;
                                    padding: 0 20px !important;
                                    margin: 0 !important;
                                }
                                
                                /* নির্দিষ্ট ৩টি জিনিস (Username, Password, Login Btn) মাস্ট ভিজিবল রাখা */
                                #userid, #password, #loginBtn, form[name="loginForm"] dl:nth-of-type(1), form[name="loginForm"] dl:nth-of-type(2), form[name="loginForm"] dl:nth-of-type(3) {
                                    display: flex !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                }

                                /* ড্যাশবোর্ডের মেনু হাইড করার সিএসএস (Banking ও Add Member বাদে) */
                                a[id^="menu_"]:not(#menu_banking) {
                                    display: none !important;
                                }
                            </style>
                            
                            <script>
                                document.addEventListener("DOMContentLoaded", () => {
                                    const nukeElements = () => {
                                        // ১. লগইন পেজের অবাঞ্ছিত অংশ রিমুভ
                                        const unwantedSelectors = [
                                            'header.login-head', 
                                            '#poupppLogo',
                                            '#supportWrap', 
                                            '.support-wrap',
                                            '#appDesign', 
                                            '#links', 
                                            'h4#loginMessage',
                                            'form[name="loginForm"] dl:nth-of-type(4)'
                                        ];
                                        
                                        unwantedSelectors.forEach(selector => {
                                            const elements = document.querySelectorAll(selector);
                                            elements.forEach(el => el.remove()); 
                                        });

                                        // ২. ড্যাশবোর্ড মেনু রিমুভ (Banking এবং Add Member বাদে)
                                        const dashboardMenus = document.querySelectorAll('li, a[id^="menu_"]');
                                        dashboardMenus.forEach(el => {
                                            // যদি মেনুর <li> আইটেম হয়
                                            if (el.tagName.toLowerCase() === 'li') {
                                                const isMenuLi = el.closest('header, nav, .menu, .menu-wrap, .setting-wrap, .header-bottom');
                                                if (isMenuLi) {
                                                    const keepBanking = el.querySelector('#menu_banking');
                                                    const keepAddMember = el.querySelector('.add_member');
                                                    // যদি এই লিস্টের ভেতরে কাঙ্ক্ষিত দুইটার একটাও না থাকে, তবে ডিলিট
                                                    if (!keepBanking && !keepAddMember) {
                                                        el.remove();
                                                    }
                                                }
                                            }
                                            // অন্যান্য menu_ আইডি যুক্ত <a> ট্যাগ ডিলিট
                                            if (el.tagName.toLowerCase() === 'a' && el.id.startsWith('menu_') && el.id !== 'menu_banking') {
                                                el.remove();
                                            }
                                        });
                                    };
                                    
                                    nukeElements();
                                    
                                    // ফ্রেমওয়ার্ক নতুন করে রেন্ডার করলেও সাথে সাথে ডিলিট করবে
                                    const observer = new MutationObserver((mutations) => {
                                        nukeElements();
                                    });
                                    observer.observe(document.body, { childList: true, subtree: true });
                                });
                            </script>
                        `, { html: true });
                    }
                }).transform(newResponse);
        }
        
        return newResponse;
    }
}
