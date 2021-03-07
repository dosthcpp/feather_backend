const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    fname: { tpye: String, required: true },
    lname: { tpye: String, required: true },
  },
  {
    collection: "feather",
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
