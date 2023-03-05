const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
});

const contacts = mongoose.model("contacts", contactUsSchema);

module.exports = contacts;
