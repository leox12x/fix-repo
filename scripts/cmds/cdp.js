const axios = require("axios");

const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "cdp",
                version: "1.8",
                author: "MahMUD",
                countDown: 5,
                cost: 1000,
                role: 0,
                category: "media",
                description: {
                        bn: "ক্যাটালগ অনুযায়ী কাপল প্রোফাইল পিকচার (CDP) পান বা যোগ করুন",
                        en: "Get or add Couple Profile Pictures (CDP) by category",
                        vi: "Lấy hoặc thêm ảnh đại diện cặp đôi (CDP) theo danh mục"
                },
                guide: {
                        bn: '   {pn} <category>: নির্দিষ্ট ক্যাটাগরি\n   {pn} list: সব ক্যাটাগরি\n   {pn} add <category>: ছবি যোগ করুন',
                        en: '   {pn} <category>: Get specific category\n   {pn} list: View all categories\n   {pn} add <category>: Add images',
                        vi: '   {pn} <category>: Nhận theo danh mục\n   {pn} list: Xem tất cả danh mục\n   {pn} add <category>: Thêm ảnh'
                }
        },

        langs: {
                bn: {
                        listTitle: "🎀 সহজলভ্য CDP তালিকা:\n",
                        noCategory: "× অনুগ্রহ করে একটি ক্যাটাগরির নাম দিন।",
                        noReply: "× ছবি যোগ করতে ২-৫টি ছবিতে রিপ্লাই দিন।",
                        limitErr: "× অনুগ্রহ করে ২ থেকে ৫টি ছবিতে রিপ্লাই দিন।",
                        uploadFail: "× ছবি প্রসেস করতে ব্যর্থ হয়েছে।",
                        addSuccess: "✅ Added to successfully!\n• Category: %1",
                        notFound: "× ক্যাটাগরি \"%1\" পাওয়া যায়নি!\nসঠিক তালিকা দেখতে \"cdpp list\" লিখুন।",
                        replyMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        defaultMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐝𝐞𝐟𝐚𝐮𝐥𝐭 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        listTitle: "🎀 Available CDP List:\n",
                        noCategory: "× Please specify a category name.",
                        noReply: "× Reply to 2–5 images to add.",
                        limitErr: "× Please reply to 2–5 images.",
                        uploadFail: "× Failed to process images.",
                        addSuccess: "✅ Added to successfully!\n• Category: %1",
                        notFound: "× Category \"%1\" not found!\nUse \"cdpp list\" to see categories.",
                        replyMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        defaultMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐝𝐞𝐟𝐚𝐮𝐥𝐭 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        listTitle: "🎀 Danh sách CDP hiện có:\n",
                        noCategory: "× Vui lòng chỉ định tên danh mục.",
                        noReply: "× Phản hồi 2–5 ảnh để thêm.",
                        limitErr: "× Vui lòng phản hồi từ 2 đến 5 ảnh.",
                        uploadFail: "× Xử lý ảnh thất bại.",
                        addSuccess: "✅ Added to successfully!\n• Category: %1",
                        notFound: "× Không tìm thấy danh mục \"%1\"!\nDùng \"cdpp list\" để xem danh sách.",
                        replyMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        defaultMsg: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐝𝐞𝐟𝐚𝐮𝐥𝐭 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ."
                }
        },

        onStart: async function ({ api, message, usersData, args, event, getLang }) {
                const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const getStream = async (url) => {
                        const res = await axios({
                                url,
                                method: "GET",
                                responseType: "stream",
                                headers: { "User-Agent": "Mozilla/5.0" }
                        });
                        return res.data;
                };

                const uploadToImgur = async (url, apiBase) => {
                        try {
                                const apiUrl = `${apiBase}/api/imgur?url=${encodeURIComponent(url)}`;
                                const res = await axios.get(apiUrl, { timeout: 10000 });
                                return res.data.status && res.data.link ? res.data.link : null;
                        } catch (err) { return null; }
                };

                try {
                        const apiBase = await mahmud();
                        const command = args[0]?.toLowerCase();

                        if (command === "list") {
                                const res = await axios.get(`${apiBase}/api/cdpvip2/list`);
                                const summary = res.data?.summary || {};
                                const defaultRes = await axios.get(`${apiBase}/api/cdp/list`);
                                
                                let msg = getLang("listTitle");
                                msg += `1. Default : ${defaultRes.data.total || 0}\n`;
                                Object.keys(summary).forEach((cat, index) => {
                                        msg += `${index + 2}. ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${summary[cat].totalGroups}\n`;
                                });
                                return message.reply(msg);
                        }

                        if (command === "add") {
                                const category = args[1]?.toLowerCase();
                                if (!category) return message.reply(getLang("noCategory"));
                                if (!event.messageReply || !event.messageReply.attachments?.length)
                                        return message.reply(getLang("noReply"));

                                const attachments = event.messageReply.attachments;
                                if (attachments.length < 2 || attachments.length > 5) 
                                        return message.reply(getLang("limitErr"));

                                api.setMessageReaction("⏳", event.messageID, () => {}, true);
                                const uploaded = [];
                                for (const att of attachments) {
                                        const imgurLink = await uploadToImgur(att.url, apiBase);
                                        if (imgurLink) uploaded.push(imgurLink);
                                }

                                if (uploaded.length < 2) {
                                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                                        return message.reply(getLang("uploadFail"));
                                }

                                await axios.post(`${apiBase}/api/cdpvip2/add`, { category, attachmentUrls: uploaded });
                                api.setMessageReaction("✅", event.messageID, () => {}, true);
                                return message.reply(getLang("addSuccess", category));
                        }

                        if (!command) {
                                const cdpRes = await axios.get(`${apiBase}/api/cdp`);
                                const attachments = [await getStream(cdpRes.data.boy), await getStream(cdpRes.data.girl)];
                                return message.reply({ body: getLang("defaultMsg"), attachment: attachments });
                        }

                        const listRes = await axios.get(`${apiBase}/api/cdpvip2/list`);
                        const availableCategories = Object.keys(listRes.data?.summary || {});
                        if (!availableCategories.includes(command)) return message.reply(getLang("notFound", command));

                        const res = await axios.get(`${apiBase}/api/cdpvip2?category=${command}`);
                        const streamAttachments = [];
                        for (const url of res.data.group) {
                                streamAttachments.push(await getStream(url));
                        }

                        return message.reply({
                                body: `${getLang("replyMsg")}\n• 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${command.charAt(0).toUpperCase() + command.slice(1)}`,
                                attachment: streamAttachments
                        });

                } catch (err) {
                        console.error(err);
                        return message.reply(getLang("error", err.message));
                }
        }
};
