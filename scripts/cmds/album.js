const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = { 
        config: { 
                name: "album", 
                version: "1.7", 
                author: "MahMUD", 
                countDown: 5,
                role: 0, 
                cost: 1000,
                category: "media", 
                guide: { 
                        en: "{pn} [page number]\n{pn} add [category] reply to video\n{pn} list",
                        bn: "{pn} [পৃষ্ঠা নম্বর]\n{pn} add [ক্যাটাগরি] (ভিডিও রিপ্লাই দিয়ে)\n{pn} list",
                        vi: "{pn} [số trang]\n{pn} add [danh mục] phản hồi video\n{pn} list"
                }, 
        },

        langs: {
                bn: {
                        authError: "আপনি লেখকের নাম পরিবর্তন করার অনুমতি পাননি।",
                        specifyCat: "❌ অনুগ্রহ করে একটি ক্যাটাগরি দিন।",
                        replyMedia: "❌ অনুগ্রহ করে একটি ভিডিও বা মিডিয়া ফাইলে রিপ্লাই দিন।",
                        listError: "❌ লিস্ট আনতে সমস্যা হয়েছে।",
                        invalidPage: "❌ ভুল পৃষ্ঠা! সর্বোচ্চ পৃষ্ঠা: %1",
                        invalidSelect: "❌ ভুল সিলেকশন।",
                        loadError: "❌ এপিআই কনফিগ লোড করতে ব্যর্থ হয়েছে Contact MahMUD for help.",
                        downloadError: "❌ ডাউনলোড সমস্যা: %1",
                        header: "𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨",
                        footer: "\n♻ | পৃষ্ঠা [%1/%2]<😘\nℹ | টাইপ করুন !%3 %4 - পরবর্তী পৃষ্ঠা দেখতে।"
                },
                en: {
                        authError: "You are not authorized to change the author name.",
                        specifyCat: "❌ Please specify a category.",
                        replyMedia: "❌ Please reply to a video or media file.",
                        listError: "❌ Error fetching list.",
                        invalidPage: "❌ Invalid page! Max page: %1",
                        invalidSelect: "❌ Invalid selection.",
                        loadError: "❌ Failed to load categories from API Contact MahMUD for help..",
                        downloadError: "❌ Download Error: %1 Contact MahMUD for help.",
                        header: "𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨",
                        footer: "\n♻ | 𝐏𝐚𝐠𝐞 [%1/%2]<😘\nℹ | 𝐓𝐲𝐩𝐞 !%3 %4 - 𝐭𝐨 𝐬𝐞𝐞 𝐧𝐞𝐱𝐭 𝐩𝐚𝐠𝐞."
                },
                vi: {
                        authError: "Bạn không có quyền thay đổi tên tác giả.",
                        specifyCat: "❌ Vui lòng chỉ định một danh mục.",
                        replyMedia: "❌ Vui lòng phản hồi một video hoặc tệp phương tiện.",
                        listError: "❌ Lỗi khi lấy danh sách.",
                        invalidPage: "❌ Trang không hợp lệ! Trang tối đa: %1",
                        invalidSelect: "❌ Lựa chọn không hợp lệ.",
                        loadError: "❌ Không tải được cấu hình từ API.",
                        downloadError: "❌ Lỗi tải xuống: %1",
                        header: "𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨",
                        footer: "\n♻ | Trang [%1/%2]<😘\nℹ | Nhập !%3 %4 - để xem trang tiếp theo."
                }
        },

        onStart: async function ({ api, event, args, usersData, getLang }) { 
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68); 
                if (this.config.author !== authorName) {
                        return api.sendMessage(getLang("authError"), event.threadID, event.messageID);
                }

                try {
                        const baseURL = await mahmud();

                        if (args[0] === "add") {
                                if (!args[1]) return api.sendMessage(getLang("specifyCat"), event.threadID, event.messageID);
                                const category = args[1].toLowerCase();

                                if (event.type !== "message_reply" || !event.messageReply.attachments.length) {
                                        return api.sendMessage(getLang("replyMedia"), event.threadID, event.messageID);
                                }

                                api.setMessageReaction("⌛", event.messageID, () => {}, true);
                                const attachmentUrl = encodeURIComponent(event.messageReply.attachments[0].url);
                                const imgurRes = await axios.get(`${baseURL.replace(/\/$/, "")}/api/imgur?url=${attachmentUrl}`);

                                if (!imgurRes.data.status || !imgurRes.data.link) throw new Error("Imgur Upload Failed");

                                const videoUrl = imgurRes.data.link;
                                const res = await axios.post(`${baseURL}/api/album2/mahmud/add`, { category, videoUrl });
                                
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                return api.sendMessage(res.data.message, event.threadID, event.messageID);
                        } 
                        
                        else if (args[0] === "list") {
                                const response = await axios.get(`${baseURL}/api/album2/mahmud/list`);
                                return api.sendMessage(response.data.message, event.threadID, event.messageID);
                        } 

                        else {
                                const configRes = await axios.get(`${baseURL}/api/album2/mahmud/display`);
                                const { displayNames, realCategories, captions } = configRes.data;

                                const itemsPerPage = 10;
                                const page = parseInt(args[0]) || 1;
                                const totalPages = Math.ceil(displayNames.length / itemsPerPage);

                                if (page < 1 || page > totalPages) return api.sendMessage(getLang("invalidPage", totalPages), event.threadID, event.messageID);

                                const startIndex = (page - 1) * itemsPerPage;
                                const displayed = displayNames.slice(startIndex, startIndex + itemsPerPage);

                                const message = `${getLang("header")}\n` +
                                        "𐙚━━━━━━━━━━━━━━━━━━━━━ᡣ𐭩\n" +
                                        displayed.map((name, i) => `${startIndex + i + 1}. ${name}`).join("\n") +
                                        "\n𐙚━━━━━━━━━━━━━━━━━━━━━ᡣ𐭩" +
                                        getLang("footer", page, totalPages, this.config.name, page + 1);

                                await api.sendMessage(message, event.threadID, (error, info) => {
                                        if (error) return;
                                        global.GoatBot.onReply.set(info.messageID, {
                                                commandName: this.config.name,
                                                messageID: info.messageID,
                                                author: event.senderID,
                                                realCategories,
                                                captions
                                        });
                                }, event.messageID);
                        }
                } catch (err) {
                        return api.sendMessage(getLang("loadError"), event.threadID, event.messageID);
                }
        },

        onReply: async function ({ api, event, Reply, getLang }) {
                if (event.senderID !== Reply.author) return;
                api.unsendMessage(Reply.messageID);

                const replyIndex = parseInt(event.body) - 1;
                const category = Reply.realCategories[replyIndex];
                if (!category) return api.sendMessage(getLang("invalidSelect"), event.threadID, event.messageID);

                const caption = Reply.captions[category] || Reply.captions["default"];

                try {
                        const baseURL = await mahmud();
                        const response = await axios.get(`${baseURL}/api/album2/mahmud/videos/${category}?userID=${event.senderID}`);

                        if (!response.data.success) return api.sendMessage(response.data.message, event.threadID, event.messageID);

                        const videos = response.data.videos;
                        const randomVideoUrl = videos[Math.floor(Math.random() * videos.length)];
                        const filePath = path.join(__dirname, `cache/album2_${Date.now()}.mp4`);

                        const res = await axios({ 
                                url: randomVideoUrl, 
                                method: "GET", 
                                responseType: "stream", 
                                headers: { 'User-Agent': 'Mozilla/5.0' } 
                        });

                        const writer = fs.createWriteStream(filePath);
                        res.data.pipe(writer);

                        writer.on("finish", () => {
                                api.sendMessage({ 
                                        body: caption, 
                                        attachment: fs.createReadStream(filePath) 
                                }, event.threadID, () => {
                                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                                }, event.messageID);
                        });

                        writer.on("error", (err) => {
                                api.sendMessage(getLang("downloadError", err.message), event.threadID, event.messageID);
                        });
                } catch (error) {
                        api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
                }
        }
};
