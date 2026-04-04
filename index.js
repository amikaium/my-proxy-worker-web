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
                // সকার/টেনিস হলে অরিজিনাল score1 লিংক
                newIframe.src = "https://score1.365cric.com/#/score1/" + newMatchId;
                
                // 'Not Authorized' বাইপাস করার জন্য Referrer হাইড করা হচ্ছে
                newIframe.setAttribute('referrerpolicy', 'no-referrer');
            }
            
            newIframe.style.setProperty('width', '100%', 'important');
            newIframe.style.setProperty('height', '100%', 'important');
            newIframe.style.setProperty('border', 'none', 'important');
            newIframe.style.setProperty('overflow', 'hidden', 'important');
            
            myIsconBox.appendChild(newIframe);
          }
