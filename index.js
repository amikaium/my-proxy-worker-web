export default {
  async fetch(request) {
    const targetDomain = "vellki247.com";
    const url = new URL(request.url);
    
    // টার্গেট সাইটের সম্পূর্ণ URL তৈরি করা
    const targetUrl = new URL(`https://${targetDomain}${url.pathname}${url.search}`);
    
    // অরিজিনাল রিকোয়েস্ট থেকে নতুন রিকোয়েস্ট তৈরি করা
    const modifiedRequest = new Request(targetUrl, request);
    
    // হেডার মডিফাই করা (খুবই গুরুত্বপূর্ণ)
    modifiedRequest.headers.set("Host", targetDomain);
    
    if (modifiedRequest.headers.has("Origin")) {
      modifiedRequest.headers.set("Origin", `https://${targetDomain}`);
    }
    if (modifiedRequest.headers.has("Referer")) {
      modifiedRequest.headers.set("Referer", `https://${targetDomain}${url.pathname}`);
    }

    // ক্লাউডফ্লেয়ারের ট্রেসিং হেডারগুলো মুছে ফেলা
    modifiedRequest.headers.delete("cf-connecting-ip");
    modifiedRequest.headers.delete("cf-visitor");
    modifiedRequest.headers.delete("x-forwarded-for");
    modifiedRequest.headers.delete("x-real-ip");

    try {
      // মডিফাই করা রিকোয়েস্টটি টার্গেট সার্ভারে পাঠানো
      const response = await fetch(modifiedRequest);
      
      // রেসপন্স হেডার সেট করার জন্য নতুন রেসপন্স অবজেক্ট তৈরি
      const modifiedResponse = new Response(response.body, response);
      
      // CORS পলিসি বাইপাস করা
      modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
      modifiedResponse.headers.set("X-Frame-Options", "ALLOWALL");
      
      return modifiedResponse;
    } catch (e) {
      return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
