const axios = require("axios");
const mongoose = require("mongoose");

// ==========================================
// Schema & Model (For Hinata Chat Logging)
// ==========================================
const ChatSchema = new mongoose.Schema({
  senderID: String,
  message: String,
  time: { type: Date, default: Date.now }
});

const ChatModel = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

const mahmud = [
  "baby", "bby", "babu", "bbu", "jan", "bot", "জান", "জানু", "বেবি", "wifey", "hinata",
];

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
@author MahMUD
@author: do not delete it
*/

module.exports.config = {
  name: "baby",
  aliases: ["hinata", "bby", "bbu", "jan", "janu", "wifey", "bot"],
  version: "2.7",
  author: "MahMUD",
  role: 0,
  category: "chat",
  guide: {
    en: "{pn} [message] OR teach [question] - [response] OR remove [question] - [index] OR list OR list all OR edit [question] - [newResponse] OR msg [question]"
  }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
  const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
  if (module.exports.config.author !== obfuscatedAuthor) {
    return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
  }

  const msg = args.join(" ").toLowerCase();
  const uid = event.senderID;

  try {
    if (!args[0]) {
      const ran = ["Bolo baby", "I love you", "type !bby hi"];
      return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
    }

    // TEACH
    if (args[0] === "teach") {
      const specialUsers = ["61556006709662", "61582357109253", "61575279513663", "61582588881607", "61587095596896", "61587059954884"];
      const allowedThreads = ["25332509896387705", "24821970854134199"];
      
      if (!allowedThreads.includes(event.threadID) && !specialUsers.includes(event.senderID)) {
        return api.sendMessage("❌ teach Temporarily off.", event.threadID, event.messageID);
      }

      const mahmudText = msg.replace("teach ", "");
      const [trigger, ...responsesArr] = mahmudText.split(" - ");
      const responses = responsesArr.join(" - ");

      if (!trigger || !responses) return api.sendMessage("❌ | teach [question] - [response1, response2,...]", event.threadID, event.messageID);
      
      const response = await axios.post(`${await baseApiUrl()}/api/jan/teach2`, { trigger, responses, userID: uid });
      const userName = (await usersData.getName(uid)) || "Unknown User";
      
      return api.sendMessage(`✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`, event.threadID, event.messageID);
    }

    // REMOVE
    if (args[0] === "remove") {
      const mahmudText = msg.replace("remove ", "");
      const [trigger, index] = mahmudText.split(" - ");
      if (!trigger || !index || isNaN(index)) return api.sendMessage("❌ | remove [question] - [index]", event.threadID, event.messageID);
      const response = await axios.delete(`${await baseApiUrl()}/api/jan/remove`, { data: { trigger, index: parseInt(index, 10) } });
      return api.sendMessage(response.data.message, event.threadID, event.messageID);
    }

    // LIST
// LIST
    if (args[0] === "list") {
      const endpoint = args[1] === "all" ? "/list/all" : "/list";
      const response = await axios.get(`${await baseApiUrl()}/api/jan${endpoint}`);

      if (args[1] === "all") {
        const page = parseInt(args[2]) || 1;
        const limit = 100;
        const start = (page - 1) * limit;
        const end = start + limit;

        const allData = Object.entries(response.data.data).sort((a, b) => b[1] - a[1]);
        const pagedData = allData.slice(start, end);

        if (pagedData.length === 0) {
          return api.sendMessage(`❌ | Page ${page} contains no data.`, event.threadID, event.messageID);
        }

        let message = `👑 | List of Teachers of baby\n\n`;
        for (let i = 0; i < pagedData.length; i++) {
          const [userID, count] = pagedData[i];
          
          // Force conversion to a standard integer to satisfy strict type checks
          const formattedUID = parseInt(userID, 10);
          const name = (await usersData.getName(formattedUID)) || "Unknown";
          
          message += `${start + i + 1}. ${name}: ${count}\n`;
        }

        const totalPages = Math.ceil(allData.length / limit);
        if (page < totalPages) {
          message += `\n\n• Page Number ${page}\n• Type !baby list all ${page + 1} to see the next page`;
        }

        return api.sendMessage(message, event.threadID, event.messageID);
      }
      return api.sendMessage(response.data.message, event.threadID, event.messageID);
    }
    
    // EDIT
    if (args[0] === "edit") {
      const specialUsers = ["61556006709662", "61582357109253", "61575279513663", "61580682368883", "61587095596896"];
      if (!specialUsers.includes(event.senderID)) return api.sendMessage("❌ Only special users can edit replies.", event.threadID, event.messageID);
      const mahmudText = msg.replace("edit ", "");
      const [oldTrigger, ...newArr] = mahmudText.split(" - ");
      const newResponse = newArr.join(" - ");
      if (!oldTrigger || !newResponse) return api.sendMessage("❌ | Format: edit [question] - [newResponse]", event.threadID, event.messageID);
      await axios.put(`${await baseApiUrl()}/api/jan/edit2`, { oldTrigger, newResponse });
      return api.sendMessage(`✅ Edited "${oldTrigger}" to "${newResponse}"`, event.threadID, event.messageID);
    }

    // MSG
    if (args[0] === "msg") {
      const searchTrigger = args.slice(1).join(" ");
      if (!searchTrigger) return api.sendMessage("Please provide a message to search.", event.threadID, event.messageID);
      try {
        const response = await axios.get(`${await baseApiUrl()}/api/jan/msg`, { params: { userMessage: `msg ${searchTrigger}` } });
        return api.sendMessage(response.data.message || "No message found.", event.threadID, event.messageID);
      } catch (error) {
        return api.sendMessage(error.response?.data?.error || error.message || "error", event.threadID, event.messageID);
      }
    }

    // Default Response Selection
    const getBotResponse = async (text, attachments) => {
      try {
        const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
        return res.data.message;
      } catch { return "error janu🥹"; }
    };

    const botResponse = await getBotResponse(msg, event.attachments || []);
    api.sendMessage(botResponse, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name, type: "reply", messageID: info.messageID, author: uid, text: botResponse
        });
      }
    }, event.messageID);

  } catch (err) {
    api.sendMessage(err.response?.data || err.message, event.threadID, event.messageID);
  }
};

