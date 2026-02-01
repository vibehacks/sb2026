const API = process.env.SQUAD_SQUARES_API;

const SPORT_MAP = {
  nba: "basketball",
  nfl: "football",
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();

  const { sport } = req.query;
  const espnSport = SPORT_MAP[sport] || sport;
  const league = sport; // nba or nfl

  try {
    const resp = await fetch(`${API}/games/espn/${espnSport}?league=${league}`);
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable", detail: err.message });
  }
}
