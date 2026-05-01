const mongoose = require("mongoose");
const axios = require("axios");
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  usageCount: { type: Number, default: 0 },
});

const slotDatabaseSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  winCount: { type: Number, default: 0 },
  lossCount: { type: Number, default: 0 },
  dailyWin: { type: Number, default: 0 },
  dailyLoss: { type: Number, default: 0 },
  dailyProfit: { type: Number, default: 0 }
});

const UserUsage = mongoose.models.UserUsage || mongoose.model("UserUsage", userSchema);
const SlotDatabase = mongoose.models.SlotDatabase || mongoose.model("SlotDatabase", slotDatabaseSchema);

module.exports = {
  config: {
    name: "slot",
    version: "2.4",
    author: "MahMUD",
    countDown: 20,
    shortDescription: { en: "Slot game" },
    longDescription: { en: "Slot game with win rate display and jackpots." },
    category: "game",
  },
  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to have a chance to win double",
      not_enough_money: "𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐟 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐭𝐡𝐚𝐭 𝐚𝐦𝐨𝐮𝐧𝐭",
      spin_message: "Spinning...",
      spin_count: ">🎀",
      win_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1",
      lose_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 $%1",
      rare_jackpot: "• 𝐑𝐚𝐫𝐞 𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬, 𝐁𝐚𝐛𝐲!",
      medium_jackpot: "• 𝐌𝐞𝐝𝐢𝐮𝐦 𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬, 𝐁𝐚𝐛𝐲!",
      mini_jackpot: "• 𝐌𝐢𝐧𝐢 𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬, 𝐁𝐚𝐛𝐲!",
      wrong_use_message: "❌ | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐧𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐚𝐬 𝐲𝐨𝐮𝐫 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭.",
      time_left_message: "• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐬𝐥𝐨𝐭 𝐥𝐢𝐦𝐢𝐭, 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 %1𝐡 %2𝐦 𝐥𝐚𝐭𝐞𝐫 <🥹",
      max_bet_exceeded: "❌ | The maximum bet amount is 10M.",
    },
  },
  onStart: async function ({ args, message, event, usersData, getLang, api }) {
    const { senderID, threadID, messageID } = event;

    // --- Leaderboard & Info logic remains same ---
    if (args[0] === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 100;
      const skip = (page - 1) * perPage;
      const total = await SlotDatabase.countDocuments();
      const pages = Math.ceil(total / perPage);
      if (page > pages || page <= 0) return api.sendMessage(`❌ | Invalid page number!`, threadID, messageID);
      const stats = await SlotDatabase.find().sort({ winCount: -1 }).skip(skip).limit(perPage);
      let msg = `👑 𝐒𝐥𝐨𝐭 𝐆𝐚𝐦𝐞 𝐑𝐚𝐧𝐤𝐢𝐧𝐠𝐬:\n\n`;
      for (let i = 0; i < stats.length; i++) {
        const name = await usersData.getName(stats[i].userID);
        msg += `${toBoldNumbers(skip + i + 1)}. ${toBoldUnicode(name)}: 𝐖𝐢𝐧𝐬 ${toBoldNumbers(stats[i].winCount)}\n`;
      }
      return api.sendMessage(msg.trim(), threadID, messageID);
    }

    if (args[0] === "info") {
      const allStats = await SlotDatabase.find().sort({ winCount: -1, lossCount: 1 });
      const rank = allStats.findIndex(entry => entry.userID === senderID) + 1;
      if (rank === 0) return api.sendMessage("❌ | You haven't played yet!", threadID, messageID);
      const myStats = allStats[rank - 1];
      const userName = await usersData.getName(senderID);
      const userData = await usersData.get(senderID);
      const dailyLimit = userData.data?.slots?.count || 0;
      const profitFormatted = (myStats.dailyProfit > 0 ? "+" : "") + formatMoney(myStats.dailyProfit || 0);
      const msg = `# 𝐒𝐋𝐎𝐓 𝐑𝐀𝐍𝐊 𝐈𝐍𝐅𝐎\n• 𝐑𝐚𝐧𝐤: #${toBoldNumbers(rank)}\n• 𝐖𝐢𝐧𝐬: ${toBoldNumbers(myStats.winCount)}\n• 𝐋𝐨𝐬𝐭: ${toBoldNumbers(myStats.lossCount)}\n• 𝐓𝐨𝐭𝐚𝐥 𝐏𝐥𝐚𝐲: ${toBoldNumbers(myStats.winCount + myStats.lossCount)}\n \n# 𝐒𝐋𝐎𝐓 𝐃𝐀𝐈𝐋𝐘 𝐈𝐍𝐅𝐎\n• 𝐃𝐚𝐢𝐥𝐲 𝐖𝐢𝐧: ${toBoldNumbers(myStats.dailyWin || 0)}\n• 𝐃𝐚𝐢𝐥𝐲 𝐥𝐨𝐬𝐭: ${toBoldNumbers(myStats.dailyLoss || 0)}\n• 𝐃𝐚𝐢𝐥𝐲 𝐏𝐫𝐨𝐟𝐢𝐭: ${profitFormatted}\n• 𝐃𝐚𝐢𝐥𝐲 𝐥𝐢𝐦𝐢𝐭: ${toBoldNumbers(dailyLimit)}/${toBoldNumbers(20)}\n\n•${toBoldUnicode(userName)}`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // --- Reset & Limit Logic ---
    const maxlimit = 20;
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");
    const userData = await usersData.get(senderID);

    if (!userData.data.slots || userData.data.slots.lastReset !== today) {
        userData.data.slots = { count: 0, lastReset: today };
        await usersData.set(senderID, userData);
        await SlotDatabase.findOneAndUpdate({ userID: senderID }, { dailyWin: 0, dailyLoss: 0, dailyProfit: 0 }, { upsert: true });
    }

    if (userData.data.slots.count >= maxlimit) {
      const endOfDay = moment.tz("Asia/Dhaka").endOf('day');
      const duration = moment.duration(endOfDay.diff(now));
      return api.sendMessage(getLang("time_left_message", toBoldNumbers(duration.hours()), toBoldNumbers(duration.minutes())), threadID, messageID);
    }

    // --- Betting ---
    if (!args[0]) return api.sendMessage(getLang("wrong_use_message"), threadID, messageID);
    const amount = parseBetAmount(args[0]);
    if (isNaN(amount) || amount <= 0) return api.sendMessage(getLang("wrong_use_message"), threadID, messageID);
    if (amount > 10000000) return api.sendMessage(getLang("max_bet_exceeded"), threadID, messageID);
    if (userData.money < amount) return api.sendMessage(getLang("not_enough_money"), threadID, messageID);

    // --- Spinning ---
    const slots = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];
    const winnings = calculateWinnings(slot1, slot2, slot3, amount);
    
    // --- Update Data ---
    userData.money += winnings;
    userData.data.slots.count += 1;
    await usersData.set(senderID, userData);

    let slotStats = await SlotDatabase.findOne({ userID: senderID }) || new SlotDatabase({ userID: senderID });
    if (winnings > 0) {
      slotStats.winCount += 1;
      slotStats.dailyWin += 1;
    } else {
      slotStats.lossCount += 1;
      slotStats.dailyLoss += 1;
    }
    slotStats.dailyProfit = (slotStats.dailyProfit || 0) + winnings;
    await slotStats.save();

    // --- Calculate Win Rate Today ---
    const totalDailyGames = userData.data.slots.count;
    const dailyWins = slotStats.dailyWin;
    const winRate = ((dailyWins / totalDailyGames) * 100).toFixed(1);

    // --- Final Message Construction ---
    const messageResult = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang);
    const winRateText = `🎯 𝐖𝐢𝐧 𝐑𝐚𝐭𝐞 𝐓𝐨𝐝𝐚𝐲: ${toBoldNumbers(winRate)}% (${toBoldNumbers(dailyWins)}/${toBoldNumbers(totalDailyGames)})`;
    
    return message.reply(`${getLang("spin_count")}\n${messageResult}\n\n${winRateText}`);
  },
};

