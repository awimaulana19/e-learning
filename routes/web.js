const express = require("express");
const {
  home,
  login,
  loginAuth,
  loginAction,
  logout,
} = require("../controller/auth.js");
const {
  dashboardAdmin,
  dashboardGuru,
  dashboardSiswa,
  getGuru,
  createGuru,
  updateGuru,
  deleteGuru,
  getSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
  getProfile,
  updateProfile,
  updatePassword,
} = require("../controller/user.js");
const {
  getMapel,
  createMapel,
  updateMapel,
  deleteMapel,
} = require("../controller/mapel.js");
const {
  getMapelById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
} = require("../controller/course.js");
const {
  createResource,
  updateResource,
  deleteResource,
} = require("../controller/resource.js");
const {
  createTugas,
  updateTugas,
  deleteTugas,
  getTugasById,
  getTugasSiswa,
  createKumpulTugas,
  deleteKumpulTugas,
} = require("../controller/tugas.js");
const { getNilaiById, updateNilai } = require("../controller/nilai.js");
const {
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendById,
  createAttend,
  getAttendSiswa,
  createAttendSiswa,
} = require("../controller/attendance.js");
const { isAdmin, isGuru, isSiswa } = require("../middleware/authUser.js");
const {
  validateAddGuru,
  validateUpdateGuru,
  validateAddSiswa,
  validateUpdateSiswa,
  validateUpdateProfile,
} = require("../request/user.js");
const {
  validateAddMapel,
  validateUpdateMapel,
} = require("../request/mapel.js");
const {
  uploadFileCourse,
  uploadSingleFile,
} = require("../utils/uploadFile.js");

const router = express.Router();

router.get("/", home);
router.get("/login", login);
router.post("/login", loginAuth, loginAction);
router.get("/logout", logout);
router.get("/admin/guru", isAdmin, getGuru);

router.get("/admin/dashboard", isAdmin, dashboardAdmin);
router.post("/admin/guru", validateAddGuru, isAdmin, createGuru);
router.put("/admin/guru", validateUpdateGuru, isAdmin, updateGuru);
router.delete("/admin/guru", isAdmin, deleteGuru);
router.get("/admin/siswa/:kelas", isAdmin, getSiswa);
router.post("/admin/siswa", validateAddSiswa, isAdmin, createSiswa);
router.put("/admin/siswa", validateUpdateSiswa, isAdmin, updateSiswa);
router.delete("/admin/siswa", isAdmin, deleteSiswa);

router.get("/admin/mapel/:kelas", isAdmin, getMapel);
router.post("/admin/mapel", validateAddMapel, isAdmin, createMapel);
router.put("/admin/mapel", validateUpdateMapel, isAdmin, updateMapel);
router.delete("/admin/mapel", isAdmin, deleteMapel);

router.get("/guru/dashboard", isGuru, dashboardGuru);
router.get("/guru/mapel/:_id", isGuru, getMapelById);
router.post("/guru/mapel", isGuru, uploadFileCourse, createCourse);
router.put("/guru/course", isGuru, updateCourse);
router.delete("/guru/mapel", isGuru, deleteCourse);
router.get("/guru/course/:_id", isGuru, getCourseById);

router.get("/siswa/dashboard", isSiswa, dashboardSiswa);
router.post("/guru/resource", isGuru, uploadSingleFile, createResource);
router.put("/guru/resource", isGuru, uploadSingleFile, updateResource);
router.get("/guru/delete-resource/:_id", isGuru, deleteResource);

router.post("/guru/tugas", isGuru, uploadSingleFile, createTugas);
router.put("/guru/tugas", isGuru, uploadSingleFile, updateTugas);
router.get("/guru/delete-tugas/:_id", isGuru, deleteTugas);
router.get("/guru/tugas/:_id", isGuru, getTugasById);

router.get("/guru/nilai/:_id/:siswaId", isGuru, getNilaiById);
router.put("/guru/nilai", isGuru, updateNilai);

router.post("/guru/kehadiran", isGuru, createAttendance);
router.put("/guru/kehadiran", isGuru, updateAttendance);
router.get("/guru/delete-kehadiran/:_id", isGuru, deleteAttendance);
router.get("/guru/kehadiran/:_id", isGuru, getAttendanceById);
router.get("/guru/absen/:_id", isGuru, getAttendById);
router.post("/guru/absen", isGuru, createAttend);

router.get("/siswa/mapel/:_id", isSiswa, getMapelById);

router.get("/siswa/tugas/:_id", isSiswa, getTugasSiswa);
router.post("/siswa/kumpul", isSiswa, uploadSingleFile, createKumpulTugas);
router.delete("/siswa/kumpul", isSiswa, deleteKumpulTugas);

router.get("/siswa/kehadiran/:_id", isSiswa, getAttendSiswa);
router.post("/siswa/absen", isSiswa, createAttendSiswa);

router.get("/siswa/profile", isSiswa, getProfile);
router.put(
  "/siswa/profile",
  isSiswa,
  uploadSingleFile,
  validateUpdateProfile,
  updateProfile
);
router.put("/siswa/pass", isSiswa, updatePassword);

module.exports = router;
