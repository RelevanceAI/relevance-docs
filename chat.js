// Direct embed of the chat widget
const script = document.createElement('script');
script.defer = true;
script.src = "https://app.relevanceai.com/embed/chat-bubble.js";
script.setAttribute('data-relevanceai-share-id', 'f1db6c/9c237002-9738-4c4f-9855-590ae53a36eb/32ad892a-70f0-4f69-b181-d6cf681768f9');
script.setAttribute('data-share-styles', 'hide_tool_steps=true&hide_file_uploads=true&hide_conversation_list=false&bubble_style=icon&primary_color=%23685FFF&bubble_icon=sparkles&input_placeholder_text=Ask+Sophia...&hide_logo=false&hide_description=false');
document.body.appendChild(script);