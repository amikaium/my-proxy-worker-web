addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);

  // আপনার দেওয়া মূল সাইটের লিংক
  const targetBase = 'https://tenx365x.live';
  
  // ব্যবহারকারী যে পাথে (path) ভিজিট করবে, আইফ্রেমে সেই পেজটিই লোড হবে
  let targetUrl = targetBase + url.pathname + url.search;

  // যদি কেউ সরাসরি আপনার মূল ডোমেইনে (যেমন: yourdomain.com/) প্রবেশ করে, 
  // তবে তাকে ডিফল্টভাবে ইন-প্লে পেজটি দেখানো হবে
  if (url.pathname === '/') {
    targetUrl = targetBase + '/exchange/member/Matches/Inplay';
  }

  // ফুল-স্ক্রিন আইফ্রেম সহ এইচটিএমএল (HTML) পেজ তৈরি
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Sports Live</title>
      <style>
          /* পেজের মার্জিন সরিয়ে আইফ্রেমকে সম্পূর্ণ স্ক্রিন জুড়ে দেওয়া হয়েছে */
          body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              overflow: hidden;
              background-color: #000; /* লোড হওয়ার আগে কালো ব্যাকগ্রাউন্ড দেখাবে */
          }
          iframe {
              width: 100%;
              height: 100%;
              border: none;
          }
      </style>
  </head>
  <body>
      <iframe 
          src="${targetUrl}" 
          allow="autoplay; fullscreen; encrypted-media" 
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
          allowfullscreen>
      </iframe>
  </body>
  </html>
  `;

  // ব্রাউজারকে HTML পেজ হিসেবে রেসপন্স পাঠানো
  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}
