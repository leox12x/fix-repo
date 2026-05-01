module.exports = {
  config: {
    name: "ping",
    Author: "𝗠𝗮𝗵 𝗠𝗨𝗗 彡",
    version: "1.0",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Ping!"
    },
    longDescription: {
      en: "𝙘𝙝𝙚𝙘𝙠𝙞𝙣𝙜 𝙗𝙤𝙩 𝙥𝙞𝙣𝙜"
    },
    category: "general",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const timeStart = Date.now();
    const msg = await api.sendMessage("⏳ Checking bot ping...", event.threadID);
    const ping = Date.now() - timeStart;

    api.editMessage(`✅ 𝐏𝐢𝐧𝐠 𝐂𝐡𝐞𝐜𝐤 𝐑𝐞𝐬𝐮𝐥𝐭\n───────────────\n📶 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐓𝐢𝐦𝐞: ${ping}ms`, msg.messageID);
  }
};
