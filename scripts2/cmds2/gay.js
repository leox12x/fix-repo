const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// VIP User schema
const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
  config: {
    name: "gay",
    aliases: [],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "gay [mention-reply-UID]",
  },

  onStart: async function ({ api, event, args }) {
     // VIP check using Mongoose
    try {
      const vip = await VipUser.findOne({ uid: event.senderID, expiredAt: { $gt: new Date() } });
      if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);
    } catch (err) {
      console.error("VIP check error:", err);
      return api.sendMessage("❌ Error checking VIP status.", event.threadID, event.messageID);
    }
    
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
     if (module.exports.config.author !== obfuscatedAuthor) {
     return api.sendMessage(
     "You are not authorized to change the author name.", event.threadID, event.messageID );
   }

    const { threadID, messageID, messageReply, mentions } = event;
    let id2; if (messageReply) { id2 = messageReply.senderID; } else if (Object.keys(mentions).length > 0) {
    id2 = Object.keys(mentions)[0];  } else if (args[0]) {  id2 = args[0]; } else {
    return api.sendMessage( "baby, Mention, reply, or provide UID of the target.", threadID, messageID );
  }

   try {
    const url = `${await baseApiUrl()}/api/dig?type=gay&user=${id2}`;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const filePath = path.join(__dirname, `gay_${id2}.png`);
    fs.writeFileSync(filePath, response.data);

     
    api.sendMessage({ attachment: fs.createReadStream(filePath),
    body: `𝐄𝐟𝐟𝐞𝐜𝐭 𝐠𝐚𝐲 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 🐸`,
     },
    threadID, () => fs.unlinkSync(filePath),  messageID );
  } catch (err) {
    console.error(err);
    api.sendMessage(`🥹 Error, contact MahMUD.`, threadID, messageID);
    }
  },
};
