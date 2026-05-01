const express = require("express");
const app = express();

app.use(express.json());

// MCP TOOL LIST
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

// MCP TOOL CALL
app.post("/tools/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (name !== "search_web") {
      return res.json({ error: "Unknown tool" });
    }

    const query = encodeURIComponent(args.query);

    // 🔥 IMPORTANT: JSON MODE
    const url = `http://SEARXNG_URL/search?q=${query}&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.json({
        error: "SearXNG request failed",
        status: response.status
      });
    }

    const data = await response.json();

    // sadece önemli alanları döndürelim
    const results = (data.results || []).slice(0, 5).map(r => ({
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

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "MCP server running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
