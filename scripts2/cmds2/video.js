const axios = require("axios");
const fs = require('fs');
const path = require('path');

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json`);
    return base.data.mahmud; 
};

/**
* @author MahMUD
* @author: do not delete it
*/

module.exports = {
    config: {
        name: "video",
        version: "1.7",
        author: "MahMUD",
        countDown: 10,
        category: "media",
        cost: 1000,
        guide: { en: "{pn} <name or link>" }
    },

    onStart: async ({ api, args, event, usersData }) => {
        const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68); 
        if (module.exports.config.author !== obfuscatedAuthor) {
        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
      }
        
        const { threadID, messageID } = event;
        if (!args[0]) return api.sendMessage("❌ Baby, Please provide a video name or link.\n\nExample !Video mood lofi ", threadID, messageID);
        try { api.setMessageReaction("🐤", messageID, () => {}, true); } catch (e) {}
        const apiUrl = await baseApiUrl();
        const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
        let videoID;

        try {
            if (checkurl.test(args[0])) {
                videoID = args[0].match(checkurl)[1];
            } else {
                const keyWord = args.join(" ");
                const searchRes = await axios.get(`${apiUrl}/api/video/search?songName=${encodeURIComponent(keyWord)}`);
                const results = searchRes.data;

                if (!results || results.length === 0) {
                    try { api.setMessageReaction("🥹", messageID, () => {}, true); } catch (e) {}
                    return api.sendMessage("no results found.", threadID, messageID);
                }
                videoID = results[0].id;
            }

            await handleDownload(api, threadID, messageID, videoID, apiUrl);

        } catch (e) {
            console.error(e);
            try { api.setMessageReaction("🥹", messageID, () => {}, true); } catch (err) {}
            return api.sendMessage("Error searching or processing video.", threadID, messageID);
        }
    }
};

async function handleDownload(api, threadID, messageID, videoID, apiUrl) {
    const filePath = path.join(__dirname, `video_${videoID}.mp4`);
    try {
        const res = await axios.get(`${apiUrl}/api/video/download?link=${videoID}&format=mp4`);
        const { title, downloadLink, quality } = res.data;
        
        const videoBuffer = (await axios.get(downloadLink, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(filePath, Buffer.from(videoBuffer));

        await api.sendMessage({
            body: `✅ 𝙃𝙚𝙧𝙚'𝙨 𝙮𝙤𝙪𝙧 𝙫𝙞𝙙𝙚𝙤 𝙗𝙖𝙗𝙮\n\n• 𝐓𝐢𝐭𝐥𝐞: ${title}`,
            attachment: fs.createReadStream(filePath)
        }, threadID, (err) => {
            if (!err) {
                try { api.setMessageReaction("🪽", messageID, () => {}, true); } catch (e) {}
            }
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, messageID);

    } catch (e) { 
        try { api.setMessageReaction("🥹", messageID, () => {}, true); } catch (err) {}
        api.sendMessage("error contact MahMUD.", threadID, messageID); 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}
