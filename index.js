export default {
  async fetch(request, env, ctx) {
    // এটি একটি ডেমো টার্গেট ডোমেইন
    const targetDomain = "example.com"; 

    // ইনকামিং রিকোয়েস্ট থেকে একটি নতুন URL অবজেক্ট তৈরি করা
    const url = new URL(request.url);

    // হোস্টনেম পরিবর্তন করে টার্গেট ডোমেইন সেট করা
    url.hostname = targetDomain;

    // নতুন URL এবং অরিজিনাল রিকোয়েস্টের হেডার/মেথড দিয়ে নতুন রিকোয়েস্ট তৈরি করা
    const newRequest = new Request(url.toString(), request);

    // টার্গেট সার্ভার থেকে রেসপন্স নিয়ে আসা
    try {
      const response = await fetch(newRequest);
      
      // অরিজিনাল রেসপন্সটি পরিবর্তনযোগ্য (mutable) করে ব্যবহারকারীকে পাঠানো
      const newResponse = new Response(response.body, response);
      return newResponse;
      
    } catch (error) {
      return new Response("Error fetching the target website.", { status: 500 });
    }
  },
};