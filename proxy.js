// ChillMode — CORS Proxy for Ollama
// Forwards requests from the browser extension to Ollama (localhost:11434)
// with CORS headers so the extension can call it directly.

const http = require("http");

const PROXY_PORT = 11435;
const OLLAMA_HOST = "localhost";
const OLLAMA_PORT = 11434;

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Collect request body
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);

    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${OLLAMA_HOST}:${OLLAMA_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error(`[proxy] Error connecting to Ollama: ${err.message}`);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cannot reach Ollama at localhost:11434" }));
    });

    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`🌿 ChillMode proxy running on http://localhost:${PROXY_PORT}`);
  console.log(`   Forwarding to Ollama at http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
