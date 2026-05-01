const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/raven0809/exe/refs/heads/main/baseApiUrl.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing",
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    cost: 1000, // <--- Handler (index.js) eikhan theke cost logic nibe
    category: "media",
    guide: {
      en: "{pn} sing mood"
    }
  },

  onStart: async ({ api, args, event, message, usersData }) => {
    // Note: Cost check and deduction is now handled automatically by index.js
    
    // 🐤 Loading Reaction
    try { api.setMessageReaction("🐤", event.messageID, () => {}, true); } catch (e) {}

    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID, title;

    try {
      if (checkurl.test(args[0])) {
        const match = args[0].match(checkurl);
        videoID = match ? match[1] : null;
      } else if (args.length > 0) {
        const query = args.join(" ");
        const res = await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${query}`);
        const firstResult = res.data[0];
        
        if (!firstResult) {
            try { api.setMessageReaction("🥹", event.messageID, () => {}, true); } catch (e) {}
            return api.sendMessage("❌ No results found for your query.", event.threadID, event.messageID);
        }

        videoID = firstResult.id;
        title = firstResult.title;
      } else {
        try { api.setMessageReaction("🥹", event.messageID, () => {}, true); } catch (e) {}
        return message.reply("Please provide a song name or a valid YouTube link.");
      }

      const {
        data: { title: videoTitle, downloadLink }
      } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);

      const filePath = path.join(__dirname, `audio_${event.senderID}.mp3`);
      const audioBuffer = (await axios.get(downloadLink, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(audioBuffer));

      const audioStream = fs.createReadStream(filePath);
      
      await api.sendMessage(
        {
          body: `✅ 𝙃𝙚𝙧𝙚'𝙨 𝙮𝙤𝙪𝙧 𝙨𝙤𝙣𝙜 𝙗𝙖𝙗𝙮\n\n🐤 | 𝙀𝙣𝙟𝙤𝙮: ${videoTitle || title}`,  
          attachment: audioStream
        },
        event.threadID,
        (err) => {
            if (!err) {
                // 🪽 Success Reaction
                try { api.setMessageReaction("🪽", event.messageID, () => {}, true); } catch (e) {}
            }
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        event.messageID
      );

    } catch (error) {
      console.error("Error:", error.message);
      // 🥹 Wrong/Error Reaction
      try { api.setMessageReaction("🥹", event.messageID, () => {}, true); } catch (e) {}
      api.sendMessage("❌ An error occurred while processing your request.", event.threadID, event.messageID);
    }
  }
};
