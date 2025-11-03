How to build an MRP Agent to
complete complex tasks with
simple tools
An MRP agent has 1-3 low-level tools like an API step, code step, or LLM step etc.
It uses a model with a long context window and thinking, like GPT-4.1. Optionally,
you can give it instructions about its tools, like documentation.
When you give this agent a task, it will try to figure out how to achieve its objective
using those low-level tools.
(Note: MRP stands for Model Relevance Protocol, and was coined by Jacky. It's
an extension to the MCP (Model Context Protocol)).
An MCP is a bundle of tools packaged together in a way that lets AI assistants (like
agents) use them through a standardised interface. It's even better when the tools
are built by the integration provides themselves (e.g. Webflow tools built by
Webflow team).
MRPs are an extension to MCP, because it allows your AI assistant to work out
how to complete tasks that the MCP does not have tools for already.
Table of Contents
1. Try the MRP Agents
2. Notion MRP Example
3. How to build an MRP Agent Yourself
a. Credit cost optimisation example: Minify API documentation
b. Credit cost optimisation example: Minify API Results
c. Test Simple, Medium and Complex Tasks.
d. Limitations of MRP
e. Strengths of MRP
How to build an MRP Agent to complete complex tasks with simple tools 1
4. MRP Workforce Example
Try the MRP Agents
These are all of the MRPs we've built out so far, clone and try them out.
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
→ Clone Link
Notion MRP Example
This Notion MRP agent has a single API call tool, and documentation about
endpoints available in the Notion API. It uses GPT-4.1 as the agent model, because
it has a long context window and ability to think, which means you can give it a lot
of documentation about Notion and it can reason through how to achieve it's
objective better than non-thinking models.
How to build an MRP Agent to complete complex tasks with simple tools 2
With just that simple generic API tool, the agent was able to figure out how to
achieve a range of fairly complex tasks in Notion. Like creating this task
management system using inline databases, with projects, tasks, assignees and
relations between the databases 🤯
This is the Task Management system it produced:
And these are the 16 steps (API calls) it chose to use to achieve this task:
How to build an MRP Agent to complete complex tasks with simple tools 3
How to build an MRP Agent to complete complex tasks with simple tools 4
How to build an MRP agent from scratch: Google
Docs example.
This guide will show you how to build an MRP agent from scratch, for any
integration that has an API. The same concept applies for other low-level tools,
like code tools, browser use, other AI models (e.g. the agent can figure out which
model and parameters like temperature or top p is needed for a specific task), and
more.
Step 1: Add a low-level API tool to your agent.
In Relevance AI, we have hundreds of API tool steps for different integrations, like
this Google Docs API Call tool step. If there isn't one, you can use the generic API
Call tool step instead, and give it your API tokens. Our built-in versions make auth
really easy because connecting your account is as easy as clicking "add account"
and signing-in.
Give your agent the ability to fill in the values for the method, endpoint, base url,
relative path and body etc.
Here is an example of what a generic Google Docs API tool that an agent can
dynamically fill in looks like in Relevance AI.
🔗 Clone link: https://app.relevanceai.com/notebook/f1db6c/9221a5cd-f8ff-4def-
bb1b-7498351748b7/b26bb708-2dc8-4922-95ac-33da0cbdb0f5
How to build an MRP Agent to complete complex tasks with simple tools 5
How to build an MRP Agent to complete complex tasks with simple tools 6
Modification: Minify API call results
You can reduce the number of tokens your agent consumes in a conversation, by
minifying the results of the API call before returning the output to your agent.
For a Google Slides agent, before minifying the API call results, a presentation
creation task cost 1830.4 credits. After minifying the API call results the credit cost
went down to 41 credits. A 98.8% reduction in token cost.
❌ Token cost before minifying API results
🤯 Token cost after minifying API results (The task flow itself was also more
accurate).
How to build an MRP Agent to complete complex tasks with simple tools 7
The cost reduction savings were also significant in other MRP agent tasks. A
Gmail MRP agent that was asked to return the last 5 emails cost 997.6 credits
before minifying, and 158.9 credits after minifying: An 84.06% reduction in token
cost.
To minify your API call results, you need to add an input for the agent to describe
the purpose of the API call, and what the results will be used for in the next step.
Then, you need an LLM step at then end of your API call, which takes the purpose
of the call, and the call results, then returns just what is needed to based on the
task requirements.
In the case of the Google Slides MRP agent, instead of returning all of the
presentations in our drive so the agent could pick the right one, the API call tool
itself would just return the right one. This led to a large reduction in the amount of
information added to the agent's context window as a whole for each task.
Here is what a minified version of a generic API call tool step looks like for Google
Docs.
How to build an MRP Agent to complete complex tasks with simple tools 8
🔗 Clone link: https://app.relevanceai.com/notebook/f1db6c/9221a5cd-f8ff-4def-
bb1b-7498351748b7/b26bb708-2dc8-4922-95ac-33da0cbdb0f5
How to build an MRP Agent to complete complex tasks with simple tools 9
How to build an MRP Agent to complete complex tasks with simple tools 10
The minification prompt also has a line at the end for handling error messages. If
there is an error, it will return the error in plain English and suggest a way to fix it
again next time, in the imperative tone (Imperative just means "do x", like a todo
item instruction the agent should follow).
Step 2: Create an agent and give it your tool.
Next, create an agent and give it the API tool you made. Then write a prompt so
the agent knows its job is to try and figure out how to solve any task given to it in
natural language using its tools.
I usually copy and paste this prompt into each new MRP agent, and change the
attached tool and integration name mentioned in bold throughout the prompt.
How to build an MRP Agent to complete complex tasks with simple tools 11
Step 3 [optional]: Add minified documentation
Next, go to the variables tab, create a long-text variable for storing the API
documentation for your integration, like this:
Reference that variable in your agent's main instructions. The variable is shown as
green in the agent prompt screenshot shown in the previous section.
How to build an MRP Agent to complete complex tasks with simple tools 12
Note: You can also use the agent knowledge feature. I opted for variables
because knowledge doesn't clone across, and I want my MRP agents to have the
docs so you don't have to format and paste them in.
Tip: It can help to include clear delimiters at the start and end of your
documentation so your agent knows what is documentation vs what is your agent
core instructions.
Then, go to the API docs for that integration provider, and download or copy-paste
the documentation for each of the core endpoints needed to get most possible
work done with your integration.
Minify API Documentation
I recommend minifying the docs too. Your agent doesn't need to know about all
the different code options for making each endpoint request. A simple title,
method, endpoint url and json body information in markdown will be enough (and
easier for you to read).
Before: API docs for creating and managing google documents:
How to build an MRP Agent to complete complex tasks with simple tools 13
How to build an MRP Agent to complete complex tasks with simple tools 14
After: Agent optimised API docs for creating and managing google docs
This is the documentation after it has been optimised for agent use:
How to build an MRP Agent to complete complex tasks with simple tools 15
To generate this, I uploaded a screenshot of the docs page to ChatGPT online,
along with the following prompt.
—
Simplify this to remove python/javascript/curl code etc.
Just want:
## Title of endpoint category
### Endpoint action title
METHOD url
{ json body example if there is one, don't include backticks json just the raw
codeblock. Also don't write URL params here if there are any, they should always
go at end of url above. }
Don't include auth headers.
Add --- before and after each request. Include every single action mentioned
here, don't skip any.
If there are url params, include them in the endpoint. Output as markdown in a
codeblock so it's easy to copy paste.
—
Do this for every page and append it to your documentation variable:
How to build an MRP Agent to complete complex tasks with simple tools 16
Minifying the entirety of the Google Docs API reduced the token count for
documentation from 15,156 to 3,068 tokens, an ~80% reduction in token
consumption for docs.
Step 4: Try out some tasks!
How to build an MRP Agent to complete complex tasks with simple tools 17
Your MRP is ready to try out. To test it out, I recommend pasting the docs into an
LLM and asking it to generate a series of tasks prompts ranging from simple to
complex, based on the endpoints, but written as a non-technical user. Like this:
These were the natural language tasks ChatGPT suggested based on the API
docs:
How to build an MRP Agent to complete complex tasks with simple tools 18
How to build an MRP Agent to complete complex tasks with simple tools 19
Try a few of these out in your agent. Start a new task, copy a prompt in and see if
the agent can do it.
Simple Task: Create a new blank document called "Weekly Notes"
.
The agent did this successfully, and the document link is included in the tool
output if not the agent output. I updated the agent's core instructions to include
document links as markdown hyperlinks if there are any.
Before: Successful but not including the link.
After: Agent returns the link.
How to build an MRP Agent to complete complex tasks with simple tools 20
✅ Simple Task: Make a copy of the "Weekly Notes" file and name it "Monthly
Notes"
.
❌✅ Simple Task: Fill weekly notes file inside "Work Notes" folder with
template content.
"Fill the "Weekly Notes" document with a template for filling in weekly notes. You
can find it inside the "Work Notes" folder. Include a "{{name}}" placeholder
somewhere too."
The agent can do this, but only if you give it the ID of the files and the folder. If
you want the agent to be able to find files, you need to give it access to
Google Drive. Which is why all of my GSuite MRPs also have generic API call
tools for Google Drive too, with docs created for Drive in the same process as
for this MRP.
How to build an MRP Agent to complete complex tasks with simple tools 21
✅ Medium Task: Replace all the text that says "{{name}}" with "Dinosaur"
across the whole document
✅ Medium Task: Turn the "Weekly Notes for…
" line into a main title.
❌✅ Complex Task: Turn the actions item list into a table with three columns
including date completed, checkbox, and task
This is a very cool task, because it had to identify the actions section which
was a numbered list, delete it without deleting anything else in the doc, then
construct the table.
It failed initially because it tried to insert all of the content into the first cell. But
it did create the table with the correct number of columns.
How to build an MRP Agent to complete complex tasks with simple tools 22
To troubleshoot, I pasted the API call made by the agent, as well as the above
photo into an LLM and asked it what went wrong. It said the following:
1. The issue in your API call is that all the insertText requests are using
document-level indices, not cell-specific indices within the table. As a result,
all text is being inserted into a single cell instead of into each separate cell in
the 3×3 table.
2. You cannot insert a paragraph or text into an empty table cell unless that cell
already contains a paragraph element. You can't insert any text after it has
been created, so you have to add a space or character to each cell when you
first create the table.
Eventually, we figured out as a team that the way to add formatted content to
Google Docs (headers, bold, italic and tables with checkboxes etc), was to create
How to build an MRP Agent to complete complex tasks with simple tools 23
a custom tool that accepts content in HTML format, and uploads the file via
Google Drive API.
This is a good example of how not every task is possible via an integrations API.
We needed to create a tool for adding/updating formatted content to a Google Doc
via Google Drive for these complex tasks to be successful.
How to build an MRP Agent to complete complex tasks with simple tools 24
Clone link to the "Add/Update any content to Google Doc" tool:
https://app.relevanceai.com/notebook/f1db6c/9221a5cd-f8ff-4def-bb1b-
7498351748b7/4863f6d5-dfd0-4d84-a727-535e0ffe8ed8
How to build an MRP Agent to complete complex tasks with simple tools 25
We also ran into this in other G-Suite integration like Gmail, where we needed an
additional tool to convert email content into base64 format, before the API would
allow us to send an email.
Limitations of MRP
Not everything can be done with Simple API calls, so you may need extra
tools.
Gmail requires tool for converting emails to base64 encoding before
sending.
Google Docs requires HTML formatting tool and file upload for
creating/updating docs with headers, and tables.
HubSpot needs extra tool for formatting Date Ranges and doing Math.
More context per agent call
Adding documentation to agent can eat up the context window and cost
more tokens/credits per interaction. Can offset that with minifying docs &
api call results.
Potential for destructive actions - add your own guardrails
You agent could delete prod databases without clear guardrails and
approval baked into your agent prompt/settings. So be careful with your
requests.
Strengths of MRP
Your agent can dynamically work out what API calls to make.
Complex workflows can be achieved easily, whereas before it would take
a while to build each custom tool and you'd have to start from scratch for
other workflows.
Self-healing. It can learn from it's mistakes.
When the agent fails to complete a request, it can use it's reasoning
abilities to self-reflect and try again.
You can leverage this by getting your agent to update it's own knowledge
with how to successfully complete similar tasks first time next time (Harry
How to build an MRP Agent to complete complex tasks with simple tools 26
the HubSpot Wizard does this, clone link at start of document).
Easier to maintain. When API is changed or extended, all you need to update is
the documentation, not the individual tools.
MRP Workforce Example
MRP becomes even more powerful when you combine them into multi-agent
workforces like this:
E.g.
Please research dinosaurs, create a presentation about them,
save the presentation to a folder called "DinosaurFacts" and
email the slides to "[email]"
How to build an MRP Agent to complete complex tasks with simple tools 27
→ Clone Link
How to build an MRP Agent to complete complex tasks with simple tools 28


