const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

// List of common emojis for the random feature
const emojiList = ["😀", "😂", "🥰", "😎", "🤔", "🤩", "🥳", "😡", "😱", "🤡", "👻", "😛", "🙄", "🐱", "😶", "🥶", "😊", "😎", "🙀", "🫤"];

module.exports = {
    config: {
        name: "emojimix",
        aliases: ["mix", "ইমোজি"],
        version: "1.7",
        author: "MahMUD",
        countDown: 10,
        role: 0,
        description: {
            bn: "দুটি ইমোজি মিক্স করে নতুন স্টিকার তৈরি করুন",
            en: "Mix two emojis to create a new sticker",
            vi: "Trộn hai biểu tượng cảm xúc để tạo một nhãn dán mới"
        },
        category: "fun",
        guide: {
            bn: '   {pn} <emoji1> <emoji2> বা {pn} random\n   উদাহরণ: {pn} 🙂😘',
            en: '   {pn} <emoji1> <emoji2> or {pn} random\n   Example: {pn} 🙂😘',
            vi: '   {pn} <emoji1> <emoji2> hoặc {pn} random\n   Ví dụ: {pn} 🙂😘'
        }
    },

    langs: {
        bn: {
            error: "× দুঃখিত বেবি, এই ইমোজিগুলো মিক্স করা সম্ভব নয়। 🥺",
            success: "✨ | এই নাও তোমার মিক্স ইমোজি: %1 + %2",
            invalid: "• দয়া করে দুটি ইমোজি দিন বা random লিখুন."
        },
        en: {
            error: "× Sorry baby, these emojis can't be mixed. 🥺",
            success: "✨ | Emoji %1 and %2 mixed successfully!",
            invalid: "• Please provide two emojis\n\nExample: {pn} 😘🙂 or type {pn} random."
        },
        vi: {
            error: "❌ Xin lỗi, không thể trộn các biểu tượng cảm xúc này.",
            success: "✨ | Đã trộn biểu tượng cảm xúc %1 và %2 thành công!",
            invalid: "• Vui lòng cung cấp hai biểu tượng hoặc nhập 'random'! 😘"
        }
    },

    onStart: async function ({ api, message, event, args, getLang }) {
        const authorName = String.fromCharCode(77, 97, 104, 77, 85, 68);
        if (this.config.author !== authorName) return api.sendMessage("Unauthorized.", event.threadID);

        let emoji1, emoji2;

        // 1. Handle Random Mode
        if (args[0] === "random" || args[0] === "-r") {
            emoji1 = emojiList[Math.floor(Math.random() * emojiList.length)];
            emoji2 = emojiList[Math.floor(Math.random() * emojiList.length)];
        } 
        // 2. Handle cases with or without spaces
        else {
            const input = args.join("");
            // Use spread operator to correctly split Unicode emojis (including multi-byte)
            const emojis = [...input]; 
            
            if (emojis.length < 2) {
                return api.sendMessage(getLang("invalid"), event.threadID, event.messageID);
            }
            emoji1 = emojis[0];
            emoji2 = emojis[1];
        }

        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);
            const image = await generateEmojimix(emoji1, emoji2);

            if (!image) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return api.sendMessage(getLang("error"), event.threadID, event.messageID);
            }

            return api.sendMessage({
                body: getLang("success", emoji1, emoji2),
                attachment: image
            }, event.threadID, () => {
                api.setMessageReaction("🪽", event.messageID, () => {}, true);
            }, event.messageID);

        } catch (e) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage(getLang("error"), event.threadID, event.messageID);
        }
    }
};

async function generateEmojimix(emoji1, emoji2) {
    try {
        const baseUrl = await baseApiUrl();
        const apiUrl = `${baseUrl}/api/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;
        const response = await axios.get(apiUrl, {
            headers: { "Author": "MahMUD" },
            responseType: "stream"
        });
        return response.data;
    } catch (error) {
        return null;
    }
}
