const axios = require("axios");
const mongoose = require("mongoose");

// VIP User schema
const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);
const mahmud = async () => {
        const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
        return base.data.mahmud;
};

module.exports = {
        config: {
                name: "bomb",
                version: "1.2",
                author: "MahMUD",
                countDown: 10,
                role: 0,
                vip: "yes",
                description: {
                        bn: "নির্দিষ্ট নাম্বারে ফান অ্যাটাক শুরু করুন",
                        en: "Start a fun attack on a specific number",
                        vi: "Bắt đầu cuộc tấn công vui vẻ vào một số cụ thể"
                },
                category: "tools",
                guide: {
                        bn: '   {pn} <01XXXXXXXXX> <পরিমাণ>: (যেমন: {pn} 017XXXXXXXX 10)',
                        en: '   {pn} <01XXXXXXXXX> <count>: (Ex: {pn} 017XXXXXXXX 10)',
                        vi: '   {pn} <01XXXXXXXXX> <số lượng>: (VD: {pn} 017XXXXXXXX 10)'
                }
        },

        langs: {
                bn: {
                        noInput: "× সঠিক নিয়ম: {pn} <নাম্বার> <পরিমাণ>\n\nউদাহরণ: {pn} 017XXXXXXXX 10",
                        invalidNum: "× ভুল নাম্বার! শুধুমাত্র বাংলাদেশী নাম্বার দিন।",
                        invalidCount: "× পরিমাণ ১ থেকে ১০০০ এর মধ্যে হতে হবে।",
                        started: "🚀 ফান শুরু হয়েছে...\n\n• টার্গেট: %1\n• পরিমাণ: %2",
                        error: "× সমস্যা হয়েছে: %1। প্রয়োজনে Contact MahMUD।"
                },
                en: {
                        noInput: "× Usage: {pn} <number> <count>\n\nExample: {pn} 017XXXXXXXX 10",
                        invalidNum: "× Invalid Bangladesh number!",
                        invalidCount: "× Count must be between 1 and 1000.",
                        started: "BOMBING STARTED\n\n• Target: %1\n• Count: %2",
                        error: "× API error: %1. Contact MahMUD for help."
                },
                vi: {
                        noInput: "× Cách dùng: {pn} <số điện thoại> <số lượng>\n\nVí dụ: {pn} 017XXXXXXXX 10",
                        invalidNum: "× Số điện thoại Bangladesh không hợp lệ!",
                        invalidCount: "× Số lượng phải từ 1 đến 1000.",
                        started: "🚀 ĐANG BẮT ĐẦU...\n\n• Target: %1\n• Số lượng: %2",
                        error: "× Lỗi: %1. Liên hệ MahMUD để hỗ trợ."
                }
        },

        onStart: async function ({ api, event, args, message, getLang }) {
                // VIP check using Mongoose
    try {
      const vip = await VipUser.findOne({ uid: event.senderID, expiredAt: { $gt: new Date() } });
      if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);
    } catch (err) {
      console.error("VIP check error:", err);
      return api.sendMessage("❌ Error checking VIP status.", event.threadID, event.messageID);
    }
               const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
                if (this.config.author !== authorName) {
                        return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
                }

                const num = args[0];
                const count = args[1];

                if (!num || !count) return message.reply(getLang("noInput"));

                if (!/^01[3-9]\d{8}$/.test(num)) {
                        return message.reply(getLang("invalidNum"));
                }

                const countInt = parseInt(count);
                if (isNaN(countInt) || countInt < 1 || countInt > 1000) {
                        return message.reply(getLang("invalidCount"));
                }

                try {
                        api.setMessageReaction("⏳", event.messageID, () => {}, true);
                        const loading = await message.reply(getLang("started", num, countInt));

                        const apiBase = await mahmud();
                        const res = await axios.get(`${apiBase}/api/bomb?num=${num}&count=${countInt}`, { timeout: 300000 });

                        if (res.data && res.data.success === false) {
                                api.setMessageReaction("❌", event.messageID, () => {}, true);
                                return message.reply(res.data.message || "API Error");
                        }

                        const s = res.data.summary || {};
                        const report = `BOMBING REPORT**\n\n` +
                                       `• Target: ${s.target || num}\n` +
                                       `• Success: ${s.successful || 0}\n` +
                                       `• Failed: ${s.failed || 0}\n` +
                                       `• Time: ${s.duration_formatted || "N/A"}`;

                        api.setMessageReaction("✅", event.messageID, () => {}, true);
                        return api.editMessage(report, loading.messageID);

                } catch (err) {
                        console.error("Fun Error:", err);
                        api.setMessageReaction("❌", event.messageID, () => {}, true);
                        const errorMsg = err.response?.data?.error || err.message;
                        return message.reply(getLang("error", errorMsg));
                }
        }
};
