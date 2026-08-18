// Blobby — the live Invent badge inside .invent-callout bubbles.
// Auto-loaded by Mintlify on every page; no-ops on pages without a bubble.
//
// Ported from the product's useInventorEyes / InventorBuddyEyes so the eyes
// behave the same here as they do in-app: they follow the cursor across the
// page, blink on their own, and greet with ^ ^ when you hover the bubble.
//
// This file only builds him and animates him. Everything visual — his size,
// where he sits, the bubble itself — lives in /style.css.
(function () {
  var SEAL_SRC = "/images/invent-blobby-seal.svg";

  // Eye travel limit, in viewBox units of the 2.4→45.6 badge.
  var MAX_EYE_TRAVEL = 2.6;
  var GAZE_DEADZONE_PX = 6;
  var GAZE_FULL_REACH_PX = 260;
  var HAPPY_HOLD_MS = 2600;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // One page-level cursor tracker shared by every badge on the page.
  var pointer = { x: -9999, y: -9999, movedAt: 0 };
  var tracking = false;
  function trackPointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.movedAt = performance.now();
  }

  // Where the eyes should point for a cursor dx/dy px from the badge centre.
  // Scaled down when the cursor is close — full travel up close reads
  // cross-eyed. Null inside the dead zone.
  function computeGazeTarget(dx, dy) {
    var dist = Math.hypot(dx, dy);
    if (dist <= GAZE_DEADZONE_PX) return null;
    var reach =
      MAX_EYE_TRAVEL * (0.35 + 0.65 * Math.min(1, dist / GAZE_FULL_REACH_PX));
    return { x: (dx / dist) * reach, y: (dy / dist) * reach };
  }

  // The seal markup, fetched once and shared by every badge on the page.
  var sealMarkup = null;
  var sealPromise = null;
  function loadSeal() {
    if (!sealPromise) {
      sealPromise = fetch(SEAL_SRC)
        .then(function (r) {
          return r.text();
        })
        .then(function (text) {
          // Keep only what sits inside the <svg> — the gradients and the four
          // stacked paths that make up the iridescent seal.
          sealMarkup = text.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>[\s\S]*$/, "");
          return sealMarkup;
        })
        .catch(function () {
          // Leave the CSS fallback showing and let a later mount retry.
          sealPromise = null;
          return null;
        });
    }
    return sealPromise;
  }

  var instance = 0;

  function buildBadge(bubble, seal) {
    // Gradient ids are namespaced per badge so two bubbles on one page don't
    // collide on the same defs.
    var id = "ib" + ++instance;
    var markup = seal.replace(/inventorBadge(\w+)/g, "inventorBadge$1-" + id);

    // Decorative — he presses when you click him, but he doesn't go
    // anywhere. A span, not an anchor: Mintlify paints an animated underline
    // on any anchor sitting in body copy.
    var link = document.createElement("span");
    link.className = "invent-blobby";
    link.setAttribute("aria-hidden", "true");

    // Seal and eyes live in ONE svg, so they scale and press as a single unit.
    link.innerHTML =
      '<svg viewBox="2.4 2.4 43.2 43.2" xmlns="http://www.w3.org/2000/svg">' +
      markup +
      '<g class="invent-blobby-shift">' +
      '<g class="invent-blobby-eyes">' +
      '<rect class="invent-blobby-eye" x="17.2" y="17.4" width="4.6" height="10.4" rx="2.3" fill="#fff"/>' +
      '<rect class="invent-blobby-eye" x="26.2" y="17.4" width="4.6" height="10.4" rx="2.3" fill="#fff"/>' +
      "</g>" +
      '<g class="invent-blobby-smile" stroke="#fff" stroke-width="2.7" stroke-linecap="round" fill="none">' +
      '<path d="M17.4 24.4 Q19.5 21 21.6 24.4"/>' +
      '<path d="M26.4 24.4 Q28.5 21 30.6 24.4"/>' +
      "</g>" +
      "</g>" +
      "</svg>";

    bubble.insertBefore(link, bubble.firstChild);
    bubble.classList.add("has-blobby");
    return link;
  }

  function animate(link) {
    var shift = link.querySelector(".invent-blobby-shift");
    var eyes = link.querySelector(".invent-blobby-eyes");
    var smile = link.querySelector(".invent-blobby-smile");
    if (reduceMotion) return;

    if (!tracking) {
      document.addEventListener("mousemove", trackPointer, { passive: true });
      tracking = true;
    }

    var current = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };

    // Blink every few seconds, sometimes twice — the tell that it's alive.
    function scheduleBlink() {
      setTimeout(
        function () {
          if (!link.isConnected) return;
          eyes.classList.add("is-blinking");
          setTimeout(function () {
            eyes.classList.remove("is-blinking");
            if (Math.random() < 0.25) {
              setTimeout(function () {
                eyes.classList.add("is-blinking");
                setTimeout(function () {
                  eyes.classList.remove("is-blinking");
                }, 110);
              }, 160);
            }
          }, 110);
          scheduleBlink();
        },
        2400 + Math.random() * 4200,
      );
    }
    scheduleBlink();

    // The ^ ^ greeting: plays once per hover of the whole bubble, then the
    // eyes reopen on their own even if the pointer never leaves.
    var happyTimer = null;
    link.closest(".invent-callout").addEventListener("mouseenter", function () {
      eyes.classList.add("is-happy");
      smile.classList.add("is-happy");
      if (happyTimer) clearTimeout(happyTimer);
      happyTimer = setTimeout(function () {
        eyes.classList.remove("is-happy");
        smile.classList.remove("is-happy");
        happyTimer = null;
      }, HAPPY_HOLD_MS);
    });

    function update(now) {
      if (!link.isConnected) return;
      var rect = link.getBoundingClientRect();
      var gaze = computeGazeTarget(
        pointer.x - (rect.left + rect.width / 2),
        pointer.y - (rect.top + rect.height / 2),
      );
      // He holds the last look when the cursor stops, rather than snapping
      // back to centre — only a cursor sitting right on him recentres.
      if (gaze) {
        target.x = gaze.x;
        target.y = gaze.y;
      }

      // Lerp toward the target so the eyes have muscle, not magnetism.
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      shift.setAttribute(
        "transform",
        "translate(" + current.x.toFixed(2) + " " + current.y.toFixed(2) + ")",
      );
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function mount() {
    var bubbles = document.querySelectorAll(".invent-callout:not(.has-blobby)");
    if (!bubbles.length) return;
    loadSeal().then(function (seal) {
      if (!seal) return;
      bubbles.forEach(function (bubble) {
        if (bubble.classList.contains("has-blobby")) return;
        animate(buildBadge(bubble, seal));
      });
    });
  }

  // Mintlify is a Next.js SPA — re-check on DOM changes so the badge survives
  // client-side navigation and hydration. Coalesced to one check per frame:
  // mounting mutates the tree the observer is watching.
  var queued = false;
  function queueMount() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      mount();
    });
  }

  new MutationObserver(queueMount).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
