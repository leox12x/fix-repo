const { config } = global.GoatBot;
const { client } = global;
const fs = require("fs-extra");
const mongoose = require("mongoose");

/* ===== Mongo Model ===== */
const wltSchema = new mongoose.Schema({
  tid: { type: String, unique: true },
  addedAt: { type: Number, default: Date.now }
});
const WLT = mongoose.models.wlt || mongoose.model("wlt", wltSchema);

// আপনার টার্গেট করা বেবি আইডি
const BABY_TID = "7460623087375340";

/* ===== SYNC FROM MONGO ON START ===== */
async function syncWhitelistFromMongo() {
  try {
    const data = await WLT.find({});
    config.whiteListModeThread.whiteListThreadIds = data.map(i => i.tid);
    await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
    console.log(`[WLT] Synced ${data.length} thread(s) from MongoDB`);
  } catch (e) {
    console.error("[WLT] Sync failed:", e);
  }
}
syncWhitelistFromMongo();

module.exports = {
  config: {
    name: "whitelistthread",
    aliases: ["wlt"],
    version: "1.8",
    author: "NTKhang + MahMUD",
    countDown: 5,
    role: 2,
    description: { en: "Manage whiteListThreadIds with Baby Mode (Permanent Database List)" },
    category: "admin",
    guide: {
      en:
        '{pn} add [tid]\n' +
        '{pn} remove [tid]\n' +
        '{pn} list\n' +
        '{pn} mode on/off/baby\n' +
        '{pn} mode noti on/off'
    }
  },

  langs: {
    en: {
      added: `╭─✦✅ | Added %1 thread(s)\n%2`,
      alreadyAdmin: `╭✦⚠️ | Already added %1 thread(s)\n%2`,
      removed: `╭✦✅ | Removed %1 thread(s)\n%2`,
      notAdmin: `╭✦❎ | Not found %1 thread(s)\n%2`,
      listAdmin: `╭✦✨ | Whitelisted (Database)\n%1\n╰──────────────⧕`,
      turnedOn: "✅ | Whitelist mode ON",
      turnedOff: "❎ | Whitelist mode OFF",
      turnedOnNoti: "✅ | Notification ON",
      turnedOffNoti: "❎ | Notification OFF",
      babyMode: "✅ | 𝐎𝐧𝐥𝐲 𝐛𝐚𝐛𝐲 𝐦𝐨𝐝 𝐀𝐜𝐭𝐢𝐯𝐞. 𝐍𝐨𝐰 𝐛𝐨𝐭 𝐰𝐨𝐫𝐤𝐢𝐧𝐠 𝐨𝐧𝐥𝐲 𝐁𝐚𝐛𝐲 𝐰𝐨𝐫𝐥𝐝 𝐠𝐫𝐨𝐮𝐩"
    }
  },

  onStart: async function ({ message, args, event, getLang, api }) {
    const cmd = args[0]?.toLowerCase();

    /* ===== ADD ===== */
    if (["add", "-a", "+"].includes(cmd)) {
      let tids = args.slice(1).filter(t => !isNaN(t));
      if (!tids.length) tids = [event.threadID];

      const added = [];
      const already = [];

      for (const tid of tids) {
        // ডাটাবেজে চেক করা হচ্ছে
        const exist = await WLT.findOne({ tid });
        if (!exist) {
          await WLT.create({ tid });
          // কনফিগ আপডেট
          if (!config.whiteListModeThread.whiteListThreadIds.includes(tid)) {
            config.whiteListModeThread.whiteListThreadIds.push(tid);
          }
          added.push(tid);
        } else already.push(tid);
      }

      await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));

      return message.reply(
        (added.length
          ? getLang("added", added.length, added.map(id => `╰‣ ${id}`).join("\n"))
          : "") +
        (already.length
          ? "\n" + getLang("alreadyAdmin", already.length, already.map(id => `╰‣ ${id}`).join("\n"))
          : "")
      );
    }

    /* ===== REMOVE ===== */
    if (["remove", "-r", "-"].includes(cmd)) {
      let tids = args.slice(1).filter(t => !isNaN(t));
      if (!tids.length) tids = [event.threadID];

      const removed = [];
      const notFound = [];

      for (const tid of tids) {
        const res = await WLT.deleteOne({ tid });
        if (res.deletedCount > 0) {
          // কনফিগ থেকে রিমুভ
          config.whiteListModeThread.whiteListThreadIds = config.whiteListModeThread.whiteListThreadIds.filter(id => id !== tid);
          removed.push(tid);
        } else notFound.push(tid);
      }

      await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));

      return message.reply(
        (removed.length
          ? getLang("removed", removed.length, removed.map(id => `╰‣ ${id}`).join("\n"))
          : "") +
        (notFound.length
          ? "\n" + getLang("notAdmin", notFound.length, notFound.map(id => `╰‣ ${id}`).join("\n"))
          : "")
      );
    }

    /* ===== LIST (Directly from MongoDB - No Matter the Mode) ===== */
    if (["list", "-l"].includes(cmd)) {
      const data = await WLT.find({});
      if (data.length === 0) return message.reply("❎ | No whitelisted threads found in database.");

      const list = [];
      for (const item of data) {
        let name = "Unknown Group";
        try {
          const info = await api.getThreadInfo(item.tid);
          if (info && info.threadName) name = info.threadName;
        } catch (e) {}
        list.push(`├‣ ${name}\n╰‣ ID: ${item.tid}`);
      }
      return message.reply(getLang("listAdmin", list.join("\n")));
    }

    /* ===== MODE (ON / OFF / BABY) ===== */
    if (["mode", "-m"].includes(cmd)) {
      const isNoti = args[1] === "noti";
      const status = args[isNoti ? 2 : 1]?.toLowerCase();

      if (isNoti) {
        const value = status === "on";
        config.hideNotiMessage.whiteListModeThread = !value;
      } else {
        if (status === "baby") {
          config.whiteListModeThread.enable = true;
          // কনফিগ ফাইলে শুধু বেবি আইডিটি টেম্পোরারি সেট করা হচ্ছে
          config.whiteListModeThread.whiteListThreadIds = [BABY_TID];
          await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
          return message.reply(getLang("babyMode"));
        } else if (status === "on") {
          config.whiteListModeThread.enable = true;
          // ডাটাবেজ থেকে সব আইডি কনফিগে রিকভার করা হচ্ছে
          await syncWhitelistFromMongo();
          return message.reply(getLang("turnedOn"));
        } else if (status === "off") {
          config.whiteListModeThread.enable = false;
        }
      }

      await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
      return message.reply(
        getLang(
          isNoti
            ? (status === "on" ? "turnedOnNoti" : "turnedOffNoti")
            : (status === "on" ? "turnedOn" : "turnedOff")
        )
      );
    }

    return message.reply("⚠️ Invalid usage");
  }
};
