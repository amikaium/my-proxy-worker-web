export default {
  async fetch(request, env, ctx) {
    // আপনার কাঙ্ক্ষিত ওয়েবসাইটের লিংক
    const targetUrl = "https://vellki247.com";
    
    const url = new URL(request.url);
    const target = new URL(targetUrl);
    
    // ইউআরএল হোস্টনেম এবং প্রোটোকল পরিবর্তন করা হচ্ছে
    url.hostname = target.hostname;
    url.protocol = target.protocol;

    // নতুন রিকোয়েস্ট তৈরি করা হচ্ছে যাতে অরিজিনাল রিকোয়েস্টের সব ডেটা থাকে
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });

    // হোস্ট হেডার আপডেট করা হচ্ছে
    newRequest.headers.set('Host', target.hostname);
    // Cloudflare এর ডিফল্ট কিছু হেডার মুছে ফেলা হচ্ছে (নিরাপত্তা ও কনফ্লিক্ট এড়াতে)
    newRequest.headers.delete('cf-connecting-ip');
    newRequest.headers.delete('cf-visitor');
    newRequest.headers.delete('x-forwarded-for');
    newRequest.headers.delete('x-forwarded-proto');
    newRequest.headers.delete('x-real-ip');

    try {
      // টার্গেট সার্ভার থেকে রেসপন্স নিয়ে আসা
      let response = await fetch(newRequest);
      
      // রেসপন্স হেডার মডিফাই করার জন্য নতুন রেসপন্স অবজেক্ট তৈরি
      let newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      // CORS এরর এড়ানোর জন্য হেডার যুক্ত করা
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

      return newResponse;
    } catch (e) {
      // কোনো সমস্যা হলে এরর মেসেজ দেখাবে
      return new Response('Error fetching target website.', { status: 500 });
    }
  }
};
