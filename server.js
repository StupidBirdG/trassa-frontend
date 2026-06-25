const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
app.use("/api", createProxyMiddleware({
  target: "https://trassa-backend-production.up.railway.app",
    changeOrigin: true,
      secure: true
      }));
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (_, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
      app.listen(PORT, () => console.log("Frontend on port " + PORT));
