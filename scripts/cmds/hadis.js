const axios = require("axios");
const moment = require("moment-timezone");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "hadis",
    aliases: ["hadith"],
    version: "1.8",
    author: "MahMUD",
    countDown: 30,
    role: 0,
    category: "islamic",
    shortDescription: {
      en: "Random Bangla Hadis with Daily Task Tracking"
    },
    longDescription: {
      en: "Sends a random Bangla Hadis and tracks counts for Ramadan tasks."
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, api, event, usersData }) {
    const { senderID, threadID, messageID } = event;
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.\n",
        threadID,
        messageID
      );
    }

    try {
      // --- Hadis Counter for Task ---
      const today = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
      let userData = await usersData.get(senderID);

      if (!userData.data.hadisCount || userData.data.hadisCount.lastReset !== today) {
        userData.data.hadisCount = { count: 1, lastReset: today };
      } else {
        userData.data.hadisCount.count++;
      }
      await usersData.set(senderID, userData);
      // ------------------------------

      const base = await mahmud();
      const res = await axios.get(`${base}/api/hadis`);
      const hadis = res.data;

      const taskProgress = userData.data.hadisCount.count;
      const footer = taskProgress <= 5 ? `\n•Ramadan Task: ${taskProgress}/5` : "";

      message.reply(
        `>🎀\n${hadis.text}\n\n- ${hadis.source}${footer}`
      );
    } catch (err) {
      console.error(err);
      message.reply("🥹 error, contact MahMUD");
    }
  }
};
