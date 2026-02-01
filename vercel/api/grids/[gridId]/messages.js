const API = process.env.SQUAD_SQUARES_API;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  const { gridId } = req.query;

  try {
    if (req.method === "POST") {
      const resp = await fetch(`${API}/grids/${gridId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    }

    // GET — forward after_seq if present
    const afterSeq = req.query.after_seq;
    const qs = afterSeq != null ? `?after_seq=${afterSeq}` : "";
    const resp = await fetch(`${API}/grids/${gridId}/messages${qs}`);
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable", detail: err.message });
  }
}
