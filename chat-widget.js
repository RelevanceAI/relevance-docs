// Relevance AI Chat Widget - Auto-loaded by Mintlify on every page
(function () {
  var config = document.createElement("script");
  config.type = "application/json";
  config.setAttribute("data-config", "embed.relevanceai.com");
  config.textContent = JSON.stringify({
    region: "f1db6c",
    project: "43f86bee51aa-41f2-b7c8-71f3bcde563e",
    agent: "2d3fb2d1-0da6-4150-94b4-f1a2d0a04cc4",
    buttonImage:
      "https://userdata-f1db6c.stack.tryrelevance.com/files/public/43f86bee51aa-41f2-b7c8-71f3bcde563e/agent-emoji-dan%20the%20docs%20agent.png/be0f0749-83ba-4dfa-bf69-64c0bd47d02f.png",
    theme: "auto",
  });
  document.head.appendChild(config);

  var script = document.createElement("script");
  script.defer = true;
  script.src = "https://embed.relevanceai.com/script.js";
  document.head.appendChild(script);
})();
