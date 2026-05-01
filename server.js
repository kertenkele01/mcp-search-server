const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const app = express();

app.use(express.json());

/* ---------------------------
   MCP TOOL LIST
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
   MCP TOOL CALL
----------------------------*/
app.post("/tools/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (name !== "search_web") {
      return res.json({ error: "Unknown tool" });
    }

    if (!args?.query) {
      return res.json({ error: "Missing query" });
    }

    const base = process.env.SEARXNG_URL;

    if (!base) {
      return res.json({ error: "SEARXNG_URL missing in env" });
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
   START SERVER
----------------------------*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
