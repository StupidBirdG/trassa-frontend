import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { request as httpsReq } from "https";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND = "trassa-backend-production.up.railway.app";

app.use("/api", (req, res) => {
  const chunks = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const headers = Object.assign({}, req.headers, {
      host: BACKEND,
      "content-length": body.length
    });
    const options = {
      hostname: BACKEND,
      port: 443,
      path: "/api" + (req.url || "/"),
      method: req.method,
      headers
    };
    const proxyReq = httpsReq(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", (e) => {
      console.error("Proxy error:", e.message);
      if (!res.headersSent) res.status(502).json({ error: e.message });
    });
    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
  });
});

app.use(express.static(join(__dirname, "dist")));
app.get("*", (_, res) => res.sendFile(join(__dirname, "dist", "index.html")));
app.listen(PORT, () => console.log("Frontend on port " + PORT));
