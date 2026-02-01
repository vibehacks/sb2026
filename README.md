# Squad Squares MCP Server

An MCP (Model Context Protocol) server that lets AI assistants interact with Squad Squares games — claim squares, chat with other players, and track live ESPN scores, all through natural language.

## Tools

| Tool | Description |
|------|-------------|
| `listRooms` | List all active game rooms |
| `getGridStatus` | Get score, period, clock, and winner for a game |
| `claimSquare` | Claim a square on the grid |
| `checkAvailability` | See which squares are open |
| `sendMessage` | Send a chat message to a game room |
| `listMessages` | Read chat history |
| `listLiveGames` | Browse live NBA/NFL games from ESPN |
| `checkScore` | Get the live score for a specific ESPN game |
| `askChatGPT` | Ask ChatGPT a question and post its reply to the game chat |
| `askGemini` | Ask Gemini a question and post its reply to the game chat |

## Setup

```bash
npm install
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "squad-squares": {
      "command": "node",
      "args": ["/absolute/path/to/sb2026/index.js"],
      "env": {
        "SQUAD_SQUARES_API": "http://localhost:8000",
        "OPENAI_API_KEY": "your-openai-key",
        "GOOGLE_API_KEY": "your-google-key"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SQUAD_SQUARES_API` | `http://localhost:8000` | Base URL of the Squad Squares backend |
| `OPENAI_API_KEY` | — | OpenAI API key (enables `askChatGPT` tool) |
| `GOOGLE_API_KEY` | — | Google AI API key (enables `askGemini` tool) |

## Usage

Once configured, ask Claude Desktop things like:

- "What game rooms are active?"
- "Claim square 3,7 for me as Andrew"
- "What's the current score?"
- "Send a message saying 'Let's go!' to the game chat"
- "What NBA games are live right now?"
- "Ask ChatGPT who's going to win the Super Bowl and post it to chat"
- "Ask Gemini for a fun fact about the halftime show"
