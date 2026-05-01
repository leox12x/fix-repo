const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "sr",
    aliases: ["srlens", "lens", "search"],
    version: "2.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "search",
    vip: "yes",
    guide: {
      en: "{p}sr [reply to an image or provide an image URL]"
    }
  },

  onStart: async function ({ api, event, message, args }) {
     try {
      const vip = await VipUser.findOne({ uid: event.senderID, expiredAt: { $gt: new Date() } });
      if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);
    } catch (err) {
      console.error("VIP check error:", err);
      return api.sendMessage("❌ Error checking VIP status.", event.threadID, event.messageID);
    }
    try {
      let imageUrl;

      if (event.messageReply && event.messageReply.attachments?.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "photo") {
          imageUrl = attachment.url;
        }
      }
      if (!imageUrl && args[0]) imageUrl = args[0];
      if (!imageUrl)
        return message.reply("❌ | Please reply to an image or provide an image URL.");

      const waitMsg = await message.reply("Searching Google lens images...wait baby <😘");

      const apiURL = `${await baseApiUrl()}/api/sr?url=${encodeURIComponent(imageUrl)}`;
      const res = await axios.get(apiURL);
      const data = res.data;

      if (!data.success || !data.results?.length)
        return message.reply("🥹 | No similar results found.");

      const attachments = [];
      const results = data.results.slice(0, 6);

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.image) {
          const imgPath = path.join(__dirname, `temp_sr_${Date.now()}_${i}.png`);
          const imgBuffer = await axios.get(r.image, { responseType: "arraybuffer" });
          fs.writeFileSync(imgPath, imgBuffer.data);
          attachments.push(fs.createReadStream(imgPath));

          setTimeout(() => {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          }, 60000);
        }
      }

      await message.reply({
        body: "✅ | Here's your Google Lens search image baby.",
        attachment: attachments
      });

      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);

    } catch (err) {
      console.error(err);
      message.reply("🥹error, contact MahMUD.");
    }
  }
};
