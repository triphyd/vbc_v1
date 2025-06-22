// vbc_v3.js
console.log("🚀 vbc_v3.js loaded!");

(function() {
  //
  // 1. Inject all widget CSS
  //
  const style = document.createElement("style");
  style.textContent = `
    /* Container */
    #chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      font-family: Arial, sans-serif;
      z-index: 9999;
    }

    /* Chat button */
    #chat-widget .chat-button {
      background: #c8102e;
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    /* Chat window */
    #chat-widget .chat-window {
      display: none;
      flex-direction: column;
      width: 320px;
      height: 420px;
      background: #222;
      color: #eee;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      margin-top: 10px;
    }
    #chat-widget.expanded .chat-window {
      display: flex;
    }

    /* Header */
    #chat-widget .chat-header {
      background: #c8102e;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }
    #chat-widget .chat-header .close-button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 16px;
      cursor: pointer;
    }

    /* Body */
    #chat-widget .chat-body {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Input */
    #chat-widget .chat-input {
      display: flex;
      padding: 10px;
      border-top: 1px solid #444;
    }
    #chat-widget .chat-input input {
      flex: 1;
      padding: 6px 8px;
      border-radius: 4px;
      border: none;
      margin-right: 6px;
    }
    #chat-widget .chat-input button {
      background: #c8102e;
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }

    /* Messages */
    #chat-widget .message {
      max-width: 85%;
      padding: 8px 12px;
      border-radius: 8px;
      word-wrap: break-word;
    }
    #chat-widget .message.user {
      background: #333;
      align-self: flex-end;
    }
    #chat-widget .message.bot {
      background: #444;
      align-self: flex-start;
    }
    /* Clickable links in bot messages */
    #chat-widget .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
    }

    /* Typing indicator */
    #chat-widget .typing {
      display: flex;
      gap: 4px;
      align-self: flex-start;
    }
    #chat-widget .typing span {
      width: 6px;
      height: 6px;
      background: #888;
      border-radius: 50%;
      animation: blink 1.4s infinite ease-in-out;
    }
    #chat-widget .typing span:nth-child(2) { animation-delay: 0.2s; }
    #chat-widget .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  //
  // 2. Build widget HTML
  //
  const widget = document.createElement("div");
  widget.id = "chat-widget";
  widget.innerHTML = `
    <button class="chat-button">Chat</button>
    <div class="chat-window">
      <div class="chat-header">
        <span>Chat Assistant</span>
        <button class="close-button">×</button>
      </div>
      <div class="chat-body"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message…"/>
        <button>Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  //
  // 3. Element refs & state
  //
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let   threadId = null;

  //
  // 4. Open / close logic
  //
  btn.addEventListener("click", () => {
    widget.classList.add("expanded");
    input.focus();
  });
  closeBtn.addEventListener("click", () => {
    widget.classList.remove("expanded");
  });
  document.addEventListener("click", e => {
    if (!widget.contains(e.target)) {
      widget.classList.remove("expanded");
    }
  });

  //
  // 5. Helpers
  //
  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(text, who = "bot") {
    const msg = document.createElement("div");
    msg.className = `message ${who}`;

    if (who === "bot") {
      // Replace <CALENDLY> token with real Calendly link
      const withLink = text.replace(
        /<CALENDLY>/g,
        `<a href="https://calendly.com/vesselenyit/30min" target="_blank" rel="noopener noreferrer">Rezervă aici</a>`
      );
      msg.innerHTML = withLink;
    } else {
      msg.textContent = text;
    }

    body.appendChild(msg);
    scrollBottom();
  }

  function appendTyping() {
    const t = document.createElement("div");
    t.className = "typing bot";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t);
    scrollBottom();
    return t;
  }

  //
  // 6. Send & receive
  //
  async function sendMessage(text) {
    appendMessage(text, "user");
    input.value = "";
    const typingEl = appendTyping();

    try {
      const res = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId }),
      });
      const { reply, threadId: newThread } = await res.json();
      typingEl.remove();

      if (reply) {
        appendMessage(reply.trim(), "bot");
        threadId = newThread;
      } else {
        appendMessage("Error: no reply received.", "bot");
      }
    } catch (err) {
      typingEl.remove();
      appendMessage("Error: could not reach assistant.", "bot");
      console.error(err);
    }
  }

  sendBtn.addEventListener("click", () => {
    const t = input.value.trim();
    if (t) sendMessage(t);
  });
  input.addEventListener("keypress", e => {
    if (e.key === "Enter" && input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });

  //
  // 7. Initial greeting
  //
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");
})();
