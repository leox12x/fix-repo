const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "dicegame",
    aliases: ["dice"],
    version: "3.7",
    author: "MahMUD",
    role: 0,
    category: "game",
    guide: {
      en: "{pn} <bet amount> — play dice\n{pn} list — global leaderboard\n{pn} info — your global stats"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;
    const currentTime = Date.now();
    const cooldownTime = 10 * 1000;
    const maxLimit = 10;
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");

    let userData = await usersData.get(senderID);

    // --- Daily Reset Logic ---
    if (!userData.data.dices || userData.data.dices.lastReset !== today) {
      userData.data.dices = { count: 0, lastReset: today, lastDicesTime: 0 };
      await usersData.set(senderID, userData);
    }

    // --- Global Ranking & Info Logic ---
    if (args[0] === "list" || args[0] === "info" || args[0] === "rank") {
      try {
        const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/dice?list=true");
        const apiStats = (listRes.data || []).filter(u => u.win > 0);

        if (args[0] === "list") {
          if (apiStats.length === 0) return api.sendMessage("❌ | No rankings with wins yet.", threadID, messageID);
          
          let msg = `👑 Dice Game Global Ranking:\n\n`;
          for (let i = 0; i < Math.min(apiStats.length, 100); i++) {
            const u = apiStats[i];
            const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
            msg += `${i + 1}. ${name}: ${u.win} Wins\n`;
          }
          return api.sendMessage(msg, threadID, messageID);
        } else {
          const index = apiStats.findIndex(u => u.userID == senderID);
          const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/dice?userID=${senderID}`);
          const stats = userRes.data || { win: 0, loss: 0 };

          let infoMsg = `📊 𝐃𝐢𝐜𝐞 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 𝐟𝐨𝐫 ${userData.name}\n${"━".repeat(20)}\n`;
          infoMsg += `• Global Rank: #${index === -1 ? "N/A" : index + 1}\n`;
          infoMsg += `• Total Wins: ${stats.win}\n• Total Lost: ${stats.loss}\n`;
          infoMsg += `• Daily: ${userData.data.dices.count}/${maxLimit}\n${"━".repeat(20)}`;
          return api.sendMessage(infoMsg, threadID, messageID);
        }
      } catch (e) { return api.sendMessage("❌ Error fetching stats.", threadID, messageID); }
    }

    // --- Game Constraints ---
    const timeSinceLast = currentTime - (userData.data.dices.lastDicesTime || 0);
    if (timeSinceLast < cooldownTime) 
      return api.sendMessage(`⏳ | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭 ${toBoldNumbers(((cooldownTime - timeSinceLast) / 1000).toFixed(1))}𝐬 𝐛𝐞𝐟𝐨𝐫𝐞 𝐫𝐨𝐥𝐥𝐢𝐧𝐠 𝐚𝐠𝐚𝐢𝐧`, threadID, messageID);

    if (userData.data.dices.count >= maxLimit) {
      const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
      return api.sendMessage(`🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐝𝐢𝐜𝐞 𝐥𝐢𝐦𝐢𝐭.\n𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 ${toBoldNumbers(duration.hours())}𝐡 ${toBoldNumbers(duration.minutes())}𝐦.`, threadID, messageID);
    }

    if (!args[0]) return api.sendMessage("❌ | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐲𝐨𝐮𝐫 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭", threadID, messageID);

    let betAmount = parseBetAmount(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) return api.sendMessage("❌ | 𝐄𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭", threadID, messageID);
    if (betAmount > 10000000) return api.sendMessage("🚫 | 𝐌𝐚𝐱 𝐛𝐞𝐭 𝐢𝐬 𝟏𝟎𝐌", threadID, messageID);
    if (userData.money < betAmount) return api.sendMessage("- আপনার অ্যাকাউন্ট এ পর্যাপ্ত ব্যালেন্স নেই দয়া করে রিচার্জ করুন এবং পরবর্তীতে আবার চেষ্টা করুন ধন্যবাদ <🥹", threadID, messageID);

    // --- Biased Logic ---
    function rollDiceWithBias() {
      return Math.random() < 0.8 ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 3) + 4;
    }
    const rollDice = () => Math.floor(Math.random() * 6) + 1;

    let playerRoll = rollDiceWithBias();
    let botRoll = rollDice();

    userData.data.dices.count += 1;
    userData.data.dices.lastDicesTime = currentTime;

    let resultMessage = `🎲 𝐘𝐨𝐮 𝐑𝐨𝐥𝐥𝐞𝐝: ${toBoldNumbers(playerRoll)}\n🤖 𝐁𝐨𝐭 𝐑𝐨𝐥𝐥𝐞𝐝: ${toBoldNumbers(botRoll)}\n`;

    if (playerRoll > botRoll) {
      // জিতলে ব্যালেন্স থেকে টাকা কাটবে না, উল্টো ২ গুণ বোনাস পাবে
      let winAmount = betAmount * 2;
      userData.money += winAmount; 
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/dice/win", { userID: senderID });
      resultMessage += `\n• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐖𝐨𝐧 ${formatMoney(winAmount)} ✨`;
    } else if (playerRoll < botRoll) {
      // হারলে ব্যালেন্স থেকে বেট এর সমপরিমাণ টাকা কেটে নেওয়া হবে
      userData.money = Math.max(0, userData.money - betAmount);
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/dice/loss", { userID: senderID });
      resultMessage += `\n• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐋𝐨𝐬𝐭 ${formatMoney(betAmount)} 🥹`;
    } else {
      resultMessage += `\n⚖ 𝐈𝐭’𝐬 𝐚 𝐓𝐢𝐞! 𝐍𝐨 𝐌𝐨𝐧𝐞𝐲 𝐋𝐨𝐬𝐭 ⚖`;
    }

    await usersData.set(senderID, userData);
    return api.sendMessage(resultMessage, threadID, messageID);
  }
};

function parseBetAmount(input) {
  if (!input) return NaN;
  input = input.toString().toLowerCase().trim();
  let multiplier = 1;
  if (input.endsWith("k")) multiplier = 1000;
  else if (input.endsWith("m")) multiplier = 1000000;
  else if (input.endsWith("b")) multiplier = 1000000000;
  let val = parseFloat(input.replace(/[kmb]/g, ""));
  return isNaN(val) ? NaN : Math.floor(val * multiplier);
}

function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}

function toBoldNumbers(number) {
  const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
  return number.toString().split("").map(c => bold[c] || c).join("");
    }
