export default {
    async fetch(request) {
        // টার্গেট ওয়েবসাইটের ডোমেইন
        const targetHostname = 'ag.tenx365x.live';
        
        // বর্তমান রিকোয়েস্টের URL এবং ডোমেইন
        const url = new URL(request.url);
        const workerHostname = url.hostname;
        
        // টার্গেট ডোমেইনে রিকোয়েস্ট পাঠানোর জন্য URL পরিবর্তন
        url.hostname = targetHostname;
        
        const newRequest = new Request(url.toString(), new Request(request, {
            redirect: 'manual' 
        }));
        
        // অরিজিনাল ওয়েবসাইটের কাছে রিকোয়েস্ট ভ্যালিড করার জন্য হেডার
        newRequest.headers.set('Host', targetHostname);
        newRequest.headers.set('Origin', `https://${targetHostname}`);
        newRequest.headers.set('Referer', `https://${targetHostname}${url.pathname}`);
        newRequest.headers.set('Cache-Control', 'no-cache'); // ক্যাশ ইগনোর করার জন্য
        
        const response = await fetch(newRequest);
        let newResponse = new Response(response.body, response);
        
        // রিডাইরেক্ট (Location) ঠিক করা
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(targetHostname, workerHostname));
        }
        
        // কুকিজ (Cookies) ঠিক করা
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(targetHostname, 'g'), workerHostname));
        }

        const contentType = newResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return new HTMLRewriter()
                // লেয়ার ১: সার্ভার লেভেল থেকে পার্মানেন্ট রিমুভ (ব্রাউজারে আসবেই না)
                .on('header.login-head', { element(el) { el.remove(); } })
                .on('div#supportWrap', { element(el) { el.remove(); } })
                .on('button#appDesign', { element(el) { el.remove(); } })
                .on('button#links', { element(el) { el.remove(); } })
                .on('head', {
                    element(el) {
                        el.append(`
                            <style>
                                /* লেয়ার ২: অ্যাগ্রেসিভ ফোর্স সিএসএস (যেকোনো ফ্রেমওয়ার্ককে ওভাররাইড করবে) */
                                
                                /* পেজের সম্পূর্ণ ব্যাকগ্রাউন্ড ডার্ক করে দেওয়া */
                                html, body, .ui-mobile-viewport, .ui-page, .ui-page-theme-a {
                                    background-image: none !important;
                                    background-color: #121212 !important;
                                    color: #ffffff !important;
                                }
                                
                                /* অবাঞ্ছিত সবকিছু ফোর্স হাইড করা */
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

                                /* ডাউনলোড বাটনের এরিয়াটা (form এর ভেতরের 4th dl) হাইড করা */
                                form[name="loginForm"] dl:nth-of-type(4) {
                                    display: none !important;
                                }

                                /* শুধু লগইন ফর্মকে স্ক্রিনের ঠিক মাঝখানে সুন্দরভাবে সেট করা */
                                form[name="loginForm"] {
                                    display: flex !important;
                                    flex-direction: column !important;
                                    justify-content: center !important;
                                    min-height: 100vh !important; /* একদম মাঝখানে রাখার জন্য */
                                    padding: 0 25px !important;
                                    margin: 0 !important;
                                    max-width: 500px !important;
                                    margin-left: auto !important;
                                    margin-right: auto !important;
                                }
                                
                                /* নির্দিষ্ট ৩টি জিনিস (Username, Password, Login Btn) মাস্ট ভিজিবল রাখা */
                                #userid, #password, #loginBtn, form[name="loginForm"] dl:nth-of-type(1), form[name="loginForm"] dl:nth-of-type(2), form[name="loginForm"] dl:nth-of-type(3) {
                                    display: flex !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                }
                            </style>
                            
                            <script>
                                /* লেয়ার ৩: পাওয়ারফুল জাভাস্ক্রিপ্ট কিলার (MutationObserver) */
                                /* যদি ফ্রেমওয়ার্ক নতুন করে কোনো ইলিমেন্ট বানায়, এটা সাথে সাথে ধ্বংস করে দিবে */
                                document.addEventListener("DOMContentLoaded", () => {
                                    const nukeElements = () => {
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
                                            elements.forEach(el => el.remove()); // ডাইরেক্ট ডিলিট
                                        });
                                    };
                                    
                                    // প্রথমবার ক্লিন করা
                                    nukeElements();
                                    
                                    // ফ্রেমওয়ার্কের রেন্ডারিং মনিটর করা এবং ক্লিন করা
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
