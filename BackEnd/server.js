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
  // Use ".." to step out of the BackEnd folder and into the FrontEnd folder
  const frontendPath = path.join(__dirname, "..", "FrontEnd", "dist");

  app.use(express.static(frontendPath));

  // ADD THE '*' HERE: Catch all non-API routes and hand them to React Router
  app.get((req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

server.listen(process.env.PORT, () => {
  console.log("Server running");
});
