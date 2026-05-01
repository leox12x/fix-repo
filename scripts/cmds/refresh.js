const axios = require("axios");

const getBaseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return base.data.mahmud;
  } catch (e) {
    return null;
  }
};

async function stylize(text, fontNumber = 11) {
  try {
    const apiUrl = await getBaseApiUrl();
    if (!apiUrl) return text;
    const { data: { data: fontData } } = await axios.post(`${apiUrl}/api/font`, { 
      number: fontNumber.toString(), 
      text 
    });
    const fontStyle = fontData[fontNumber];
    return text.split("").map(char => fontStyle[char] || char).join("");
  } catch (err) {
    return text;
  }
}

module.exports = {
  config: {
    name: "refresh",
    version: "1.6",
    author: "MahMUD",
    countDown: 20,
    role: 2,
    description: { en: "Refresh group or user info using Font 11" },
    category: "box chat",
    guide: {
      en: "{pn} group [ID] or {pn} user [@tag/UID]"
    }
  },

  langs: {
    en: {
      refreshMyThreadSuccess: "✅ | Group info refreshed successfully!",
      refreshThreadTargetSuccess: "✅ | Group %1 refreshed successfully!",
      refreshMyUserSuccess: "✅ | Your info refreshed!\n• Name: %1\n• UID: %2",
      refreshUserTargetSuccess: "✅ | User refreshed!\n• Name: %1\n• UID: %2"
    }
  },

  onStart: async function ({ args, threadsData, usersData, message, event, getLang }) {
    try {
      const type = args[0]?.toLowerCase() || "user";
      const FONT_STYLE = 11;

      if (type === "group" || type === "thread") {
        const targetID = args[1] || event.threadID;
        await threadsData.refreshInfo(targetID);
        const rawMsg = targetID === event.threadID
          ? getLang("refreshMyThreadSuccess")
          : getLang("refreshThreadTargetSuccess", targetID);
        return message.reply(await stylize(rawMsg, FONT_STYLE));
      }

      else if (type === "user") {
        let targetID = event.senderID;
        if (event.messageReply) targetID = event.messageReply.senderID;
        else if (Object.keys(event.mentions).length) targetID = Object.keys(event.mentions)[0];
        else if (args[1]) targetID = args[1];

        await usersData.refreshInfo(targetID);
        const user = await usersData.get(targetID);
        const userName = user?.name || "Unknown";
        const rawMsg = targetID === event.senderID
          ? getLang("refreshMyUserSuccess", userName, targetID)
          : getLang("refreshUserTargetSuccess", userName, targetID);
        return message.reply(await stylize(rawMsg, FONT_STYLE));
      }

      return message.SyntaxError();
    } catch (err) {
      return message.reply("❌ | Refresh failed.");
    }
  }
};
