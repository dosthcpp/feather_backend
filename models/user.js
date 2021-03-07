const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, unique: true },
    fname: { type: String },
    lname: { type: String },
    username: { type: String },
  },
  {
    collection: "feather",
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
