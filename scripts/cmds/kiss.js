const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "kiss",
    version: "1.9",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    cost: 1000,
    longDescription: "Generate anime-style kiss image (supports mention or reply)",
    category: "love",
    guide: "{pn} @mention or {pn} @mention1 @mention2 or reply to a message"
  },

  onStart: async function ({ message, event, api, usersData }) {
    try {
      const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
      if (module.exports.config.author.trim() !== obfuscatedAuthor) {
        return api.sendMessage(
          "❌ | You are not authorized to change the author name.",
          event.threadID,
          event.messageID
        );
      }

      const senderID = event.senderID;
      const mention = Object.keys(event.mentions);
      const messageReply = event.messageReply;

      let one, two;

      // ✅ Case 1: Two mentions → first kisses second
      if (mention.length >= 2) {
        one = mention[1];
        two = mention[0];
      }
      // ✅ Case 2: One mention → sender kisses mentioned user
      else if (mention.length === 1) {
        one = senderID;
        two = mention[0];
      }
      // ✅ Case 3: Reply → sender kisses replied user
      else if (messageReply && messageReply.senderID !== senderID) {
        one = senderID;
        two = messageReply.senderID;
      }
      // ❌ No mention or reply
      else {
        return message.reply("Please mention or reply to someone to kiss 💋");
      }

      const base = await mahmud();
      const apiURL = `${base}/api/kiss`;

      message.reply("💞 Generating your kiss image, please wait...");

      const response = await axios.post(
        apiURL,
        { senderID: one, targetID: two },
        { responseType: "arraybuffer" }
      );

      const imgPath = path.join(__dirname, `kiss_${one}_${two}.png`);
      fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

      let msgBody;
      if (mention.length >= 2) {
        msgBody = "「 𝕌𝕞𝕞𝕞𝕞𝕒𝕙 𝕓𝕒𝕓𝕪🥰❤ 」";
      } else {
        msgBody = "「 𝕃𝕠𝕧𝕖 𝕪𝕠𝕦 𝔹𝕒𝕓𝕖🥰❤ 」";
      }

      message.reply({
        body: msgBody,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 10000);

    } catch (err) {
      console.error("Error in kiss command:", err.message || err);
      message.reply("🥹 Error occurred, contact MahMUD.");
    }
  }
};
