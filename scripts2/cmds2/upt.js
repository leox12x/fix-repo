const os = require("os");
const mongoose = require("mongoose");

// MongoDB models
const Users = mongoose.models.users || mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Threads = mongoose.models.threads || mongoose.model("threads", new mongoose.Schema({}, { strict: false }));

// Format uptime in days, hours, minutes
function formatTime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}D ${h}H ${m}M`;
}

module.exports = {
  config: {
    name: "upt",
    version: "1.0",
    author: "MahMUD",
    role: 0,
    shortDescription: { en: "Minimal uptime info" },
    longDescription: { en: "Shows minimal uptime with total users and groups." },
    category: "general",
    guide: { en: "{p}up" }
  },

  onStart: async function ({ api, event }) {
    try {
      const totalUsers = await Users.countDocuments();
      const totalGroups = await Threads.countDocuments();
      const botUptime = formatTime(process.uptime());

      const msg = 
`╭─ [🎀 𝐘𝐎𝐔𝐑 𝐇𝐈𝐍𝐀𝐓𝐀 𝐔𝐏 ]
╰‣ 🐤 𝗨𝗽𝘁𝗶𝗺𝗲: ${botUptime}  
╰‣ 👥 𝗧𝗼𝘁𝗮𝗹 𝗨𝘀𝗲𝗿𝘀: ${totalUsers.toLocaleString()}  
╰‣ 💬 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽𝘀: ${totalGroups.toLocaleString()}  

 • 𝐀𝐝𝐦𝐢𝐧: 𝐌𝐚𝐡 𝐌𝐔𝐃 🎀`;

      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (err) {
      api.sendMessage("❌ Failed to fetch uptime data.", event.threadID, event.messageID);
      console.error(err);
    }
  }
};
