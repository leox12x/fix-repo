const Tesseract = require("tesseract.js");

module.exports = {
    config: {
        name: "ocr",
        version: "1.1",
        author: "RL",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Extract text from an image" },
        description: { 
            en: "This command extracts and returns text from an image using OCR (Optical Character Recognition)." 
        },
        category: "utility",
        guide: { en: "{prefix}ocr <reply to an image>" }
    },

    langs: {
        en: {
            processing: "Processing the image, please wait...",
            noImage: "Please reply to an image to extract text.",
            success: "Here is the extracted text:",
            failed: "Failed to extract text. Make sure the image contains readable text."
        }
    },

    onStart: async function ({ message, event, getLang }) {
        const reply = event.messageReply;
        const lang = getLang;

        if (!reply || !reply.attachments || reply.attachments[0].type !== "photo") {
            return message.reply(lang("noImage"));
        }

        const imageURL = reply.attachments[0].url;
        message.reply(lang("processing"));

        try {
            const { data: { text } } = await Tesseract.recognize(imageURL, "ben+eng"); // Supports both Bengali & English
            if (text.trim()) {
                message.reply(`${lang("success")}\n\n${text}`);
            } else {
                message.reply(lang("failed"));
            }
        } catch (err) {
            message.reply(`${lang("failed")} Error: ${err.message}`);
        }
    }
};