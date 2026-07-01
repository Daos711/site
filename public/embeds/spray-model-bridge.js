// Bridge script injected into spray-model.html when embedded as an iframe.
// Reports document height to the parent and applies look-and-feel overrides
// so the model sits seamlessly on the host page.
(function () {
  if (window.self === window.top) return;

  function applyOverrides() {
    if (document.getElementById("site-bridge-overrides")) return;
    var s = document.createElement("style");
    s.id = "site-bridge-overrides";
    s.textContent =
      "html,body{background:transparent!important;margin:0!important}" +
      "body h1{display:none!important}";
    (document.head || document.documentElement).appendChild(s);
  }

  function postHeight() {
    var h = Math.max(
      document.documentElement.scrollHeight,
      (document.body && document.body.scrollHeight) || 0
    );
    if (h > 0) {
      window.parent.postMessage(
        { type: "spray-model-height", height: h },
        "*"
      );
    }
  }

  function init() {
    applyOverrides();
    postHeight();
    requestAnimationFrame(postHeight);
    setTimeout(postHeight, 100);
    setTimeout(postHeight, 500);
    setTimeout(postHeight, 1500);

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(postHeight);
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("load", postHeight);
})();
