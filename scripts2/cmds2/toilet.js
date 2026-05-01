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



module.exports = {
  config: {
    name: "toilet",
    version: "1.8",
    author: "MahMUD",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "[mention/reply/UID]",
  },

  onStart: async function({ api, event, args }) {
   
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
        "You are not authorized to change the author name.\n", 
        event.threadID, 
        event.messageID
      );
    }

    const { senderID, mentions, threadID, messageID, messageReply } = event;

    // Determine target ID
    let id;
    if (Object.keys(mentions).length > 0) {
      id = Object.keys(mentions)[0];
    } else if (messageReply) {
      id = messageReply.senderID;
    } else if (args[0]) {
      id = args[0]; 
    } else {
      return api.sendMessage(
        "Mention, reply, or give UID to make toilet someone.",
        threadID,
        messageID
      );
    }

    if (id === "61581306515651") {
      return api.sendMessage("who are you baby🐸", threadID, messageID);
    }

    try {
      const apiUrl = await baseApiUrl();
      const url = `${apiUrl}/api/toilet?user=${id}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `toilet_${id}.png`);
      fs.writeFileSync(filePath, response.data);
      
      api.sendMessage(
        { attachment: fs.createReadStream(filePath), body: "Here's your toilet image 🐸" },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );

    } catch (err) {
      api.sendMessage(`🥹error, contact MahMUD.`, threadID, messageID);
    }
  }
};
