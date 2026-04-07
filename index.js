export default {
  async fetch(request, env, ctx) {
    // আপনি যে সাইটটি প্রক্সি করতে চান তার ডোমেইন
    const TARGET_DOMAIN = "vellki365.app";

    // ইনকামিং রিকোয়েস্টের ইউআরএল পার্স করা হচ্ছে
    const url = new URL(request.url);

    // ইউআরএল-এর হোস্টনেম পরিবর্তন করে টার্গেট ডোমেইনে সেট করা হচ্ছে
    url.hostname = TARGET_DOMAIN;

    // অরিজিনাল রিকোয়েস্টের মেথড (GET, POST ইত্যাদি) এবং বডি ঠিক রেখে নতুন রিকোয়েস্ট তৈরি
    const newRequest = new Request(url.toString(), request);

    // অনেক সার্ভার Host, Origin বা Referer হেডার না মিললে রিকোয়েস্ট ব্লক করে দেয়।
    // তাই হেডারগুলোকে টার্গেট ডোমেইনের সাথে মিলিয়ে মডিফাই করা হচ্ছে।
    newRequest.headers.set("Host", TARGET_DOMAIN);
    
    if (newRequest.headers.has("Origin")) {
      newRequest.headers.set("Origin", `https://${TARGET_DOMAIN}`);
    }
    if (newRequest.headers.has("Referer")) {
      const refererUrl = new URL(newRequest.headers.get("Referer"));
      refererUrl.hostname = TARGET_DOMAIN;
      newRequest.headers.set("Referer", refererUrl.toString());
    }

    try {
      // টার্গেট সার্ভার থেকে রেসপন্স ফেচ করা হচ্ছে
      let response = await fetch(newRequest);

      // রেসপন্স হেডার মডিফাই করার জন্য রেসপন্সটি রি-ক্রিয়েট করা হচ্ছে
      response = new Response(response.body, response);

      // সিকিউরিটি এবং ব্রাউজার কম্প্যাটিবিলিটির জন্য বেসিক CORS হেডার অ্যাড করা হলো
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      
      // X-Frame-Options রিমুভ করা হচ্ছে যাতে চাইলে আইফ্রেম বা অন্য কোথাও এমবেড করা যায়
      response.headers.delete("X-Frame-Options");
      response.headers.delete("Content-Security-Policy");

      return response;
    } catch (e) {
      // টার্গেট সাইট ডাউন থাকলে বা এরর হলে এই মেসেজ দেখাবে
      return new Response("Error connecting to the upstream server: " + e.message, { status: 500 });
    }
  },
};
