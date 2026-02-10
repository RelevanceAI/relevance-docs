
# Documentation Categories Plan

This document organizes all Relevance AI documentation content into top-level categories similar to Claude Code docs structure. Each category will appear as a tab in the top navigation bar.

## Category Structure

### 1. Getting Started
**Purpose:** Help new users understand the platform and get up and running quickly.

#### Overview
- `get-started/introduction.mdx`

#### Quickstart Guides
- `agent/quick-start-guide.mdx`
- `workforce/workforce-overview/quick-start-guide.mdx`
- `get-started/enterprise/quick-start-guide.mdx`

#### Core Concepts
- `get-started/key-concepts/agent.mdx`
- `get-started/key-concepts/tools.mdx`
- `get-started/key-concepts/knowledge.mdx`

#### Account Setup
- `get-started/account-management/update-profile-info.mdx`
- `get-started/account-management/change-email-address.mdx`
- `get-started/account-management/change-password.mdx`
- `get-started/account-management/account-deletion.mdx`

#### Troubleshooting
- `get-started/troubleshooting/troubleshooting-browser-issues.mdx`
- `get-started/troubleshooting/troubleshooting-agents-not-working.mdx`
- `get-started/support.mdx`

#### System Information
- `get-started/system-limits.mdx`
- `get-started/subscriptions/plans.mdx`
- `get-started/subscriptions/new-pricing.mdx`
- `get-started/subscriptions/spend-controls.mdx`

#### Security
- `security.mdx`

---

### 2. Build
**Purpose:** Guide users through building Agents, Tools, Workforces, and other features.

#### Agents
- `agent/introduction.mdx`
- **Build Your Agent**
  - `agent/build-your-agent/build-overview.mdx`
  - `agent/build-your-agent/prompt.mdx`
  - `agent/build-your-agent/tools.mdx`
  - `agent/build-your-agent/triggers.mdx`
  - `agent/build-your-agent/escalations.mdx`
  - `agent/build-your-agent/memory.mdx`
  - `agent/build-your-agent/variables.mdx`
  - `agent/build-your-agent/evals.mdx`
  - **Agent Triggers**
    - `agent/build-your-agent/agent-triggers/integrations.mdx`
    - `agent/build-your-agent/agent-triggers/custom-webhook.mdx`
    - `agent/build-your-agent/agent-triggers/zapier.mdx`
    - `agent/build-your-agent/agent-triggers/api.mdx`
    - `agent/build-your-agent/agent-triggers/tools-as-triggers.mdx`
  - **Advanced Settings**
    - `agent/build-your-agent/agent-settings/general.mdx`
    - `agent/build-your-agent/agent-settings/language-model.mdx`
    - `agent/build-your-agent/agent-settings/subagents.mdx`
    - `agent/build-your-agent/agent-settings/task-view.mdx`
    - `agent/build-your-agent/agent-settings/flow-builder.mdx`
  - **Agent Modes**
    - `agent/build-your-agent/agent-modes/phone-calls.mdx`
    - **Meeting Agents**
      - `agent/use-cases/meeting-agents-overview.mdx`
      - `agent/use-cases/calendar-scheduling.mdx`
      - `agent/use-cases/meeting-notetaker.mdx`
      - `agent/advanced-features/on-call-ai-commands.mdx`
- **Give Your Agent Tasks**
  - `agent/give-your-agent-tasks/task-overview.mdx`
  - `agent/give-your-agent-tasks/interact-with-your-agent.mdx`
  - `agent/give-your-agent-tasks/bulk-schedule.mdx`
  - `agent/give-your-agent-tasks/task-queue.mdx`
- **AI Assistants**
  - `agent/assistants/assistants-overview.mdx`
  - `agent/assistants/cloning-and-setting-up-assistant.mdx`
  - `agent/assistants/webflow-assistant.mdx`
  - `agent/assistants/notion-assistant.mdx`
  - `agent/assistants/hubspot-assistant.mdx`
  - `agent/assistants/gmail-assistant.mdx`
  - `agent/assistants/google-docs-assistant.mdx`
  - `agent/assistants/google-slides-assistant.mdx`
  - `agent/assistants/workforce.mdx`
- **Sharing & Management**
  - `agent/share-your-agent.mdx`
  - `agent/delete-agent.mdx`
- **Examples**
  - `agent/agent-examples/bosh-bdr-agent.mdx`

