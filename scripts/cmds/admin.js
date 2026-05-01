const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");
const mongoose = require("mongoose");

/* ===== Mongo Model ===== */
const adminSchema = new mongoose.Schema({
  uid: { type: String, unique: true },
  addedAt: { type: Number, default: Date.now }
});
const AdminDB =
  mongoose.models.admins || mongoose.model("admins", adminSchema);

/* ===== Bold Helpers ===== */
function toBoldNumbers(number) {
  const bold = { "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗" };
  return number.toString().split("").map(c => bold[c] || c).join("");
}

function toBoldUnicode(text) {
  const map = {
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
    k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
    u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
    K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
    U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    " ":" "
  };
  return text.split("").map(c => map[c] || c).join("");
}

function boldToNormal(text) {
  const map = { "𝟎":"0","𝟏":"1","𝟐":"2","𝟑":"3","𝟒":"4","𝟓":"5","𝟔":"6","𝟕":"7","𝟖":"8","𝟗":"9" };
  return text.split("").map(c => map[c] || c).join("");
}

module.exports = {
  config: {
    name: "admin",
    version: "1.9",
    author: "MahMUD",
    role: 0,
    category: "admin"
  },

  onStart: async function ({ message, args, usersData, event }) {
    const senderID = event.senderID;

    if (["add","-a","remove","-r"].includes(args[0]) &&
        !config.adminBot.includes(senderID)) {
      return message.reply("❌ | You do not have permission.");
    }

    /* ===== ADD ===== */
    if (["add","-a"].includes(args[0])) {
      let uids = [];
      if (Object.keys(event.mentions).length)
        uids = Object.keys(event.mentions);
      else if (event.messageReply)
        uids = [event.messageReply.senderID];
      else
        uids = args.slice(1).filter(id => !isNaN(id));

      if (!uids.length) return message.reply("⚠️ | Enter UID or tag user");

      const added = [];
      const already = [];

      for (const uid of uids) {
        if (!config.adminBot.includes(uid)) {
          config.adminBot.push(uid);
          added.push(uid);

          await AdminDB.updateOne(
            { uid },
            { $set: { uid, addedAt: Date.now() } },
            { upsert: true }
          );
        } else already.push(uid);
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(
        added.map(uid => usersData.getName(uid).then(name => ({ uid, name })))
      );

      return message.reply(
        (added.length
          ? `✅ | Added ${toBoldNumbers(added.length)} admins:\n`
            + names.map(n => `• ${toBoldUnicode(n.name)} (${toBoldNumbers(n.uid)})`).join("\n")
          : ""
        )
        + (already.length
          ? `\n⚠️ | Already admin ${toBoldNumbers(already.length)}:\n`
            + already.map(uid => `• ${toBoldNumbers(uid)}`).join("\n")
          : ""
        )
      );
    }

    /* ===== REMOVE ===== */
    if (["remove","-r"].includes(args[0])) {
      let uids = args.slice(1).map(boldToNormal);
      if (!uids.length) return message.reply("⚠️ | Enter UID");

      const removed = [];
      const notAdmin = [];

      for (const uid of uids) {
        if (config.adminBot.includes(uid)) {
          config.adminBot.splice(config.adminBot.indexOf(uid), 1);
          removed.push(uid);
          await AdminDB.deleteOne({ uid });
        } else notAdmin.push(uid);
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const names = await Promise.all(
        removed.map(uid => usersData.getName(uid).then(name => ({ uid, name })))
      );

      return message.reply(
        (removed.length
          ? `✅ | Removed ${toBoldNumbers(removed.length)} admins:\n`
            + names.map(n => `• ${toBoldUnicode(n.name)} (${toBoldNumbers(n.uid)})`).join("\n")
          : ""
        )
        + (notAdmin.length
          ? `\n⚠️ | Not admin ${toBoldNumbers(notAdmin.length)}:\n`
            + notAdmin.map(uid => `• ${toBoldNumbers(uid)}`).join("\n")
          : ""
        )
      );
    }

    /* ===== LIST ===== */
    if (["list","-l"].includes(args[0])) {
      const data = await Promise.all(
        config.adminBot.map(uid =>
          usersData.getName(uid).then(name => ({ uid, name }))
        )
      );

      return message.reply(
        `👑 | 𝐋𝐢𝐬𝐭 𝐨𝐟 𝐚𝐝𝐦𝐢𝐧𝐬: ${toBoldNumbers(data.length)}\n\n`
        + data.map(
            (u,i) =>
              `╭‣ ${toBoldNumbers(i+1)}. ${toBoldUnicode(u.name)}\n╰‣ 𝐔𝐈𝐃: ${toBoldNumbers(u.uid)}`
          ).join("\n\n")
      );
    }

    return message.SyntaxError();
  }
};
