// মূল টার্গেট ডোমেইন
const TARGET_HOST = "velki123.win";
const TARGET_URL = `https://${TARGET_HOST}`;

export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request);
    } catch (e) {
      return new Response(`Worker Error: ${e.message}`, { status: 500 });
    }
  }
};

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // ডায়নামিক প্রক্সি হোস্ট (যে ডোমেইন থেকে ভিজিট করা হচ্ছে বা প্রিভিউ লিংক)
  const proxyHost = url.hostname; 

  // টার্গেট URL তৈরি করা
  url.hostname = TARGET_HOST;
  url.protocol = "https:";

  // রিকোয়েস্ট হেডার মডিফাই করা (যাতে মূল সার্ভার বুঝতে না পারে এটা প্রক্সি)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Host", TARGET_HOST);
  requestHeaders.delete("x-real-ip");
  requestHeaders.delete("cf-connecting-ip");

  if (requestHeaders.has("Origin")) {
    requestHeaders.set("Origin", requestHeaders.get("Origin").replace(proxyHost, TARGET_HOST));
  }
  if (requestHeaders.has("Referer")) {
    requestHeaders.set("Referer", requestHeaders.get("Referer").replace(proxyHost, TARGET_HOST));
  }

  // OPTIONS রিকোয়েস্ট হ্যান্ডেলিং (CORS Preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": requestHeaders.get("Access-Control-Request-Headers") || "*",
        "Access-Control-Max-Age": "86400",
      }
    });
  }

  // মূল সার্ভারে রিকোয়েস্ট পাঠানো
  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    redirect: "manual" // রিডাইরেক্ট ম্যানুয়ালি হ্যান্ডেল করার জন্য
  });

  const response = await fetch(proxyRequest);
  
  // রেসপন্স হেডার মডিফাই করা
  const responseHeaders = new Headers(response.headers);
  
  // সিকিউরিটি হেডার রিমুভ করা যাতে ফ্রেমিং বা ব্রাউজার ব্লক না করে
  responseHeaders.delete("Content-Security-Policy");
  responseHeaders.delete("Content-Security-Policy-Report-Only");
  responseHeaders.delete("Clear-Site-Data");
  responseHeaders.delete("X-Frame-Options");
  
  // CORS সেট করা
  responseHeaders.set("Access-Control-Allow-Origin", "*");

  // 1. রিডাইরেক্ট (Location) ফিক্স করা
  if (responseHeaders.has("Location")) {
    let location = responseHeaders.get("Location");
    location = location.replace(TARGET_HOST, proxyHost);
    responseHeaders.set("Location", location);
  }

  // 2. কুকি (Set-Cookie) ফিক্স করা
  const setCookies = responseHeaders.get("Set-Cookie");
  if (setCookies) {
    // কুকি থেকে মূল ডোমেইন সরিয়ে আপনার ডোমেইন বসানো
    const modifiedCookies = setCookies.replace(new RegExp(TARGET_HOST, 'gi'), proxyHost);
    responseHeaders.set("Set-Cookie", modifiedCookies);
  }

  // রেসপন্স বডি (HTML/JSON) এর ভেতরের লিংকগুলো রিপ্লেস করা
  let body = response.body;
  const contentType = responseHeaders.get("Content-Type") || "";

  if (
    contentType.includes("text/html") || 
    contentType.includes("application/json") || 
    contentType.includes("application/javascript") || 
    contentType.includes("text/css")
  ) {
    let originalText = await response.text();
    
    // মূল সাইটের লিংকগুলোকে প্রক্সি লিংক দিয়ে রিপ্লেস করা
    const regexHost = new RegExp(TARGET_HOST, 'g');
    let modifiedText = originalText.replace(regexHost, proxyHost);
    
    body = modifiedText;
  }

  return new Response(body, {
    status: response.status,
    headers: responseHeaders
  });
}
