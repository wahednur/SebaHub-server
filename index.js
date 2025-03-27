require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const app = express();

//Cors options
const corsOpt = {
  origin: ["http://localhost:5173/", "http://localhost:5174/"],
  credential: true,
  optionSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOpt));
app.use(express.json());

// Server running test
app.get("/", (req, res) => {
  res.send(`<h1>WS jobs server running on port ${port}</h1>`);
});

// Port Listening
app.listen(port, () =>
  console.log(`WS job server is running on port number ${port}`)
);
