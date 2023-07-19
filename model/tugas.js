const mongoose = require("mongoose");

const Tugas = mongoose.model("Tugas", {
  nama_tugas: {
    type: String,
    required: true,
  },
  tugas: {
    type: String,
    required: true,
  },
  file_tugas: {
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

module.exports = Tugas;
