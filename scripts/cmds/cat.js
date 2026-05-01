const axios = require("axios");
const fs = require("fs");
const path = require("path");

const getBaseApi = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return res.data.mahmud;
};

module.exports = {
  config: {
    name: "cat",
    version: "2.0",
    author: "MahMUD",
    role: 0,
    category: "media",
    guide: {
      en: "{pn} → cat image\n{pn} video → cat video"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      const type = (args[0] || "image").toLowerCase();
      const baseApi = await getBaseApi();

      switch (type) {

        // 🐱 CAT VIDEO
        case "video":
        case "vid": {
          const loading = await message.reply(
            "🐤 | 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 𝗿𝗮𝗻𝗱𝗼𝗺 𝗖𝗮𝘁 𝘃𝗶𝗱𝗲𝗼..."
          );

          setTimeout(() => {
            api.unsendMessage(loading.messageID);
          }, 5000);

          const res = await axios.get(
            `${baseApi}/api/album/mahmud/videos/cat?userID=${event.senderID}`
          );

          if (!res.data?.success || !res.data.videos?.length)
            return message.reply("❌ | No cat videos found.");

          const url =
            res.data.videos[Math.floor(Math.random() * res.data.videos.length)];

          const filePath = path.join(__dirname, "cat_video.mp4");

          const stream = await axios({
            url,
            method: "GET",
            responseType: "stream",
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          const writer = fs.createWriteStream(filePath);
          stream.data.pipe(writer);

          writer.on("finish", () => {
            api.sendMessage(
              {
                body: "✨ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐂𝐚𝐭 𝐯𝐢𝐝𝐞𝐨",
                attachment: fs.createReadStream(filePath)
              },
              event.threadID,
              () => fs.unlinkSync(filePath),
              event.messageID
            );
          });

          writer.on("error", () => {
            message.reply("❌ | Video download failed.");
          });
          break;
        }

        // 🐱 CAT IMAGE (DEFAULT)
        case "image":
        default: {
          const res = await axios.get(
            `${baseApi}/api/catimg/random-cats`
          );

          const images = res.data?.images;
          if (!images || !images.length)
            return message.reply("❌ | No cat images found.");

          const attachments = await Promise.all(
            images.map(async (url) => {
              const img = await axios({
                url,
                method: "GET",
                responseType: "stream",
                headers: { "User-Agent": "Mozilla/5.0" }
              });
              return img.data;
            })
          );

          api.sendMessage(
            {
              body: "🐱 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐫𝐚𝐧𝐝𝗼𝗺 𝐜𝐚𝐭 𝐢𝐦𝐚𝐠𝐞𝐬",
              attachment: attachments
            },
            event.threadID,
            event.messageID
          );
          break;
        }
      }
    } catch (err) {
      console.error("CAT CMD ERROR:", err);
      message.reply("❌ | Something went wrong.");
    }
  }
};
