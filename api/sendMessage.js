export default async function handler(req, res) {
  const { text, threadId } = JSON.parse(req.body);
  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = "asst_M7Ik5XISOOnmrKY1Qu2wAWws";

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v2"
  };

  try {
    // 1. Create thread if needed
    let finalThreadId = threadId;
    if (!finalThreadId) {
      const create = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers,
        body: "{}"
      });
      const created = await create.json();
      finalThreadId = created.id;
    }

    // 2. Add message
    await fetch(`https://api.openai.com/v1/threads/${finalThreadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "user", content: text })
    });

    // 3. Start run
    const run = await fetch(`https://api.openai.com/v1/threads/${finalThreadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: assistantId })
    });
    const runData = await run.json();

    // 4. Poll until complete
    let status = runData.status;
    while (status !== "completed") {
      await new Promise(res => setTimeout(res, 1000));
      const check = await fetch(`https://api.openai.com/v1/threads/${finalThreadId}/runs/${runData.id}`, {
        method: "GET", headers
      });
      const result = await check.json();
      status = result.status;
      if (status === "failed" || status === "expired") throw new Error("Run failed");
    }

    // 5. Get messages
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${finalThreadId}/messages`, {
      method: "GET", headers
    });
    const msgData = await msgRes.json();
    const message = msgData.data.find(m => m.role === "assistant");

    res.status(200).json({ reply: message?.content[0]?.text?.value, threadId: finalThreadId });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ error: "OpenAI API error" });
  }
}
