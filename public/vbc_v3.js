// vbc_v3.js
;(function() {
  console.log("🚀 vbc_v3.js loaded!");

  // ── CONFIG ────────────────────────────────────────────────────────────────
  // 1) Your Vercel app origin (where /api/sendMessage lives):
  const API_HOST = "https://vbc-v1.vercel.app";

  // 2) Your Calendly link placeholder replacement:
  const CALENDLY_HTML = `<a
    href="https://calendly.com/vesselenyit/30min"
    target="_blank"
    rel="noopener noreferrer"
  >Rezervă aici</a>`;

  // ── 1) INJECT CSS ──────────────────────────────────────────────────────────
  const css = `
    /* container holds the button only */
    #chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: sans-serif;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    /* hide the button when expanded */
    #chat-widget.expanded .chat-button {
      display: none;
    }

    /* chat button + bounce */
    #chat-widget .chat-button {
      width: 60px;
      height: 60px;
      background: #c40000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    }
    #chat-widget .chat-button:hover {
      transform: scale(1.1);
    }
    @keyframes bounce {
      0%   { transform: translateY(0) }
      30%  { transform: translateY(-12px) }
      50%  { transform: translateY(0) }
      70%  { transform: translateY(-6px) }
      100% { transform: translateY(0) }
    }
    #chat-widget .chat-button.bounce {
      animation: bounce 0.8s ease;
    }

    /* chat window base styling */
    #chat-widget .chat-window {
      display: none;
      position: fixed;
      right: 20px;
      width: 320px;
      max-width: 90vw;
      background: #1a1a1a;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      overflow: hidden;
      flex-direction: column;
    }
    #chat-widget.expanded .chat-window {
      display: flex;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px) }
      to   { opacity: 1; transform: translateY(0) }
    }

    /* desktop: fixed height, bottom */
    @media (min-width: 601px) {
      #chat-widget .chat-window {
        height: 420px;
        bottom: 80px;
        top: auto;
      }
    }
    /* mobile: stretch */
    @media (max-width: 600px) {
      #chat-widget .chat-window {
        top:    env(safe-area-inset-top, 20px);
        bottom: env(safe-area-inset-bottom, 20px);
        left:   env(safe-area-inset-left, 20px);
        right:  env(safe-area-inset-right, 20px);
        width: calc(100vw - 40px);
        max-width: none;
        height: auto;
        max-height: none;
      }
    }

    /* header + close */
    #chat-widget .chat-header {
      position: relative;
      background: #c40000;
      color: white;
      padding: 12px;
      font-weight: bold;
      text-align: center;
    }
    #chat-widget .chat-header .close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }

    /* body, messages, typing, input */
    #chat-widget .chat-body {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      background: #222;
      color: #eee;
      font-size: 14px;
    }
    #chat-widget .chat-body .message.user {
      background: #c40000;
      color: #fff;
      text-align: right;
      margin: 4px 0;
      padding: 6px 8px;
      border-radius: 8px;
      display: inline-block;
      white-space: pre-wrap;
    }
    #chat-widget .chat-body .message.bot {
      background: #333;
      margin: 4px 0;
      padding: 6px 8px;
      border-radius: 8px;
      display: inline-block;
      white-space: pre-wrap;
    }
    #chat-widget .chat-body .message.bot a {
      color: #1a73e8;
      text-decoration: underline;
      cursor: pointer;
    }
    #chat-widget .chat-body .typing {
      display: flex;
      gap: 4px;
      padding: 6px 8px;
    }
    #chat-widget .chat-body .typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #555;
      animation: blink 1s infinite ease-in-out;
    }
    #chat-widget .chat-body .typing span:nth-child(2) { animation-delay: .2s }
    #chat-widget .chat-body .typing span:nth-child(3) { animation-delay: .4s }
    @keyframes blink { 50% { opacity: 0 } }

    #chat-widget .chat-input {
      display: flex;
      border-top: 1px solid #333;
    }
    #chat-widget .chat-input input {
      flex: 1;
      border: none;
      padding: 8px;
      background: #111;
      color: #fff;
      outline: none;
    }
    #chat-widget .chat-input button {
      background: #c40000;
      border: none;
      color: white;
      padding: 0 16px;
      cursor: pointer;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // ── 2) WIDGET MARKUP ───────────────────────────────────────────────────────
  const widget = document.createElement("div");
  widget.id = "chat-widget";
  widget.innerHTML = `
    <div class="chat-button" title="Chat with us">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"
           xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.897 2 2 2.897 2 4v14c0 1.103.897 2 2 2h14l4 4V4
                 c0-1.103-.897-2-2-2z"/>
        <path d="M7 7h10v2H7zM7 11h7v2H7z"/>
      </svg>
    </div>
    <div class="chat-window">
      <div class="chat-header">
        Chat Assistant
        <button class="close-button" aria-label="Close">&times;</button>
      </div>
      <div class="chat-body"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type your message…" />
        <button>Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // ── 3) REFERENCES & STATE ─────────────────────────────────────────────────
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let   threadId = null;

  // ── 4) OPEN / CLOSE ───────────────────────────────────────────────────────
  btn.addEventListener("click", () => {
    widget.classList.add("expanded");
    input.focus();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", adjustViewport);
      window.visualViewport.addEventListener("scroll", adjustViewport);
      adjustViewport();
    }
  });
  closeBtn.addEventListener("click", () => widget.classList.remove("expanded"));
  document.addEventListener("click", e => {
    if (!widget.contains(e.target)) widget.classList.remove("expanded");
  });

  function adjustViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    const margin = 20;
    win.style.top    = (vv.offsetTop + margin) + "px";
    win.style.height = (vv.height - margin * 2) + "px";
    win.style.bottom = "auto";
  }

  // ── 5) SCROLL UTILITY ─────────────────────────────────────────────────────
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  // ── 6) APPEND MESSAGES ────────────────────────────────────────────────────
  function appendMessage(raw, who = "bot") {
    const m = document.createElement("div");
    m.className = "message " + who;
    if (who === "bot") {
      // swap placeholder
      m.innerHTML = raw.replace(/<CALENDLY>/g, CALENDLY_HTML);
    } else {
      m.textContent = raw;
    }
    body.appendChild(m);
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

  // ── 7) SEND / RECEIVE ─────────────────────────────────────────────────────
  async function sendMessage(text) {
    appendMessage(text, "user");
    input.value = "";
    const typingEl = appendTyping();

    try {
      const res = await fetch(`${API_HOST}/api/sendMessage`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, threadId })
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

  // ── 8) INITIAL GREETING & BOUNCE ──────────────────────────────────────────
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");

  btn.addEventListener("animationend", () => btn.classList.remove("bounce"));
  setTimeout(() => {
    btn.classList.add("bounce");
    setInterval(() => btn.classList.add("bounce"), 10000);
  }, 3000);

})();
