const axios = require("axios");

module.exports = {
  config: {
    name: "draw",
    version: "1.1",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "image",
    guide: { en: "{p}imggen2 [prompt]" }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("❌ | Example: imggen2 cyberpunk samurai", event.threadID, event.messageID);
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
      await api.sendMessage({
        body: `🎨 here your image`,
        attachment: await global.utils.getStreamFromURL(url)
      }, event.threadID, event.messageID);
    } catch {
      api.sendMessage("❌ | Failed to generate image.", event.threadID, event.messageID);
    }
  }
};
