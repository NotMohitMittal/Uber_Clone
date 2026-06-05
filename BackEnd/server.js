require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");

const { initializeSocket } = require("./socket");
const connectDB = require("./src/DB/db");
const app = require("./src/app");

const server = http.createServer(app);

initializeSocket(server);

connectDB();

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "..", "FrontEnd", "dist");

  app.use(express.static(frontendPath));

  // Express 5 dropped the bare "*" wildcard — use a named splat param instead.
  // "{*path}" matches every route that hasn't already been handled by the API.
  app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

server.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
