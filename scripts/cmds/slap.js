const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
    name: "slap",
    aliases: ["thappor"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    cost: 1000,
    category: "fun",
    cooldown: 5,
    guide: "[mention/reply/UID]",
  },

  onStart: async function({ api, event, args, usersData }) {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    const { threadID, messageID, messageReply, mentions, senderID } = event;
    
    let id2;
    if (messageReply) {
      id2 = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      id2 = Object.keys(mentions)[0];
    } else if (args[0]) {
      id2 = args[0];
    } else {
      return api.sendMessage("Please mention or reply to someone to slap!", threadID, messageID);
    }

    try {
      const baseUrl = await baseApiUrl();
      const url = `${baseUrl}/api/dig?type=slap&user=${senderID}&user2=${id2}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `slap_${id2}.png`);
      fs.writeFileSync(filePath, Buffer.from(response.data, 'utf-8'));

      return api.sendMessage(
        {
          attachment: fs.createReadStream(filePath),
          body: `Take that! 👋`
        },
        threadID,
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        messageID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage(`🥹 Error occurred. Contact MahMUD.`, threadID, messageID);
    }
  }
};
