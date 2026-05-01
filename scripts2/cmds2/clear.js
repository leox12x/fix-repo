const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "clear",
    aliases: [],
    version: "1.7",
    author: "BADBOY 彡 & MahMUD",
    countDown: 1,
    role: 2,
    category: "utility",
    shortDescription: "Delete files and images",
    longDescription: "Clean cache & delete specific files or delete downloaded images.",
    guide: {
      en: "{pn} (Clean cache and temp files)\n {pn} <file.js> (Deletes specific command)\n {pn} images (Deletes downloaded images)"
    },
  },

  onStart: async function ({ args, api, event }) {
    const directoriesToDelete = ['cache', 'tmp'];
    const fileName = args[0];

    // Convert bytes to MB
    const formatSize = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

    try {
      if (fileName === "images") {
        const imagesFolder = path.join('downloads', 'images');
        let totalSize = 0;

        if (fs.existsSync(imagesFolder)) {
          const imageFiles = fs.readdirSync(imagesFolder);

          if (imageFiles.length === 0) {
            api.sendMessage("🚫 The 'downloads/images' folder is already empty.", event.threadID);
          } else {
            for (const imageFile of imageFiles) {
              const imagePath = path.join(imagesFolder, imageFile);
              const stats = fs.statSync(imagePath);
              totalSize += stats.size;
              fs.unlinkSync(imagePath);
            }
            api.sendMessage(`✅ All downloaded images have been deleted.\n🗑 Cleared: ${formatSize(totalSize)} MB`, event.threadID);
          }
        } else {
          api.sendMessage("❎ The 'downloads/images' folder does not exist.", event.threadID);
        }
      } else if (fileName) {
        const filePath = path.join(__dirname, fileName);

        fs.stat(filePath, (err, stats) => {
          if (err) {
            api.sendMessage(`❎ | Failed to delete ${fileName}.`, event.threadID);
            return;
          }
          const fileSize = stats.size;
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(err);
              api.sendMessage(`❎ | Failed to delete ${fileName}.`, event.threadID);
              return;
            }
            api.sendMessage(`✅ | Deleted successfully! ${fileName}\n🗑 Cleared: ${formatSize(fileSize)} MB`, event.threadID);
          });
        });
      } else {
        console.log("Starting cleanup process...");
        let totalSize = 0;

        for (const directory of directoriesToDelete) {
          const directoryPath = path.join(__dirname, directory);
          if (!fs.existsSync(directoryPath)) continue;

          const files = fs.readdirSync(directoryPath);
          for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const fileStat = fs.statSync(filePath);

            if (fileStat.isFile()) {
              totalSize += fileStat.size;
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            }
          }
        }
        console.log("Cleanup process completed successfully!");

        api.sendMessage(
          `✅ | Deleted all caches and temp files.\n🗑 Cleared: ${formatSize(totalSize)} MB`,
          event.threadID
        );
      }
    } catch (err) {
      console.error(err);
      api.sendMessage(`An error occurred: ${err.message}`, event.threadID);
    }
  }
};