#### Tools
- `tool/introduction.mdx`
- `tool/create-a-tool.mdx`
- `tool/delete-tool.mdx`
- **Customize Tools**
  - `tool/customize-tool/tool-style-guide.mdx`
  - `tool/customize-tool/inputs.mdx`
  - `tool/customize-tool/steps.mdx`
  - `tool/customize-tool/outputs.mdx`
  - `tool/customize-tool/looping.mdx`
  - `tool/customize-tool/branching.mdx`
- **Tool Steps** (Reference section - see Reference category)
- **Sharing**
  - `tool/share-your-tool.mdx`

#### Workforce
- **Build an AI Workforce**
  - `workforce/build-an-ai-workforce/add-triggers.mdx`
  - `workforce/build-an-ai-workforce/introduction-to-nodes.mdx`
  - `workforce/build-an-ai-workforce/add-agents.mdx`
  - `workforce/build-an-ai-workforce/add-tools.mdx`
  - `workforce/build-an-ai-workforce/add-conditions.mdx`
  - `workforce/build-an-ai-workforce/edge-settings.mdx`
  - `workforce/build-an-ai-workforce/notes.mdx`
- **Workforce Features**
  - `workforce/workforce-features/trigger-to-agent-configuration.mdx`
  - `workforce/workforce-features/agent-to-agent-configuration.mdx`
  - `workforce/workforce-features/agent-to-tool-configuration.mdx`
  - `workforce/workforce-features/tool-to-tool-configuration.mdx`
  - `workforce/workforce-features/condition-to-tool-configuration.mdx`
  - `workforce/workforce-features/communication.mdx`
  - `workforce/workforce-features/workforce-task-view.mdx`
  - `workforce/workforce-features/approvals-and-escalations.mdx`
- **Sharing**
  - `workforce/share-your-workforce.mdx`

#### Knowledge
- `knowledge/introduction.mdx`
- `knowledge/create-knowledge.mdx`
- **Integrated Knowledge Sources**
  - `knowledge/integrated-knowledge-sources/google-drive.mdx`
  - `knowledge/integrated-knowledge-sources/sharepoint.mdx`
  - `knowledge/integrated-knowledge-sources/notion.mdx`
- `knowledge/find-and-use-knowledge.mdx`
- `knowledge/enrich-with-tool.mdx`
- `knowledge/knowledge-tool-steps.mdx`
- `knowledge/use-snippets-for-quick-access.mdx`
- `knowledge/advanced-knowledge-retrieval.mdx`

#### Chat
- `chat/intro-to-chat.mdx`
- **Chat Agents**
  - `chat/chat-agents/website-builder.mdx`
  - `chat/chat-agents/image-generator.mdx`
  - `chat/chat-agents/deep-researcher.mdx`
  - `chat/chat-agents/slide-builder.mdx`

#### Marketplace
- `marketplace/intro-to-marketplace.mdx`
- **Relevance Builders**
  - `marketplace/relevance-builders/become-a-relevance-builder.mdx`
  - `marketplace/relevance-builders/setup-builder-profile.mdx`
  - `marketplace/relevance-builders/submit-agents.mdx`
  - `marketplace/relevance-builders/getting-paid.mdx`
  - `marketplace/relevance-builders/supporting-agents.mdx`

---

### 3. Integrations
**Purpose:** Connect Relevance AI with external services and platforms.

#### Overview
- `integrations/introduction.mdx`
- `integrations/add-integrations.mdx`
- `integrations/removing-integrations.mdx`

#### LLM Integrations
- `integrations/llm-integrations/openai.mdx`
- `integrations/llm-integrations/gemini.mdx`
- `integrations/llm-integrations/anthropic.mdx`
- `integrations/llm-integrations/azure.mdx`
- `integrations/llm-integrations/openrouter.mdx`

#### Popular Integrations
- `integrations/popular-integrations/airtop.mdx`
- `integrations/popular-integrations/canva.mdx`
- `integrations/popular-integrations/confluence.mdx`
- `integrations/popular-integrations/fireflies.mdx`
- `integrations/popular-integrations/freshdesk.mdx`
- `integrations/popular-integrations/github.mdx`
- `integrations/popular-integrations/gmail.mdx`
- `integrations/popular-integrations/google-calendar.mdx`
- `integrations/popular-integrations/google-sheets.mdx`
- `integrations/popular-integrations/hubspot.mdx`
- `integrations/popular-integrations/linkedin.mdx`
- `integrations/popular-integrations/lusha.mdx`
- `integrations/popular-integrations/marketo.mdx`
- `integrations/popular-integrations/Model-context-protocol.mdx`
- `integrations/popular-integrations/notion.mdx`
- `integrations/popular-integrations/outlook.mdx`
- `integrations/popular-integrations/salesforce.mdx`
- `integrations/popular-integrations/slack.mdx`
- `integrations/popular-integrations/telegram.mdx`
- `integrations/popular-integrations/trello.mdx`
- `integrations/popular-integrations/vercel.mdx`
- `integrations/popular-integrations/whatsapp.mdx`
- `integrations/popular-integrations/whatsapp-for-business.mdx`
- `integrations/popular-integrations/zendesk.mdx`
- `integrations/popular-integrations/zoom.mdx`
- `integrations/popular-integrations/zoominfo.mdx`

