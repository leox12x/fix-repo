const axios = require("axios");

const languages = {
  bn: "Bangla (বাংলা)",
  en: "English",
  hi: "Hindi",
  ur: "Urdu",
  ar: "Arabic",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  ne: "Nepali",
  si: "Sinhala",
  id: "Indonesian",
  ms: "Malay",
  th: "Thai",
  vi: "Vietnamese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  tr: "Turkish"
};

module.exports = {
  config: {
    name: "say",
    aliases: ["sbn"],
    version: "1.2",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    cost: 1000,
    shortDescription: "Text to speech (multi-language)",
    longDescription: "Google TTS female voice",
    category: "media",
    guide: "{pn} <lang> <text>\n{pn} list\n(or reply to message)",
  },

  onStart: async function ({ message, args, event, api, usersData }) {

    // 🔹 Language list
    if (args[0] === "list") {
      let msg = "🌍 Supported Languages:\n\n";
      for (const [code, name] of Object.entries(languages)) {
        msg += `• ${code} → ${name}\n`;
      }
      return message.reply(msg);
    }

    let lng = "bn"; // default language
    let say = args.join(" ");

    // 🔹 If first arg is a language code
    if (languages[args[0]]) {
      lng = args[0];
      say = args.slice(1).join(" ");
    }

    // 🔹 Reply text support
    if (event.type === "message_reply" && event.messageReply.body) {
      say = event.messageReply.body;
    }

    if (!say) {
      return message.reply("⚠️ লেখা দিন অথবা `say list` লিখে language দেখুন");
    }

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lng}&client=tw-ob&q=${encodeURIComponent(say)}`;

      message.reply({
        attachment: await global.utils.getStreamFromURL(url),
      });

    } catch (e) {
      console.error(e);
      message.reply("🐥 TTS generate করতে সমস্যা হয়েছে!");
    }
  },
};
