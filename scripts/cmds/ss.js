 const axios = require("axios");

// Fetch the base API URL from your GitHub JSON
const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports.config = {
  name: "ss",
  version: "1.7",
  author: "MahMUD",
  role: 2,
  description: "Take a screenshot of a website via MahMUD API",
  category: "tools",
  guide: { en: "ss link" },
  coolDowns: 10,
};

module.exports.onStart = async function ({ api, event, args }) {

obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }
  const url = args.join(" ");
  if (!url) {
    return api.sendMessage("Please provide a URL.", event.threadID);
  }

  try {
    const apiUrl = `${await baseApiUrl()}/api/ss?url=${encodeURIComponent(url)}`;
    
    const attachment = await global.utils.getStreamFromURL(apiUrl);
    
    api.sendMessage(
      { body: "Here's your screenshot image <😘", attachment },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("Error taking screenshot:", error);
    api.sendMessage("🥹error, contact MahMUD.", event.threadID);
  }
};
