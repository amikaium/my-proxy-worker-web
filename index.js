export default {
  async fetch(request, env, ctx) {
    const TARGET = "https://vellki247.com";
    const url = new URL(request.url);

    // 🔥 LIVE / VIDEO / GAME ROUTE DETECT
    if (
      url.pathname.includes("live") ||
      url.pathname.includes("tv") ||
      url.pathname.includes("stream")
    ) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Live</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin:0; padding:0; background:#000; }
            iframe { width:100%; height:100vh; border:none; }
          </style>
        </head>
        <body>
          <iframe src="${TARGET + url.pathname + url.search}"
            allow="autoplay; fullscreen"
            allowfullscreen>
          </iframe>
        </body>
        </html>
      `, {
        headers: { "content-type": "text/html" }
      });
    }

    // 🔁 NORMAL PROXY
    const targetUrl = TARGET + url.pathname + url.search;

    const newHeaders = new Headers(request.headers);
    newHeaders.set("origin", TARGET);
    newHeaders.set("referer", TARGET);

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: "follow"
    });

    const response = await fetch(modifiedRequest);

    const contentType = response.headers.get("content-type") || "";

    let newHeadersResp = new Headers(response.headers);

    // 🔓 SECURITY HEADER REMOVE
    newHeadersResp.delete("content-security-policy");
    newHeadersResp.delete("x-frame-options");

    // 🍪 COOKIE FIX
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      newHeadersResp.set(
        "set-cookie",
        setCookie.replaceAll("vellki247.com", url.hostname)
      );
    }

    // 🔧 HTML REWRITE
    if (contentType.includes("text/html")) {
      let text = await response.text();

      text = text
        .replaceAll("https://vellki247.com", url.origin)
        .replaceAll("http://vellki247.com", url.origin);

      return new Response(text, {
        headers: newHeadersResp,
        status: response.status
      });
    }

    return new Response(response.body, {
      headers: newHeadersResp,
      status: response.status
    });
  }
};
