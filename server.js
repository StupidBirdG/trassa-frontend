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
  const options = {
    hostname: BACKEND,
    port: 443,
    path: "/api" + (req.url || "/"),
    method: req.method,
    headers: { ...req.headers, host: BACKEND }
  };
  delete options.headers["content-length"];
  const proxyReq = httpsReq(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (e) => {
    console.error("Proxy error:", e.message);
    if (!res.headersSent) res.status(502).json({ error: e.message });
  });
  req.pipe(proxyReq);
});

app.use(express.static(join(__dirname, "dist")));
app.get("*", (_, res) => res.sendFile(join(__dirname, "dist", "index.html")));
app.listen(PORT, () => console.log("Frontend on port " + PORT));