#### Integration Examples
- `integrations/integration-examples/email-warmups.mdx`

#### API Integration
- `get-started/key-concepts/api-keys.mdx`

---

### 4. Administration
**Purpose:** Manage organizations, projects, users, and enterprise features.

#### Organization & Project Management
- `get-started/project-management/add-members.mdx`
- `get-started/project-management/remove-members.mdx`
- `get-started/project-management/delete-project.mdx`
- `get-started/project-management/change-project-and-org-name.mdx`
- `get-started/project-management/usage-alerts.mdx`
- `get-started/project-management/usage-limits.mdx`
- `get-started/project-management/ids.mdx`

#### Enterprise
- `get-started/enterprise/sso-setup.mdx`
- `get-started/enterprise/rbac-groups.mdx`
- `get-started/enterprise/org-structure-best-practices.mdx`
- `get-started/enterprise/rbac.mdx`
- `get-started/enterprise/analytics.mdx`
- `get-started/enterprise/streaming-events.mdx`
- `get-started/enterprise/integration-controls.mdx`
- `get-started/enterprise/org-project-level-api-keys.mdx`
- `get-started/enterprise/org-project-controls-governance.mdx`
- `get-started/enterprise/asset-controls.mdx`
- `get-started/enterprise/default-org.mdx`
- `get-started/enterprise/data-retention.mdx`

---

### 5. Configuration
**Purpose:** Configure settings and platform preferences.

*(No configuration-specific pages - configuration is handled within relevant categories)*

---

### 6. Reference
**Purpose:** Technical reference documentation for APIs, tool steps, and commands.

#### API Reference
- (No API reference pages currently in docs.json)

#### Tool Steps Reference
- `tool/tool-steps.mdx`
- **LLM Tool Steps**
  - `tool/tool-steps/llms/llm-tool-step.mdx`
- **Knowledge Tool Steps**
  - `tool/tool-steps/knowledge/insert-knowledge.mdx`
  - `tool/tool-steps/knowledge/delete-knowledge.mdx`
  - `tool/tool-steps/knowledge/update-knowledge.mdx`
  - `tool/tool-steps/knowledge/advanced-knowledge-search-2m.mdx`
  - `tool/tool-steps/knowledge/advanced-knowledge-search.mdx`
  - `tool/tool-steps/knowledge/knowledge-search.mdx`
  - `tool/tool-steps/knowledge/get-knowledge.mdx`
  - `tool/tool-steps/knowledge/using-variables-in-json.mdx`
- **Google Docs Tool Steps**
  - `tool/tool-steps/google-docs/append-text.mdx`
  - `tool/tool-steps/google-docs/append-image-to-document.mdx`
  - `tool/tool-steps/google-docs/get-document.mdx`
  - `tool/tool-steps/google-docs/create-a-new-document.mdx`
  - `tool/tool-steps/google-docs/replace-text.mdx`
  - `tool/tool-steps/google-docs/create-new-document-from-template.mdx`
- **Google Calendar Tool Steps**
  - `tool/tool-steps/google-calendar/create-google-calendar-event.mdx`
  - `tool/tool-steps/google-calendar/check-google-calendar-availability.mdx`
  - `tool/tool-steps/google-calendar/get-events-from-google-calendar.mdx`
  - `tool/tool-steps/google-calendar/cancel-event-in-google-calendar.mdx`
  - `tool/tool-steps/google-calendar/get-all-google-calendars-details.mdx`
  - `tool/tool-steps/google-calendar/get-google-calendar-event-details.mdx`
