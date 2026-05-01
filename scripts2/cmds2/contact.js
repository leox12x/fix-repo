 module.exports = {
  config: {
    name: "contact",
    version: "1.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "general",
    guide: {
      en: "{pn} - Show admin & support contact information"
    }
  },

  onStart: async function ({ message }) {

    const msg = `>🎀 𝗛𝗜𝗡𝗔𝗧𝗔 𝗦𝗨𝗣𝗣𝗢𝗥𝗧

🔰 𝗦𝗨𝗣𝗣𝗢𝗥𝗧 𝗚𝗥𝗢𝗨𝗣
• Messenger: https://m.me/j/AbaI0vNvy8EjE1ek/
• WhatsApp: https://chat.whatsapp.com/BLMzY9oF8lAC7sqH8IpyOH

👤 𝗔𝗗𝗠𝗜𝗡 𝗖𝗢𝗡𝗧𝗔𝗖𝗧
• Facebook: m.me/mahmudexe
• WhatsApp: 01836298139
• Gmail: mahmudx077@gmail.com

✨ Feel free to contact for any help or support.`;

    return message.reply(msg);
  }
};
