const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

function formatMoney(num) {
  const units = ["", "K", "M", "B"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}
module.exports = {
  config: {
    name: "prompt",
    aliases: ["p"],
    version: "1.7",
    author: "MahMUD",
    category: "ai",
    guide: {
      en: "{pn} reply with an image",
    },
  },

  onStart: async function ({ api, args, event, usersData }) {
   const COST = 1000;

    // Get user balance
    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;

    if (balance < COST) {
      return api.sendMessage(
        `𝐁𝐚𝐛𝐲, 𝐧𝐞𝐞𝐝 ${formatMoney(COST)} 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝, 𝐛𝐮𝐭 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 ${formatMoney(balance)} <🥹\n\n• 𝐔𝐬𝐞 𝐝𝐚𝐢𝐥𝐲 𝐟𝐨𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐫 𝐩𝐥𝐚𝐲 𝐠𝐚𝐦𝐞𝐬 𝐭𝐨 𝐞𝐚𝐫𝐧 𝐦𝐨𝐫𝐞.`,
        event.threadID,
        event.messageID
      );
    }

    // Deduct cost
    const newBalance = balance - COST;
    await usersData.set(event.senderID, { money: newBalance });
    
const apiUrl = `${await mahmud()}/api/prompt`;
    let prompt = args.join(" ") || "Describe this image";

    if (event.type === "message_reply" && event.messageReply.attachments[0]?.type === "photo") {
      try {
        const response = await axios.post(apiUrl, {
          imageUrl: event.messageReply.attachments[0].url,
          prompt
        }, {
          headers: { "Content-Type": "application/json", "author": module.exports.config.author }
        });

        const reply = response.data.error || response.data.response || "No response";
        api.sendMessage(reply, event.threadID, event.messageID);
        return api.setMessageReaction("🪽", event.messageID, () => {}, true);

      } catch (error) {
        api.sendMessage("moye moye🥹", event.threadID, event.messageID);
        return api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
    }

    api.sendMessage("Please reply with an image.", event.threadID, event.messageID);
  }
};
