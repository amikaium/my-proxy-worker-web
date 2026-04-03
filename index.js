export default {
  async fetch(request, env, ctx) {
    const TARGET = "https://vellki247.com";
    const url = new URL(request.url);

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

    // STREAM / VIDEO / HLS FIX
    if (
      contentType.includes("video") ||
      url.pathname.includes(".m3u8") ||
      url.pathname.includes(".ts")
    ) {
      return new Response(response.body, {
        headers: response.headers,
        status: response.status
      });
    }

    let newHeadersResp = new Headers(response.headers);

    newHeadersResp.delete("content-security-policy");
    newHeadersResp.delete("x-frame-options");

    // COOKIE FIX
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      newHeadersResp.set(
        "set-cookie",
        setCookie.replaceAll("vellki247.com", url.hostname)
      );
    }

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
