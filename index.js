const TARGET_DOMAIN = '7wickets.live';

export default {
  async fetch(request, env, ctx) {
    return await handleRequest(request);
  }
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ১. টার্গেট ডোমেইন সেট করা
  url.hostname = TARGET_DOMAIN;

  // ২. হেডার্স তৈরি করা (সবচেয়ে গুরুত্বপূর্ণ অংশ - স্পুফিং)
  const headers = new Headers(request.headers);
  
  // স্ট্রিমিং সার্ভারকে ধোকা দেওয়ার জন্য Host, Origin এবং Referer মেইন ডোমেইনের নামে সেট করা
  headers.set('Host', TARGET_DOMAIN);
  headers.set('Origin', `https://${TARGET_DOMAIN}`);
  headers.set('Referer', `https://${TARGET_DOMAIN}${url.pathname}`);
  
  // ক্লাউডফ্লেয়ারের ট্রেসিং হেডারগুলো রিমুভ করা, নাহলে অরিজিন সার্ভার প্রক্সি ধরে ফেলবে
  headers.delete('cf-ray');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-visitor');
  headers.delete('x-forwarded-for');
  headers.delete('x-forwarded-proto');

  // ৩. WebSocket সাপোর্ট
  if (request.headers.get('Upgrade') === 'websocket') {
    return fetch(new Request(url.toString(), {
      headers: headers,
      method: request.method,
      body: request.body
    }));
  }

  // ৪. CORS Preflight বাইপাস
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // ৫. মেইন সার্ভারে রিকোয়েস্ট পাঠানো
  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual' // রিডাইরেক্ট নিজে হ্যান্ডেল করার জন্য
  });

  let response = await fetch(proxyRequest);
  let resHeaders = new Headers(response.headers);

  // ৬. ব্রাউজারের জন্য সিকিউরিটি ক্লিয়ার করা ও CORS অ্যালাউ করা
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers', '*');
  resHeaders.delete('Content-Security-Policy');
  resHeaders.delete('X-Frame-Options');
  resHeaders.delete('Strict-Transport-Security');

  // ৭. রিডাইরেক্ট হ্যান্ডেল
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    let location = resHeaders.get('location');
    if (location) {
      location = location.replace(new RegExp(TARGET_DOMAIN, 'gi'), myDomain);
      resHeaders.set('location', location);
    }
    return new Response(response.body, { status: response.status, headers: resHeaders });
  }

  // ৮. কুকিজ ফিক্স করা
  const setCookie = resHeaders.get('set-cookie');
  if (setCookie) {
    resHeaders.set('set-cookie', setCookie.replace(new RegExp(TARGET_DOMAIN, 'gi'), myDomain));
  }

  // ৯. কন্টেন্ট রিপ্লেস করা (HTML, JS, JSON এবং .m3u8 ফাইল)
  const contentType = (resHeaders.get('content-type') || '').toLowerCase();
  const urlPath = url.pathname.toLowerCase();

  const isTextType = contentType.includes('text/') || 
                     contentType.includes('application/javascript') || 
                     contentType.includes('application/json') ||
                     contentType.includes('mpegurl') || // HLS Video Playlist Type
                     urlPath.endsWith('.m3u8');         // HLS Video Extension

  if (isTextType) {
    let bodyText = await response.text();

    // মেইন ডোমেইনকে প্রক্সি ডোমেইন দিয়ে পরিবর্তন করা
    bodyText = bodyText.replace(new RegExp(`https://${TARGET_DOMAIN}`, 'g'), `https://${myDomain}`)
                       .replace(new RegExp(`http://${TARGET_DOMAIN}`, 'g'), `http://${myDomain}`)
                       .replace(new RegExp(`//${TARGET_DOMAIN}`, 'g'), `//${myDomain}`); 

    // Content-Length বাদ দিতে হবে কারণ টেক্সট পরিবর্তন হওয়ায় সাইজ বদলে গেছে
    resHeaders.delete('content-length');
    return new Response(bodyText, { status: response.status, headers: resHeaders });
  }

  // ১০. ভিডিও (.ts) ফাইলগুলো সরাসরি ব্রাউজারে পাঠানো
  // যেহেতু উপরে আমরা Referer এবং Origin মেইন সাইটের নামে স্পুফ করেছি, তাই .ts ফাইলগুলো ব্লক হবে না
  return new Response(response.body, { status: response.status, headers: resHeaders });
}
