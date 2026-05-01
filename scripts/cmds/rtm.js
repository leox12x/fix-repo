const fs = require("fs");
const os = require("os");
const mongoose = require("mongoose");

// MongoDB models
const Users = mongoose.models.users || mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Threads = mongoose.models.threads || mongoose.model("threads", new mongoose.Schema({}, { strict: false }));

// Helper to format bytes into B, KB, MB or GB
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < 1024 ** 3) return `${(bytes / (1024 ** 2)).toFixed(2)} MB`;
  else return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

module.exports = {
  config: {
    name: "stats",
    aliases: ["rtm"],
    version: "1.8",
    author: "MahMUD",
    role: 0,
    shortDescription: { en: "Displays bot statistics and uptime." },
    longDescription: { en: "Shows users, groups, and system stats with animation." },
    category: "general",
    guide: { en: "Use {p}stats to display animated bot stats." }
  },

  onStart: async function ({ api, event }) {
    // Updated formatTime to include days
    function formatTime(sec) {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);

      let result = "";
      if (d > 0) result += `${d}d `;
      if (h > 0 || d > 0) result += `${h}h `;
      result += `${m}m`;
      return result.trim();
    }

    try {
      // Load font style if available
      let fontStyle;
      try {
        const styles = JSON.parse(fs.readFileSync("style.json", "utf-8"));
        fontStyle = styles["11"];
      } catch {
        fontStyle = {}; // fallback to plain text
      }

      const stylize = (text) =>
        text.toString().split("").map((char) => fontStyle[char] || char).join("");

      const loadingFrames = [
        "█▒▒▒▒",
        "██▒▒▒",
        "███▒▒",
        "████▒"
      ];
      let frame = 0;

      // Send initial loading message
      const loadingMsg = await api.sendMessage(">🎀\n █▒▒▒▒", event.threadID);

      // Animate loading bar
      const interval = setInterval(() => {
        if (frame >= loadingFrames.length) {
          clearInterval(interval);
        } else {
          api.editMessage(`>🎀\n${loadingFrames[frame++]}`, loadingMsg.messageID);
        }
      }, 1100);

      setTimeout(async () => {
        try {
          // Fetch stats
          const totalUsers = await Users.countDocuments();
          const totalGroups = await Threads.countDocuments();
          const totalCommands = global.GoatBot?.commands?.size || 0;
          const botUptime = formatTime(process.uptime());
          const serverUptime = formatTime(os.uptime());

          const pingMs = Date.now() - event.timestamp;
          const pingSeconds = (pingMs / 1000).toFixed(2) + "s";

          const cpuInfo = os.cpus();
          const cpuModel = cpuInfo.length > 0 ? cpuInfo[0].model : "Unknown";
          const cpuUsage = (os.loadavg()[0] * 100).toFixed(2);

          const totalMemory = Number(os.totalmem());
          const freeMemory = Number(os.freemem());
          const usedMemory = totalMemory - freeMemory;

          const osVersion = typeof os.version === "function" ? os.version() : os.release();
          const botName = global.GoatBot?.config?.nickNameBot || "GoatBot";
          const nodeVersion = process.version;
          const hostName = os.hostname();

          const finalMessage = `
-  USERS & GROUPS 
• Total Users    : ${totalUsers}
• Total Groups   : ${totalGroups}
• Total Commands : ${totalCommands}

-  RAM INFO
• Total RAM      : ${formatSize(totalMemory)}
• Free RAM       : ${formatSize(freeMemory)}
• Used RAM       : ${formatSize(usedMemory)}

-  BOT STATUS
• Bot Uptime     : ${botUptime}
• Server Uptime  : ${serverUptime}
• Ping           : ${pingSeconds}
• Bot Name       : ${botName}
• Hostname       : ${hostName}

-  CPU & SYSTEM
• CPU Model      : ${cpuModel}
• CPU Usage      : ${cpuUsage}%
• OS             : ${osVersion}
• Node.js        : ${nodeVersion}
`;

          await api.editMessage(finalMessage, loadingMsg.messageID);
        } catch (err) {
          await api.sendMessage(`❌ Failed to collect bot statistics.\nError: ${err.message}`, event.threadID);
        }
      }, loadingFrames.length * 1100);
    } catch (err) {
      await api.sendMessage(`❌ Failed to retrieve bot statistics.\nError: ${err.message}`, event.threadID, event.messageID);
    }
  }
};