module.exports.onReply = async ({ api, event }) => {
  if (event.type !== "message_reply") return;

  try {
    const message = event.body?.toLowerCase() || "";
    const uid = event.senderID;

    // Duplication Check (By Message Only) & Save
    if (message) {
        const existing = await ChatModel.findOne({ message: message });
        if (!existing) {
            await ChatModel.create({ senderID: uid, message: message });
        }
    }

    const getBotResponse = async (text, attachments) => {
      try {
        const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
        return res.data.message;
      } catch { return "error janu🥹"; }
    };

    const replyMessage = await getBotResponse(message || "meow", event.attachments || []);
    api.sendMessage(replyMessage, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name, type: "reply", messageID: info.messageID, author: uid, text: replyMessage
        });
      }
    }, event.messageID);

  } catch (err) {
    console.error(err);
  }
};

module.exports.onChat = async ({ api, event }) => {
  try {
    const message = event.body?.toLowerCase() || "";
    const attachments = event.attachments || [];
    const uid = event.senderID;

    if (event.type !== "message_reply" && mahmud.some(word => message.startsWith(word))) {

      api.setMessageReaction("🪽", event.messageID, () => {}, true);
      api.sendTypingIndicator(event.threadID, true);

      // Duplication Check (By Message Only) & Save
      if (message) {
        const existing = await ChatModel.findOne({ message: message });
        if (!existing) {
            await ChatModel.create({ senderID: uid, message: message });
        }
      }

      const messageParts = message.trim().split(/\s+/);
      const getBotResponse = async (text, attachments) => {
        try {
          const res = await axios.post(`${await baseApiUrl()}/api/hinata`, { text, style: 3, attachments });
          return res.data.message;
        } catch { return "error janu🥹"; }
      };

      const randomMessage = [
        "babu khuda lagse🥺", "Hop beda😾,Boss বল boss😼", "ভুলে জাও আমাকে 😞😞",
        "দেখা হলে কাঠগোলাপ দিও..🤗", "শুনবো না😼 তুমি আমাকে প্রেম করাই দাও নি🥺 পচা তুমি🥺",
        "আগে একটা গান বলো, ☹ নাহলে কথা বলবো না 🥺", "বলো কি করতে পারি তোমার জন্য 😚",
        "কথা দেও আমাকে পটাবা...!! 😌", "বার বার Disturb করেছিস কোনো 😾, আমার জানু এর সাথে ব্যাস্ত আসি 😋",
        "আমাকে না দেকে একটু পড়তে বসতেও তো পারো 🥺🥺", "বার বার ডাকলে মাথা গরম হয় কিন্তু 😑😒",
        "ওই তুমি single না?🫵🤨 😑😒", "প্রেম করার বয়সে লেখাপড়া করতেছি, রেজাল্ট তো খা/রা'প হবেই.!🙂",
        "আমার ইয়ারফোন চু'রি হয়ে গিয়েছে!! কিন্তু চোর'কে গা-লি দিলে আমার বন্ধু রেগে যায়!'🙂",
        "ছেলেদের প্রতি আমার এক আকাশ পরিমান শরম🥹🫣", "__ফ্রী ফে'সবুক চালাই কা'রন ছেলেদের মুখ দেখা হারাম 😌",
        "মন সুন্দর বানাও মুখের জন্য তো 'Snapchat' আছেই! 🌚"
      ];

      if (messageParts.length === 1 && attachments.length === 0) {
        const hinataMsg = randomMessage[Math.floor(Math.random() * randomMessage.length)];
        api.sendMessage(hinataMsg, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name, type: "reply", messageID: info.messageID, author: uid, text: hinataMsg
            });
          }
        }, event.messageID);
      } else {
        let userText = message;
        for (const prefix of mahmud) {
          if (message.startsWith(prefix)) {
            userText = message.substring(prefix.length).trim();
            break;
          }
        }
        const botResponse = await getBotResponse(userText, attachments);
        api.sendMessage(botResponse, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: module.exports.config.name, type: "reply", messageID: info.messageID, author: uid, text: botResponse
            });
          }
        }, event.messageID);
      }
    }
  } catch (err) {
    console.error(err);
  }
};
