const API = process.env.SQUAD_SQUARES_API;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const resp = await fetch(`${API}/rooms`);
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable", detail: err.message });
  }
}
