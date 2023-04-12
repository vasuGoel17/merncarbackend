const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const keysecret = "kuchbhikuchbhikuchbhikuchbhikuch";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  imageurl: {
    type: String,
  },
  imgsegment: [
    {
      imgg: String,
      num: Number,
    },
  ],
});

const users = new mongoose.model("users", userSchema);
module.exports = users;
