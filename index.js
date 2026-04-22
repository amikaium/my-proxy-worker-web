export default {
    async fetch(request) {
        // টার্গেট ওয়েবসাইটের ডোমেইন (যেখান থেকে ডেটা আসবে)
        const targetHostname = 'ag.tenx365x.live';
        
        // বর্তমান রিকোয়েস্টের URL এবং ডোমেইন বের করা (আপনার কাস্টম ডোমেইন বা প্রিভিউ লিংক)
        const url = new URL(request.url);
        const workerHostname = url.hostname;
        
        // টার্গেট ডোমেইনে রিকোয়েস্ট পাঠানোর জন্য URL পরিবর্তন
        url.hostname = targetHostname;
        
        // নতুন রিকোয়েস্ট তৈরি করা
        const newRequest = new Request(url.toString(), new Request(request, {
            redirect: 'manual' // রিডাইরেক্ট ম্যানুয়ালি হ্যান্ডেল করার জন্য
        }));
        
        // অরিজিনাল ওয়েবসাইটের কাছে যেন মনে হয় রিকোয়েস্ট তাদের ডোমেইন থেকেই আসছে
        newRequest.headers.set('Host', targetHostname);
        newRequest.headers.set('Origin', `https://${targetHostname}`);
        newRequest.headers.set('Referer', `https://${targetHostname}${url.pathname}`);
        
        // টার্গেট ওয়েবসাইট থেকে রেসপন্স নিয়ে আসা
        const response = await fetch(newRequest);
        let newResponse = new Response(response.body, response);
        
        // রিডাইরেক্ট (Location) হেডার ঠিক করা
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(targetHostname, workerHostname));
        }
        
        // কুকিজ (Cookies) এর ডোমেইন ঠিক করা যাতে লগইন ঠিকঠাক কাজ করে
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(targetHostname, 'g'), workerHostname));
        }

        // রেসপন্স যদি HTML হয়, তাহলে আমরা అనাকাঙ্ক্ষিত ইলিমেন্টগুলো হাইড করে দিব
        const contentType = newResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return new HTMLRewriter().on("head", {
                element(el) {
                    // পেজ লোড হওয়ার আগেই CSS ইনজেক্ট করা হচ্ছে যাতে ১ মিলি-সেকেন্ডের জন্যও কিছু দেখা না যায়
                    el.append(`
                        <style>
                            /* পেজের ব্যাকগ্রাউন্ড ইমেজ সরিয়ে ডার্ক থিম সেট করা */
                            html, body, .ui-page-theme-a {
                                background-image: none !important;
                                background-color: #121212 !important;
                            }
                            
                            /* উপরের ব্যানার ইমেজ সম্পূর্ণ হাইড করা */
                            .login-head {
                                display: none !important;
                                opacity: 0 !important;
                                visibility: hidden !important;
                            }

                            /* নিচের সাপোর্ট সেকশন হাইড করা */
                            .support-wrap {
                                display: none !important;
                            }

                            /* অ্যাপ ডাউনলোড বাটন (ফর্মের ৩য় dl ব্লক) এবং অন্যান্য অপ্রয়োজনীয় বাটন হাইড করা */
                            form[name="loginForm"] dl:nth-of-type(3),
                            button#appDesign, 
                            button#links {
                                display: none !important;
                            }

                            /* লগইন মেসেজ বা ওয়ার্নিং টেক্সট হাইড করা */
                            h4#loginMessage {
                                display: none !important;
                            }

                            /* ইনপুট ফিল্ড ও লগইন বাটন যেন স্ক্রিনের মাঝামাঝি সুন্দরভাবে দেখা যায় তার ডিজাইন */
                            form[name="loginForm"] {
                                margin-top: 25vh !important;
                                padding: 0 25px;
                            }
                            
                            /* ইউজারনেম, পাসওয়ার্ড এবং লগইন বাটন নিশ্চিতভাবে ভিজিবল রাখা */
                            #userid, #password, #loginBtn {
                                display: block !important;
                                visibility: visible !important;
                            }
                        </style>
                    `, { html: true });
                }
            }).transform(newResponse);
        }
        
        return newResponse;
    }
}
