const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
  })
  .then(() => console.log("connection start"))
  .catch((err) => console.log(err.message));
