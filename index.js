    // মূল কোডের শুরুতে যেখানে url ভেরিয়েবল আছে
    // const url = new URL(request.url); এর ঠিক নিচে এই কোডটি বসান:

    if (url.pathname.includes('gamex.689a2e64e46ee4d9cc7e.svg')) {
      // এটি আপনার ২য় ছবির মতো একটি কাস্টম SVG কোড তৈরি করবে
      const customSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="0,0 0,100 100,100" fill="#56BAD9" />
        </svg>
      `;
      
      // মূল সার্ভারে না গিয়ে সরাসরি ওয়ার্কার থেকেই ইমেজটি রেসপন্স হিসেবে পাঠিয়ে দেবে
      return new Response(customSvg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=86400" // ফাস্ট লোডের জন্য ক্যাশে করে রাখা
        }
      });
    }
