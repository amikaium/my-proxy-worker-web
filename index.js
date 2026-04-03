export default {
  async fetch(request, env, ctx) {
    const TARGET_HOST = "https://vellki247.com";

    const url = new URL(request.url);

    // Build target URL
    const targetUrl = TARGET_HOST + url.pathname + url.search;

    // Clone request
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow"
    });

    // Remove problematic headers
    modifiedRequest.headers.set("origin", TARGET_HOST);
    modifiedRequest.headers.set("referer", TARGET_HOST);

    let response = await fetch(modifiedRequest);

    let contentType = response.headers.get("content-type") || "";

    // Clone response for modification
    let newResponse = new Response(response.body, response);

    // Remove security headers that block embedding
    newResponse.headers.delete("x-frame-options");
    newResponse.headers.delete("content-security-policy");

    // Rewrite HTML
    if (contentType.includes("text/html")) {
      let text = await response.text();

      text = text
        .replaceAll("https://vellki247.com", url.origin)
        .replaceAll("http://vellki247.com", url.origin);

      return new Response(text, {
        headers: newResponse.headers,
        status: response.status
      });
    }

    return newResponse;
  }
};
