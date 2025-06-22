export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, threadId: oldThread } = req.body;
  const assistantId = "asst_M7Ik5XISOOnmrKY1Qu2wAWws";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OpenAI API key." });
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };

    // Step 1: Create thread if needed
    let threadId = oldThread;
    if (!threadId) {
      const threadRes = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const threadData = await threadRes.json();
      threadId = threadData.id;
    }

    // Step 2: Post user message
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "user", content: text }),
    });

    // Step 3: Run the assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: assistantId }),
    });

    const runData = await runRes.json();
    const runId = runData.id;

    // Step 4: Poll for completion
    let status = runData.status;
    while (status !== "completed") {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        { method: "GET", headers }
      );
      const statusData = await statusRes.json();
      status = statusData.status;

      if (status === "failed" || status === "expired") {
        throw new Error(`Run ${status}`);
      }
    }

    // Step 5: Get assistant message
    const msgRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { method: "GET", headers }
    );
    const msgData = await msgRes.json();
    const assistantMsg = msgData.data.find((m) => m.role === "assistant");
    const reply = assistantMsg?.content?.[0]?.text?.value || null;

    res.status(200).json({ reply, threadId });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Failed to connect to assistant." });
  }
}
