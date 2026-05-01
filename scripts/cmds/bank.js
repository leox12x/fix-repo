const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  bank: { type: Number, default: 0 },
  lastInterestClaimed: { type: Date, default: Date.now },
  loan: { type: Number, default: 0 },
  loanPayed: { type: Boolean, default: true },
});

const Bank = mongoose.models.Bank || mongoose.model("Bank", bankSchema);

module.exports = {
  config: {
    name: "bank",
    version: "1.9",
    description: "Deposit, withdraw, transfer, earn interest, take or repay loans, and view top users.",
    guide: {
      en: "{pn} deposit <amount>\n{pn} withdraw <amount>\n{pn} balance\n{pn} interest\n{pn} transfer <amount> <uid>\n{pn} top\n{pn} loan <amount>\n{pn} payloan <amount>"
    },
    category: "Economy",
    countDown: 5,
    role: 0,
    author: "MahMUD",
  },

  onStart: async function ({ args, message, event, api, usersData }) {
    const commandAliases = {
      "bal": "balance",
      "-d": "deposit",
      "-w": "withdraw",
      "-i": "interest",
      "-t": "transfer",
      "-l": "loan",
      "-pl": "payloan"
    };

    const command = commandAliases[args[0]?.toLowerCase()] || args[0]?.toLowerCase();
    const amount = parseBetAmount(args[1]);
    const senderID = event.senderID;
    const senderName = await usersData.get(senderID, "name") || "User";

    let senderBankData = await Bank.findOne({ userID: senderID });
    if (!senderBankData) senderBankData = await Bank.create({ userID: senderID });

    const sendReply = (text) =>
      message.reply(`╭─ [🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n╰──‣ ${toBoldUnicode(text)}\n\n• ${toBoldUnicode(senderName)}`);

    const sendBankMenu = () => {
      const menuText = `╰‣ 𝐁𝐚𝐥𝐚𝐧𝐜𝐞\n╰‣ 𝐃𝐞𝐩𝐨𝐬𝐢𝐭\n╰‣ 𝐖𝐢𝐭𝐡𝐝𝐫𝐚𝐰\n╰‣ 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭\n╰‣ 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫\n╰‣ 𝐓𝐨𝐩\n╰‣ 𝐋𝐨𝐚𝐧\n╰‣ 𝐏𝐚𝐲𝐋𝐨𝐚𝐧\n╰‣ 𝐑𝐮𝐥𝐞𝐬`;
      message.reply(`╭─ [🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n${toBoldUnicode(menuText)}\n\n• ${toBoldUnicode(senderName)}`);
    };

    if (!command) return sendBankMenu();

    switch (command) {
      case "deposit": {
        if (isNaN(amount) || amount <= 0) return sendReply("Please enter a valid amount to deposit");
        const userMoney = await usersData.get(senderID, "money");
        if (userMoney < amount) return sendReply("You don’t have enough money to deposit");
        senderBankData.bank += amount;
        await senderBankData.save();
        await usersData.set(senderID, { money: userMoney - amount });
        return sendReply(`Successfully deposited $${formatMoney(amount)}`);
      }

      case "withdraw": {
        if (isNaN(amount) || amount <= 0) return sendReply("Please enter a valid amount to withdraw");
        if (senderBankData.bank < amount) return sendReply("You don’t have enough money in your bank");
        senderBankData.bank -= amount;
        await senderBankData.save();
        const updatedMoney = await usersData.get(senderID, "money");
        await usersData.set(senderID, { money: (updatedMoney || 0) + amount });
        return sendReply(`Withdrawn $${formatMoney(amount)}. New bank balance: $${formatMoney(senderBankData.bank)}`);
      }

      case "balance": {
        let targetID = senderID;
        if (event.type === "message_reply" && event.messageReply) {
          targetID = event.messageReply.senderID;
        } else if (event.mentions && Object.keys(event.mentions).length > 0) {
          targetID = Object.keys(event.mentions)[0];
        }

        const targetName = await usersData.get(targetID, "name") || "User";
        let targetBankData = await Bank.findOne({ userID: targetID });
        if (!targetBankData) targetBankData = await Bank.create({ userID: targetID });

        const text = (targetID === senderID)
          ? `Baby, your bank balance: $${formatMoney(targetBankData.bank)}`
          : `${targetName}'s bank balance: $${formatMoney(targetBankData.bank)}`;

        return message.reply(`╭─ [🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n╰──‣ ${toBoldUnicode(text)}\n\n• ${toBoldUnicode(senderName)}`);
      }

      case "interest": {
        const maxBankLimit = 50000000;
        const interestRate = 0.001;

        if (senderBankData.bank >= maxBankLimit) {
          return sendReply("You have reached the maximum bank limit of $50M. No interest can be earned.");
        }

        const lastClaimed = new Date(senderBankData.lastInterestClaimed).getTime();
        const timeElapsed = (Date.now() - lastClaimed) / (1000 * 60 * 60 * 24);

        if (timeElapsed < 1) return sendReply("You can only claim interest once every 24 hours");

        let interest = senderBankData.bank * interestRate * Math.floor(timeElapsed);

        if (senderBankData.bank + interest > maxBankLimit) {
          interest = maxBankLimit - senderBankData.bank;
        }

        if (interest <= 0) return sendReply("Your balance is too low to earn interest.");

        senderBankData.bank += interest;
        senderBankData.lastInterestClaimed = Date.now();
        await senderBankData.save();
        return sendReply(`You earned $${formatMoney(interest)} interest. New balance: $${formatMoney(senderBankData.bank)}`);
      }

      case "transfer": {
        let recipientID;
        if (event.mentions && Object.keys(event.mentions).length > 0) {
          recipientID = Object.keys(event.mentions)[0];
        } else if (event.messageReply && event.messageReply.senderID) {
          recipientID = event.messageReply.senderID;
        } else {
          recipientID = args[2];
        }

        if (!recipientID) return sendReply("Please mention recipient, reply, or provide UID.");
        if (recipientID === senderID) return sendReply("You cannot transfer money to yourself.");
        if (isNaN(amount) || amount <= 0) return sendReply("Please enter a valid amount to transfer.");
        if (senderBankData.bank < amount) return sendReply("You don’t have enough money to transfer.");

        let recipientBank = await Bank.findOne({ userID: recipientID });
        if (!recipientBank) recipientBank = await Bank.create({ userID: recipientID });

        senderBankData.bank -= amount;
        recipientBank.bank += amount;

        await senderBankData.save();
        await recipientBank.save();

        const recipientName = await usersData.get(recipientID, "name") || "User";
        return message.reply(
          `╭─ [🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n` +
          `╰──‣ ${toBoldUnicode("Transfer Successful!")}\n\n` +
          `• ${toBoldUnicode("From: " + senderName)}\n` +
          `• ${toBoldUnicode("To: " + recipientName)}\n` +
          `• ${toBoldUnicode("Amount: $" + formatMoney(amount))}`
        );
      }

      case "loan": {
        const maxLoanAmount = 500000;
        if (isNaN(amount) || amount <= 0) return sendReply("Please enter a valid loan amount");
        if (amount > maxLoanAmount) return sendReply(`The maximum loan amount is $${formatMoney(maxLoanAmount)}.`);
        if (!senderBankData.loanPayed && senderBankData.loan > 0) {
          return sendReply(`You cannot take a new loan until you pay off your current one.\nYour current loan: $${formatMoney(senderBankData.loan)}.`);
        }

        senderBankData.loan += amount;
        senderBankData.bank += amount;
        senderBankData.loanPayed = false;
        await senderBankData.save();
        return sendReply(`You successfully took a loan of $${formatMoney(amount)}. Please repay it soon.`);
      }

      case "payloan": {
        if (isNaN(amount) || amount <= 0) return sendReply("Please enter a valid amount to repay your loan");

        const userLoan = senderBankData.loan || 0;
        if (userLoan <= 0) return sendReply("You don't have any pending loan payments");
        if (amount > userLoan) return sendReply(`You cannot pay more than your remaining loan. Current loan: $${formatMoney(userLoan)}.`);

        const userMoney = await usersData.get(senderID, "money");
        if (amount > userMoney) return sendReply(`You don't have enough money in your wallet to repay $${formatMoney(amount)}`);

        const remainingLoan = userLoan - amount;
        senderBankData.loan = remainingLoan;
        senderBankData.loanPayed = remainingLoan === 0;
        await senderBankData.save();

        await usersData.set(senderID, { money: userMoney - amount });
        return sendReply(remainingLoan === 0
          ? `You have fully repaid your loan of $${formatMoney(amount)}!`
          : `You repaid $${formatMoney(amount)}. Remaining loan: $${formatMoney(remainingLoan)}.`);
      }

      case "rules": {
        const rulesText = `╭─ [ 🏦 𝐁𝐀𝐍𝐊 𝐑𝐔𝐋𝐄𝐒 🏦 ]\n╰‣ 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 - Check your bank balance\n• 𝐃𝐞𝐩𝐨𝐬𝐢𝐭 <amount> - Deposit money to the bank\n• 𝐖𝐢𝐭𝐡𝐝𝐫𝐚𝐰 <amount> - Withdraw money from bank\n• 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭 - Earn daily interest (Max 50M)\n• 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 <amount> <uid> - Send money to others\n• 𝐋𝐨𝐚𝐧 <amount> - Take a loan (max 500k)\n• 𝐏𝐚𝐲𝐋𝐨𝐚𝐧 <amount> - Repay your loan\n• 𝐓𝐨𝐩 - View top 15 users\n• Shorthands: 𝐤 = 1,000 | 𝐦 = 1,000,000`;
        return message.reply(`${toBoldUnicode(rulesText)}\n\n• ${toBoldUnicode(senderName)}`);
      }

      case "top": {
        const topUsers = await Bank.find().sort({ bank: -1 }).limit(15);
        const leaderboard = await Promise.all(topUsers.map(async (user, index) => {
          const topName = await usersData.get(user.userID, "name") || "User";
          const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
          return `${toBoldUnicode(rank + " " + topName + ": $" + formatMoney(user.bank))}`;
        }));
        return message.reply(`╭─ [🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n╰──‣ ${toBoldUnicode("Top 15 Bank Richest Users:")}\n${leaderboard.join("\n")}`);
      }

      default:
        return sendBankMenu();
    }
  }
};

