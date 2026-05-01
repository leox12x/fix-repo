const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
    name: "removebg",
    aliases: ["rmbg", "rbg"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "media",
    guide: "{pn} [Reply to image]",
  },

  onStart: async function ({ message, event, usersData, api }) {
  
    const COST = 1000;
    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;
    if (balance < COST) { 
    return api.sendMessage(`𝐁𝐚𝐛𝐲, 𝐧𝐞𝐞𝐝 ${formatMoney(COST)} 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝, 𝐛𝐮𝐭 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 ${formatMoney(balance)} <🥹\n\n• 𝐔𝐬𝐞 𝐝𝐚𝐢𝐥𝐲 𝐟𝐨𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐫 𝐩𝐥𝐚𝐲 𝐠𝐚𝐦𝐞𝐬 𝐭𝐨 𝐞𝐚𝐫𝐧 𝐦𝐨𝐫𝐞.`, event.threadID, event.messageID);}
    const newBalance = balance - COST;
    await usersData.set(event.senderID, { money: newBalance }
  );
    
    try {
      if (event.type !== "message_reply")
        return message.reply("❌ | Please reply to an image.");

      if (!event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo")
        return message.reply("No image found, reply to an image.");

      const imageUrl = event.messageReply.attachments[0].url;
      const apiUrl = await mahmud();

      const response = await axios.post(
        `${apiUrl}/api/rmbg`,
        { imageUrl },
        { responseType: "stream" }
      );

      const outputPath = path.resolve(__dirname, "cache", `${Date.now()}_rmbg.png`);
      const writer = fs.createWriteStream(outputPath);

      response.data.pipe(writer);

      writer.on("finish", () => {
        message.reply({ attachment: fs.createReadStream(outputPath) }).then(() => fs.unlinkSync(outputPath));
      });

      writer.on("error", (err) => {
        console.error("Error saving image:", err);
        message.reply("Error occurred while saving the image.");
      });
    } catch (error) {
      console.error("Error calling API:", error);
      message.reply("An error occurred while contacting the API.");
    }
  },
};
