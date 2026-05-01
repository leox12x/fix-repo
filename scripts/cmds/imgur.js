const axios = require("axios");

const getBase = async () => {
    const res = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return res.data.mahmud;
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
    config: {
        name: "imgur",
        version: "1.7",
        author: "MahMUD",
        countDown: 10,
        role: 0,
        category: "tools",
        guide: { en: "{pn} [reply to media]" }
    },

    onStart: async function ({ api, event, message }) {
          const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
          if (module.exports.config.author !== obfuscatedAuthor) {
          return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
       }
        
        if (event.type !== "message_reply" || !event.messageReply.attachments.length) {
           return message.reply("🐤 | Please reply to a media file image video mp4.");
        }

        try {  
            api.setMessageReaction("⌛", event.messageID, () => {}, true);  

            const attachmentUrl = encodeURIComponent(event.messageReply.attachments[0].url);
            const baseUrl = await getBase();
            const apiUrl = `${baseUrl.replace(/\/$/, "")}/api/imgur?url=${attachmentUrl}`;  
            const response = await axios.get(apiUrl, { timeout: 100000 });
            
            if (response.data.status && response.data.link) {
                message.reply({  
                    body: response.data.link
                }, () => {  
                    api.setMessageReaction("✅", event.messageID, () => {}, true);  
                });
            } else {
                throw new Error("API status false");
            }

        } catch (e) {  
            console.error(e);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            message.reply("🥺 error, contact MahMUD");  
        }
    }
};