function parseBetAmount(input) {
  if (!input || typeof input !== "string") return NaN;
  input = input.toLowerCase().trim();
  let multiplier = 1;
  if (input.endsWith("k")) multiplier = 1000;
  else if (input.endsWith("m")) multiplier = 1000000;
  else if (input.endsWith("b")) multiplier = 1000000000;
  const num = parseFloat(input.replace(/[kmb]/g, ""));
  return isNaN(num) ? NaN : Math.floor(num * multiplier);
}

function formatMoney(num) {
  // Fix: Convert input to number and handle NaN/undefined
  const n = parseFloat(num);
  if (isNaN(n)) return "0";

  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓"];
  let unit = 0;
  let val = n;

  while (Math.abs(val) >= 1000 && unit < units.length - 1) {
    val /= 1000;
    unit++;
  }
  // Fix: toFixed(1) works on the number, and parseFloat cleans trailing .0
  return parseFloat(val.toFixed(1)) + units[unit];
}

function toBoldUnicode(name) {
  const bold = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    0: "𝟎", 1: "𝟏", 2: "𝟐", 3: "𝟑", 4: "𝟒", 5: "𝟓", 6: "𝟔", 7: "𝟕", 8: "𝟖", 9: "𝟗", " ": " ", ".": ".", "-": "-", "!": "!", "?": "?"
  };
  return name.split("").map(c => bold[c] || c).join("");
}
