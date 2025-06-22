export default async function handler(req, res) {
  const { barber, preferred_day } = req.query;

  if (!barber) {
    return res.status(400).json({ error: "Missing 'barber' parameter" });
  }

  const token = process.env.CALENDLY_API_KEY;

  const eventTypeUri = "https://api.calendly.com/event_types/df329c53-bbc3-4e3b-9f4b-9c8149de4b82";

  const dateRange = getDateRange(preferred_day);

  try {
    const url = `https://api.calendly.com/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${dateRange.start}&end_time=${dateRange.end}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // 🔍 Debug output to Vercel logs
    console.log("Calendly raw response:", JSON.stringify(data, null, 2));

    const slots = (data.collection || []).map(slot => ({
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));

    res.status(200).json({ slots });
  } catch (err) {
    console.error("Error fetching Calendly slots:", err);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
}

function getDateRange(preferred_day) {
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}
