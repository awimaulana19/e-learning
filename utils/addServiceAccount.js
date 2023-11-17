const fs = require("fs");
const https = require("https");
const path = require("path");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            `Gagal mendownload file, status code: ${response.statusCode}`
          );
          return;
        }

        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });

        fileStream.on("error", (err) => {
          fs.unlink(dest, () => reject(err));
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function downloadJsonFile() {
  const url = process.env.SERVICE_ACCOUNT_GCP;
  const fileName = "serviceAccountKey.json";
  const filePath = path.join("./utils/", fileName);

  if (fs.existsSync(filePath)) {
    console.log(`File ${fileName} sudah ada`);
    return;
  }

  try {
    await downloadFile(url, filePath);
    console.log(`File ${fileName} berhasil di download.`);
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
  }
}

downloadJsonFile();
