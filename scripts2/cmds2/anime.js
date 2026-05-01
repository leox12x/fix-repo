const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const mahmud = async () => {
  const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return response.data.mahmud;
};

module.exports = {
  config: {
    name: "anime",
    aliases: ["anivid", "animevideo"],
    version: "2.0",
    role: 0,
    cost: 1000,
    author: "MahMUD",
    category: "anime",
    guide: {
      en: "Use {pn} for random video, {pn} <name> to search, or {pn} list for categories."
    }
  },

  onStart: async function ({ api, event, message, args, usersData }) {
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    try {
      const apiUrl = await mahmud();

      // --- OPTION 1: LIST COMMAND ---
      if (args[0] === "list") {
        const response = await axios.get(`${apiUrl}/api/album/mahmud/list`);
        const lines = response.data.message.split("\n");
        const animeCategories = lines.filter(line =>
          /anime/i.test(line) && !/hanime/i.test(line) && !/Total\s*anime/i.test(line)
        );
        if (!animeCategories.length) {
          return api.sendMessage("❌ | No anime categories found.", event.threadID, event.messageID);
        }
        return api.sendMessage(animeCategories.join("\n"), event.threadID, event.messageID);
      }

      // --- OPTION 2: SEARCH (If keyword is provided) ---
      if (args.length > 0) {
        const kw = args.join(" ");
        const videoPath = path.join(cacheDir, `anisr_${Date.now()}.mp4`);
        
        try { api.setMessageReaction("⏳", event.messageID, () => {}, true); } catch (e) {}

        const searchRes = await axios({
          method: "get",
          url: `${apiUrl}/api/anisr?search=${encodeURIComponent(kw)}`,
          responseType: "stream",
          timeout: 60000
        });

        const writer = fs.createWriteStream(videoPath);
        searchRes.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        if (fs.statSync(videoPath).size < 100) throw new Error("File too small/empty");

        await message.reply({
          body: `• 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨 <😘`,
          attachment: fs.createReadStream(videoPath)
        });

        fs.unlinkSync(videoPath);
        return api.setMessageReaction("✅", event.messageID, () => {}, true);
      }

      // --- OPTION 3: DEFAULT (Random Video) ---
      const loadingMessage = await message.reply("🐤 | 𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝐫𝐚𝐧𝐝𝐨𝐦 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨...𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭..!!");
      setTimeout(() => { api.unsendMessage(loadingMessage.messageID); }, 5000);

      const res = await axios.get(`${apiUrl}/api/album/mahmud/videos/anime?userID=${event.senderID}`);
      if (!res.data.success || !res.data.videos.length)
        return api.sendMessage("❌ | No videos found.", event.threadID, event.messageID);

      const url = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
      const randomPath = path.join(cacheDir, `anime_rand_${Date.now()}.mp4`);

      const videoStream = await axios({
        url,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(randomPath);
      videoStream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: "✨ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐚𝐧𝐢𝐦𝐞 𝐯𝐢𝐝𝐞𝐨",
          attachment: fs.createReadStream(randomPath)
        }, event.threadID, () => fs.unlinkSync(randomPath), event.messageID);
      });

    } catch (e) {
      console.error("ERROR:", e);
      api.sendMessage("❌ | Failed to fetch or send video. Try again later.", event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
