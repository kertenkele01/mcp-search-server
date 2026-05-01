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
   TOOL CALL (FULL FIX)
----------------------------*/
app.post("/tools/call", async (req, res) => {
  try {
    const raw = req.body || {};

    // 🔥 1. farklı wrapper formatlarını çöz
    let payload = raw.body || raw.data || raw;

    // 🔥 2. string JSON ise parse et
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    // 🔥 3. tool name al
    let name =
      payload.name ||
      payload.tool ||
      payload.tool_name ||
      "";

    // 🔥 4. prefix temizle (Search_mcp1-search_web → search_web)
    if (name && name.includes("-")) {
      name = name.split("-").pop();
    }

    // 🔥 5. arguments normalize
    const args =
      payload.arguments ||
      payload.args ||
      {};

    // 🔥 6. tool kontrol
    if (name !== "search_web") {
      return res.json({
        error: "Unknown tool",
        got: name,
        raw: payload
      });
    }

    if (!args.query) {
      return res.json({ error: "Missing query" });
    }

    // 🔥 7. SearXNG çağrısı
    const base = process.env.SEARXNG_URL;

    if (!base) {
      return res.json({ error: "SEARXNG_URL missing" });
    }

    const url = `${base}/search?q=${encodeURIComponent(args.query)}&format=json`;

    const response = await fetch(url);
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
