export default {
  async fetch(request, env, ctx) {
    // CORS বাইপাস করার জন্য হেডার
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId');

    if (!matchId) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    // প্রক্সি লিংক তৈরি
    const proxyUrl = `https://score1.365cric.com/#/score1/${matchId}`;

    try {
      // লিংকে ভিজিট করে রিডাইরেক্ট ফলো করা
      const response = await fetch(proxyUrl, { redirect: 'follow' });
      const finalUrl = response.url; // আসল লিংক এক্সট্র্যাক্ট করা

      return new Response(JSON.stringify({ matchId: matchId, finalUrl: finalUrl }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch URL" }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  }
};
