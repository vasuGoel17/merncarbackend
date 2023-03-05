// const bodyParser = require("body-parser");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const router = require("./routes/router");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const PORT = process.env.PORT || 5000;

require("./db/conn");
const signups = require("./models/signUpSchema");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.get("/", (req, res) => {
  res.status(201).json("Server start");
});

app.use(router);
app.listen(PORT, function () {
  console.log(`server is successfully working at port ${PORT}`);
});
