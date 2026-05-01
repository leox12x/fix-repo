const axios = require("axios");
const mongoose = require("mongoose");

// VIP User schema
const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

module.exports = {
  config: {
    name: "cpic",
    aliases: ["cp", "cover"],
    version: "1.2",
    author: "MahMUD",
    role: 0,
    vip: "yes",
    category: "info",
    guide: {
      en: "{pn} OR {pn} @mention"
    }
  },

  onStart: async ({ message, args, api, event }) => {
    try {
      // Determine target UID
      let uid;

      // 1️⃣ If mention exists
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      // 2️⃣ If message is reply
      else if (event.messageReply) {
        uid = event.messageReply.senderID;
      }
      // 3️⃣ If UID provided as argument
      else if (args[0]) {
        uid = args[0];
      }
      // 4️⃣ Default: sender's UID
      else {
        uid = event.senderID;
      }

      // VIP check only if no mention/reply
      if ((!event.mentions || Object.keys(event.mentions).length === 0) && !event.messageReply) {
        const vip = await VipUser.findOne({ uid: event.senderID, expiredAt: { $gt: new Date() } });
        if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);
      }

      // Fetch cover photo
      const apiUrl = `https://not-asif.top/fbbasicinfo?q=${uid}&apiKey=Zenitsu_404`;
      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data.coverPhoto) {
        return message.reply("❌ No cover photo found for this user.");
      }

      // Send cover photo
      await message.reply({
        body: `📸 Cover Photo of ${uid}`,
        attachment: await global.utils.getStreamFromURL(data.coverPhoto)
      });

    } catch (err) {
      console.error("Error:", err);
      return message.reply("❌ API error occurred.");
    }
  }
};
