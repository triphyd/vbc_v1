export default async function handler(req, res) {
  const { barber, preferred_day } = req.query;

  if (!barber) {
    return res.status(400).json({ error: "Missing 'barber' parameter" });
  }

  const token = process.env.CALENDLY_API_KEY;
  const userUri = barber === "robby"
    ? "https://api.calendly.com/users/your-robby-id"
    : "https://api.calendly.com/users/e97cfb9d-8610-4d2d-b401-7f1401ee2651";

  const dateRange = getDateRange(preferred_day); // optional helper to limit to 1 day

  try {
    const response = await fetch(`https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&status=active&sort=start_time:asc&start_time=${dateRange.start}&end_time=${dateRange.end}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    // Extract next 2–3 slots as needed
    const slots = data.collection?.slice(0, 3).map(event => ({
      time: event.start_time,
      url: event.uri
    })) || [];

    res.status(200).json({ slots });
  } catch (err) {
    console.error("Error fetching Calendly slots:", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
}

// Optional helper to parse a specific day
function getDateRange(preferred_day) {
  // For now just return full week range
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}
