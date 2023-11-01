require("./db");
const User = require("../model/user");
const bcrypt = require("bcrypt");

const adminData = {
  nama: "Admin",
  username: "admin",
  password: "admin01",
  email: "admin@gmail.com",
  roles: "admin",
};

async function seedAdmin() {
  try {
    const existingAdmin = await User.findOne({ username: adminData.username });

    if (existingAdmin) {
      console.log("Akun Admin Sudah Ada");
      return process.exit();
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = new User({
      nama: adminData.nama,
      username: adminData.username,
      password: hashedPassword,
      email: adminData.email,
      roles: adminData.roles,
    });

    await admin.save();

    console.log("Akun Admin Berhasil Dibuat");
    process.exit();
  } catch (error) {
    console.error("Error :", error);
    process.exit(1);
  }
}

seedAdmin();
