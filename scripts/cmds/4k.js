const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "4k",
    aliases: ["remini"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    vip: "yes",
    role: 0,
    cost: 10000, // <--- Centralized cost logic
    category: "image",
    description: "Enhance or restore image quality using 4k AI.",
    guide: {
      en: "{pn} [url] or reply with image"
    }
  },

  onStart: async function ({ api, message, event, usersData, args }) {
    const { threadID, messageID, senderID } = event;

    // 🔒 ONLY ALLOWED GROUP
    const ALLOWED_TID = "7460623087375340";
    if (threadID !== ALLOWED_TID) {
      return api.sendMessage(
        "❌ 𝐓𝐡𝐢𝐬 𝐜𝐦𝐝 𝐖𝐨𝐫𝐤𝐢𝐧𝐠 𝐨𝐧𝐥𝐲\n•Baby World group",
        threadID,
        messageID
      );
    }

    // --- Cost check and deduction is now handled automatically by index.js ---

    // 🔐 Author protection
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "You are not authorized to change the author name.",
        threadID,
        messageID
      );
    }

    let imgUrl;
    const startTime = Date.now();

    if (event.messageReply?.attachments?.[0]?.type === "photo") {
      imgUrl = event.messageReply.attachments[0].url;
    } else if (args[0]) {
      imgUrl = args.join(" ");
    }

    if (!imgUrl) {
      return message.reply(
        "Baby, Please reply to an image or provide an image URL 🥹"
      );
    }

    const waitMsg = await message.reply(
      "𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐢𝐦𝐚𝐠𝐞... 𝐰𝐚𝐢𝐭 𝐛𝐚𝐛𝐲 <😘"
    );
    api.setMessageReaction("😘", messageID, () => {}, true);

    try {
      const baseUrl = await mahmud();
      const apiUrl = `${baseUrl}/api/hd/mahmud?imgUrl=${encodeURIComponent(imgUrl)}`;

      const res = await axios.get(apiUrl, { responseType: "stream" });

      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);
      api.setMessageReaction("✅", messageID, () => {}, true);

      const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

      return message.reply({
        body: `✅ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲\n⏱ ${processTime}s`,
        attachment: res.data
      });

    } catch (err) {
      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("🥹 Error baby, contact MahMUD.");
    }
  }
};
