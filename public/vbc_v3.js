// vbc_v3.js
console.log("🚀 vbc_v3.js loaded!");

(function() {
  //
  // 1) INJECT CSS (including clickable links)
  //
  const css = `
    /* ── YOUR EXISTING STYLES ABOVE ── */

    #chat-widget .chat-body .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
      pointer-events: auto;
    }
    #chat-widget .chat-body .message {
      white-space: pre-wrap;
    }

    /* ── YOUR EXISTING STYLES BELOW ── */
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  //
  // 2) BUILD WIDGET HTML
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
  // 3) REFS & STATE
  //
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let   threadId = null;

  //
  // 4) OPEN/CLOSE LOGIC
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
  // 5) MESSAGE HELPERS
  //
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(content, who = "bot", isHtml = false) {
    const msg = document.createElement("div");
    msg.className = `message ${who}`;
    if (isHtml) {
      // raw HTML from bot (e.g. <a href="…">)
      msg.innerHTML = content;
    } else {
      // plain text
      msg.textContent = content;
    }
    body.appendChild(msg);
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
  // 6) SEND & RECEIVE
  //
  async function sendMessage(text) {
    appendMessage(text, "user", false);
    input.value = "";
    const typingEl = appendTyping();

    try {
      const res  = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId }),
      });
      const json = await res.json();
      typingEl.remove();

      if (json.reply) {
        // **Assume** json.reply contains real HTML for links
        appendMessage(json.reply.trim(), "bot", true);
        threadId = json.threadId;
      } else {
        appendMessage("Error: no reply received.", "bot", false);
      }
    } catch (err) {
      typingEl.remove();
      appendMessage("Error: could not reach assistant.", "bot", false);
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
  // 7) WELCOME MESSAGE
  //
  appendMessage(
    "Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?",
    "bot",
    false
  );
})();
