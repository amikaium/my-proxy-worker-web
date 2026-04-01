export default {
  async fetch(request) {
    const TARGET_DOMAIN = "vellki247.com";
    
    let url = new URL(request.url);
    const MY_DOMAIN = url.hostname;
    url.hostname = TARGET_DOMAIN;

    // নতুন রিকোয়েস্ট তৈরি এবং হেডার স্পুফিং
    let newRequest = new Request(url.toString(), request);
    newRequest.headers.set("Host", TARGET_DOMAIN);
    newRequest.headers.set("Origin", `https://${TARGET_DOMAIN}`);
    newRequest.headers.set("Referer", `https://${TARGET_DOMAIN}/`);

    // **সবচেয়ে গুরুত্বপূর্ণ: WebSocket হ্যান্ডলিং (লাইভ ভিডিও ও স্কোরের জন্য)**
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(newRequest);
    }

    // সাধারণ রিকোয়েস্ট মেইন সাইটে পাঠানো
    let response = await fetch(newRequest);
    let newResponse = new Response(response.body, response);

    // সিকিউরিটি বাইপাস (CORS এবং Frame)
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.delete("X-Frame-Options");
    newResponse.headers.delete("Content-Security-Policy");

    // HTML পেজ হলে ডোমেইন নাম রিপ্লেস করা
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      let text = await response.text();
      // মেইন ডোমেইন নাম পরিবর্তন করে আপনার ডোমেইন বসানো
      let modifiedText = text.replace(new RegExp(TARGET_DOMAIN, 'g'), MY_DOMAIN);
      return new Response(modifiedText, newResponse);
    }

    return newResponse;
  }
};
