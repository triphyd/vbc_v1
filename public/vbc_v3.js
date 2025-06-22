// vbc_v3.js
console.log("🚀 vbc_v3.js loaded!");

(function() {
  //
  // 1. Inject minimal CSS (including clickable links)
  //
  const style = document.createElement("style");
  style.textContent = `
    /* — your other widget styles here — */

    #chat-widget .chat-body .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
    }
    #chat-widget .chat-body .message {
      white-space: pre-wrap;
    }
  `;
  document.head.appendChild(style);

  //
  // 2. Build the widget HTML
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
        <input type="text" placeholder="Type your message…" />
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
  // 4. Open / close behavior
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
  // 5. Helpers for messages
  //
  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(text, who = "bot") {
    const msg = document.createElement("div");
    msg.className = `message ${who}`;
    if (who === "bot") {
      // Bot text may contain HTML (links, etc)
      msg.innerHTML = text;
    } else {
      // User text always plaintext
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
      const res  = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId }),
      });
      const { reply, threadId: newThread } = await res.json();
      typingEl.remove();

      if (reply) {
        appendMessage(reply.trim(), "bot");  // **real HTML** here
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
