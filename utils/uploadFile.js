const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const uploadFileCourse = upload.fields([
  { name: "file", maxCount: 100 },
  { name: "file_tugas", maxCount: 1 },
]);

const uploadSingleFile = upload.single("file");

const storage = new Storage({
  projectId: "project-latihan-awi",
  keyFilename: "./utils/serviceAccountKey.json",
});

const bucketName = "sman6-learning-storage";
const bucket = storage.bucket(bucketName);

const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    const fileName = Date.now() + "_" + file.originalname;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    blobStream.on("error", (error) => {
      reject(error);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

const deleteFileByPublicUrl = async (publicUrl) => {
  const fileName = publicUrl.split("/").slice(4).join("/");

  const file = bucket.file(fileName);

  const exists = await file.exists();
  if (exists[0]) {
    await file.delete();
    console.log(`File deleted: ${publicUrl}`);
  } else {
    console.log(`File not found: ${publicUrl}`);
  }
};

module.exports = {
  uploadFileCourse,
  uploadSingleFile,
  uploadFile,
  deleteFileByPublicUrl,
};
