require("dotenv").config();
const http = require("http");

const { initializeSocket } = require("./socket");
const connectDB = require("./src/DB/db");
const app = require("./src/app");

const server = http.createServer(app);

initializeSocket(server);

connectDB();

server.listen(process.env.PORT, () => {
  console.log("Server running");
});
