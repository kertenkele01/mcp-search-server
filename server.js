const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const app = express();

app.use(express.json());

/* ---------------------------
   TOOL LIST
----------------------------*/
app.get("/tools/list", (req, res) => {
  res.json({
    tools: [
      {
        name: "search_web",
        description: "Web search using SearXNG",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      }
    ]
  });
});

/* ---------------------------
   TOOL CALL (ROBUST FIX)
----------------------------*/
app.post("/tools/call", async (req, res) => {
  try {
    const raw = req.body || {};

    // 🔥 LiteLLM bazen body içine sarıyor
    const payload = raw.body || raw;

    // 🔥 tool name farklı formatlarda gelebilir
    let name =
      payload.name ||
      payload.tool ||
      payload.tool_name ||
      "";

    // 🔥 prefix temizle (Search_mcp1-search_web -> search_web)
    if (name.includes("-")) {
      name = name.split("-").pop();
    }

    // 🔥 arguments farklı gelebilir
    const args =
      payload.arguments ||
      payload.args ||
      {};

    if (name !== "search_web") {
      return res.json({
        error: "Unknown tool",
        got: name,
        raw: payload
      });
    }

    if (!args.query) {
      return res.json({
        error: "Missing query"
      });
    }

    const base = process.env.SEARXNG_URL;

    if (!base) {
      return res.json({
        error: "SEARXNG_URL missing"
      });
    }

    const query = encodeURIComponent(args.query);

    const url = `${base}/search?q=${query}&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.json({
        error: "SearXNG request failed",
        status: response.status
      });
    }

    const data = await response.json();

    const results = (data.results || []).slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content
    }));

    return res.json({
      content: results
    });

  } catch (err) {
    return res.json({
      error: "Server error",
      message: err.message
    });
  }
});

/* ---------------------------
   HEALTH CHECK
----------------------------*/
app.get("/", (req, res) => {
  res.json({ status: "MCP server running" });
});

/* ---------------------------
   START
----------------------------*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
