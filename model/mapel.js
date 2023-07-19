const mongoose = require("mongoose");

const Mapel = mongoose.model("Mapel", {
  nama: {
    type: String,
    required: true,
  },
  kelas: {
    type: String,
  },
  jurusan: {
    type: String,
  },
  tingkatan: {
    type: String,
  },
  guru: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

module.exports = Mapel;
