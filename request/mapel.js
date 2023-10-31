const { check } = require("express-validator");

const validateAddMapel = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("guru", "Guru Tidak Boleh Kosong").notEmpty(),
  check("tingkatan", "Tingkatan Tidak Boleh Kosong").notEmpty(),
];

const validateUpdateMapel = [
  check("nama", "Nama Tidak Boleh Kosong").notEmpty(),
  check("guru", "Guru Tidak Boleh Kosong").notEmpty(),
];

module.exports = {
  validateAddMapel,
  validateUpdateMapel,
};
