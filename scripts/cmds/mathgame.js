const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "mathgame",
    aliases: ["math"],
    version: "16.0",
    author: "MahMUD",
    countDown: 30,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — play random math quiz\n{pn} list — show global leaderboard\n{pn} info — show global rank & stats"
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    const { senderID, threadID, messageID } = event;
    let userData = await usersData.get(senderID);
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const maxLimit = 10;

    if (!userData.data.maths || userData.data.maths.lastReset !== today) {
      userData.data.maths = { count: 0, lastReset: today };
      await usersData.set(senderID, userData);
    }

    // --- Global API Data ---
    let apiStats = [], currentUserStats = { win: 0, loss: 0 };
    try {
      const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/math?list=true");
      apiStats = listRes.data || [];
      const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/math?userID=${senderID}`);
      currentUserStats = userRes.data || { win: 0, loss: 0 };
    } catch (e) {}

    if (args[0] === "list") {
      if (!apiStats.length) return api.sendMessage("❌ | No rankings yet.", threadID, messageID);
      let msg = `👑 Math Game Rankings:\n\n`;
      for (let i = 0; i < Math.min(apiStats.length, 100); i++) {
        const u = apiStats[i];
        const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
        msg += `${i + 1}. ${name}: ${u.win} Wins\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    if (args[0] === "info" || args[0] === "rank") {
      const index = apiStats.findIndex(u => u.userID == senderID);
      const wins = currentUserStats.win || 0;
      const lost = currentUserStats.loss || 0;
      const rank = index === -1 ? "N/A" : index + 1;
      
      let infoMsg = `📊 𝐌𝐚𝐭𝐡 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 𝐟𝐨𝐫 ${userData.name}\n${"━".repeat(20)}\n`;
      infoMsg += `• Global Rank: #${rank}\n`;
      infoMsg += `• Total Wins: ${wins}\n`;
      infoMsg += `• Total Lost: ${lost}\n`;
      infoMsg += `• Daily Progress: ${userData.data.maths.count}/${maxLimit}\n`;
      infoMsg += `${"━".repeat(20)}\n© MahMUD - Global Gaming System`;
      return api.sendMessage(infoMsg, threadID, messageID);
    }

    if (userData.data.maths.count >= maxLimit) {
      const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
      return api.sendMessage(`• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐌𝐚𝐭𝐡 𝐥𝐢𝐦𝐢𝐭, 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 ${duration.hours()}𝐡 ${duration.minutes()}𝐦.`, threadID, messageID);
    }

    try {
      const res = await axios.get("https://mahmud-global-apis.onrender.com/api/math");
      const quiz = res.data?.data || res.data;
      const { question, correctAnswer, options } = quiz;

      const quizMsg = `\n╭──✦ ${question}\n├‣ 𝗔) ${options.a}\n├‣ 𝗕) ${options.b}\n├‣ 𝗖) ${options.c}\n├‣ 𝗗) ${options.d}\n╰──────────────────‣\n• 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐲𝐨𝐮𝐫 𝐚𝐧𝐬𝐰𝐞𝐫.`;

      api.sendMessage(quizMsg, threadID, async (err, info) => {
        if (err) return;
        userData.data.maths.count++;
        await usersData.set(senderID, userData);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          correctAnswer,
          answered: false
        });

        setTimeout(async () => {
          const session = global.GoatBot.onReply.get(info.messageID);
          if (session && !session.answered) {
            let uData = await usersData.get(senderID);
            uData.money = Math.max(0, (uData.money || 0) - 500);
            uData.exp = Math.max(0, (uData.exp || 0) - 121);
            await axios.post("https://mahmud-infinity-api.onrender.com/api/game/math/loss", { userID: senderID });
            await usersData.set(senderID, uData);
            api.editMessage(`• 𝐓𝐢𝐦𝐞 𝐨𝐯𝐞𝐫 𝐁𝐚𝐛𝐲! 🥹\n• The Correct Answer: ${correctAnswer.toUpperCase()}\n• You lost 500 coins & 121 exp.`, info.messageID);
            global.GoatBot.onReply.delete(info.messageID);
          }
        }, 40000); 
      }, messageID);
    } catch (e) { return api.sendMessage("❌ Error fetching math data.", threadID, messageID); }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, threadID, messageID: replyMsgID, body } = event;
    const { correctAnswer, author, answered } = Reply;
    const gameMessageID = event.messageReply.messageID;

    if (senderID !== author || answered) return;
    
    const userAnswer = body?.trim()?.toLowerCase();
    if (!["a", "b", "c", "d"].includes(userAnswer)) return;

    Reply.answered = true; 
    let userData = await usersData.get(senderID);

    if (userAnswer === correctAnswer.toLowerCase()) {
      userData.money = (userData.money || 0) + 1000;
      userData.exp = (userData.exp || 0) + 121;
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/math/win", { userID: senderID });
      api.editMessage(`✅ | Correct answer baby!\n• You Earned 1000 coins & 121 exp.`, gameMessageID);
    } else {
      userData.money = Math.max(0, (userData.money || 0) - 500);
      userData.exp = Math.max(0, (userData.exp || 0) - 121);
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/math/loss", { userID: senderID });
      api.editMessage(`❌ | Wrong answer baby!\n• The Correct Answer: ${correctAnswer.toUpperCase()}\n• You lost 500 coins & 121 exp.`, gameMessageID);
    }
    
    await usersData.set(senderID, userData);
    api.unsendMessage(replyMsgID);
    global.GoatBot.onReply.delete(gameMessageID);
  }
};
