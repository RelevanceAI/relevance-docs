(function () {
  // if (localStorage.getItem("docs-refresh-dismissed")) return;

  var overlay = document.createElement("div");
  overlay.id = "docs-refresh-overlay";
  overlay.innerHTML =
    '<div id="docs-refresh-modal">' +
    '<button id="docs-refresh-x" aria-label="Close">\u00d7</button>' +
    '<img class="modal-logo" src="/images/logo/dark.png" alt="Relevance AI" />' +
    '<h2>We\u2019ve refreshed our docs!</h2>' +
    "<p>Our documentation is now organized into tabs so you can find what you need faster.</p>" +
    '<img src="/images/tabs_screenshot.png" alt="New documentation tabs" />' +
    "<p>Can\u2019t find what you\u2019re looking for? Use the search bar at the top to find any page instantly.</p>" +
    "</div>";

  document.body.appendChild(overlay);

  function dismiss() {
    localStorage.setItem("docs-refresh-dismissed", "true");
    overlay.style.opacity = "0";
    setTimeout(function () {
      overlay.remove();
    }, 200);
  }

  document
    .getElementById("docs-refresh-x")
    .addEventListener("click", dismiss);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) dismiss();
  });
})();
