// vbc_v3.js
console.log("🚀 Secure vbc_v3.js loaded!");

(function () {
  //
  // 1) UTILITY: decode HTML entities so "<a>" comes through correctly
  //
  function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  //
  // 2) WIDGET SETUP
  //
  // — insert your real CSS here instead of the placeholder
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    /* —— your widget CSS —— */
    #chat-widget { /* … */ }
    /* etc. */
  `;
  document.head.appendChild(styleTag);

  // build the widget’s HTML; replace the `…` below with your actual markup
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
  // 3) ELEMENT REFERENCES
  //
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");

  let threadId = null;  // track ongoing conversation

  //
  // 4) OPEN / CLOSE BEHAVIOR
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
  // 5) HELPERS TO SHOW MESSAGES
  //
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(rawHtml, who = "bot") {
    const div = document.createElement("div");
    div.className = `message ${who}`;
    // decode any entities, then inject real HTML
    div.innerHTML = decodeHTMLEntities(rawHtml);
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
  // 6) SEND / RECEIVE
  //
  async function sendMessage(text) {
    // show user’s message
    appendMessage(text, "user");
    input.value = "";

    // show “typing…” indicator
    const typingEl = appendTyping();

    try {
      // POST to your Vercel function
      const r = await fetch("/api/sendMessage", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId })
      });
      const j = await r.json();
      typingEl.remove();

      if (j.reply) {
        // decode + render assistant’s reply
        appendMessage(j.reply.trim(), "bot");
        // keep conversation context
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

  // wire up send button + Enter key
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
  // 7) INITIAL WELCOME
  //
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");

})();
