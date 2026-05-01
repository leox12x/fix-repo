const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
        config: {
                name: "alldl",
                version: "1.7",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                cost: 1000,
                description: {
                        bn: "যেকোনো সোশ্যাল মিডিয়া ভিডিও ডাউনলোড করুন",
                        en: "Download videos from any social media"
                },
                category: "media",
                guide: {
                        bn: '   {pn} <লিংক>: ভিডিওর লিংক দিন'
                                + '\n   অথবা ভিডিও লিংকে রিপ্লাই দিয়ে {pn} লিখুন',
                        en: '   {pn} <link>: Provide the video link'
                                + '\n   Or reply to a link with {pn}'
                }
        },

        langs: {
                bn: {
                        noLink: "× বেবি, একটি সঠিক ভিডিও লিংক দাও অথবা লিংকে রিপ্লাই করো!",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐯𝐢𝐝𝐞𝐨 𝐛𝐚𝐛𝐲 <😘",
                        error: "× ভিডিও ডাউনলোড করতে সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        noLink: "× Baby, please provide a valid video link or reply to one!",
                        success: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐯𝐢𝐝𝐞𝐨 𝐛𝐚𝐛𝐲 <😘",
                        error: "× Download error: %1. Contact MahMUD for help."
                }
        },

        onStart: async function ({ api, message, args, event, getLang, usersData }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const link = args[0] || event.messageReply?.body;

                if (!link || !link.startsWith("http")) {
                        return message.reply(getLang("noLink"));
                }

                const cacheDir = path.join(__dirname, "cache");
                const filePath = path.join(cacheDir, `alldl_${Date.now()}.mp4`);

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        await fs.ensureDir(cacheDir);
                        const base = await baseApiUrl();
                        const apiUrl = `${base}/api/download/video?link=${encodeURIComponent(link)}`;
                        
                        const response = await axios({
                                method: 'get',
                                url: apiUrl,
                                responseType: 'arraybuffer',
                                headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                                }
                        });

                        await fs.writeFile(filePath, Buffer.from(response.data));

                        const stats = fs.statSync(filePath);
                        if (stats.size < 100) {
                                throw new Error("Invalid video file received.");
                        }

                        api.setMessageReaction("✅", event.messageID, () => {}, true);

                        await message.reply({
                                body: getLang("success"),
                                attachment: fs.createReadStream(filePath)
                        });

                        await fs.remove(filePath);

                } catch (err) {
                        console.error("Error in alldl command:", err);
                        api.setMessageReaction("❎", event.messageID, () => {}, true);
                        if (fs.existsSync(filePath)) await fs.remove(filePath);
                        return message.reply(getLang("error", err.message));
                }
        }
};
