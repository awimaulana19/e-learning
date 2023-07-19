const mongoose = require("mongoose");

const User = mongoose.model("User", {
  nama: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
    type: String,
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
  tanggalLahir: {
    type: String,
  },
  foto: {
    type: String,
  },
  jk: {
    type: String,
  },
  alamat: {
    type: String,
  },
  noTelp: {
    type: String,
  },
});

module.exports = User;
