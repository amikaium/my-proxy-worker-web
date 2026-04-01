const scriptInjection = `
<style>
#signupButton, .btn-signup { display: inline-block !important; }
</style>

<script>
(function() {

  var proxyHost = window.location.host;

  function buildExtUrl(originalUrl) {
    try {
      let u = new URL(originalUrl, window.location.origin);

      if (u.hostname !== proxyHost) {
        return window.location.origin + '/__ext__/' + u.protocol.replace(':','') + '/' + u.hostname + u.pathname + u.search;
      }
    } catch(e) {}

    return originalUrl;
  }

  // 🔥 CORE FIX FUNCTION
  function fixIframe(ifr) {
    if (!ifr) return;

    let src = ifr.getAttribute('src');

    if (src && src.startsWith('http') && !src.includes('__ext__')) {
      let newSrc = buildExtUrl(src);

      if (ifr.getAttribute('data-fixed-src') !== newSrc) {
        ifr.setAttribute('data-fixed-src', newSrc);
        ifr.src = newSrc;
      }
    }
  }

  // 🔥 ALL IFRAME FIX
  function fixAllIframes() {
    document.querySelectorAll('iframe').forEach(fixIframe);
  }

  // 🔥 INITIAL LOAD
  window.addEventListener('load', fixAllIframes);
  document.addEventListener('DOMContentLoaded', fixAllIframes);

  // 🔥 SPA NAVIGATION DETECT (IMPORTANT)
  let lastUrl = location.href;

  setInterval(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      // নতুন ম্যাচে গেলে আবার fix
      setTimeout(fixAllIframes, 500);
      setTimeout(fixAllIframes, 1500);
      setTimeout(fixAllIframes, 3000);
    }
  }, 500);

  // 🔥 DOM CHANGE OBSERVER (live update)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {

      if (m.type === 'childList') {
        m.addedNodes.forEach(function(node) {

          if (node.tagName === 'IFRAME') {
            fixIframe(node);
          }

          if (node.querySelectorAll) {
            node.querySelectorAll('iframe').forEach(fixIframe);
          }

        });
      }

      if (m.type === 'attributes' && m.target.tagName === 'IFRAME') {
        fixIframe(m.target);
      }

    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });

  // 🔥 FETCH INTERCEPTOR (LIVE TV FIX)
  var origFetch = window.fetch;
  window.fetch = async function(...args) {
    let reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);

    if (reqUrl) {
      try {
        let u = new URL(reqUrl, location.origin);

        if (u.hostname !== proxyHost) {
          reqUrl = buildExtUrl(u.href);
        }

      } catch(e) {}
    }

    args[0] = reqUrl;
    return origFetch.apply(this, args);
  };

  // 🔥 XHR FIX
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {

    try {
      let u = new URL(url, location.origin);

      if (u.hostname !== proxyHost) {
        url = buildExtUrl(u.href);
      }

    } catch(e) {}

    return origOpen.call(this, method, url, ...rest);
  };

})();
</script>
</body>
`;
