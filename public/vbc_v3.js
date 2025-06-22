// vbc_v3.js
console.log("🚀 Secure vbc_v3.js loaded!");

(function () {
  //
  // 1) WIDGET CSS (including clickable <a> tags)
  //
  const style = document.createElement("style");
  style.textContent = `
    /* ── YOUR EXISTING CHAT CSS ABOVE THIS LINE ── */

    /* ensure bot‐generated links are clickable */
    #chat-widget .chat-body .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
      pointer-events: auto;
    }

    /* wrap long lines */
    #chat-widget .chat-body .message {
      white-space: pre-wrap;
    }

    /* ── YOUR EXISTING CHAT CSS BELOW THIS LINE ── */
  `;
  document.head.appendChild(style);

  //
  // 2) WIDGET HTML
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
  // 3) ELEMENTS & STATE
  //
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let   threadId = null;

  //
  // 4) OPEN/CLOSE BEHAVIOR
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
  // 5) MESSAGES HELPERS
  //
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(html, who = "bot") {
    const msg = document.createElement("div");
    msg.className = `message ${who}`;
    // **Directly set .innerHTML** so any <a>…</a> is real HTML
    msg.innerHTML = html;
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
    appendMessage(text, "user");
    input.value = "";
    const loading = appendTyping();

    try {
      const res = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId }),
      });
      const json = await res.json();
      loading.remove();

      if (json.reply) {
        appendMessage(json.reply.trim(), "bot");
        threadId = json.threadId;
      } else {
        appendMessage("Error: no reply received.", "bot");
      }
    } catch (err) {
      loading.remove();
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
  // 7) INITIAL GREETING
  //
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");
})();
