const { getStreamsFromAttachment } = global.utils;
const mongoose = require("mongoose");

const Threads = mongoose.models.threads || mongoose.model("threads", new mongoose.Schema({}, { strict: false }));

module.exports = {
  config: {
    name: "notify",
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Send notification from admin to all groups"
    },
    longDescription: {
      en: "Send notification from admin to all groups with optional attachments"
    },
    category: "admin",
    guide: {
      en: "{pn} <message>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    en: {
      missingMessage: "Please enter the message you want to send to all groups.",
      notification: ">🎀\n𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐅𝐫𝐨𝐦 𝐀𝐝𝐦𝐢𝐧 𝐌𝐚𝐡𝐌𝐔𝐃\n──────────────────",
      sendingNotification: "🚀 Start sending notification to %1 chat groups...",
      sentNotification: "✅ Sent notification to %1 groups successfully.",
      errorSendingNotification: "⚠️ An error occurred while sending to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, getLang }) {
    const allowedUserIDs = ["61581306515651", "61587095596896", "100086629038499"];
    if (!allowedUserIDs.includes(event.senderID)) {
      return message.reply("❌ You do not have permission to use this command.");
    }

    if (!args[0]) return message.reply(getLang("missingMessage"));
    const { delayPerGroup } = envCommands[commandName];

    const formSend = {
      body: `${getLang("notification")}\n${args.join(" ")}`,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    // Fetch all groups directly from MongoDB
    const allThreads = await Threads.find({ isGroup: true, "members.userID": api.getCurrentUserID() });
    const allThreadID = allThreads.map(t => t.threadID).filter(tid => tid !== "1803867766392364" && tid !== "5210270059035725");

    message.reply(getLang("sendingNotification", allThreadID.length));

    let sendSuccess = 0;
    const sendError = [];

    for (const tid of allThreadID) {
      try {
        await api.sendMessage(formSend, tid);
        sendSuccess++;
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      } catch (e) {
        const { errorDescription } = e;
        if (!sendError.includes(errorDescription)) sendError.push(errorDescription);
      }
    }

    let msg = "";
    if (sendSuccess > 0) msg += getLang("sentNotification", sendSuccess) + "\n";
    if (sendError.length > 0) {
      msg += getLang(
        "errorSendingNotification",
        sendError.length,
        sendError.map(err => ` - ${err}`).join("\n")
      );
    }
    message.reply(msg);
  }
};
