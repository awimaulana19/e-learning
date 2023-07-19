const mongoose = require("mongoose");

const Attendance = mongoose.model("Attendance", {
  deskripsi: {
    type: String,
  },
  password: {
    type: String,
  },
  batas_tanggal: {
    type: String,
  },
  batas_jam: {
    type: String,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
  }
});

module.exports = Attendance;
