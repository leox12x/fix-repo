const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// VIP User schema
const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
  config: {
    name: "mistake",
    version: "2.3",
    author: "mahmud",
    countDown: 10,
    role: 0,
    category: "fun",
    guide: "{pn} (mention/uid/reply to a msg)"
  },

  onStart: async function ({ message, event, args, api }) {
   // VIP check using Mongoose
    try {
      const vip = await VipUser.findOne({ uid: event.senderID, expiredAt: { $gt: new Date() } });
      if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);
    } catch (err) {
      console.error("VIP check error:", err);
      return api.sendMessage("❌ Error checking VIP status.", event.threadID, event.messageID);
    }
    
    let uid;

    // 1. Check for Reply
    if (event.messageReply) {
      uid = event.messageReply.senderID;
    } 
    // 2. Check for Mentions
    else if (Object.keys(event.mentions || {}).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } 
    // 3. Check for URL to find UID
    else if (args[0] && regExCheckURL.test(args[0])) {
      try {
        uid = await findUid(args[0]);
      } catch (e) {
        return message.reply("Could not find UID from that URL.");
      }
    } 
    // 4. Check for direct UID in args
    else if (args[0]) {
      uid = args[0];
    }

    if (!uid) return message.reply("Please mention someone, provide a UID, or reply to a message.");

    try {
      const imagePath = await createMistakeImage(uid);
      await message.reply({
        body: "The Biggest Mistake on Earth",
        attachment: fs.createReadStream(imagePath)
      });
      // Optional: Delete the temp file after sending to save space
      // fs.unlinkSync(imagePath); 
    } catch (error) {
      console.error(error);
      await message.reply("An error occurred while generating the image.");
    }
  }
};

async function createMistakeImage(uid) {
  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  
  // Create temp directory if it doesn't exist
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const [avatar, canvas] = await Promise.all([
    jimp.read(avatarURL),
    jimp.read("https://i.postimg.cc/2ST7x1Dw/received-6010166635719509.jpg")
  ]);

  canvas.resize(512, 512).composite(avatar.resize(220, 203), 145, 305);
  
  const imagePath = path.join(tmpDir, `${uid}_mistake.png`);
  await canvas.writeAsync(imagePath);
  return imagePath;
}
