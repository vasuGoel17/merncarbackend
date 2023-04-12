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
// app.set("view-engine", "ejs");
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// app.get("/", (req, res) => {
//   res.status(201).json("Server start");
// });

app.use(router);
app.listen(PORT, function () {
  console.log(`server is successfully working at port ${PORT}`);
});
