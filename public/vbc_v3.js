console.log("🚀 Secure vbc_v3.js loaded!");

(function () {
  const styleTag = document.createElement("style");
  styleTag.textContent = `/* your CSS styles here */`;
  document.head.appendChild(styleTag);

  const widget = document.createElement("div");
  widget.id = "chat-widget";
  widget.innerHTML = `<!-- your full HTML for the widget should go here -->`;
  document.body.appendChild(widget);

  const btn = widget.querySelector(".chat-button");
  const win = widget.querySelector(".chat-window");
  const closeBtn = widget.querySelector(".close-button");
  const body = widget.querySelector(".chat-body");
  const input = widget.querySelector(".chat-input input");
  const sendBtn = widget.querySelector(".chat-input button");

  let threadId = null;

  btn.addEventListener("click", () => {
    widget.classList.add("expanded");
    input.focus();
  });

  closeBtn.addEventListener("click", () => widget.classList.remove("expanded"));

  document.addEventListener("click", (e) => {
    if (!widget.contains(e.target)) widget.classList.remove("expanded");
  });

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }


}

function appendMessage(text, who = "bot") {
  const div = document.createElement("div");
  div.className = "message " + who;
  div.innerHTML = decodeHTMLEntities(text); // decode entities first
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

  async function sendMessage(text) {
    appendMessage(text, "user");
    input.value = "";
    const typingEl = appendTyping();

    try {
      const r = await fetch("/api/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, threadId })
      });
      const j = await r.json();
      typingEl.remove();
      if (j.reply) {
        const decoded = decodeHTMLEntities(j.reply.trim());
        appendMessage(decoded, "bot");
        threadId = j.threadId;
      } else {
        appendMessage("Error: No reply received", "bot");
      }
    } catch (err) {
      typingEl.remove();
      appendMessage("Error: could not contact assistant", "bot");
    }
  }

  sendBtn.addEventListener("click", () => {
    const t = input.value.trim();
    if (t) sendMessage(t);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      sendMessage(input.value.trim());
    }
  });

  appendMessage("Ceau! Bine ai venit la VBC Barbershop! Cum te pot ajuta?", "bot");
})();
