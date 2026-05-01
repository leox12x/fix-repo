const fs = require("fs-extra");
const os = require("os");
const axios = require("axios");
const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");

// MongoDB models
const Users = mongoose.models.users || mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Threads = mongoose.models.threads || mongoose.model("threads", new mongoose.Schema({}, { strict: false }));

const footerImgUrl = "https://i.imgur.com/LbIdjhE.jpeg";

module.exports = {
  config: {
    name: "up",
    aliases: ["dashboard"],
    version: "2.5.6",
    author: "MahMUD & Gemini",
    role: 0,
    shortDescription: { en: "Premium Dashboard with Glowing Lines and 'Times' count." },
    longDescription: { en: "Updates command usage text to 'X Times' with enhanced neon glow." },
    category: "system",
    guide: { en: "{p}up" }
  },

  onStart: async function ({ api, event, globalData }) {
    const { threadID, messageID } = event;
    const cachePath = __dirname + `/cache/honata_dash_${Date.now()}.png`;

    try {
      // --- 1. DATA COLLECTION ---
      const totalUsers = await Users.countDocuments();
      const maleUsers = await Users.countDocuments({ gender: 2 }); 
      const femaleUsers = await Users.countDocuments({ gender: 1 });
      const totalGroups = await Threads.countDocuments();
      
      const totalMem = os.totalmem();
      const usedMem = totalMem - os.freemem();
      const memPercent = (usedMem / totalMem);
      
      const uptimeSec = process.uptime();
      const uptimeStr = `${Math.floor(uptimeSec / 86400)}d ${Math.floor((uptimeSec % 86400) / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`;
      const cpuModel = os.cpus()[0].model.split(" @")[0].substring(0, 18) + "...";

      const analytics = await globalData.get("analytics", "data", {});
      const topCommands = Object.entries(analytics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // --- 2. CANVAS SETUP ---
      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext("2d");

      // VIP Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
      bgGrad.addColorStop(0, "#0f172a"); 
      bgGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1000, 600);

      // Decorative Background Circles
      ctx.fillStyle = "rgba(102, 217, 239, 0.04)";
      ctx.beginPath(); ctx.arc(900, 150, 220, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(189, 147, 249, 0.04)";
      ctx.beginPath(); ctx.arc(100, 500, 280, 0, Math.PI * 2); ctx.fill();

      // Header Bar
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      drawRoundRect(ctx, 20, 20, 960, 75, 20);
      ctx.fill();

      // --- AVATAR WITH NEON GLOW ---
      const centerX = 75, centerY = 58, radius = 30;
      try {
        const imageResponse = await axios.get(footerImgUrl, { 
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://imgur.com/' }
        });
        const avatarImg = await loadImage(Buffer.from(imageResponse.data));
        
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00FFCC";
        ctx.strokeStyle = "#00FFCC";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatarImg, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      } catch (e) {
        ctx.fillStyle = "#00FFCC";
        ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Hinata Bot Global Dashboard", 135, 68);

      // Helpers
      function drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
      }

      const drawPanel = (x, y, w, h, title) => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        drawRoundRect(ctx, x, y, w, h, 25);
        ctx.fill();
        ctx.fillStyle = "#bd93f9"; 
        ctx.font = "bold 18px Arial";
        ctx.fillText(title, x + 25, y + 40);
      };

      const drawStat = (x, y, iconChar, iconColor, label, value) => {
        ctx.fillStyle = iconColor;
        ctx.beginPath(); ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center";
        ctx.fillText(iconChar, x + 20, y + 26);
        ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px Arial";
        ctx.fillText(label, x + 50, y + 15);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Arial";
        ctx.fillText(value, x + 50, y + 35);
      };

      // --- DRAWING PANELS ---
      drawPanel(20, 115, 280, 440, "SYSTEM INFO");
      drawStat(40, 175, "V", "#238636", "VERSION", "2.5.6");
      drawStat(40, 240, "N", "#1f6feb", "NODE", process.version);
      drawStat(40, 305, "P", "#8957e5", "PLATFORM", os.platform());
      drawStat(40, 370, "A", "#da3633", "ARCH", os.arch());
      drawStat(40, 435, "T", "#d29922", "UPTIME", uptimeStr);

      drawPanel(320, 115, 320, 210, "USER & GROUP INFO");
      drawStat(340, 175, "U", "#1f6feb", "USERS", totalUsers.toLocaleString());
      drawStat(340, 240, "G", "#238636", "GROUPS", totalGroups.toLocaleString());
      drawStat(485, 175, "♂", "#00d2ff", "MALE", maleUsers.toLocaleString());
      drawStat(485, 240, "♀", "#ff4b2b", "FEMALE", femaleUsers.toLocaleString());

      drawPanel(320, 345, 320, 210, "PERFORMANCE");
      drawStat(340, 405, "C", "#1f6feb", "CPU MODEL", cpuModel);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Arial";
      ctx.fillText("RAM USAGE", 340, 470);
      ctx.fillStyle = "rgba(255,255,255,0.1)"; 
      drawRoundRect(ctx, 340, 480, 280, 10, 5); ctx.fill();
      ctx.fillStyle = "#00FFCC";
      drawRoundRect(ctx, 340, 480, 280 * memPercent, 10, 5); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial";
      ctx.fillText(`${(usedMem / 1024**3).toFixed(1)}GB / ${(totalMem / 1024**3).toFixed(1)}GB`, 340, 510);

      // --- TOP 10 COMMANDS WITH GLOWING DIVIDERS & 'TIMES' ---
      drawPanel(660, 115, 320, 440, "TOP 10 COMMANDS USE");
      let startY = 185;
      topCommands.forEach(([cmd, count], index) => {
        // Rank & Command Name
        ctx.fillStyle = index < 3 ? "#FFD700" : "rgba(255,255,255,0.4)";
        ctx.font = "bold 14px Arial";
        ctx.fillText(`${index + 1}.`, 685, startY);
        
        ctx.fillStyle = "#fff";
        ctx.font = "13px Arial";
        ctx.fillText(cmd.toUpperCase(), 715, startY);
        
        // Count with "Times"
        ctx.textAlign = "right";
        ctx.fillStyle = "#00FFCC";
        ctx.font = "bold 13px Arial";
        ctx.fillText(`${count} Times`, 955, startY);
        ctx.textAlign = "left";

        // Premium Neon Glow Divider Line
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = index < 3 ? "#FFD700" : "#00FFCC";
        ctx.strokeStyle = index < 3 ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 255, 204, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(685, startY + 14);
        ctx.lineTo(955, startY + 14);
        ctx.stroke();
        ctx.restore();

        startY += 38; 
      });

      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "12px Arial"; ctx.textAlign = "center";
      ctx.fillText("© 2026 Hinata Bot - by MahMUD", 500, 585);

      const buffer = canvas.toBuffer("image/png");
      if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
      fs.writeFileSync(cachePath, buffer);

      return api.sendMessage({
        body: "📊 Hinata Bot Official - Dashboard",
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ Error: ${error.message}`, threadID);
    }
  }
};