// --- Helpers ---
function calculateWinnings(s1, s2, s3, bet) {
  if (s1 === "❤" && s2 === "❤" && s3 === "❤") return bet * 10;
  if (s1 === "💜" && s2 === "💜" && s3 === "💜") return bet * 5;
  if (s1 === s2 && s2 === s3) return bet * 3;
  if (s1 === s2 || s1 === s3 || s2 === s3) return bet * 2;
  return -bet;
}

function getSpinResultMessage(s1, s2, s3, win, getLang) {
  const res = `• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: [ ${s1} | ${s2} | ${s3} ]`;
  if (win > 0) {
    let mainMsg = "";
    if (s1 === "❤" && s2 === "❤" && s3 === "❤") mainMsg = getLang("rare_jackpot", formatMoney(win), "❤");
    else if (s1 === "💜" && s2 === "💜" && s3 === "💜") mainMsg = getLang("medium_jackpot", formatMoney(win), "💜");
    else if (s1 === s2 && s2 === s3) mainMsg = getLang("mini_jackpot", formatMoney(win), s1);
    else mainMsg = getLang("win_message", formatMoney(win));
    return `${mainMsg}\n${res}`;
  }
  return `${getLang("lose_message", formatMoney(-win))}\n${res}`;
}

function toBoldNumbers(n) {
  const b = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗", ".": "." };
  return n.toString().split('').map(c => b[c] || c).join('');
}

function toBoldUnicode(t) {
  const b = {"a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣","k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭","u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳","A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉","K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓","U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙"," ":" ","'":"'",",":",",".":".","-":"-"};
  return t.split('').map(c => b[c] || c).join('');
}

function formatMoney(num) {
  const isNegative = num < 0;
  num = Math.abs(num);
  const units = ["","𝐊","𝐌","𝐁","𝐓"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) { num /= 1000; unit++; }
  let formatted = toBoldNumbers(Number(num.toFixed(1))) + units[unit];
  return (isNegative ? "-" : "") + formatted;
}

function parseBetAmount(input) {
  input = input.toLowerCase().trim();
  let m = 1;
  if (input.endsWith("k")) { m = 1000; input = input.replace("k",""); }
  else if (input.endsWith("m")) { m = 1000000; input = input.replace("m",""); }
  else if (input.endsWith("b")) { m = 1000000000; input = input.replace("b",""); }
  const n = parseFloat(input);
  return (isNaN(n) || n <= 0) ? NaN : Math.floor(n * m);
}
