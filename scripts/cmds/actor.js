const axios = require("axios");
const moment = require("moment-timezone");

const baseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
  } catch (e) { return null; }
};

module.exports = {
  config: {
    name: "actorgame",
    aliases: ["actor"],
    version: "16.1",
    author: "MahMUD",
    countDown: 30,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — play\n{pn} list — global leaderboard\n{pn} rank — global stats"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    let userData = await usersData.get(senderID);
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const maxLimit = 10;

    // Daily Limit Reset
    if (!userData.data.actorAttempts || userData.data.actorAttempts.lastReset !== today) {
      userData.data.actorAttempts = { count: 0, lastReset: today };
      await usersData.set(senderID, userData);
    }

    // --- Global Ranking & Info Logic ---
    if (args[0] === "list" || args[0] === "rank" || args[0] === "info") {
      try {
        const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/actor?list=true");
        const apiStats = listRes.data || [];
        
        if (args[0] === "list") {
          let msg = `👑 Actor Quiz Ranking:\n\n`;
          for (let i = 0; i < Math.min(apiStats.length, 100); i++) {
            const u = apiStats[i];
            const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
            msg += `${i + 1}. ${name}: ${u.win} Wins\n`;
          }
          return api.sendMessage(msg, threadID, messageID);
        } else {
          const index = apiStats.findIndex(u => u.userID == senderID);
          const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/actor?userID=${senderID}`);
          const stats = userRes.data || { win: 0, loss: 0 };
          
          let infoMsg = `📊 𝐀𝐜𝐭𝐨𝐫 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 𝐟𝐨𝐫 ${userData.name}\n${"━".repeat(20)}\n`;
          infoMsg += `• Global Rank: #${index === -1 ? "N/A" : index + 1}\n`;
          infoMsg += `• Total Wins: ${stats.win}\n• Total Lost: ${stats.loss}\n`;
          infoMsg += `• Daily: ${userData.data.actorAttempts.count}/${maxLimit}\n${"━".repeat(20)}`;
          return api.sendMessage(infoMsg, threadID, messageID);
        }
      } catch (e) { return api.sendMessage("❌ Error fetching stats.", threadID, messageID); }
    }

    // Daily Limit Check
    if (userData.data.actorAttempts.count >= maxLimit) {
      const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
      return api.sendMessage(`• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐀𝐜𝐭𝐨𝐫 𝐥𝐢𝐦𝐢𝐭, 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 ${duration.hours()}𝐡 ${duration.minutes()}𝐦.`, threadID, messageID);
    }

    try {
      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/actor`);
      const { name, imgurLink } = response.data.actor;
      const actorNames = Array.isArray(name) ? name : [name];

      // --- Stream Image with Headers ---
      const imageStream = await axios({
        url: imgurLink,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      userData.data.actorAttempts.count++;
      await usersData.set(senderID, userData);

      api.sendMessage({
        body: "🎬 Guess the actor:",
        attachment: imageStream.data
      }, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID, actorNames, answered: false });
        
        // Timeout Logic
        setTimeout(async () => {
          const session = global.GoatBot.onReply.get(info.messageID);
          if (session && !session.answered) {
            let uData = await usersData.get(senderID);
            uData.money = Math.max(0, uData.money - 300);
            uData.exp = Math.max(0, uData.exp - 121);
            await axios.post("https://mahmud-infinity-api.onrender.com/api/game/actor/loss", { userID: senderID });
            await usersData.set(senderID, uData);
            api.editMessage(`• 𝐓𝐢𝐦𝐞 𝐨𝐯𝐞𝐫 𝐁𝐚𝐛𝐲! 🥹\nCorrect Answer: ${actorNames[0]}\nYou lost 300 coins & 121 exp.`, info.messageID);
            global.GoatBot.onReply.delete(info.messageID);
          }
        }, 40000);
      }, messageID);
    } catch (e) { api.sendMessage("❌ Error starting quiz.", threadID, messageID); }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { actorNames, author, answered } = Reply;
    const { senderID, threadID, body } = event;
    const gameMsgID = event.messageReply.messageID;

    if (senderID !== author || answered) return;
    Reply.answered = true;

    const isCorrect = actorNames.some(n => n.toLowerCase() === body.trim().toLowerCase());
    let userData = await usersData.get(senderID);

    if (isCorrect) {
      userData.money += 1000; userData.exp += 121;
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/actor/win", { userID: senderID });
      api.editMessage(`✅ | Correct answer baby!\nYou earned 1000 coins & 121 exp.`, gameMsgID);
    } else {
      userData.money = Math.max(0, userData.money - 300); userData.exp = Math.max(0, userData.exp - 121);
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/actor/loss", { userID: senderID });
      api.editMessage(`❌ | Wrong Answer baby.\nCorrect answer: ${actorNames[0]}\nYou lost 300 coins & 121 exp.`, gameMsgID);
    }
    await usersData.set(senderID, userData);
    api.unsendMessage(event.messageID);
    global.GoatBot.onReply.delete(gameMsgID);
  }
};
