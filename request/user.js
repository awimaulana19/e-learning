const { check } = require("express-validator");
const User = require("../model/user");

const validateAddGuru = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("username", "Username Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error("Username Sudah Ada");
      }
    }),
  check("email", "Email Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email Sudah Ada");
      }
    }),
  check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
  check("alamat", "Alamat Tidak Boleh Kosong").notEmpty(),
  check("noTelp", "Nomor Telepon Tidak Boleh Kosong").notEmpty(),
];

const validateUpdateGuru = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("username", "Username Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ username: value });
      const guru = await User.findOne({ _id: req.body._id });

      if (user && value !== guru.username) {
        throw new Error("Username Sudah Ada");
      }
    }),
  check("email", "Email Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      const guru = await User.findOne({ _id: req.body._id });

      if (user && value !== guru.email) {
        throw new Error("Email Sudah Ada");
      }
    }),
  check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
  check("alamat", "Alamat Tidak Boleh Kosong").notEmpty(),
  check("noTelp", "Nomor Telepon Tidak Boleh Kosong").notEmpty(),
];

const validateAddSiswa = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("username", "Username/NIS Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error("NIS Sudah Ada");
      }
    }),
  check("email", "Email Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email Sudah Ada");
      }
    }),
  check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
];

const validateUpdateSiswa = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("username", "Username/NIS Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ username: value });
      const siswa = await User.findOne({ _id: req.body._id });

      if (user && value !== siswa.username) {
        throw new Error("NIS Sudah Ada");
      }
    }),
  check("email", "Email Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      const siswa = await User.findOne({ _id: req.body._id });

      if (user && value !== siswa.email) {
        throw new Error("Email Sudah Ada");
      }
    }),
  check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
];

const validateUpdateProfile = [
  check("jk", "Jenis Kelamin Tidak Boleh Kosong").notEmpty(),
  check("username", "Username/NIS Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ username: value });
      const siswa = await User.findOne({ _id: req.body._id });

      if (user && value !== siswa.username) {
        throw new Error("Username/NIS Sudah Ada");
      }
    }),
  check("email", "Email Tidak Boleh Kosong")
    .notEmpty()
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      const siswa = await User.findOne({ _id: req.body._id });

      if (user && value !== siswa.email) {
        throw new Error("Email Sudah Ada");
      }
    }),
];

module.exports = {
  validateAddGuru,
  validateUpdateGuru,
  validateAddSiswa,
  validateUpdateSiswa,
  validateUpdateProfile,
};
