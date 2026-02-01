/**
 * Squad Squares MCP Server
 *
 * Gives any MCP-compatible client (Claude Desktop, etc.) the ability to
 * interact with a Squad Squares game: claim squares, chat, check scores,
 * and browse live ESPN games — all through natural language.
 *
 * Configuration:
 *   SQUAD_SQUARES_API  — base URL of the Squad Squares backend
 *                        (default: http://localhost:8000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.SQUAD_SQUARES_API || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "squad-squares-mcp",
  version: "1.0.0",
});

// -- Rooms & Grid Status ----------------------------------------------------

server.tool(
  "listRooms",
  "List all active Squad Squares game rooms",
  {},
  async () => {
    const data = await api("/rooms");
    return {
      content: [{ type: "text", text: JSON.stringify(data.rooms, null, 2) }],
    };
  }
);

server.tool(
  "getGridStatus",
  "Get the current score, period, clock, and status of a Squad Squares game",
  {
    gridId: z.string().describe("The grid/room ID"),
  },
  async ({ gridId }) => {
    const data = await api(`/grids/${gridId}`);
    const summary = {
      id: data.id,
      gameMode: data.gameMode,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      period: data.period,
      clock: data.clock,
      status: data.status,
      totalClaimed: data.totalClaimed,
      currentWinnerPosition: data.currentWinnerPosition,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  }
);

// -- Squares ----------------------------------------------------------------

server.tool(
  "claimSquare",
  "Claim a square on the Squad Squares grid for a player",
  {
    gridId: z.string().describe("The grid/room ID"),
    position: z
      .string()
      .describe("Square position in 'row,col' format (e.g. '3,7')"),
    userName: z.string().describe("Name of the player claiming the square"),
  },
  async ({ gridId, position, userName }) => {
    const data = await api(`/grids/${gridId}/join`, {
      method: "POST",
      body: JSON.stringify({
        user_name: userName,
        preferred_position: position,
      }),
    });
    return {
      content: [
        {
          type: "text",
          text: `Square ${data.position} claimed by ${userName} (userId=${data.userId})`,
        },
      ],
    };
  }
);

server.tool(
  "checkAvailability",
  "Check which squares are available (unclaimed) on a Squad Squares grid",
  {
    gridId: z.string().describe("The grid/room ID"),
  },
  async ({ gridId }) => {
    const data = await api(`/grids/${gridId}/availability`);
    const summary = `${data.totalAvailable} available, ${data.totalClaimed} claimed out of 100.\n\nAvailable positions: ${data.available.map((s) => s.position).join(", ")}`;
    return {
      content: [{ type: "text", text: summary }],
    };
  }
);

// -- Chat / Messaging -------------------------------------------------------

server.tool(
  "sendMessage",
  "Send a chat message to a Squad Squares game room",
  {
    gridId: z.string().describe("The grid/room ID to send the message to"),
    sender: z.string().describe("Display name of the sender"),
    content: z.string().describe("Message content"),
  },
  async ({ gridId, sender, content }) => {
    const data = await api(`/grids/${gridId}/messages`, {
      method: "POST",
      body: JSON.stringify({ sender, content }),
    });
    return {
      content: [
        {
          type: "text",
          text: `Message sent (seq=${data.seq}, ts=${data.ts})`,
        },
      ],
    };
  }
);

server.tool(
  "listMessages",
  "List chat messages in a Squad Squares game room",
  {
    gridId: z.string().describe("The grid/room ID"),
    afterSeq: z
      .number()
      .optional()
      .default(0)
      .describe("Only return messages after this sequence number"),
  },
  async ({ gridId, afterSeq }) => {
    const data = await api(`/grids/${gridId}/messages?after_seq=${afterSeq}`);
    return {
      content: [
        { type: "text", text: JSON.stringify(data.messages, null, 2) },
      ],
    };
  }
);

// -- Live ESPN Games --------------------------------------------------------

server.tool(
  "listLiveGames",
  "List live and upcoming games from ESPN for a given sport",
  {
    sport: z
      .enum(["nba", "nfl"])
      .default("nba")
      .describe("Sport league to query (nba or nfl)"),
  },
  async ({ sport }) => {
    const league = sport;
    const sportPath = sport === "nba" ? "basketball" : "football";
    const data = await api(`/games/espn/${sportPath}?league=${league}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "checkScore",
  "Check the live ESPN score for a specific game by game ID",
  {
    gameId: z.string().describe("ESPN game ID"),
    sport: z
      .enum(["nba", "nfl"])
      .default("nba")
      .describe("Sport league (nba or nfl)"),
  },
  async ({ gameId, sport }) => {
    const league = sport;
    const sportPath = sport === "nba" ? "basketball" : "football";
    const data = await api(`/games/espn/${sportPath}?league=${league}`);
    const games = Array.isArray(data) ? data : data.games || [];
    const game = games.find((g) => g.game_id === gameId);
    if (!game) {
      return {
        content: [{ type: "text", text: `No game found with ID ${gameId}` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(game, null, 2) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
