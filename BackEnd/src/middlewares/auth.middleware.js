const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const validateUserInput = (req, res, next) => {
  const error = validationResult(req);

  if (!error.isEmpty()) {
    return res.status(400).json({
      message: error.array(),
    });
  }
  next();
};

const validateUserLogin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Valid accessToken required",
    });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Incorrect token",
    });
  }
};

module.exports = { validateUserInput, validateUserLogin };
