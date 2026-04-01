export default {
  async fetch(request, env, ctx) {
    // আপনার মেইন সাইটের ডোমেইন
    const TARGET_DOMAIN = "vellki247.com";
    const TARGET_URL = "https://" + TARGET_DOMAIN;

    let url = new URL(request.url);
    const MY_DOMAIN = url.hostname; // আপনার বর্তমান কাস্টম ডোমেইন
    
    // রিকোয়েস্ট মেইন সাইটে ফরোয়ার্ড করার জন্য URL পরিবর্তন
    url.hostname = TARGET_DOMAIN;

    // ১. হেডার মডিফাই করা (মেইন সাইটকে ধোঁকা দেওয়ার জন্য)
    let newHeaders = new Headers(request.headers);
    newHeaders.set("Host", TARGET_DOMAIN);
    newHeaders.set("Origin", TARGET_URL);
    newHeaders.set("Referer", TARGET_URL);

    // ২. নতুন রিকোয়েস্ট তৈরি করা
    let newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "manual" // রিডাইরেক্ট কন্ট্রোল করার জন্য
    });

    // ৩. মেইন সাইট থেকে ডাটা ফেচ করা
    let response = await fetch(newRequest);
    let modifiedHeaders = new Headers(response.headers);

    // ৪. CORS পলিসি বাইপাস (লাইভ স্কোর ও API যেন ব্লক না হয়)
    modifiedHeaders.set("Access-Control-Allow-Origin", "*");
    modifiedHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    modifiedHeaders.set("Access-Control-Allow-Headers", "*");
    
    // ৫. ফ্রেম ও সিকিউরিটি পলিসি রিমুভ (লাইভ টিভির iFrame সাপোর্ট করার জন্য)
    modifiedHeaders.delete("Content-Security-Policy");
    modifiedHeaders.delete("X-Frame-Options");
    modifiedHeaders.delete("Strict-Transport-Security");

    // ৬. রিডাইরেক্ট হলে যেন আপনার ডোমেইনেই ইউজার থাকে
    if (modifiedHeaders.has("Location")) {
      let location = modifiedHeaders.get("Location");
      location = location.replace(TARGET_DOMAIN, MY_DOMAIN);
      modifiedHeaders.set("Location", location);
    }

    // ৭. HTML কন্টেন্ট হলে মেইন ডোমেইনের নাম রিপ্লেস করে আপনার ডোমেইন বসানো
    // এতে সাইটের ভেতরের সব লিঙ্ক অটোমেটিক আপনার ডোমেইনে কনভার্ট হয়ে যাবে
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      let text = await response.text();
      // vellki247.com লেখাকে আপনার ডোমেইন দিয়ে রিপ্লেস করা
      let modifiedText = text.replace(new RegExp(TARGET_DOMAIN, 'g'), MY_DOMAIN);
      
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: modifiedHeaders
      });
    }

    // ছবি, ভিডিও, সকেট বা অন্যান্য ফাইলের জন্য সরাসরি রেসপন্স
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders
    });
  }
};
