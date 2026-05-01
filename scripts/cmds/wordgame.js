const axios = require("axios");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmudexe || base.data.mahmud;
  } catch (e) { return null; }
};

// Timer Helper Function
const setGameTimer = (api, messageID, senderID, answer, usersData) => {
  setTimeout(async () => {
    const session = global.GoatBot.onReply.get(messageID);
    if (session && !session.answered) {
      let uData = await usersData.get(senderID);
      uData.money = Math.max(0, (uData.money || 0) - 10000);
      try { await axios.post("https://mahmud-infinity-api.onrender.com/api/game/word/loss", { userID: senderID }); } catch(e) {}
      await usersData.set(senderID, uData);
      api.editMessage(`⏰ 𝐓𝐢𝐦𝐞 𝐎𝐯𝐞𝐫!\n• Answer: ${answer.toUpperCase()}`, messageID);
      global.GoatBot.onReply.delete(messageID);
    }
  }, 30000);
};

module.exports = {
  config: {
    name: "word",
    aliases: ["wordguess", "wdgame", "wordgame"],
    version: "10.7",
    author: "MahMUD",
    countDown: 20,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — start game\n{pn} info — show rank card\n{pn} list — show global leaderboard"
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    const { senderID, threadID, messageID } = event;
    let userData = await usersData.get(senderID);
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const maxLimit = 15;

    if (!userData.data.wordGames || userData.data.wordGames.lastReset !== today) {
      userData.data.wordGames = { 
        count: 0, 
        lastReset: today, 
        highestLevel: userData.data.wordGames?.highestLevel || 0 
      };
      await usersData.set(senderID, userData);
    }

    let apiStats = [], currentUserStats = { win: 0, loss: 0 };
    try {
      const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/word?list=true");
      apiStats = listRes.data || [];
      const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/word?userID=${senderID}`);
      currentUserStats = userRes.data || { win: 0, loss: 0 };
    } catch (e) {}

    if (args[0] === "list") {
      if (!apiStats.length) return api.sendMessage("❌ | No rankings yet.", threadID, messageID);
      let msg = `👑 Word Game Global Ranking:\n\n`;
      for (let i = 0; i < Math.min(apiStats.length, 10); i++) {
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
      const dailyDone = userData.data.wordGames.count || 0;
      const highest = userData.data.wordGames.highestLevel || 0;
      const timeLeft = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));

      const canvas = createCanvas(1000, 600);
      const ctx = canvas.getContext("2d");

      const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
      bgGrad.addColorStop(0, "#0f172a"); bgGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 1000, 600);

      ctx.fillStyle = "rgba(102, 217, 239, 0.04)"; ctx.beginPath(); ctx.arc(900, 150, 220, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(189, 147, 249, 0.04)"; ctx.beginPath(); ctx.arc(100, 500, 280, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.08)"; drawRoundRect(ctx, 20, 20, 960, 75, 20); ctx.fill();
      await drawCircleImage(ctx, senderID, 75, 58, 30, true);
      ctx.textAlign = "left"; ctx.fillStyle = "#00FFCC"; ctx.font = "bold 24px Arial"; 
      ctx.fillText(userData.name.toUpperCase(), 135, 52);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "bold 16px Arial"; 
      ctx.fillText("Word Guessing Personal Analytics", 135, 76);

      drawPanel(ctx, 20, 115, 300, 440, "PLAYER STATISTICS");
      drawStat(ctx, 40, 160, "R", "#1f6feb", "GLOBAL RANK", `#${index === -1 ? "N/A" : index + 1}`);
      drawStat(ctx, 40, 210, "W", "#238636", "TOTAL WINS", `${wins} Times`);
      drawStat(ctx, 40, 260, "L", "#da3633", "TOTAL LOST", `${lost} Times`);
      drawStat(ctx, 40, 310, "H", "#8957e5", "HIGHEST LEVEL", `Level ${highest}`);
      drawStat(ctx, 40, 360, "P", "#f59e0b", "TOTAL PLAYED", `${totalPlayed} Games`);

      const dailyRate = Math.min(1, dailyDone / maxLimit);
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Arial"; ctx.fillText("DAILY LIMIT PROGRESS", 40, 415);
      ctx.textAlign = "right"; ctx.fillStyle = "#FF79C6"; ctx.font = "bold 12px Arial"; ctx.fillText(`${dailyDone}/${maxLimit}`, 300, 415);
      ctx.fillStyle = "rgba(255,255,255,0.1)"; drawRoundRect(ctx, 40, 425, 260, 10, 5); ctx.fill();
      ctx.fillStyle = "#FF79C6"; drawRoundRect(ctx, 40, 425, 260 * dailyRate, 10, 5); ctx.fill();
      
      ctx.textAlign = "center"; ctx.fillStyle = "#FF79C6"; ctx.font = "bold 13px Arial"; 
      ctx.fillText(`Next Reset: ${timeLeft.hours()}h ${timeLeft.minutes()}m`, 170, 500);

      drawPanel(ctx, 340, 115, 300, 440, "FEATURED WORD");
      try {
        const midImg = await loadImage("https://i.imgur.com/05eHKWQ.jpeg");
        ctx.save(); drawRoundRect(ctx, 360, 170, 260, 365, 20); ctx.clip();
        ctx.drawImage(midImg, 360, 170, 260, 365); ctx.restore();
        ctx.strokeStyle = "rgba(0, 255, 204, 0.4)"; ctx.lineWidth = 2; drawRoundRect(ctx, 360, 170, 260, 365, 20); ctx.stroke();
      } catch (e) {}

      drawPanel(ctx, 660, 115, 320, 440, "TOP 10 WORD RANKING");
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

      const cachePath = path.join(process.cwd(), "cache", `word_rank_${senderID}.png`);
      fs.ensureDirSync(path.join(process.cwd(), "cache"));
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));
      return cachePath;
    };

    if (args[0] === "info" || args[0] === "rank") {
      const cachePath = await drawRankCard();
      return api.sendMessage({ body: `📊 Stats for ${userData.name}`, attachment: fs.createReadStream(cachePath) }, threadID, () => { if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath); }, messageID);
    }

    if (userData.data.wordGames.count >= maxLimit) {
      const timeLeft = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
      return api.sendMessage(`• 𝐁𝐚𝐛𝐲, limit reached! Try again in ${timeLeft.hours()}h ${timeLeft.minutes()}m.`, threadID, messageID);
    }

    try {
      const res = await axios.get("https://mahmud-global-apis.onrender.com/api/word/random");
      const randomWord = res.data.word;
      const shuffledWord = shuffleWord(randomWord);

      api.sendMessage(`╭‣ 𝐆𝐮𝐞𝐬𝐬 𝐭𝐡𝐞 𝐰𝐨𝐫𝐝:\n╰──‣ "${shuffledWord}" ?\n\n• Level: 1\n• Reply with the answer!`, threadID, async (err, info) => {
        if (err) return;
        userData.data.wordGames.count++;
        await usersData.set(senderID, userData);
        
        global.GoatBot.onReply.set(info.messageID, { 
          commandName: this.config.name, 
          author: senderID, 
          answer: randomWord, 
          level: 1, 
          answered: false,
          attempts: 0 
        });

        setGameTimer(api, info.messageID, senderID, randomWord, usersData);
      }, messageID);
    } catch (e) { return api.sendMessage("❌ API Error.", threadID, messageID); }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, threadID, messageID: replyMsgID, body } = event;
    let { answer, author, level, answered, attempts } = Reply;
    const gameMessageID = event.messageReply.messageID;

    if (senderID !== author || answered) return;
    const userAns = body?.trim()?.toLowerCase();
    let userData = await usersData.get(senderID);

    if (userAns === answer.toLowerCase()) {
      Reply.answered = true;
      const reward = level * 10000;
      userData.money = (userData.money || 0) + reward;
      try { await axios.post("https://mahmud-infinity-api.onrender.com/api/game/word/win", { userID: senderID }); } catch(e) {}
      
      if (level > (userData.data.wordGames.highestLevel || 0)) userData.data.wordGames.highestLevel = level;
      await usersData.set(senderID, userData);

      try {
        const nextRes = await axios.get("https://mahmud-global-apis.onrender.com/api/word/random");
        const nextWord = nextRes.data.word;
        const shuffledNext = shuffleWord(nextWord);
        try { await api.unsendMessage(gameMessageID); } catch(e) {}
        
        const rewardText = reward >= 1000 ? (reward / 1000) + "k" : reward;
        api.sendMessage(`Level now: ${level}\nBaby, you won ${rewardText} 😍\n\n• 𝐍𝐞𝐱𝐭 𝐰𝐨𝐫𝐝 = ${shuffledNext} ?`, threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, { 
            commandName: this.config.name, 
            author: senderID, 
            answer: nextWord, 
            level: level + 1, 
            answered: false,
            attempts: attempts // LEVEL UP HOILEO ATTEMPTS RESET HOBE NA
          });
          setGameTimer(api, info.messageID, senderID, nextWord, usersData);
        }, replyMsgID);
      } catch (e) { api.sendMessage(`✅ Correct!`, threadID, replyMsgID); }
    } 
    else {
      attempts++;
      const maxAttempts = 3;
      const remaining = maxAttempts - attempts;

      if (remaining > 0) { 
        Reply.attempts = attempts; 
        let attemptMsg = remaining === 1 ? "1 𝐜𝐡𝐚𝐧𝐜𝐞𝐬 𝐥𝐞𝐟𝐭" : "2 𝐜𝐡𝐚𝐧𝐜𝐞𝐬 𝐥𝐞𝐟𝐭";
        api.sendMessage(`❌ 𝐰𝐫𝐨𝐧𝐠 𝐚𝐧𝐬𝐰𝐞𝐫 𝐛𝐚𝐛𝐲!\n• ${attemptMsg} 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐬𝐞𝐬𝐬𝐢𝐨𝐧... 𝐛𝐞 𝐜𝐚𝐫𝐞𝐟𝐮𝐥 𝐧𝐞𝐱𝐭 𝐭𝐢𝐦𝐞! ⚠️`, threadID, replyMsgID);
      } else {
        Reply.answered = true;
        userData.money = Math.max(0, (userData.money || 0) - 10000);
        try { await axios.post("https://mahmud-infinity-api.onrender.com/api/game/word/loss", { userID: senderID }); } catch(e) {}
        await usersData.set(senderID, userData);
        
        api.sendMessage(`❌ 𝐰𝐫𝐨𝐧𝐠 𝐚𝐧𝐬𝐰𝐞𝐫 𝐛𝐚𝐛𝐲!\n• 𝐍𝐨 𝐜𝐡𝐚𝐧𝐜𝐞𝐬 𝐥𝐞𝐟𝐭 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐬𝐞𝐬𝐬𝐢𝐨𝐧... 𝐛𝐞 𝐜𝐚𝐫𝐞𝐟𝐮𝐥 𝐧𝐞𝐱𝐭 𝐭𝐢𝐦𝐞! ⚠️`, threadID, () => {
             api.editMessage(`❌ 𝐆𝐚𝐦𝐞 𝐎𝐯𝐞𝐫!\n• Correct Answer: ${answer.toUpperCase()}\nYou lost 10k coins.`, gameMessageID);
        }, replyMsgID);
        global.GoatBot.onReply.delete(gameMessageID);
      }
    }
    try { await api.unsendMessage(replyMsgID); } catch(e) {}
  }
};

function shuffleWord(word) {
  let s = word.split('').sort(() => 0.5 - Math.random()).join('');
  return s === word ? shuffleWord(word) : s;
}
function drawRoundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function drawPanel(ctx, x, y, w, h, title) { ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; drawRoundRect(ctx, x, y, w, h, 25); ctx.fill(); ctx.fillStyle = "#bd93f9"; ctx.font = "bold 18px Arial"; ctx.textAlign = "left"; ctx.fillText(title, x + 25, y + 40); }
function drawStat(ctx, x, y, iconChar, iconColor, label, value) { ctx.fillStyle = iconColor; ctx.beginPath(); ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.textAlign = "center"; ctx.fillText(iconChar, x + 20, y + 26); ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px Arial"; ctx.fillText(label, x + 50, y + 15); ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px Arial"; ctx.fillText(value, x + 50, y + 35); }
async function drawCircleImage(ctx, uid, x, y, radius, glow = false) { if (glow) { ctx.save(); ctx.shadowBlur = 15; ctx.shadowColor = "#00FFCC"; ctx.strokeStyle = "#00FFCC"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip(); try { const img = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`); ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2); } catch (e) { ctx.fillStyle = "#334155"; ctx.fill(); } ctx.restore(); }
