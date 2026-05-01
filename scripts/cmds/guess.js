const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "guess",
        version: "3.8",
        author: "MahMUD",
        role: 0,
        countDown: 10,
        category: "game",
        guide: {
            en: "{pn} [number 1-3] [bet amount]\n{pn} rules\n{pn} rank\n{pn} list"
        }
    },

    formatMoney(num) {
        const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐"];
        let unit = 0;
        while (num >= 1000 && ++unit < units.length) num /= 1000;
        return toBoldNumbers(num.toFixed(1).replace(/\.0$/, "")) + units[unit];
    },

    onStart: async function ({ event, api, args, usersData }) {
        const { senderID, threadID, messageID } = event;
        const now = moment.tz("Asia/Dhaka");
        const today = now.format("DD/MM/YYYY");
        const maxLimit = 10;

        let userData = await usersData.get(senderID);

        // --- Daily Reset Logic ---
        if (!userData.data.guessLimit || userData.data.guessLimit.lastReset !== today) {
            userData.data.guessLimit = { count: 0, lastReset: today };
            await usersData.set(senderID, userData);
        }

        // === Rules ===
        if (args[0] && args[0].toLowerCase() === "rules") {
            return api.sendMessage(
                "🎲 𝐆𝐮𝐞𝐬𝐬 𝐆𝐚𝐦𝐞 𝐑𝐮𝐥𝐞𝐬\n\n" +
                "1⃣ {pn} [number 1-3] [bet]\n" +
                "2⃣ Correct → win 2x bet bonus.\n" +
                "3⃣ Wrong → lose bet amount.\n" +
                "4⃣ Daily Limit: 10 games.\n" +
                "5⃣ Numbers: 1 to 3.",
                threadID, messageID
            );
        }

        // === Rank & Global List (Guess API Used) ===
        if (args[0] === "list" || args[0] === "info") {
            try {
                const listRes = await axios.get("https://mahmud-infinity-api.onrender.com/api/game/guess?list=true");
                const apiStats = (listRes.data || []).filter(u => u.win > 0);

                if (args[0] === "list") {
                    if (apiStats.length === 0) return api.sendMessage("❌ | No rankings available yet.", threadID, messageID);
                    let msg = `👑 𝐆𝐮𝐞𝐬𝐬 𝐆𝐚𝐦𝐞 𝐆𝐥𝐨𝐛𝐚𝐥 𝐑𝐚𝐧𝐤𝐢𝐧𝐠:\n\n`;
                    for (let i = 0; i < Math.min(apiStats.length, 100); i++) {
                        const u = apiStats[i];
                        const name = await usersData.getName(u.userID) || u.name || `User ${u.userID}`;
                        msg += `${i + 1}. ${name}: ${u.win} Wins\n`;
                    }
                    return api.sendMessage(msg, threadID, messageID);
                } else {
                    const index = apiStats.findIndex(u => u.userID == senderID);
                    const userRes = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/guess?userID=${senderID}`);
                    const stats = userRes.data || { win: 0, loss: 0 };

                    let infoMsg = `📊 𝐆𝐮𝐞𝐬𝐬 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬 𝐟𝐨𝐫 ${userData.name}\n${"━".repeat(20)}\n`;
                    infoMsg += `• Global Rank: #${index === -1 ? "N/A" : index + 1}\n`;
                    infoMsg += `• Total Wins: ${toBoldNumbers(stats.win)}\n• Total Lost: ${toBoldNumbers(stats.loss)}\n`;
                    infoMsg += `• Daily: ${toBoldNumbers(userData.data.guessLimit.count)}/${toBoldNumbers(maxLimit)}\n${"━".repeat(20)}`;
                    return api.sendMessage(infoMsg, threadID, messageID);
                }
            } catch (e) { return api.sendMessage("❌ Error fetching statistics.", threadID, messageID); }
        }

        // === Daily Limit Check ===
        if (userData.data.guessLimit.count >= maxLimit) {
            const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
            return api.sendMessage(`🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐝𝐚𝐢𝐥𝐲 𝐥𝐢𝐦𝐢𝐭.\n𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 ${toBoldNumbers(duration.hours())}𝐡 ${toBoldNumbers(duration.minutes())}𝐦.`, threadID, messageID);
        }

        // === Game Logic ===
        const userGuess = parseInt(args[0]);
        const betAmount = parseBetAmount(args[1]);

        if (isNaN(userGuess) || userGuess < 1 || userGuess > 3)
            return api.sendMessage("❌ | Enter a number between 1-3", threadID, messageID);
        if (isNaN(betAmount) || betAmount < 1)
            return api.sendMessage("❌ | Minimum bet is 1.", threadID, messageID);
        if (betAmount > 10000000)
            return api.sendMessage("🚫 | 𝐌𝐚𝐱 𝐛𝐞𝐭 is 𝟏𝟎𝐌", threadID, messageID);
        if (userData.money < betAmount)
            return api.sendMessage("- আপনার অ্যাকাউন্ট এ পর্যাপ্ত ব্যালেন্স নেই দয়া করে রিচার্জ করুন <🥹", threadID, messageID);

        // --- Win Probability (1/3) ---
        const isWin = Math.random() < 0.33; 
        let randomNumber;

        if (isWin) {
            randomNumber = userGuess;
        } else {
            const numbers = [1, 2, 3].filter(n => n !== userGuess);
            randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        }

        userData.data.guessLimit.count += 1;

        if (userGuess === randomNumber) {
            let winBonus = betAmount * 2;
            userData.money += winBonus;
            // Win end-point changed to guess
            await axios.post("https://mahmud-infinity-api.onrender.com/api/game/guess/win", { userID: senderID });
            
            await usersData.set(senderID, userData);
            return api.sendMessage(
                `╭──────────⭓\n│• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧 ${this.formatMoney(winBonus)} 😍\n│• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: ${toBoldNumbers(randomNumber)}\n╰────────────⭓`,
                threadID, messageID
            );
        } else {
            userData.money = Math.max(0, userData.money - betAmount);
            // Loss end-point changed to guess
            await axios.post("https://mahmud-infinity-api.onrender.com/api/game/guess/loss", { userID: senderID });
            
            await usersData.set(senderID, userData);
            return api.sendMessage(
                `╭──────────⭓\n│• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 ${this.formatMoney(betAmount)} 🥺\n│• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: ${toBoldNumbers(randomNumber)}\n╰────────────⭓`,
                threadID, messageID
            );
        }
    }
};

function toBoldNumbers(number) {
  const bold = { "0": "𝟎","1": "𝟏","2": "𝟐","3": "𝟑","4": "𝟒","5": "𝟓","6": "𝟔","7": "𝟕","8": "𝟖","9": "𝟗" };
  return number.toString().split('').map(c => bold[c] || c).join('');
}

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
