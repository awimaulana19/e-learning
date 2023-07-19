const mongoose = require("mongoose");

const Attend = mongoose.model("Attend", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status_kehadiran: {
    type: String,
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance",
  },
});

module.exports = Attend;
