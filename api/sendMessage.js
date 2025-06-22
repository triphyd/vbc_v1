export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, threadId: oldThread } = req.body;
  const assistantId = process.env.ASSISTANT_ID;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !assistantId) {
    console.error("Missing OpenAI key or assistant ID");
    return res.status(500).json({ error: "Missing API credentials" });
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };

    let threadId = oldThread;
    if (!threadId) {
      const threadRes = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers,
        body: "{}",
      });
      const threadData = await threadRes.json();
      threadId = threadData.id;
    }

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "user", content: text }),
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: assistantId }),
    });
    const runData = await runRes.json();
    const runId = runData.id;

    let status = runData.status;
    while (status !== "completed") {
      await new Promise(r => setTimeout(r, 1000));
      const statusCheck = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers,
      });
      const statusData = await statusCheck.json();
      status = statusData.status;
      if (status === "failed" || status === "expired") {
        throw new Error("Run " + status);
      }
    }

    const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
      headers,
    });
    const msgData = await msgRes.json();
    const assistantMsg = msgData.data.find(m => m.role === "assistant");
    const reply = assistantMsg?.content?.[0]?.text?.value || null;

    return res.status(200).json({ reply, threadId });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Failed to connect to assistant." });
  }
}
