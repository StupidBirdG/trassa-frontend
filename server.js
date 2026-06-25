import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
app.use("/api", createProxyMiddleware({
  target: "https://trassa-backend-production.up.railway.app",
  changeOrigin: true,
  secure: true
}));
app.use(express.static(join(__dirname, "dist")));
app.get("*", (_, res) => res.sendFile(join(__dirname, "dist", "index.html")));
app.listen(PORT, () => console.log("Frontend on port " + PORT));
