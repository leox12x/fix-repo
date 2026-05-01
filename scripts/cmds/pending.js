const { config } = global.GoatBot;
const { client } = global;
const fs = require("fs-extra");
const mongoose = require("mongoose");

// Mongo Model (whitelistthread কমান্ডের সাথে মিল রেখে)
const wltSchema = new mongoose.Schema({
  tid: { type: String, unique: true },
  addedAt: { type: Number, default: Date.now }
});
const WLT = mongoose.models.wlt || mongoose.model("wlt", wltSchema);

const allowedThreadID = "7460623087375340"; // Bot Support Group ID
const specialUID = "61581306515651"; // Special User ID

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "approve"],
    version: "1.8",
    author: "Mah MUD + Gemini",
    countDown: 10,
    role: 2,
    category: "utility"
  },

  onReply: async function ({ message, api, event, Reply, usersData }) {
    const { author, pending } = Reply;
    const { body, threadID, messageID, senderID } = event;

    if (senderID !== specialUID && threadID !== allowedThreadID) {
      return api.sendMessage(
        "❌ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐫𝐨𝐮𝐩 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.",
        threadID,
        messageID
      );
    }

    if (String(senderID) !== String(author) && senderID !== specialUID) return;

    let count = 0;
    const index = body.split(/\s+/);

    for (const singleIndex of index) {
      const idx = parseInt(singleIndex);
      if (isNaN(idx) || idx <= 0 || idx > pending.length) continue;

      const targetThread = pending[idx - 1].threadID;

      try {
        // ১. MongoDB তে অ্যাড করা
        const exist = await WLT.findOne({ tid: targetThread });
        if (!exist) {
          await WLT.create({ tid: targetThread });
        }

        // ২. কনফিগ ফাইলে অ্যাড করা (Runtime whitelist এর জন্য)
        if (!config.whiteListModeThread.whiteListThreadIds.includes(targetThread)) {
          config.whiteListModeThread.whiteListThreadIds.push(targetThread);
          await fs.writeFile(client.dirConfig, JSON.stringify(config, null, 2));
        }

        // ৩. গ্রুপে মেসেজ পাঠানো
        api.changeNickname(`𝙔𝙤𝙪𝙧 𝙗𝙖𝙗𝙮 め`, targetThread, api.getCurrentUserID());
        
        api.sendMessage({
          body: "•𝐁𝐨𝐭 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 ✅\n•𝐀𝐝𝐦𝐢𝐧: 𝐌𝐚𝐡𝐌𝐔𝐃\n\n•𝐓𝐲𝐩𝐞 !help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐞𝐧𝐣𝐨𝐲 𝐨𝐮𝐫 𝐌𝐚𝐬𝐭𝐞𝐫𝐩𝐢𝐞𝐜𝐞 𝐛𝐨𝐭."
        }, targetThread);

        const approvedByName = await usersData.getName(senderID);
        api.sendMessage(`✅ | 𝐆𝐫𝐨𝐮𝐩 𝐚𝐩𝐩𝐫𝐨𝐯𝐞𝐝 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐛𝐲 ${approvedByName}`, targetThread);

        count++;
      } catch (err) {
        console.error(`[Pending] Error approving ${targetThread}:`, err);
      }
    }

    api.unsendMessage(messageID);
    return message.reply(`✅ | 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐚𝐩𝐩𝐫𝐨𝐯𝐞𝐝 ${count} 𝐭𝐡𝐫𝐞𝐚𝐝(𝐬).`);
  },

  onStart: async function ({ message, api, event }) {
    const { threadID, messageID, senderID } = event;
    const commandName = this.config.name;

    if (senderID !== specialUID && threadID !== allowedThreadID) {
      return api.sendMessage(
        "❌ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐫𝐨𝐮𝐩 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.",
        threadID,
        messageID
      );
    }

    let msg = "", index = 1;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      if (list.length === 0) return message.reply("There are currently no groups in the queue");

      for (const single of list) {
        msg += `│${index++}. ${single.name || "Unknown"}\n│𝐓𝐈𝐃: ${single.threadID}\n`;
      }

      return api.sendMessage(
        `╭─╮\n│𝐓𝐨𝐭𝐚𝐥 𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐠𝐫𝐨𝐮𝐩: ${list.length} \n${msg}╰───────────ꔪ\n\n• 𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐭𝐡𝐞 𝐨𝐫𝐝𝐞𝐫 𝐧𝐮𝐦𝐛𝐞𝐫 𝐛𝐞𝐥𝐨𝐰 𝐭𝐨 𝐚𝐩𝐩𝐫𝐨𝐯𝐞`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );
    } catch (e) {
      return api.sendMessage("[ ERR ] Can't get the pending list", threadID, messageID);
    }
  }
};
