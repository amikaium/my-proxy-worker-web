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
        
        // হেডারগুলো আপডেট করা হচ্ছে যাতে অরিজিনাল সাইট বুঝতে না পারে
        newRequest.headers.set('Host', targetHostname);
        newRequest.headers.set('Origin', `https://${targetHostname}`);
        newRequest.headers.set('Referer', `https://${targetHostname}${url.pathname}`);
        
        const response = await fetch(newRequest);
        let newResponse = new Response(response.body, response);
        
        // Location header ঠিক করা (রিডাইরেক্টের জন্য)
        const location = newResponse.headers.get('location');
        if (location) {
            newResponse.headers.set('location', location.replace(targetHostname, workerHostname));
        }
        
        // Cookies ঠিক করা (লগইন সেশন ঠিক রাখার জন্য)
        const setCookies = newResponse.headers.get('set-cookie');
        if (setCookies) {
            newResponse.headers.set('set-cookie', setCookies.replace(new RegExp(targetHostname, 'g'), workerHostname));
        }

        // রেসপন্স HTML হলে নির্দিষ্ট এলিমেন্টগুলো হাইড করার জন্য CSS ইনজেক্ট করা
        const contentType = newResponse.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
            return new HTMLRewriter().on("head", {
                element(el) {
                    el.append(`
                        <style>
                            /* ১. ব্যানার / লোগো হাইড করা */
                            #poupppLogo, .login-head, header.login-head {
                                display: none !important;
                                opacity: 0 !important;
                                visibility: hidden !important;
                                height: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            /* ২. অ্যাপ ডাউনলোড বাটন ও লিংক হাইড করা */
                            #appDesign, #links {
                                display: none !important;
                                height: 0 !important;
                                overflow: hidden !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }

                            /* ৩. সাপোর্ট সেকশন সম্পূর্ণ হাইড করা */
                            #supportWrap, .support-wrap, .support-service, .support-info {
                                display: none !important;
                                height: 0 !important;
                                overflow: hidden !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                        </style>
                    `, { html: true });
                }
            }).transform(newResponse);
        }
        
        return newResponse;
    }
}
