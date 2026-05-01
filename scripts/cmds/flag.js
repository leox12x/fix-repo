const axios = require("axios");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
  } catch (e) { return null; }
};

module.exports = {
  config: {
    name: "flag",
    aliases: ["flagquiz", "countryflag"],
    version: "14.0",
    author: "MahMUD",
    countDown: 20,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — play\n{pn} list — show leaderboard\n{pn} info — show your rank & info"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    let userData = await usersData.get(senderID);
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const maxLimit = 15;

    if (!userData.data?.flagAttempts || userData.data.flagAttempts.lastReset !== today) {
      userData.data.flagAttempts = { count: 0, lastReset: today };
      await usersData.set(senderID, userData);
    }

    // --- Global API Data Fetching (Flag Stats) ---
    let apiStats = [], currentUserStats = { win: 0, loss: 0 };
    try {
      const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/flag?list=true");
      apiStats = listRes.data || [];
      const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/flag?userID=${senderID}`);
      currentUserStats = userRes.data || { win: 0, loss: 0 };
    } catch (e) {}

    if (args[0] === "list") {
      if (!apiStats.length) return api.sendMessage("❌ | No rankings yet.", threadID, messageID);
      let msg = `👑 Flag game Ranking:\n\n`;
      for (let i = 0; i < Math.min(apiStats.length, 100); i++) {
        const u = apiStats[i];
        const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
        msg += `${i + 1}. ${name}: ${u.win} Wins\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    const drawRankCard = async () => {
      const index = apiStats.findIndex(u => u.userID == senderID);
      const wins = currentUserStats.win || 0;
      const lost = currentUserStats.loss || 0;
      const totalPlayed = wins + lost;
      const dailyDone = userData.data.flagAttempts.count || 0;
      const timeLeft = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));

      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext("2d");

      // Background logic
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
      bgGrad.addColorStop(0, "#0f172a"); 
      bgGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 1000, 600);

      // Glow effect
      ctx.fillStyle = "rgba(102, 217, 239, 0.04)";
      ctx.beginPath(); ctx.arc(900, 150, 220, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(189, 147, 249, 0.04)";
      ctx.beginPath(); ctx.arc(100, 500, 280, 0, Math.PI * 2); ctx.fill();

      // Header
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      drawRoundRect(ctx, 20, 20, 960, 75, 20); ctx.fill();
      await drawCircleImage(ctx, senderID, 75, 58, 30, true);
      ctx.textAlign = "left"; ctx.fillStyle = "#00FFCC"; ctx.font = "bold 24px Arial"; 
      ctx.fillText(userData.name.toUpperCase(), 135, 52);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "bold 16px Arial"; ctx.fillText("Flag Quiz Personal Analytics", 135, 76);

      // Panels
      drawPanel(ctx, 20, 115, 300, 440, "PLAYER STATISTICS");
      drawStat(ctx, 40, 160, "R", "#1f6feb", "GLOBAL RANK", `#${index === -1 ? "N/A" : index + 1}`);
      drawStat(ctx, 40, 210, "W", "#238636", "TOTAL WINS", `${wins} Times`);
      drawStat(ctx, 40, 260, "L", "#da3633", "TOTAL LOST", `${lost} Times`);
      drawStat(ctx, 40, 310, "G", "#8957e5", "TOTAL PLAYED", `${totalPlayed} Games`);

      const accuracy = totalPlayed === 0 ? 0 : (wins / totalPlayed);
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Arial"; ctx.fillText("WIN RATE PERCENTAGE", 40, 375);
      ctx.textAlign = "right"; ctx.fillStyle = "#00FFCC"; ctx.font = "bold 12px Arial"; ctx.fillText(`${(accuracy * 100).toFixed(1)}%`, 300, 375);
      ctx.fillStyle = "rgba(255,255,255,0.1)"; drawRoundRect(ctx, 40, 385, 260, 10, 5); ctx.fill();
      ctx.fillStyle = "#00FFCC"; drawRoundRect(ctx, 40, 385, 260 * accuracy, 10, 5); ctx.fill();
      
      const dailyRate = Math.min(1, dailyDone / maxLimit);
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Arial"; ctx.fillText("DAILY LIMIT PROGRESS", 40, 430);
      ctx.textAlign = "right"; ctx.fillStyle = "#FF79C6"; ctx.font = "bold 12px Arial"; ctx.fillText(`${dailyDone}/${maxLimit}`, 300, 430);
      ctx.fillStyle = "rgba(255,255,255,0.1)"; drawRoundRect(ctx, 40, 440, 260, 10, 5); ctx.fill();
      ctx.fillStyle = "#FF79C6"; drawRoundRect(ctx, 40, 440, 260 * dailyRate, 10, 5); ctx.fill();
      ctx.textAlign = "center"; ctx.fillStyle = "#FF79C6"; ctx.font = "bold 13px Arial"; 
      ctx.fillText(`Next Reset: ${timeLeft.hours()}h ${timeLeft.minutes()}m`, 170, 475);

      drawPanel(ctx, 340, 115, 300, 440, "FEATURED FLAG");
      try {
        const midImg = await loadImage("https://i.imgur.com/KwLrNJa.png");
        ctx.save(); drawRoundRect(ctx, 360, 170, 260, 365, 20); ctx.clip(); ctx.drawImage(midImg, 360, 170, 260, 365); ctx.restore();
        ctx.strokeStyle = "rgba(0, 255, 204, 0.4)"; ctx.lineWidth = 2; drawRoundRect(ctx, 360, 170, 260, 365, 20); ctx.stroke();
      } catch (e) {}

      drawPanel(ctx, 660, 115, 320, 440, "TOP 10 FLAG RANKING");
      let startY = 185;
      for (let i = 0; i < 10; i++) {
        const p = apiStats[i];
        ctx.textAlign = "left"; ctx.fillStyle = i < 3 ? "#FFD700" : "rgba(255,255,255,0.4)";
        ctx.font = "bold 14px Arial"; ctx.fillText(`${i + 1}.`, 685, startY);
        if (p) {
          const pName = await usersData.getName(p.userID) || p.name || "Hunter";
          ctx.fillStyle = "#fff"; ctx.font = "13px Arial"; ctx.fillText(pName.toUpperCase().substring(0, 18), 715, startY);
          ctx.textAlign = "right"; ctx.fillStyle = "#00FFCC"; ctx.fillText(`${p.win} W`, 955, startY);
        }
        ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = i < 3 ? "#FFD700" : "#00FFCC";
        ctx.strokeStyle = i < 3 ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 255, 204, 0.3)";
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(685, startY + 14); ctx.lineTo(955, startY + 14); ctx.stroke(); ctx.restore();
        startY += 38;
      }
      
      ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "12px Arial";
      ctx.fillText("© 2026 Hinata Bot - Game System by MahMUD", 500, 585);

      const cachePath = path.join(process.cwd(), "cache", `flag_rank_${senderID}.png`);
      fs.ensureDirSync(path.join(process.cwd(), "cache"));
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));
      return cachePath;
    };

    if (args[0] === "info" || args[0] === "rank") {
      const cachePath = await drawRankCard();
      return api.sendMessage({ body: `📊 Flag Quiz info for ${userData.name}`, attachment: fs.createReadStream(cachePath) }, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);
    }

    if (userData.data.flagAttempts.count >= maxLimit) {
      const cachePath = await drawRankCard();
      return api.sendMessage({ body: `• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐅𝐥𝐚𝐠 𝐥𝐢𝐦𝐢𝐭!`, attachment: fs.createReadStream(cachePath) }, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);
    }

    try {
      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/flag`);
      const { country, link } = response.data;
      const imgStream = await axios({ url: link, method: "GET", responseType: "stream", headers: { "User-Agent": "Mozilla/5.0" } });
      
      userData.data.flagAttempts.count++;
      await usersData.set(senderID, userData);

      api.sendMessage({ body: `🌍 A random flag appeared! Guess the country name.\n\n• 𝐃𝐚𝐢𝐥𝐲 𝐋𝐢𝐦𝐢𝐭: ${userData.data.flagAttempts.count}/${maxLimit}`, attachment: imgStream.data }, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, type: "reply", messageID: info.messageID, author: senderID, correctFlag: country, answered: false });
        
        setTimeout(async () => {
          const session = global.GoatBot.onReply.get(info.messageID);
          if (session && !session.answered) {
            let uData = await usersData.get(senderID);
            uData.money = Math.max(0, (uData.money || 0) - 300);
            await axios.post("https://mahmud-infinity-api.onrender.com/api/game/flag/loss", { userID: senderID });
            await usersData.set(senderID, uData);
            api.editMessage(`• 𝐓𝐢𝐦𝐞 𝐨𝐯𝐞𝐫 𝐁𝐚𝐛𝐲! 🥹\nCorrect: ${country}\n-300 coins & -100 exp.`, info.messageID);
            global.GoatBot.onReply.delete(info.messageID);
          }
        }, 40000);
      }, messageID);
    } catch (e) { api.sendMessage("❌ Failed to start flag quiz.", threadID, messageID); }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { correctFlag, author, messageID, answered } = Reply;
    const { senderID, threadID, messageID: replyMsgID } = event;

    if (senderID !== author) return api.sendMessage("• 𝐁𝐚𝐛𝐲, 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐭𝐮𝐫𝐧\n𝐓𝐲𝐩𝐞 !𝐟𝐥𝐚𝐠 𝐭𝐨 𝐬𝐭𝐚𝐫𝐭 𝐲𝐨𝐮𝐫 𝐆𝐚𝐦𝐞.", threadID, replyMsgID);
    if (answered) return;

    Reply.answered = true;
    const isCorrect = correctFlag.toLowerCase() === event.body.trim().toLowerCase();
    let userData = await usersData.get(senderID);

    if (isCorrect) {
      userData.money = (userData.money || 0) + 1000;
      userData.exp = (userData.exp || 0) + 121;
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/flag/win", { userID: senderID });
      api.editMessage(`✅ | Correct answer baby!\nYou earned 1000 coins & 121 exp.`, messageID);
    } else {
      userData.money = Math.max(0, (userData.money || 0) - 300);
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/flag/loss", { userID: senderID });
      api.editMessage(`❌ | Wrong answer baby.\nCorrect was: ${correctFlag}\nYou lost 300 coins & 100 exp.`, messageID);
    }
    await usersData.set(senderID, userData);
    api.unsendMessage(replyMsgID);
    global.GoatBot.onReply.delete(messageID);
  }
};

// UI Helpers
function drawRoundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function drawPanel(ctx, x, y, w, h, title) { ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; drawRoundRect(ctx, x, y, w, h, 25); ctx.fill(); ctx.fillStyle = "#bd93f9"; ctx.font = "bold 18px Arial"; ctx.textAlign = "left"; ctx.fillText(title, x + 25, y + 40); }
function drawStat(ctx, x, y, iconChar, iconColor, label, value) { ctx.fillStyle = iconColor; ctx.beginPath(); ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; ctx.fillText(iconChar, x + 20, y + 26); ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px Arial"; ctx.fillText(label, x + 50, y + 15); ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Arial"; ctx.fillText(value, x + 50, y + 35); }
async function drawCircleImage(ctx, uid, x, y, radius, glow = false) { if (glow) { ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = "#00FFCC"; ctx.strokeStyle = "#00FFCC"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip(); try { const img = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`); ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2); } catch (e) { ctx.fillStyle = "#334155"; ctx.fill(); } ctx.restore(); }
