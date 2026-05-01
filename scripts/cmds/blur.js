module.exports = {
    config: {
        name: "blur",
        version: "2.3",
        author: "MahMUD",
        countDown: 3,
        role: 2,
        description: {
            en: "Blur Image"
        },
        category: "image",
        guide: {
            en: "{pn} [ImgReply/imgLink] [1-100]"
        }
    },

    onStart: async function ({ api, args, message, event }) {
        try {
            let imageUrl;
            let blurLevel = 3; // ডিফল্ট ৫০% ব্লার
            
            // যদি মেসেজ রিপ্লাই করা হয় এবং তাতে ইমেজ থাকে
            if (event.type == "message_reply" && event.messageReply.attachments) {
                imageUrl = event.messageReply.attachments[0].url;
                if (args[0] && !isNaN(args[0])) {
                    let level = parseInt(args[0]);
                    if (level >= 1 && level <= 100) {
                        blurLevel = level;
                    } else {
                        return message.reply("❎ | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚝𝚎𝚛 𝚊 𝚋𝚕𝚞𝚛 𝚕𝚎𝚟𝚎𝚕 𝚋𝚎𝚝𝚠𝚎𝚎𝚗 1-100.");
                    }
                }
            }
            // যদি ইউজার ইমেজ লিংক দেয়
            else if (args[0] && args[0].startsWith("http")) {
                imageUrl = args[0];
                if (args[1] && !isNaN(args[1])) {
                    let level = parseInt(args[1]);
                    if (level >= 1 && level <= 100) {
                        blurLevel = level;
                    } else {
                        return message.reply("❎ | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚝𝚎𝚛 𝚊 𝚋𝚕𝚞𝚛 𝚕𝚎𝚟𝚎𝚕 𝚋𝚎𝚝𝚠𝚎𝚎𝚗 1-100.");
                    }
                }
            }
            // যদি ইউজার শুধু "blur 10" বা "blur 50" দেয়, তাহলে এটি রিপ্লাই করা ইমেজ চেক করবে
            else if (args[0] && !isNaN(args[0]) && event.type == "message_reply" && event.messageReply.attachments) {
                let level = parseInt(args[0]);
                if (level >= 1 && level <= 100) {
                    blurLevel = level;
                    imageUrl = event.messageReply.attachments[0].url;
                } else {
                    return message.reply("❎ | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚎𝚗𝚝𝚎𝚛 𝚊 𝚋𝚕𝚞𝚛 𝚕𝚎𝚟𝚎𝚕 𝚋𝚎𝚝𝚠𝚎𝚎𝚗 1-100.");
                }
            } else {
                return message.reply("❎ | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚛𝚎𝚙𝚕𝚢 𝚝𝚘 𝚊𝚗 𝚒𝚖𝚊𝚐𝚎.");
            }

            api.setMessageReaction("⏳", event.messageID, (err) => {}, true);
            var waitMsg = await message.reply("⏳ | 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝 𝚊 𝚠𝚑𝚒𝚕𝚎...");

            // API লিংক
            const imgStream = `https://rubish-apihub.onrender.com/rubish/edit-blur?url=${encodeURIComponent(imageUrl)}&blurLevel=${blurLevel}&apikey=rubish69`;

            api.setMessageReaction("✅", event.messageID, (err) => {}, true);
            message.unsend(waitMsg.messageID);
            message.reply({
                body: `✅ | 𝙷𝚎𝚛𝚎'𝚜 𝚈𝚘𝚞𝚛 ${blurLevel}% 𝙱𝚕𝚞𝚛 𝙸𝚖𝚊𝚐𝚎.`,
                attachment: await global.utils.getStreamFromURL(imgStream)
            });
        } catch (error) {
            console.log(error);
            message.reply(`❎ | 𝙴𝚛𝚛𝚘𝚛: ${error.message}`);
        }
    }
};
