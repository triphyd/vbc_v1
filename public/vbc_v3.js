// vbc_v3.js
console.log("🚀 Secure vbc_v3.js loaded!");

(function () {
  //
  // 1) INJECT WIDGET STYLES (including link-clickability)
  //
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    /* —— your existing widget CSS goes above this line —— */

    /* make sure <a> tags are interactive */
    #chat-widget .chat-body .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
      pointer-events: auto;
    }

    /* ensure messages wrap nicely */
    #chat-widget .chat-body .message {
      white-space: pre-wrap;
    }

    /* —— end of your widget CSS —— */
  `;
  document.head.appendChild(styleTag);

  //
  // 2) BUILD THE CHAT WIDGET HTML
  //    Replace the placeholder below with your actual markup if needed
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
  // 3) QUERY SELECTORS
  //
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let threadId   = null;  // maintain conversation context

  //
  // 4) OPEN / CLOSE LOGIC
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
  // 5) MESSAGE APPENDERS
  //
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(html, who = "bot") {
    const div = document.createElement("div");
    div.className = `message ${who}`;
    // **Using innerHTML** so any <a href="…">…</a> is live
    div.innerHTML = html;
    body.appendChild(div);
    scrollToBottom();
  }

  function appendTyping() {
    const t = document.createElement("div");
    t.className = "typing bot";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t);
    scrollToBottom();
    return t;
  }

  //
  // 6) SEND / RECEIVE TO YOUR VERCEL FUNCTION
  //
  async function sendMessage(text) {
    // show user message
    appendMessage(text, "user");
    input.value = "";

    // show typing indicator
    const typingEl = appendTyping();

    try {
      const res = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId }),
      });
      const j = await res.json();
      typingEl.remove();

      if (j.reply) {
        // **directly render** the assistant’s HTML reply
        appendMessage(j.reply.trim(), "bot");
        threadId = j.threadId;
      } else {
        appendMessage("Error: no reply received.", "bot");
      }
    } catch (err) {
      typingEl.remove();
      appendMessage("Error: could not reach assistant.", "bot");
      console.error(err);
    }
  }

  // wire up Send button + Enter key
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
  // 7) INITIAL WELCOME MESSAGE
  //
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");
})();
