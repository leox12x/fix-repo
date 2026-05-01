const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "pp",
    aliases: ["pfp", "dp", "profile"],
    version: "2.5",
    author: "MahMUD",
    role: 0,
    cost: 1000, // <--- Centralized cost logic
    category: "media"
  },

  onStart: async function ({ message, event, args, usersData, api }) {
    const { threadID, messageID, senderID } = event;

    // Author check
    const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (this.config.author !== authorName) {
      return api.sendMessage("You are not authorized to change the author name.", threadID, messageID);
    }

    // --- Cost check and deduction is now handled automatically by index.js ---

    try {
      let targetID;

      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } 
      else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } 
      else if (args.length > 0) {
        const input = args[0];
        // Facebook link/UID regex handling
        const fbRegex = /(?:facebook\.com\/(?:profile\.php\?id=)?|fb\.com\/)(\d+)/;
        const match = input.match(fbRegex);
        targetID = match ? match[1] : input.trim();
      } 
      else {
        targetID = senderID;
      }

      const baseUrl = await baseApiUrl();
      const apiUrl = `${baseUrl}/api/pfp?mahmud=${targetID}`;
      
      const res = await axios.get(apiUrl, { responseType: "stream" });

      let userName = "User";
      try {
        const info = await api.getUserInfo(targetID);
        userName = info[targetID]?.name || "User";
      } catch (e) { 
        userName = "Profile"; 
      }

      return message.reply({
        body: `> 🎀 ${userName}\n𝐁𝐚𝐛𝐲, 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐩𝐫𝐨𝐟𝐢𝐥𝐞 😘`,
        attachment: res.data
      });

    } catch (e) {
      console.log(e);
      return message.reply("🥹 𝐄𝐫𝐫𝐨𝐫: API might be down, contact MahMUD");
    }
  }
};
