// Invent demo — the Invent panel itself, playing the task the page is about.
// One placement, leading a page where a hero screenshot would:
//
//   <div className="invent-demo" data-demo="meet"></div>
//
// The `data-demo` key picks a script from DEMOS below. Every script runs the
// same arc: Invent greets you, you type the prompt, and the panel goes to
// work — one tool call at a time in the window, then the thing that now
// exists. Then it starts over.
//
// Auto-loaded by Mintlify on every page; no-ops where no anchor is present.
//
// Built to the app's own components (builder-app/features/invent/v3):
// InventorGreeting for the badge and its speech bubble, InventorSuggested-
// Actions for the quick replies, InventorMessageInput for the composer and
// the toolbar under it, InventorToolScreen for the window a call plays in.
// Blobby is the real badge, mounted here by /invent-callout.js, so his eyes
// follow the cursor in the panel the way they do everywhere else.
//
// This file only assembles and schedules it. Everything visual lives in
// /style.css under the .ivd- prefix.
(function () {
  // The panel's own furniture, verbatim from the product.
  var PLACEHOLDER = "Create agents, tools and workforces...";
  var GREETING = "How can I help?";
  var REPLIES = [
    "Build an agent from a discussion",
    "Discuss best practices for my agents",
    "Test my agents and track performance",
  ];
  // Whatever model the reader would have selected. One line to change when
  // the app's default moves on.
  var MODEL_LABEL = "Opus 4.8";

  var GREET_MS = 2400;
  var SEND_MS = 520;
  // How long the greeting takes to clear the stage. Matches the .is-out
  // animation in style.css.
  var GREETING_OUT_MS = 260;

  // Per-entity mark tints, in the app's order: pink, green, purple, yellow,
  // blue. A list never shows a column of identical glyphs — each row wears
  // its own face.
  var TINTS = [
    "240 107 216",
    "47 187 104",
    "167 93 255",
    "234 195 0",
    "52 145 251",
  ];

  // Lucide paths, the same marks the app puts in the window chrome.
  var GLYPHS = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    wrench:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    wand: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"/><path d="M18 16v4"/><path d="M16 18h4"/>',
    bot: '<rect width="16" height="11" x="4" y="9" rx="3"/><path d="M12 9V5"/><path d="M9.5 14h.01"/><path d="M14.5 14h.01"/>',
    plug: '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8z"/><path d="M12 17v5"/>',
    gauge:
      '<path d="M12 21a9 9 0 1 0-9-9"/><path d="M3 12h2"/><path d="M12 4v2"/><path d="m14.5 14.5 4-4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.4 2.4 2.4 4.6-5"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
    workforce:
      '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4"/><path d="m10.4 13-3 3"/><path d="m13.6 13 3 3"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 19v3"/>',
    send: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  };

  function icon(name) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' +
      GLYPHS[name] +
      "</svg>"
    );
  }

  // The verified-style seal the app hangs off a settled row or a finished
  // thing: brand disc, white check.
  var SEAL =
    '<svg class="ivd-seal" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="11" fill="rgb(104 95 255)"/>' +
    '<path d="m7.5 12.4 3 3 6-6.6" fill="none" stroke="#fff" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------------
  // The scripts. A beat is one tool call on the window: its chrome (title,
  // kind, mark), the stage body, and how long it holds. `state` is the label
  // while the call is live and `settled` the one it flips to partway through;
  // list headlines carry the same pair as [present, past]. `kind` is the only
  // thing that decides the wash — see washFor — so the same call cannot come
  // out a different colour on a different page.
  // ---------------------------------------------------------------------
  var DEMOS = {
    // Meet Invent — the shortest possible arc: ask for an Agent, get one.
    meet: {
      prompt: "Qualify the leads that come in from our website form",
      beats: [
        {
          title: "List Tools",
          kind: "search",
          icon: "wrench",
          state: "Running",
          settled: "Done",
          ms: 3400,
          body: {
            kind: "list",
            headline: ["Looking through tools", "Looked through tools"],
            rows: [
              { mark: 0, label: "Enrich company from domain" },
              { mark: 2, label: "Score lead against ICP" },
              { mark: 4, label: "Send Slack message", detail: "3 steps" },
              { mark: 1, label: "Create Salesforce task" },
              { mark: 3, label: "Look up the account owner" },
            ],
          },
        },
        {
          title: "Create Agent",
          kind: "create",
          target: "Lead Qualifier",
          icon: "wand",
          state: "Running",
          settled: "Done",
          ms: 4200,
          body: {
            kind: "form",
            fields: [
              ["Name", "Lead Qualifier"],
              ["Purpose", "Score inbound form leads, route the strong ones"],
            ],
          },
        },
        {
          title: "Created 1 Agent",
          kind: "create",
          icon: "check",
          ms: 3600,
          body: {
            kind: "finale",
            mark: 2,
            markIcon: "bot",
            name: "Lead Qualifier",
            meta: "Agent · in draft",
          },
        },
      ],
    },

    // Build with Invent — the full arc, because this is the reference page:
    // find the Tools, build the missing one, wire the Agent, set the bar.
    build: {
      prompt: "Research inbound leads, score them, and route the best to an AE",
      beats: [
        {
          title: "List Tools",
          kind: "search",
          target: "lead enrichment",
          icon: "search",
          state: "Running",
          settled: "5 results",
          ms: 3400,
          body: {
            kind: "search",
            query: "lead enrichment",
            rows: [
              { mark: 1, label: "Enrich company from domain" },
              { mark: 3, label: "Find decision makers" },
              { mark: 0, label: "Score lead against ICP" },
              { mark: 4, label: "Look up the latest funding round" },
              { mark: 2, label: "Check the tech stack" },
            ],
          },
        },
        {
          title: "Create Tool",
          kind: "create",
          target: "Route lead to an AE",
          icon: "wrench",
          state: "Running",
          settled: "Done",
          ms: 4200,
          body: {
            kind: "form",
            fields: [
              ["Name", "Route lead to an AE"],
              ["Steps", "Look up owner, post to Slack, log the handoff"],
            ],
          },
        },
        {
          title: "Attach Tools To Agent",
          kind: "edit",
          target: "Inbound Lead Router",
          icon: "bot",
          state: "Running",
          settled: "Done",
          ms: 3600,
          body: {
            kind: "list",
            headline: ["Updating agent tools", "Updated agent tools"],
            rows: [
              {
                mark: 1,
                label: "Enrich company from domain",
                detail: "Attached",
                tone: "positive",
              },
              {
                mark: 0,
                label: "Score lead against ICP",
                detail: "Attached",
                tone: "positive",
              },
              {
                mark: 4,
                label: "Route lead to an AE",
                detail: "Attached",
                tone: "positive",
              },
            ],
          },
        },
        {
          title: "Create Eval Test Set",
          kind: "create",
          target: "Inbound lead routing",
          icon: "gauge",
          state: "Running",
          settled: "Done",
          ms: 4200,
          body: {
            kind: "form",
            fields: [
              ["Test set", "Inbound lead routing"],
              ["Checks", "Score is justified, the right AE was tagged"],
            ],
          },
        },
        {
          title: "Run Evaluation",
          kind: "run",
          target: "Inbound lead routing",
          icon: "gauge",
          state: "Running",
          settled: "4 / 4 passed",
          ms: 3600,
          body: {
            kind: "list",
            headline: ["Running the test set", "Finished running the test set"],
            rows: [
              {
                mark: null,
                label: "Scores a strong lead above 80",
                detail: "Passed",
                tone: "positive",
              },
              {
                mark: null,
                label: "Tags the account's own AE",
                detail: "Passed",
                tone: "positive",
              },
              {
                mark: null,
                label: "Leaves a weak lead unrouted",
                detail: "Passed",
                tone: "positive",
              },
              {
                mark: null,
                label: "Says why it scored the lead that way",
                detail: "Passed",
                tone: "positive",
              },
            ],
          },
        },
        {
          title: "Created 1 Agent, 1 Tool",
          kind: "create",
          icon: "check",
          ms: 4000,
          body: {
            kind: "finale",
            mark: 2,
            markIcon: "bot",
            name: "Inbound Lead Router",
            meta: "Agent · 1 Tool · 4 Checks",
          },
        },
      ],
    },

    // Explore with Invent — a guide read back as your own process, gaps and
    // all, before anything gets built.
    explore: {
      prompt: "Run the inbound SDR guide, but against our own stages",
      beats: [
        {
          title: "Ask Questions",
          kind: "ask",
          icon: "wand",
          state: "Waiting on you",
          settled: "Answered",
          ms: 4200,
          body: {
            kind: "list",
            headline: ["Asking about your process", "Asked about your process"],
            rows: [
              {
                mark: null,
                label: "Which CRM holds the lead?",
                detail: "Salesforce",
              },
              {
                mark: null,
                label: "What counts as qualified?",
                detail: "Meeting booked",
              },
              {
                mark: null,
                label: "Who owns the follow-up?",
                detail: "The AE",
              },
            ],
          },
        },
        {
          title: "Create Workforce",
          kind: "create",
          target: "Inbound SDR",
          icon: "workforce",
          state: "Running",
          settled: "Done",
          ms: 4200,
          body: {
            kind: "form",
            fields: [
              ["Name", "Inbound SDR"],
              ["Agents", "Researcher, Qualifier, Follow-up writer"],
            ],
          },
        },
        {
          title: "Created 1 Workforce",
          kind: "create",
          icon: "check",
          ms: 3600,
          body: {
            kind: "finale",
            mark: 2,
            markIcon: "workforce",
            name: "Inbound SDR",
            meta: "Workforce · 3 Agents",
          },
        },
      ],
    },

    // Configure with Invent — the pause is the point on this page, so the
    // window holds on the approval rather than racing past it.
    configure: {
      prompt: "Publish the Lead Qualifier agent",
      beats: [
        {
          title: "Publish Agent",
          kind: "publish",
          target: "Lead Qualifier",
          icon: "shield",
          state: "Waiting on you",
          settled: "Approved",
          ms: 5200,
          body: {
            kind: "approve",
            lead: "Always ask",
            action: "Publish Lead Qualifier, replacing the live version",
          },
        },
        {
          title: "Publish Agent",
          kind: "publish",
          target: "Lead Qualifier",
          icon: "wand",
          state: "Running",
          settled: "Done",
          ms: 3400,
          body: {
            kind: "list",
            headline: ["Publishing agent", "Published agent"],
            rows: [
              {
                mark: null,
                label: "Version 4 is now live",
                detail: "Published",
                tone: "positive",
              },
              { mark: null, label: "Draft cleared", detail: "No changes" },
              { mark: null, label: "Audit event recorded" },
            ],
          },
        },
        {
          title: "Published 1 Agent",
          kind: "publish",
          icon: "check",
          ms: 3400,
          body: {
            kind: "finale",
            mark: 2,
            markIcon: "bot",
            name: "Lead Qualifier",
            meta: "Agent · version 4 live",
          },
        },
      ],
    },

    // Integrate with Invent — what it can reach, and the wall it stops at.
    integrate: {
      prompt: "Read the account from Salesforce and draft the follow-up in Gmail",
      beats: [
        {
          title: "List OAuth Accounts",
          kind: "connect",
          icon: "plug",
          state: "Running",
          settled: "Done",
          ms: 3800,
          body: {
            kind: "list",
            headline: ["Checking integrations", "Checked integrations"],
            rows: [
              {
                mark: 4,
                letter: "SF",
                label: "Salesforce",
                detail: "Connected",
                tone: "positive",
              },
              {
                mark: 0,
                letter: "G",
                label: "Gmail",
                detail: "Connected",
                tone: "positive",
              },
              {
                mark: 1,
                letter: "GC",
                label: "Google Calendar",
                detail: "Connected",
                tone: "positive",
              },
              {
                mark: 3,
                letter: "HS",
                label: "HubSpot",
                detail: "Connected",
                tone: "positive",
              },
              {
                mark: 2,
                letter: "SL",
                label: "Slack",
                detail: "Not connected",
                tone: "negative",
              },
            ],
          },
        },
        {
          title: "Create Tool",
          kind: "create",
          target: "Draft the follow-up",
          icon: "wrench",
          state: "Running",
          settled: "Done",
          ms: 4200,
          body: {
            kind: "form",
            fields: [
              ["Name", "Draft the follow-up"],
              ["Integrations", "Salesforce read, Gmail draft"],
            ],
          },
        },
        {
          title: "Created 1 Tool",
          kind: "create",
          icon: "check",
          ms: 3600,
          body: {
            kind: "finale",
            mark: 4,
            markIcon: "wrench",
            name: "Draft the follow-up",
            meta: "Tool · in draft",
          },
        },
      ],
    },
  };

  // Which calls the window paints violet, verbatim from the app's own rule
  // (InventorToolScreen's windowWash): work that touches live state. A run, a
  // publish, a batch (a fan-out of runs), a chart. Creating and editing land
  // in draft, so they read on the neutral wash like everything else — which
  // is why a Create Tool looks the same on every page it appears on.
  var VIOLET_KINDS = ["run", "bulk", "chart", "publish"];

  function washFor(beat) {
    // Paused on the reader: the colour drains out, so the stage reads as held
    // rather than working.
    if (beat.body.kind === "approve") return "grey";
    // The receipt for what now exists — the app's showcase finale.
    if (beat.body.kind === "finale") return "violet";
    return VIOLET_KINDS.indexOf(beat.kind) === -1 ? "neutral" : "violet";
  }

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ~26ms a character, capped so a long sentence doesn't hold a beat open.
  function typeMs(text) {
    return Math.min(Math.max(text.length, 1) * 26, 1500);
  }

  function typeStep(text) {
    return typeMs(text) / Math.max(text.length, 1);
  }

  function esc(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function escAttr(text) {
    return esc(text).replace(/"/g, "&quot;");
  }

  // A run of text waiting to be typed, and optionally the caret that trails
  // it. The text is carried on data-type rather than in the element, so
  // startTypers can add it one character at a time — which is what keeps the
  // caret on the last character without measuring anything.
  function runHtml(text, delay, caret) {
    return (
      '<span class="ivd-run"><span class="ivd-typed" data-type="' +
      escAttr(text) +
      '" data-delay="' +
      (delay || 0) +
      '"></span>' +
      (caret ? '<i class="ivd-caret"></i>' : "") +
      "</span>"
    );
  }

  // Types every pending run inside root. `at` is the caller's own scheduler,
  // so a demo that scrolls out of view stops mid-word like everything else.
  function startTypers(root, at) {
    root.querySelectorAll("[data-type]").forEach(function (el) {
      var text = el.getAttribute("data-type");
      var step = typeStep(text);
      var run = el.closest(".ivd-run");
      var i = 0;
      function tick() {
        el.textContent = text.slice(0, ++i);
        // Follow the caret the way a real field does, so the character just
        // typed is always the one you can see.
        if (run) run.scrollLeft = run.scrollWidth;
        if (i < text.length) at(step, tick);
      }
      at(Number(el.getAttribute("data-delay")) || 0, tick);
    });
  }

  // Reduced motion: nothing types, everything is already written.
  function fillTypers(root) {
    root.querySelectorAll("[data-type]").forEach(function (el) {
      el.textContent = el.getAttribute("data-type");
    });
  }

  // A row only wears a mark when the thing it names has an identity of its
  // own. Questions, Checks and audit lines are bare labels — the app leads
  // those with a pip, not with a repeated glyph.
  function markHtml(row) {
    if (row.mark === null) return '<span class="ivd-pip"></span>';
    return (
      '<span class="ivd-mark-tile" style="--tint:' +
      TINTS[row.mark % TINTS.length] +
      '">' +
      (row.letter ? esc(row.letter) : icon("wrench")) +
      "</span>"
    );
  }

  // A settled positive fact collapses to the seal — "Passed" repeated down a
  // list is noise. Negatives keep their words, in a quiet tint pill.
  function detailHtml(row) {
    if (!row.detail) return "";
    if (row.tone === "positive") return SEAL;
    return (
      '<span class="ivd-detail" data-tone="' +
      (row.tone || "muted") +
      '">' +
      esc(row.detail) +
      "</span>"
    );
  }

  function rowsHtml(rows) {
    return (
      '<div class="ivd-rows">' +
      rows
        .map(function (row, i) {
          return (
            '<div class="ivd-row" style="--i:' +
            i +
            '">' +
            markHtml(row) +
            '<span class="ivd-row-label">' +
            esc(row.label) +
            "</span>" +
            detailHtml(row) +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function stepHtml(beat) {
    return (
      '<div class="ivd-step" data-live="true"><span class="ivd-step-tile">' +
      icon("loader") +
      '</span><span class="ivd-step-label">' +
      esc(beat.title) +
      (beat.target
        ? '<span class="ivd-step-target"><span aria-hidden="true"> · </span>' +
          esc(beat.target) +
          "</span>"
        : "") +
      "</span></div>"
    );
  }

  // Settled: the spinner gives way to the tool's own glyph and the line
  // stops holding the accent.
  function settleStep(row, beat) {
    if (!row) return;
    row.setAttribute("data-live", "false");
    row.querySelector(".ivd-step-tile").innerHTML = icon(beat.icon);
  }

  function stageHtml(body) {
    if (body.kind === "search") {
      return (
        '<div class="ivd-strip"><span class="ivd-strip-glyph">' +
        icon("search") +
        "</span>" +
        runHtml(body.query, 0, true) +
        "</div>" +
        rowsHtml(body.rows)
      );
    }
    if (body.kind === "list") {
      return (
        '<div class="ivd-pill"><span class="ivd-headline">' +
        esc(body.headline[0]) +
        "</span></div>" +
        rowsHtml(body.rows)
      );
    }
    if (body.kind === "form") {
      return (
        '<div class="ivd-glass">' +
        body.fields
          .map(function (field, i) {
            return (
              '<div class="ivd-field"><span class="ivd-label">' +
              esc(field[0]) +
              '</span><span class="ivd-input">' +
              runHtml(field[1], 320 + i * 900, false) +
              "</span></div>"
            );
          })
          .join("") +
        "</div>"
      );
    }
    if (body.kind === "approve") {
      return (
        '<div class="ivd-glass ivd-approve"><span class="ivd-approve-head">' +
        icon("shield") +
        esc(body.lead) +
        '</span><span class="ivd-approve-body">' +
        esc(body.action) +
        '</span><span class="ivd-approve-actions">' +
        '<span class="ivd-btn ivd-btn-primary">Approve</span>' +
        '<span class="ivd-btn">Not now</span></span></div>'
      );
    }
    return (
      '<div class="ivd-finale" style="--tint:' +
      TINTS[body.mark % TINTS.length] +
      '"><span class="ivd-finale-tile">' +
      icon(body.markIcon) +
      SEAL +
      '</span><span class="ivd-finale-name">' +
      esc(body.name) +
      '</span><span class="ivd-finale-meta">' +
      esc(body.meta) +
      "</span></div>"
    );
  }

  // The panel, built once and then only switched between its two states —
  // Blobby is mounted into .ivd-mark by /invent-callout.js and has to stay
  // where he was put.
  function build(anchor) {
    var root = document.createElement("div");
    root.className = "ivd";
    root.innerHTML =
      '<div class="ivd-panel">' +
      '<div class="ivd-body">' +
      '<div class="ivd-greeting is-in">' +
      '<div class="ivd-greet-row">' +
      '<span class="ivd-mark" aria-hidden="true"></span>' +
      '<span class="ivd-bubble">' +
      esc(GREETING) +
      "</span>" +
      "</div>" +
      '<div class="ivd-replies">' +
      REPLIES.map(function (label, i) {
        return (
          '<span class="ivd-reply" style="--i:' +
          i +
          '">' +
          esc(label) +
          icon("chevron") +
          "</span>"
        );
      }).join("") +
      "</div>" +
      "</div>" +
      '<div class="ivd-thread" hidden>' +
      '<div class="ivd-sent"></div>' +
      '<div class="ivd-steps"></div>' +
      '<div class="ivd-screen" data-wash="neutral">' +
      '<div class="ivd-chrome">' +
      '<span class="ivd-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="ivd-title"></span><span class="ivd-state"></span>' +
      "</div>" +
      '<div class="ivd-stage"></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="ivd-dock">' +
      '<div class="ivd-composer" data-ready="false">' +
      '<span class="ivd-composer-field"></span>' +
      '<span class="ivd-mic">' +
      icon("mic") +
      "</span>" +
      '<span class="ivd-send">' +
      icon("send") +
      "</span>" +
      "</div>" +
      '<div class="ivd-footer">' +
      '<span class="ivd-foot-icon">' +
      icon("plus") +
      "</span>" +
      "<span>Ask first</span><span>" +
      esc(MODEL_LABEL) +
      "</span>" +
      '<span class="ivd-mic">' +
      icon("mic") +
      "</span>" +
      "</div>" +
      "</div>" +
      "</div>";
    anchor.appendChild(root);
    return {
      panel: root.querySelector(".ivd-panel"),
      greeting: root.querySelector(".ivd-greeting"),
      thread: root.querySelector(".ivd-thread"),
      sent: root.querySelector(".ivd-sent"),
      steps: root.querySelector(".ivd-steps"),
      screen: root.querySelector(".ivd-screen"),
      title: root.querySelector(".ivd-title"),
      state: root.querySelector(".ivd-state"),
      stage: root.querySelector(".ivd-stage"),
      composer: root.querySelector(".ivd-composer"),
      field: root.querySelector(".ivd-composer-field"),
    };
  }

  function paint(parts, beat, settled) {
    parts.screen.setAttribute("data-wash", washFor(beat));
    var live = !settled && !!beat.state;
    parts.title.className = "ivd-title" + (live ? " is-spinning" : "");
    parts.title.innerHTML =
      icon(live ? "loader" : beat.icon) + "<span>" + esc(beat.title) + "</span>";
    parts.state.textContent = (settled ? beat.settled : beat.state) || "";
    parts.state.setAttribute("data-tone", settled ? "settled" : "live");
  }

  // Restart a state's entrance. The animations hang off .is-in so they can be
  // replayed without rebuilding the DOM under them — the greeting's row is
  // where Blobby is mounted, and he has to stay put.
  function replay(el) {
    el.classList.remove("is-in");
    void el.offsetWidth;
    el.classList.add("is-in");
  }

  function showGreeting(parts) {
    parts.panel.setAttribute("data-state", "greeting");
    parts.thread.hidden = true;
    parts.thread.classList.remove("is-in");
    parts.greeting.hidden = false;
    parts.greeting.classList.remove("is-out");
    parts.composer.setAttribute("data-ready", "false");
    parts.field.innerHTML =
      '<span class="ivd-placeholder">' + esc(PLACEHOLDER) + "</span>";
    replay(parts.greeting);
  }

  function play(parts) {
    var demo = parts.demo;
    var timers = [];
    var visible = false;
    var index = 0;

    function clear() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function at(ms, fn) {
      timers.push(setTimeout(fn, ms));
    }

    function alive() {
      return parts.panel.isConnected;
    }

    // 1. He greets, and the replies arrive one after another.
    function greet() {
      if (!alive()) return clear();
      showGreeting(parts);
      at(GREET_MS, type);
    }

    // 2. You type past them into the composer instead.
    function type() {
      if (!alive()) return clear();
      parts.composer.setAttribute("data-ready", "true");
      parts.field.innerHTML = runHtml(demo.prompt, 0, true);
      startTypers(parts.field, at);
      at(typeMs(demo.prompt) + SEND_MS, send);
    }

    // 3. Sent. The panel hands the floor over: the greeting clears out and
    //    the composer stands down with it — there is nothing to type into a
    //    panel that is working — then your turn lands and the window, now
    //    with the whole panel to itself, gets going.
    function send() {
      if (!alive()) return clear();
      parts.composer.setAttribute("data-ready", "false");
      parts.field.innerHTML =
        '<span class="ivd-placeholder">' + esc(PLACEHOLDER) + "</span>";
      parts.panel.setAttribute("data-state", "working");
      parts.greeting.classList.add("is-out");
      at(GREETING_OUT_MS, function () {
        if (!alive()) return clear();
        parts.greeting.hidden = true;
        parts.thread.hidden = false;
        parts.sent.textContent = demo.prompt;
        parts.steps.textContent = "";
        replay(parts.thread);
        index = 0;
        beat();
      });
    }

    // 4. One call at a time. Each beat paints once, flips to its settled
    //    state partway through, then hands over — and the last one hands
    //    back to the greeting, so the loop reads as a fresh ask rather than
    //    a video rewinding.
    function beat() {
      if (!alive()) return clear();
      if (index >= demo.beats.length) return greet();
      var current = demo.beats[index++];
      // A finale is the group's receipt, not another call, so it gets the
      // window without adding a line.
      var row = null;
      if (current.body.kind !== "finale") {
        parts.steps.insertAdjacentHTML("beforeend", stepHtml(current));
        row = parts.steps.lastElementChild;
      }
      paint(parts, current, false);
      parts.stage.setAttribute(
        "data-fill",
        current.body.kind === "list" || current.body.kind === "search"
          ? "top"
          : "center",
      );
      parts.stage.innerHTML = stageHtml(current.body);
      startTypers(parts.stage, at);
      if (current.settled) {
        at(Math.round(current.ms * 0.58), function () {
          paint(parts, current, true);
          settleStep(row, current);
          var headline = parts.stage.querySelector(".ivd-headline");
          if (headline && current.body.headline) {
            headline.textContent = current.body.headline[1];
          }
          var button = parts.stage.querySelector(".ivd-btn-primary");
          if (button) button.classList.add("is-pressed");
        });
      }
      at(current.ms, beat);
    }

    // Nothing runs while the demo is off-screen — it is a decoration, and
    // not the reason the reader is on the page.
    var watcher = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting === visible) return;
          visible = entry.isIntersecting;
          if (visible) {
            greet();
          } else {
            clear();
          }
        });
      },
      { rootMargin: "120px" },
    );
    watcher.observe(parts.panel);
    parts.stop = function () {
      clear();
      watcher.disconnect();
    };
  }

  function mount() {
    document.querySelectorAll(".invent-demo").forEach(function (anchor) {
      var key = anchor.getAttribute("data-demo");
      var demo = DEMOS[key];
      if (!demo) return;
      // Mintlify's router can hand the same anchor to another page rather
      // than replacing it, so a built demo is keyed by the script it is
      // playing: a key that no longer matches is a rebuild, not a skip.
      if (anchor.dataset.builtDemo === key && anchor.firstElementChild) return;
      if (anchor.teardownDemo) anchor.teardownDemo();
      anchor.textContent = "";
      var parts = build(anchor);
      parts.demo = demo;
      anchor.dataset.builtDemo = key;
      // Reduced motion gets the outcome, held still: the thread on its last
      // beat, no timers, no typing.
      if (reduceMotion) {
        var last = demo.beats[demo.beats.length - 1];
        parts.panel.setAttribute("data-state", "working");
        parts.greeting.hidden = true;
        parts.thread.hidden = false;
        parts.sent.textContent = demo.prompt;
        demo.beats.forEach(function (b) {
          if (b.body.kind === "finale") return;
          parts.steps.insertAdjacentHTML("beforeend", stepHtml(b));
          settleStep(parts.steps.lastElementChild, b);
        });
        parts.field.innerHTML =
          '<span class="ivd-placeholder">' + esc(PLACEHOLDER) + "</span>";
        paint(parts, last, true);
        parts.stage.setAttribute(
          "data-fill",
          last.body.kind === "list" || last.body.kind === "search"
            ? "top"
            : "center",
        );
        parts.stage.innerHTML = stageHtml(last.body);
        fillTypers(parts.stage);
        anchor.teardownDemo = null;
        return;
      }
      showGreeting(parts);
      play(parts);
      anchor.teardownDemo = parts.stop;
    });
  }

  // Mintlify is a Next.js SPA — re-check on DOM changes so the demo survives
  // client-side navigation and hydration. data-demo is watched too: the
  // router can hand the same div to another page and only swap the key.
  // Coalesced to one check per frame: mounting mutates the tree the observer
  // is watching, and the filter keeps its own data-built-demo out of that.
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      mount();
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-demo"],
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
