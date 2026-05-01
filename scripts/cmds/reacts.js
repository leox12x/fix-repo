const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "react",
    category: "utility",
    role: 0,
    author: "MahMUD",
    version: "1.8"
  },

  onChat: async function({ message, event }) {    
    if (!event.body) return;
    const msgText = event.body.toLowerCase().trim();

    try {
      const apiUrl = await baseApiUrl();
      const res = await axios.get(`${apiUrl}/api/react/list`);
      const reactionsArray = res.data.reactions || [];

      for (const reactionObj of reactionsArray) {
        const emoji = reactionObj.emoji;
        const words = reactionObj.words.map(w => w.toLowerCase().trim());
        if (words.some(word => msgText.includes(word))) {
          message.reaction(emoji, event.messageID);
          break;
        }
      }
    } catch (err) {
      console.error("Error in onChat:", err.message);
    }
  },

  onStart: async function({ message, args, event }) {
    if (!args.length) return message.reply(
      "❌ Invalid format.\nUse `!react add 😀 - hi,hello`, `!react remove 😀`, or `!react list`"
    );

    const command = args[0].toLowerCase();
    const apiUrl = await baseApiUrl();
    const GODData = global.GoatBot.config.GOD; // ওনার চেক করার জন্য ডাটা

    // 📜 ১. লিস্ট দেখা (সবাই পারবে)
    if (command === "list") {
      try {
        const res = await axios.get(`${apiUrl}/api/react/list`);
        const reactionsArray = res.data.reactions || [];
        if (reactionsArray.length === 0) return message.reply("空 React list is empty.");

        let replyText = "📌 𝐑𝐞𝐚𝐜𝐭 𝐋𝐢𝐬𝐭:\n" + "━".repeat(15) + "\n";
        for (const reactionObj of reactionsArray) {
          const emoji = reactionObj.emoji;
          const words = reactionObj.words.join(", ");
          replyText += `\n${emoji} ➔ ${words}`;
        }

        return message.reply(replyText);
      } catch (err) {
        return message.reply("❌ Failed to fetch react list.");
      }
    }

    // 🟢 ২. অ্যাড করা (শুধুমাত্র ওনার)
    if (command === "add") {
      if (!GODData.includes(event.senderID)) {
        return message.reply("❌ | Baby, only my owner can add reactions.");
      }

      if (args.length < 4 || args[2] !== "-")
        return message.reply("❌ Use format: `!react add 😀 - hi,hello`");

      const emoji = args[1];
      const words = args
        .slice(3)
        .join(" ")
        .split(",")
        .map(w => w.toLowerCase().trim())
        .filter(Boolean);

      try {
        await axios.post(`${apiUrl}/api/react/add`, { emoji, words });
        return message.reply(`✅ Added words: [ ${words.join(", ")} ] to emoji: ${emoji}`);
      } catch (err) {
        return message.reply("❌ Error adding words.");
      }
    }

    // 🔴 ৩. রিমুভ করা (শুধুমাত্র ওনার)
    if (command === "remove") {
      if (!GODData.includes(event.senderID)) {
        return message.reply("❌ | Baby, only my owner can remove reactions.");
      }

      if (args.length < 2)
        return message.reply("❌ Use format: `!react remove 😀`");

      const emoji = args[1];

      try {
        await axios.post(`${apiUrl}/api/react/remove`, { emoji });
        return message.reply(`✅ Removed all words from emoji: ${emoji}`);
      } catch (err) {
        return message.reply("❌ Error removing emoji.");
      }
    }
  }
};
