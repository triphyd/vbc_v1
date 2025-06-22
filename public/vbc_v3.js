// vbc_v3.js
console.log("🚀 vbc_v3.js loaded!");

;(function() {
  // 1) Inject all CSS
  const css = `
    /* ─ widget container */
    #chat-widget { position: fixed; bottom:20px; right:20px;
      z-index:9999; font-family:sans-serif;
      padding-bottom:env(safe-area-inset-bottom,0);
    }
    #chat-widget.expanded .chat-button { display:none; }
    /* ─ chat button */
    #chat-widget .chat-button {
      width:60px; height:60px; background:#c40000;
      border-radius:50%; cursor:pointer;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s;
    }
    #chat-widget .chat-button:hover { transform:scale(1.1) }
    @keyframes bounce {
      0%,50%,100%{transform:translateY(0)}
      30%{transform:translateY(-12px)}
      70%{transform:translateY(-6px)}
    }
    #chat-widget .chat-button.bounce {
      animation:bounce .8s ease;
    }
    /* ─ chat window */
    #chat-widget .chat-window {
      display:none; position:fixed; right:20px;
      background:#1a1a1a; border-radius:10px;
      box-shadow:0 8px 24px rgba(0,0,0,0.5);
      overflow:hidden; flex-direction:column;
      width:320px; max-width:90vw;
    }
    #chat-widget.expanded .chat-window {
      display:flex; animation:fadeIn .2s ease-out;
    }
    @keyframes fadeIn {
      from{opacity:0;transform:translateY(10px);}
      to{opacity:1;transform:translateY(0);}
    }
    /* desktop vs mobile sizing */
    @media(min-width:601px){
      #chat-widget .chat-window { height:420px; bottom:80px; top:auto; }
    }
    @media(max-width:600px){
      #chat-widget .chat-window {
        top:env(safe-area-inset-top,20px);
        bottom:env(safe-area-inset-bottom,20px);
        left:env(safe-area-inset-left,20px);
        right:env(safe-area-inset-right,20px);
        width:calc(100vw-40px);
        height:auto; max-height:none;
      }
    }
    /* header */
    #chat-widget .chat-header {
      position:relative; background:#c40000;
      color:#fff; padding:12px; font-weight:bold;
      text-align:center;
    }
    #chat-widget .close-button {
      position:absolute; top:8px; right:8px;
      background:none; border:none; color:#fff;
      font-size:18px; cursor:pointer;
    }
    /* body & messages */
    #chat-widget .chat-body {
      flex:1; padding:8px; overflow-y:auto;
      background:#222; color:#eee; font-size:14px;
    }
    #chat-widget .chat-body .message.user {
      background:#c40000; color:#fff;
      text-align:right; margin:4px 0;
      padding:6px 8px; border-radius:8px;
      display:inline-block;
    }
    #chat-widget .chat-body .message.bot {
      background:#333; color:#eee;
      margin:4px 0; padding:6px 8px;
      border-radius:8px; display:inline-block;
    }
    /* clickable links & multiline */
    #chat-widget .chat-body .message.bot a {
      color:#1a73e8; text-decoration:underline;
      cursor:pointer;
    }
    #chat-widget .chat-body .message {
      white-space:pre-wrap;
    }
    /* typing */
    #chat-widget .typing {
      display:flex; gap:4px; padding:6px 8px;
    }
    #chat-widget .typing span {
      width:6px; height:6px; border-radius:50%;
      background:#555; animation:blink 1s infinite ease-in-out;
    }
    #chat-widget .typing span:nth-child(2){animation-delay:.2s}
    #chat-widget .typing span:nth-child(3){animation-delay:.4s}
    @keyframes blink{50%{opacity:0}}
    /* input */
    #chat-widget .chat-input {
      display:flex; border-top:1px solid #333;
    }
    #chat-widget .chat-input input {
      flex:1; border:none; padding:8px;
      background:#111; color:#fff; outline:none;
    }
    #chat-widget .chat-input button {
      background:#c40000; border:none;
      color:#fff; padding:0 16px; cursor:pointer;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // 2) Exact same HTML + SVG
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

  // 3) Refs & state
  const btn      = widget.querySelector(".chat-button");
  const win      = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body     = widget.querySelector(".chat-body");
  const input    = widget.querySelector(".chat-input input");
  const sendBtn  = widget.querySelector(".chat-input button");
  let   threadId = null;

  // 4) Open / close
  btn.addEventListener("click", () => {
    widget.classList.add("expanded");
    input.focus();
  });
  closeBtn.addEventListener("click", () =>
    widget.classList.remove("expanded")
  );
  document.addEventListener("click", e => {
    if (!widget.contains(e.target)) {
      widget.classList.remove("expanded");
    }
  });

  // 5) Helpers
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function appendMessage(text, who = "bot") {
    const msg = document.createElement("div");
    msg.className = `message ${who}`;

    if (who === "bot") {
      // if you use <CALENDLY> in your assistant prompt,
      // it'll get replaced here with a real clickable link:
      const withLink = text.replace(
        /<CALENDLY>/g,
        `<a href="https://calendly.com/vesselenyit/30min"
            target="_blank" rel="noopener noreferrer">Rezervă aici</a>`
      );
      msg.innerHTML = withLink;
    } else {
      msg.textContent = text;
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

  // 6) Talk to your server function
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

  // wire send
  sendBtn.addEventListener("click", () => {
    const t = input.value.trim();
    if (t) sendMessage(t);
  });
  input.addEventListener("keypress", e => {
    if (e.key === "Enter" && input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });

  // 7) Initial greeting + bounce
  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");
  function pulse() { btn.classList.add("bounce"); }
  btn.addEventListener("animationend", () => btn.classList.remove("bounce"));
  setTimeout(() => { pulse(); setInterval(pulse, 10000); }, 3000);

})();
