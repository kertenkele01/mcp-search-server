const express = require("express");
const app = express();

app.use(express.json());

// TOOL LIST
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

// TOOL CALL
app.post("/tools/call", async (req, res) => {
  const { name, arguments: args } = req.body;

  if (name === "search_web") {
    const response = await fetch(
      "https://search.coolify.denemetest.app/search?q=" + args.query
    );

    const data = await response.text();

    return res.json({
      content: data
    });
  }

  res.json({ error: "unknown tool" });
});

app.listen(3000, () => {
  console.log("MCP server running");
});
