const axios = require("axios");
const moment = require("moment-timezone");

function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  const formattedNum = (num % 1 === 0 ? num : num.toFixed(1));
  return toBoldNumbers(formattedNum) + units[unit];
}

function toBoldNumbers(number) {
  const bold = { 
    "0": "𝟎","1": "𝟏","2": "𝟐","3": "𝟑","4": "𝟒","5": "𝟓","6": "𝟔","7": "𝟕","8": "𝟖","9": "𝟗", ".": "." 
  };
  return number.toString().split('').map(c => bold[c] || c).join('');
}

function toBoldText(text) {
  const fonts = {
    "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣", "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭", "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳",
    "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍", "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙"
  };
  return text.split('').map(c => fonts[c] || c).join('');
}

function parseBetAmount(input) {
  if (!input) return NaN;
  input = input.toString().toLowerCase().trim();
  let multiplier = 1;
  if (input.endsWith("k")) { multiplier = 1000; input = input.replace("k", ""); }
  else if (input.endsWith("m")) { multiplier = 1000000; input = input.replace("m", ""); }
  else if (input.endsWith("b")) { multiplier = 1000000000; input = input.replace("b", ""); }
  const num = parseFloat(input);
  if (isNaN(num) || num <= 0) return NaN;
  return Math.floor(num * multiplier);
}

module.exports = {
  config: {
    name: "sicbo",
    version: "2.2",
    author: "MahMUD",
    role: 0,
    category: "game",
    guide: {
      en: "{pn} <small/big> <amount>\n{pn} list — leaderboard\n{pn} info — stats"
    }
  },

  onStart: async function ({ args, message, usersData, event }) {
    const { senderID } = event;
    let userData = await usersData.get(senderID);
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const maxlimit = 10;

    if (!userData.data.sicbos || userData.data.sicbos.lastReset !== today) {
      userData.data.sicbos = { count: 0, lastReset: today };
      await usersData.set(senderID, userData);
    }

    if (args[0] === "list" || args[0] === "info" || args[0] === "rank") {
      try {
        const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/sicbo?list=true");
        const apiStats = (listRes.data || []).filter(u => u.win > 0);

        if (args[0] === "list") {
          if (apiStats.length === 0) return message.reply(toBoldText("❌ | No rankings with wins yet."));
          let msg = `👑 ${toBoldText("Global Sicbo Ranking")}:\n\n`;
          for (let i = 0; i < Math.min(apiStats.length, 15); i++) {
            const u = apiStats[i];
            const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
            msg += `${toBoldNumbers(i + 1)}. ${name}: ${toBoldNumbers(u.win)} ${toBoldText("Wins")}\n`;
          }
          return message.reply(msg);
        } else {
          const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/sicbo?userID=${senderID}`);
          const stats = userRes.data || { win: 0, loss: 0 };
          const index = apiStats.findIndex(u => u.userID == senderID);

          let infoMsg = `📊 ${toBoldText("𝐒𝐢𝐜𝐛𝐨 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 𝐟𝐨𝐫")} ${userData.name}\n${"━".repeat(15)}\n`;
          infoMsg += `• ${toBoldText("Global Rank")}: #${index === -1 ? "𝐍/𝐀" : toBoldNumbers(index + 1)}\n`;
          infoMsg += `• ${toBoldText("Total Wins")}: ${toBoldNumbers(stats.win)}\n`;
          infoMsg += `• ${toBoldText("Total Lost")}: ${toBoldNumbers(stats.loss)}\n`;
          infoMsg += `• ${toBoldText("Daily")}: ${toBoldNumbers(userData.data.sicbos.count)}/${toBoldNumbers(maxlimit)}\n${"━".repeat(15)}`;
          return message.reply(infoMsg);
        }
      } catch (e) { return message.reply(toBoldText("❌ Error fetching global stats.")); }
    }

    if (userData.data.sicbos.count >= maxlimit) {
      const left = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
      return message.reply(toBoldText(`❌ | Limit reached. Try again in ${left.hours()}h ${left.minutes()}m.`));
    }

    const betType = args[0]?.toLowerCase();
    const betAmount = parseBetAmount(args[1]);
    if (!["small", "big"].includes(betType)) return message.reply(toBoldText("❌ | Choose 'small' or 'big'."));
    if (!Number.isInteger(betAmount) || betAmount < 50) return message.reply(toBoldText("❌ | Minimum bet is 50."));
    
    // Max Bet Check (10M)
    if (betAmount > 10000000) return message.reply(toBoldText("🚫 | 𝐌𝐚𝐱 𝐛𝐞𝐭 𝐢𝐬 𝟏𝟎𝐌"));
    
    if (betAmount > userData.money) return message.reply(toBoldText("- আপনার অ্যাকাউন্ট এ পর্যাপ্ত ব্যালেন্স নেই দয়া করে রিচার্জ করুন 🥹"));

    userData.data.sicbos.count++;
    
    const dice = [0, 0, 0].map(() => Math.floor(Math.random() * 6) + 1);
    const resultString = dice.map(toBoldNumbers).join(" | ");
    const playerWins = Math.random() < 0.1;

    if (playerWins) {
      const winAmount = betAmount * 2;
      userData.money += betAmount; 
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/sicbo/win", { userID: senderID });
      await usersData.set(senderID, userData);
      return message.reply(`(\\_/) \n( •_•) \n/ >🎀 [ ${resultString} ]\n\n😍 | ${toBoldText("𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧")} ${formatMoney(winAmount)}!`);
    } else {
      userData.money = Math.max(0, userData.money - betAmount);
      await axios.post("https://mahmud-infinity-api.onrender.com/api/game/sicbo/loss", { userID: senderID });
      await usersData.set(senderID, userData);
      return message.reply(`(\\_/) \n( •_•) \n/ >🎀 [ ${resultString} ]\n\n🥹 | ${toBoldText("𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭")} ${formatMoney(betAmount)}.`);
    }
  },
};
