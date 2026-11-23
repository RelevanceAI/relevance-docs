'use client';

import { useEffect } from 'react';

/**
 * "Dan the docs agent" -- the Relevance AI chat agent embedded on the docs.
 *
 * Mintlify auto-loaded any .js file at the repo root, which is how
 * chat-widget.js got onto every page. Nothing does that here, so this ports
 * the same embed explicitly. Config values are unchanged from chat-widget.js.
 */
const CONFIG = {
  region: 'f1db6c',
  project: '43f86bee51aa-41f2-b7c8-71f3bcde563e',
  agent: '2d3fb2d1-0da6-4150-94b4-f1a2d0a04cc4',
  buttonImage:
    'https://userdata-f1db6c.stack.tryrelevance.com/files/public/43f86bee51aa-41f2-b7c8-71f3bcde563e/agent-emoji-dan%20the%20docs%20agent.png/be0f0749-83ba-4dfa-bf69-64c0bd47d02f.png',
  theme: 'auto',
};

export function ChatWidget() {
  useEffect(() => {
    if (document.getElementById('relevance-chat-config')) return;

    const config = document.createElement('script');
    config.id = 'relevance-chat-config';
    config.type = 'application/json';
    config.setAttribute('data-config', 'embed.relevanceai.com');
    config.textContent = JSON.stringify(CONFIG);
    document.head.appendChild(config);

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://embed.relevanceai.com/script.js';
    document.head.appendChild(script);
  }, []);

  return null;
}