- **Google Sheets Tool Steps**
  - `tool/tool-steps/google-sheets/add-single-row.mdx`
  - `tool/tool-steps/google-sheets/list-worksheets.mdx`
  - `tool/tool-steps/google-sheets/get-values-in-range.mdx`
  - `tool/tool-steps/google-sheets/create-spreadsheet.mdx`
  - `tool/tool-steps/google-sheets/update-row.mdx`
  - `tool/tool-steps/google-sheets/add-multiple-rows.mdx`
  - `tool/tool-steps/google-sheets/find-row.mdx`
  - `tool/tool-steps/google-sheets/create-worksheet.mdx`
  - `tool/tool-steps/google-sheets/update-cell.mdx`
  - `tool/tool-steps/google-sheets/get-spreadsheet-by-id.mdx`
  - `tool/tool-steps/google-sheets/delete-rows.mdx`
  - `tool/tool-steps/google-sheets/clear-rows.mdx`
  - `tool/tool-steps/google-sheets/clear-cell.mdx`
  - `tool/tool-steps/google-sheets/delete-worksheet.mdx`
  - `tool/tool-steps/google-sheets/update-multiple-rows.mdx`
  - `tool/tool-steps/google-sheets/copy-worksheet.mdx`
  - `tool/tool-steps/google-sheets/create-column.mdx`
  - `tool/tool-steps/google-sheets/get-cell.mdx`
- **Gmail Tool Steps**
  - `tool/tool-steps/gmail/add-label-to-email.mdx`
  - `tool/tool-steps/gmail/list-labels.mdx`
- **LinkedIn Tool Steps**
  - `tool/tool-steps/linkedin/search-linkedin-profiles.mdx`
  - `tool/tool-steps/linkedin/linkedin-action.mdx`
  - `tool/tool-steps/linkedin/get-linkedin-profile.mdx`
- **Slack Tool Steps**
  - `tool/tool-steps/slack/send-message.mdx`
  - `tool/tool-steps/slack/retrieve-messages.mdx`
- **Trello Tool Steps**
  - `tool/tool-steps/trello/add-comment.mdx`
  - `tool/tool-steps/trello/add-checklist.mdx`
  - `tool/tool-steps/trello/archive-card.mdx`
  - `tool/tool-steps/trello/create-checklist-item.mdx`
- **Confluence Tool Steps**
  - `tool/tool-steps/confluence/create-post.mdx`
  - `tool/tool-steps/confluence/search-content.mdx`
- **Airtop Browser Automation Tool Steps**
  - `tool/tool-steps/airtop-browser-automation/window-management.mdx`
  - `tool/tool-steps/airtop-browser-automation/page-interaction.mdx`
  - `tool/tool-steps/airtop-browser-automation/page-information.mdx`
- **Python Code Tool Steps**
  - `tool/tool-steps/python-code/code-python.mdx`
  - `tool/tool-steps/python-code/code-python-helper-functions.mdx`
- **Other Tool Steps**
  - `tool/tool-steps/firecrawl.mdx`
  - `tool/tool-steps/extract-website-content.mdx`
  - `tool/tool-steps/api.mdx`
  - `tool/tool-steps/google-search.mdx`
  - `tool/tool-steps/delay.mdx`
  - `tool/tool-steps/convert-spreadsheet-to-json.mdx`
  - `tool/tool-steps/convert-pdf-to-text.mdx`
  - `tool/tool-steps/file-to-text.mdx`
  - `tool/tool-steps/convert-audio-video-to-text.mdx`

---

### 7. Resources
**Purpose:** Additional resources, examples, use cases, and community content.

#### Use Cases
- `use-cases/customer-support.mdx`
- `use-cases/prospect-research.mdx`
- `use-cases/lifecycle-marketing.mdx`
- `use-cases/enrichment.mdx`

---

## Notes

1. **Duplicates**: Some content may appear in multiple categories (e.g., API keys in both Getting Started and Configuration). This is intentional as users may look for the same information in different contexts.

2. **Tool Steps**: The extensive tool steps reference is placed in the Reference category as it's primarily used for lookup rather than learning.

3. **Enterprise Content**: Enterprise-specific content is grouped under Administration, but quick-start guides may also appear in Getting Started.

4. **Use Cases vs Examples**: Use Cases are real-world scenarios, while Example Use Cases are more tutorial-style examples.

5. **Chat Agents**: Chat-specific agents are grouped under Build > Chat, separate from general Agents.

6. **Missing Files**: Some files referenced in docs.json may not exist in the file system. These should be verified during implementation.

---

## Implementation Checklist

- [ ] Review and approve this categorization
- [ ] Update docs.json with new category structure
- [ ] Verify all file paths exist
- [ ] Test navigation structure
- [ ] Update any internal links that may break
- [ ] Ensure consistent ordering within each category
- [ ] Add category icons if desired
- [ ] Test mobile responsiveness of category navigation
