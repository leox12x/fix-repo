const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

const Threads = require("mongoose").models.threads || require("mongoose").model("threads", new require("mongoose").Schema({}, { strict: false }));

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "MahMUD",
    category: "events"
  },

  langs: {
    en: {
      session1: "𝗲𝗮𝗿𝗹𝘆 𝗺𝗼𝗿𝗻𝗶𝗻𝗴",
      session2: "𝗺𝗼𝗿𝗻𝗶𝗻𝗴",
      session3: "𝗮𝗳𝘁𝗲𝗿𝗻𝗼𝗼𝗻",
      session4: "𝗲𝘃𝗲𝗻𝗶𝗻𝗴",
      session5: "𝗻𝗶𝗴𝗵𝘁",
      session6: "𝗺𝗶𝗱𝗻𝗶𝗴𝗵𝘁",
      session7: "𝗹𝗮𝘁𝗲 𝗻𝗶𝗴𝗵𝘁",
      welcomeMessage: "🎀\n𝐁𝐚𝐛𝐲, 𝐓𝐡𝐚𝐧𝐤𝐬 𝐟𝐨𝐫 𝐢𝐧𝐯𝐢𝐭𝐢𝐧𝐠 𝐦𝐞 𝐀𝐥𝐰𝐚𝐲𝐬 𝐦𝐲 𝐏𝐫𝐞𝐟𝐢𝐱: %1\n𝐓𝐲𝐩𝐞 %1help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐚 𝐌𝐚𝐬𝐭𝐞𝐫𝐩𝐢𝐞𝐜𝐞 𝐌𝐞𝐬𝐬𝐞𝐧𝐠𝐞𝐫 𝐁𝐨𝐭 𝐦𝐚𝐝𝐞 𝐛𝐲 𝐌𝐚𝐡𝐌𝐔𝐃.\n\n•𝐟𝐢𝐧𝐝 𝐚𝐧𝐲 𝐢𝐬𝐬𝐮𝐞 𝐨𝐫 𝐛𝐮𝐠 𝐭𝐡𝐞𝐧 𝐃𝐢𝐫𝐞𝐜𝐭 𝐜𝐨𝐧𝐭𝐚𝐜𝐭 𝐦𝐲 𝐚𝐝𝐦𝐢𝐧.\n𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: 01836298139",      
      multiple1: "𝘆𝗼𝘆",
      multiple2: "𝘆𝗼𝘂 𝗴𝘂𝘆𝘀",
      defaultWelcomeMessage: `🥰 𝗔𝗦𝗦𝗔𝗟𝗔𝗠𝗨𝗟𝗔𝗜𝗞𝗨𝗠 🥰

>🎀 {userName}
𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘆𝗼𝘂 𝘁𝗼 𝗼𝘂𝗿
𝗚𝗿𝗼𝘂𝗽.
𝗛𝗮𝘃𝗲 𝗮 𝗻𝗶𝗰𝗲 {session} 😊
⚠ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗳𝗼𝗹𝗹𝗼𝘄 𝗮𝗹𝗹 𝗿𝘂𝗹𝗲𝘀♻

• 𝐀𝐝𝐦𝐢𝐧: 𝗠𝗮𝗵𝗠𝗨𝗗
• 𝐖𝐏: 01836298139`
    }
  },

  onStart: async ({ message, event, api, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const hours = getTime("HH");
    const threadID = event.threadID;
    const prefix = global.utils.getPrefix(threadID);
    const addedParticipants = event.logMessageData.addedParticipants;

    // Bot joined
    if (addedParticipants.some(p => p.userFbId == api.getCurrentUserID())) {
      if (global.GoatBot?.config?.nickNameBot)
        api.changeNickname(global.GoatBot.config.nickNameBot, threadID, api.getCurrentUserID());
      return message.send(getLang("welcomeMessage", prefix));
    }

    if (!global.temp.welcomeEvent[threadID]) {
      global.temp.welcomeEvent[threadID] = {
        joinTimeout: null,
        dataAddedParticipants: []
      };
    }

    global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...addedParticipants);
    clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

    global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
      const threadData = await Threads.findOne(
        { threadID },
        { threadName: 1, data: 1, settings: 1 }
      );
      if (threadData?.settings?.sendWelcomeMessage === false) return;

      const participants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
      const mentions = participants.map(p => ({ tag: p.fullName, id: p.userFbId }));
      if (mentions.length === 0) return;

      let welcomeMessage = threadData.data?.welcomeMessage || getLang("defaultWelcomeMessage");
      welcomeMessage = welcomeMessage
        .replace(/\{userName\}|\{userNameTag\}/g, mentions.map(m => m.tag).join(", "))
        .replace(/\{boxName\}|\{threadName\}/g, threadData.threadName)
        .replace(/\{multiple\}/g, participants.length > 1 ? getLang("multiple2") : getLang("multiple1"))
        .replace(/\{session\}/g,
          hours < 4 ? getLang("session7") :
          hours < 6 ? getLang("session1") :
          hours < 12 ? getLang("session2") :
          hours < 16 ? getLang("session3") :
          hours < 20 ? getLang("session4") :
          hours < 24 ? getLang("session5") :
          getLang("session6")
        );

      const form = { body: welcomeMessage, mentions };

      // Lazy load attachments
      if (threadData.data?.welcomeAttachment?.length) {
        form.attachment = [];
        for (const file of threadData.data.welcomeAttachment) {
          drive.getFile(file, "stream").then(f => f && form.attachment.push(f));
        }
      }

      message.send(form);
      delete global.temp.welcomeEvent[threadID];
    }, 500); // Faster debounce
  }
};
