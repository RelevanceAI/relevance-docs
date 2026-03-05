(function () {
  // if (localStorage.getItem("docs-refresh-dismissed")) return;

  var overlay = document.createElement("div");
  overlay.id = "docs-refresh-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Documentation update announcement");

  var modal = document.createElement("div");
  modal.id = "docs-refresh-modal";

  var closeBtn = document.createElement("button");
  closeBtn.id = "docs-refresh-x";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "\u00d7";

  var logo = document.createElement("img");
  logo.className = "modal-logo";
  logo.src = "/docs/images/logo/dark.png";
  logo.alt = "Relevance AI";

  var heading = document.createElement("h2");
  heading.textContent = "We\u2019ve refreshed our docs!";

  var p1 = document.createElement("p");
  p1.textContent = "Our documentation is now organized into tabs so you can find what you need faster.";

  var screenshot = document.createElement("img");
  screenshot.src = "/docs/images/tabs_screenshot.png";
  screenshot.alt = "New documentation tabs";

  var p2 = document.createElement("p");
  p2.textContent = "Can\u2019t find what you\u2019re looking for? Use the search bar to find any page, or chat with our Docs agent in the bottom right to get answers quick.";

  modal.appendChild(closeBtn);
  modal.appendChild(logo);
  modal.appendChild(heading);
  modal.appendChild(p1);
  modal.appendChild(screenshot);
  modal.appendChild(p2);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  closeBtn.focus();

  function dismiss() {
    localStorage.setItem("docs-refresh-dismissed", "true");
    overlay.style.opacity = "0";
    overlay.addEventListener("transitionend", function () {
      overlay.remove();
    });
  }

  closeBtn.addEventListener("click", dismiss);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) dismiss();
  });
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", onEsc);
      dismiss();
    }
  });
})();
