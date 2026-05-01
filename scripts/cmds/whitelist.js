const { writeFileSync } = require("fs-extra");
const mongoose = require("mongoose");

/* ===== Mongo Model ===== */
const whiteSchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  addedAt: { type: Number, default: Date.now }
});
const WhiteDB = mongoose.models.whitelist || mongoose.model("whitelist", whiteSchema);

/* ===== Bold Helpers ===== */
function toBoldNumbers(number) {
  if (!number) return "";
  const bold = { "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗" };
  return number.toString().split("").map(c => bold[c] || c).join("");
}

function toBoldUnicode(text) {
  if (!text) return ""; // FIX: Prevents crash if name is null
  const map = {
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
    k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
    u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
    K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
    U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    " ":" "
  };
  return text.toString().split("").map(c => map[c] || c).join("");
}

function boldToNormal(text) {
  if (!text) return "";
  const map = { "𝟎":"0","𝟏":"1","𝟐":"2","𝟑":"3","𝟒":"4","𝟓":"5","𝟔":"6","𝟕":"7","𝟖":"8","𝟗":"9" };
  return text.split("").map(c => map[c] || c).join("");
}

/* ===== Command ===== */
module.exports = {
  config: {
    name: "whitelist",
    aliases: ["wl"],
    version: "1.9",
    author: "MahMUD",
    countDown: 5,
    role: 2,
    category: "admin"
  },

  onStart: async function({ message, args, usersData, event, api, config }) {
    const botConfig = global.config || config || (global.GoatBot ? global.GoatBot.config : {});
    const admins = botConfig.adminBot || [];

    if (!admins.includes(event.senderID)) {
      return message.reply("❌ | You do not have permission.");
    }

    if (!botConfig.whiteListMode) botConfig.whiteListMode = { enable: false, whiteListIds: [] };
    if (!botConfig.hideNotiMessage) botConfig.hideNotiMessage = {};

    const getUIDs = async () => {
      if (Object.keys(event.mentions).length) return Object.keys(event.mentions);
      if (event.messageReply) return [event.messageReply.senderID];
      return args.slice(1).map(a => boldToNormal(a)).filter(a => /^[0-9]+$/.test(a));
    };

    switch (args[0]) {
      case "add":
      case "-a":
      case "+": {
        const uids = await getUIDs();
        if (!uids.length) return message.reply("⚠️ | Enter UID or mention user");

        const added = [], already = [];
        for (const uid of uids) {
          if (!botConfig.whiteListMode.whiteListIds.includes(uid)) {
            botConfig.whiteListMode.whiteListIds.push(uid);
            added.push(uid);
            await WhiteDB.updateOne({ uid }, { $set: { uid, addedAt: Date.now() } }, { upsert: true });
          } else already.push(uid);
        }

        writeFileSync(global.client.dirConfig, JSON.stringify(botConfig, null, 2));
        const names = await Promise.all(added.map(uid => usersData.getName(uid).then(name => ({ uid, name: name || "Unknown User" }))));
        return message.reply(
          (added.length ? `✅ | Added ${toBoldNumbers(added.length)} users:\n` + names.map(n => `├‣ 𝚄𝚂𝙴𝚁 𝙽𝙰𝙼𝙴: ${toBoldUnicode(n.name)}\n├‣ 𝚄𝚂𝙴𝚁 𝙸𝙳: ${toBoldNumbers(n.uid)}`).join("\n") : "") +
          (already.length ? `\n⚠️ | Already added ${toBoldNumbers(already.length)}:\n` + already.map(uid => `├‣ 𝚄𝚂𝙴𝚁 𝙸𝙳: ${toBoldNumbers(uid)}`).join("\n") : "")
        );
      }

      case "remove":
      case "rm":
      case "-r":
      case "-": {
        const uids = await getUIDs();
        if (!uids.length) return message.reply("⚠️ | Enter UID or mention user");

        const removed = [], notExist = [];
        for (const uid of uids) {
          if (botConfig.whiteListMode.whiteListIds.includes(uid)) {
            botConfig.whiteListMode.whiteListIds.splice(botConfig.whiteListMode.whiteListIds.indexOf(uid), 1);
            removed.push(uid);
            await WhiteDB.deleteOne({ uid });
          } else notExist.push(uid);
        }

        writeFileSync(global.client.dirConfig, JSON.stringify(botConfig, null, 2));
        const names = await Promise.all(removed.map(uid => usersData.getName(uid).then(name => ({ uid, name: name || "Unknown User" }))));
        return message.reply(
          (removed.length ? `✅ | Removed ${toBoldNumbers(removed.length)} users:\n` + names.map(n => `├‣ 𝚄𝚂𝙴𝚁 𝙽𝙰𝙼𝙴: ${toBoldUnicode(n.name)}\n├‣ 𝚄𝚂𝙴𝚁 𝙸𝙳: ${toBoldNumbers(n.uid)}`).join("\n") : "") +
          (notExist.length ? `\n⚠️ | Not in whitelist ${toBoldNumbers(notExist.length)}:\n` + notExist.map(uid => `├‣ 𝚄𝚂𝙴𝚁 𝙸𝙳: ${toBoldNumbers(uid)}`).join("\n") : "")
        );
      }

      case "list":
      case "-l": {
        const data = await Promise.all(
          botConfig.whiteListMode.whiteListIds.map(uid => 
            usersData.getName(uid).then(name => ({ uid, name: name || "Facebook User" }))
          )
        );

        if (data.length === 0) return message.reply("⚠️ | Whitelist is currently empty.");

        const listMsg = data.map((u, i) => {
          return `╭‣ ${toBoldNumbers(i + 1)}. ${toBoldUnicode(u.name)}\n╰‣ 𝐔𝐈𝐃: ${toBoldNumbers(u.uid)}`;
        }).join("\n\n");

        return message.reply(`👑 | 𝐋𝐢𝐬𝐭 𝐨𝐟 𝐖𝐡𝐢𝐭𝐞𝐥𝐢𝐬𝐭 𝐮𝐬𝐞𝐫:\n\n${listMsg}`);
      }

      case "m":
      case "mode":
      case "-m": {
        let isNoti = false;
        let valIndex = 1;
        if (args[1] == "noti") {
          isNoti = true;
          valIndex = 2;
        }

        const val = args[valIndex] == "on" ? true : args[valIndex] == "off" ? false : null;
        if (val === null) return message.reply("⚠️ | Usage: -m [on|off] or -m noti [on|off]");

        if (isNoti) {
          botConfig.hideNotiMessage.whiteListMode = !val;
          message.reply(val ? "✅ | Notification turned ON" : "❎ | Notification turned OFF");
        } else {
          botConfig.whiteListMode.enable = val;
          message.reply(val ? "✅ | Whitelist mode turned ON" : "❎ | Whitelist mode turned OFF");
        }

        writeFileSync(global.client.dirConfig, JSON.stringify(botConfig, null, 2));
        break;
      }

      default: return;
    }
  }
};

