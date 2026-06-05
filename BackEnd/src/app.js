const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const mapRouter = require("./routes/map.routes");
const rideRouter = require("./routes/ride.routes");
const userRouter = require("./routes/user.routes");
const captainRouter = require("./routes/captain.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://uber-clone-1-kzvh.onrender.com"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRouter);
app.use("/api/captain", captainRouter);
app.use("/api/map", mapRouter);
app.use("/api/ride", rideRouter);

module.exports = app;
