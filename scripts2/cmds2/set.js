const mongoose = require("mongoose");

// Bank Model
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
    name: "set",
    version: "5.0",
    author: "MahMUD",
    role: 0,
    shortDescription: { en: "Directly set coins, exp, bank, or counts" },
    longDescription: { en: "Set money, exp, bank, or message counts. Support custom ThreadID for count." },
    category: "owner",
    guide: { 
      en: "{pn} [money|exp|count|bank] [amount] [uid/mention/reply]\nCustom Thread: {pn} count [amount] [ThreadID] [UserID]" 
    }
  },

  parseAmount(input) {
    if (!input) return NaN;
    input = String(input).toLowerCase().trim();
    let multiplier = 1;
    if (input.endsWith("k")) multiplier = 1e3;
    else if (input.endsWith("m")) multiplier = 1e6;
    else if (input.endsWith("b")) multiplier = 1e9;
    const num = parseFloat(input.replace(/[kmb]/g, ""));
    return isNaN(num) ? NaN : Math.floor(num * multiplier);
  },

  formatAmount(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "b";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "m";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
    return num.toString();
  },

  onStart: async function ({ args, event, api, usersData, threadsData }) {
    const allowedUserIDs = ["61587095596896", "61580682368883"];
    const { threadID: currentThreadID, messageID, senderID, mentions, type, messageReply } = event;

    if (!allowedUserIDs.includes(senderID)) {
      return api.sendMessage(`>🎀\n𝐓𝐡𝐞 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐝𝐨𝐞𝐬 𝐧𝐨𝐭 𝐞𝐱𝐢𝐬𝐭, 𝐭𝐲𝐩𝐞 𝐡𝐞𝐥𝐩 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`, currentThreadID, messageID);
    }

    const typeToSet = args[0]?.toLowerCase(); 
    const amount = this.parseAmount(args[1]);

    if (!['money', 'exp', 'count', 'bank'].includes(typeToSet) || isNaN(amount)) {
      return api.sendMessage(`⚠️ | Invalid usage.\nGuide: set [money|exp|count|bank] [amount]`, currentThreadID, messageID);
    }

    // --- Special Logic for Custom ThreadID and UserID ---
    if (typeToSet === 'count' && args.length === 4) {
      const targetThreadID = args[2];
      const targetUserID = args[3];
      
      try {
        let members = await threadsData.get(targetThreadID, "members");
        let user = members?.find(u => u.userID == targetUserID);
        
        if (user) {
          user.count = amount;
          await threadsData.set(targetThreadID, members, "members");
          return api.sendMessage(`✅ | Successfully set count to ${this.formatAmount(amount)} for UID: ${targetUserID} in Thread: ${targetThreadID}`, currentThreadID, messageID);
        } else {
          return api.sendMessage(`❌ | User not found in that Thread.`, currentThreadID, messageID);
        }
      } catch (e) {
        return api.sendMessage(`❌ | Error accessing Thread: ${targetThreadID}`, currentThreadID, messageID);
      }
    }

    // --- Default Target Selection ---
    let targetUsers = [];
    if (type === "message_reply") targetUsers.push(messageReply.senderID);
    else if (Object.keys(mentions).length > 0) targetUsers = Object.keys(mentions);
    else if (args.length > 2) targetUsers = args.slice(2);
    else targetUsers.push(senderID);

    let successCount = 0;
    let errorList = [];

    for (const uid of targetUsers) {
      try {
        if (typeToSet === 'count') {
          let members = await threadsData.get(currentThreadID, "members");
          let user = members?.find(u => u.userID == uid);
          if (user) {
            user.count = amount;
            await threadsData.set(currentThreadID, members, "members");
            successCount++;
          } else { errorList.push(`${uid} (Not in group)`); }

        } else if (typeToSet === 'bank') {
          let userBankData = await Bank.findOne({ userID: uid });
          if (!userBankData) {
            await Bank.create({ userID: uid, bank: amount });
          } else {
            userBankData.bank = amount;
            await userBankData.save();
          }
          successCount++;

        } else {
          const uData = await usersData.get(uid);
          if (uData) {
            await usersData.set(uid, { [typeToSet]: amount });
            successCount++;
          } else { errorList.push(uid); }
        }
      } catch (e) {
        errorList.push(uid);
      }
    }

    const formattedAmount = this.formatAmount(amount);
    let response = `✅ | Successfully set ${typeToSet} to ${formattedAmount} for ${successCount} user(s).`;
    if (errorList.length > 0) response += `\n❌ Errors: ${errorList.join(", ")}`;

    return api.sendMessage(response, currentThreadID, messageID);
  }
};
