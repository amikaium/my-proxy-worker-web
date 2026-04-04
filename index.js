    // ==========================================
    // BACK TO ORIGINAL LOGIC (With updated working URL)
    // ==========================================
    const emptyBoxScript = `
    <script>
      let currentMatchId = null;

      setInterval(() => {
        // ১. পুরোনো myIframe আইডিটা থাকলে সেটাকে রিমুভ করে দেওয়া
        const oldIframe = document.getElementById('myIframe');
        if (oldIframe) {
          oldIframe.remove();
        }

        // ২. URL থেকে ডাইনামিক ID এবং Sport ID বের করা
        const pathSegments = window.location.pathname.split('/').filter(segment => segment.length > 0);
        const newMatchId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
        const sportId = pathSegments.length > 1 ? pathSegments[pathSegments.length - 2] : null;

        // ৩. ওয়েবসাইটের অরিজিনাল score_area খুঁজে বের করা
        const scoreArea = document.querySelector('.score_area') || document.getElementById('animScore');
        
        if (scoreArea && newMatchId) {
          // বক্সটিকে অবশ্যই দৃশ্যমান রাখা
          scoreArea.style.setProperty('display', 'block', 'important');
          scoreArea.style.setProperty('visibility', 'visible', 'important');

          // ৪. 'myIscon' আইডি বক্স চেক বা তৈরি করা
          let myIsconBox = document.getElementById('myIscon');
          
          if (!myIsconBox) {
            myIsconBox = document.createElement('div');
            myIsconBox.id = 'myIscon';
            
            // অরিজিনাল স্টাইল সেট করা
            myIsconBox.style.setProperty('width', '100%', 'important');
            myIsconBox.style.setProperty('height', '201.6px', 'important');
            myIsconBox.style.setProperty('background-color', '#172832', 'important');
            myIsconBox.style.setProperty('display', 'block', 'important');
            
            scoreArea.innerHTML = ''; // অরিজিনাল বক্সের ভেতরটা পরিষ্কার করা
            scoreArea.appendChild(myIsconBox); // ভেতরে আমাদের বক্স বসানো
          }

          // ৫. স্পোর্টস আইডি অনুযায়ী সঠিক আইফ্রেম বসানো
          if (newMatchId !== currentMatchId || !myIsconBox.querySelector('iframe')) {
            currentMatchId = newMatchId;
            
            myIsconBox.innerHTML = ''; 
            
            const newIframe = document.createElement('iframe');
            
            // 🔴 এখানেই ম্যাজিক! 
            if (sportId === '4') {
                // ক্রিকেট হলে আপনার কাস্টম লিংক (ourscore_C)
                newIframe.src = "https://score1.365cric.com/#/ourscore_C/" + newMatchId;
            } else {
                // সকার/টেনিস হলে অরিজিনাল score1 লিংক। এই লিংকটাই নিজে থেকে ckex-এ রিডাইরেক্ট করে নেবে।
                newIframe.src = "https://score1.365cric.com/#/score1/" + newMatchId;
            }
            
            newIframe.style.setProperty('width', '100%', 'important');
            newIframe.style.setProperty('height', '100%', 'important');
            newIframe.style.setProperty('border', 'none', 'important');
            newIframe.style.setProperty('overflow', 'hidden', 'important');
            
            myIsconBox.appendChild(newIframe);
          }

          // ৬. আমাদের Iframe ছাড়া অন্য কিছু ওয়েবসাইটে চলে আসলে তা রিমুভ করে দেওয়া
          if (myIsconBox) {
            Array.from(myIsconBox.children).forEach(child => {
              if (child.tagName !== 'IFRAME') {
                child.remove();
              }
            });
          }
        }
      }, 300);
    </script>
    `;
