const MAIN_TARGET = '7wickets.live'; 
const STREAM_TARGET = 'n11-production.click'; 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const myDomain = url.hostname;

  // ==========================================
  // ১. API Logic: Admin Panel-এর জন্য Scraper API
  // ==========================================
  if (url.pathname === '/api/scrape') {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const matchId = url.searchParams.get('matchId');
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), { 
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    const proxyUrl = `https://score1.365cric.com/#/score1/${matchId}`;
    try {
      // লিংকে ঢুকে অটোমেটিক রিডাইরেক্ট হওয়া আসল লিংকটা (ckex) বের করে আনা
      const fetchRes = await fetch(proxyUrl, { redirect: 'follow' });
      return new Response(JSON.stringify({ matchId: matchId, finalUrl: fetchRes.url }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch URL" }), { 
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  }

  // ==========================================
  // ২. Proxy Logic: আপনার আগের ওয়েবসাইটের প্রক্সি সিস্টেম
  // ==========================================
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  let targetHost = MAIN_TARGET;
  
  if (url.pathname.startsWith('/__video_proxy__')) {
    targetHost = STREAM_TARGET;
    url.pathname = url.pathname.replace('/__video_proxy__', '') || '/';
  }

  url.hostname = targetHost;

  const proxyReqHeaders = new Headers(request.headers);
  proxyReqHeaders.set('Host', targetHost);
  proxyReqHeaders.set('Origin', `https://${MAIN_TARGET}`);
  proxyReqHeaders.set('Referer', `https://${MAIN_TARGET}/`);
  proxyReqHeaders.delete('Accept-Encoding');

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: proxyReqHeaders,
    body: request.body,
    redirect: 'manual'
  });

  let response;
  try {
    response = await fetch(proxyRequest);
  } catch (err) {
    return new Response("Connection Error", { status: 500 });
  }

  let responseHeaders = new Headers(response.headers);
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  const contentType = (responseHeaders.get('Content-Type') || '').toLowerCase();

  if (contentType.includes('text/html')) {
    let text = await response.text();

    text = text.replace(new RegExp(MAIN_TARGET, 'g'), myDomain);
    text = text.replace(new RegExp(STREAM_TARGET, 'g'), `${myDomain}/__video_proxy__`);

    // ==========================================
    // ৩. Frontend Logic: ফায়ারবেস + আইফ্রেম আপডেট
    // ==========================================
    const emptyBoxScript = `
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
      import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

      // আপনার দেওয়া Firebase Config
      const firebaseConfig = {
        apiKey: "AIzaSyCWHY-fo2_O2uYeZ3somoz_xuFdTZZ9dCo",
        authDomain: "arfan-khan-e1f8f.firebaseapp.com",
        projectId: "arfan-khan-e1f8f",
        storageBucket: "arfan-khan-e1f8f.firebasestorage.app",
        messagingSenderId: "146361086546",
        appId: "1:146361086546:web:bb0bb3f2831a7fa04c658b",
        measurementId: "G-NFS2F4LDV0"
      };

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      let currentMatchId = null;
      let unsubscribeFirestore = null;

      function updateIframe(iframeBox, srcUrl, hideReferrer) {
         iframeBox.innerHTML = '';
         const newIframe = document.createElement('iframe');
         newIframe.src = srcUrl;
         
         if (hideReferrer) {
             newIframe.setAttribute('referrerpolicy', 'no-referrer');
         }
         
         newIframe.style.setProperty('width', '100%', 'important');
         newIframe.style.setProperty('height', '100%', 'important');
         newIframe.style.setProperty('border', 'none', 'important');
         newIframe.style.setProperty('overflow', 'hidden', 'important');
         iframeBox.appendChild(newIframe);
      }

      function listenToFirestore(matchId, sportId, iframeBox) {
        if (unsubscribeFirestore) unsubscribeFirestore(); // আগের লিসেনার অফ করা
        
        const docRef = doc(db, "live_matches", matchId);
        
        // রিয়েল-টাইম ফায়ারস্টোর ডাটাবেস চেক করা
        unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
           if (docSnap.exists() && docSnap.data().realLiveUrl) {
               // 🟢 যদি এডমিন প্যানেল থেকে স্ক্যান করা আসল লিংকটি ডাটাবেসে থাকে
               updateIframe(iframeBox, docSnap.data().realLiveUrl, false);
           } else {
               // 🟠 যদি ডাটাবেসে লিংক না থাকে, তবে ডিফল্ট লজিক কাজ করবে
               if (sportId === '4') {
                   updateIframe(iframeBox, "https://score1.365cric.com/#/ourscore_C/" + matchId, false);
               } else {
                   updateIframe(iframeBox, "https://score1.365cric.com/#/score1/" + matchId, true);
               }
           }
        });
      }

      setInterval(() => {
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) oldIframe.remove();

        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        const sportId = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;
        
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        
        if (scoreArea && newMatchId) {
          scoreArea.style.setProperty('display', 'block', 'important');
          scoreArea.style.setProperty('visibility', 'visible', 'important');

          let myIsconBox = document.getElementById('myIscon');
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '201.6px', 'important');
            myIsconBox.style.setProperty('background-color', '#172832', 'important');
            myIsconBox.style.setProperty('display', 'block', 'important');
            
            scoreArea.innerHTML = ''; 
            scoreArea.appendChild(myIsconBox); 
          }

          if (newMatchId !== currentMatchId) {
            currentMatchId = newMatchId;
            listenToFirestore(newMatchId, sportId, myIsconBox);
          }

          if (myIsconBox) {
            Array.from(myIsconBox.children).forEach(child => {
              if (child.tagName !== 'IFRAME') child.remove();
            });
          }
        }
      }, 300);
    </script>
    `;

    text = text.replace('</body>', emptyBoxScript + '</body>');

    responseHeaders.delete('Content-Length');
    return new Response(text, { status: response.status, headers: responseHeaders });
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
