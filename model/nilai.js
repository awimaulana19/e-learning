const mongoose = require("mongoose");

const Nilai = mongoose.model("Nilai", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status_pengumpulan: {
    type: String,
  },
  waktu_pengumpulan: {
    type: String,
  },
  penilaian: {
    type: String,
  },
  file_pengumpulan: {
    type: String,
  },
  tugas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tugas",
  },
});

module.exports = Nilai;
