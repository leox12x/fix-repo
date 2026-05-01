const axios = require("axios");
const moment = require("moment-timezone");

const MahmudApi = "https://mahmud-global-apis.onrender.com/api/birthday";
const TID = "7460623087375340"; // আপনার থ্রেড আইডি

module.exports = {
  config: {
    name: "birthday",
    version: "2.5",
    author: "MahMud 🐤",
    countDown: 5,
    role: 0,
    category: "utility",
    description: "Manage and wish user birthdays using Mahmud API",
    usage: "[add @user MM-DD] | [list]"
  },

  onStart: async function ({ message, args, event, api }) {
    try {
      const sub = args[0]?.toLowerCase();
      const GODData = global.GoatBot.config.GOD;

      // 🟢 ১. জন্মদিন যোগ করা (শুধুমাত্র ওনার পারবে)
      if (sub === "add") {
        if (!GODData.includes(event.senderID)) {
          return message.reply("❌ | Baby, only my owner can use this command.");
        }

        let userId, name, date;

        if (Object.keys(event.mentions || {}).length > 0) {
          userId = Object.keys(event.mentions)[0];
          name = Object.values(event.mentions)[0].replace("@", "");
          date = args[2];
        } else if (/^\d+$/.test(args[1])) {
          userId = args[1];
          name = args[2];
          date = args[3];
        } else {
          return message.reply("⚡ Usage: birthday add @user MM-DD");
        }

        if (!date || !/^\d{2}-\d{2}$/.test(date)) {
          return message.reply("❌ Please use date format MM-DD (Example: 05-25)");
        }

        const res = await axios.post(`${MahmudApi}/add`, { userId, name, date });
        return message.reply(res.data.message || "✅ Birthday added successfully!");
      }

      // 📜 ২. লিস্ট দেখা (সবাই পারবে)
      else if (sub === "list") {
        const res = await axios.get(`${MahmudApi}/list`);
        if (!res.data.success || !res.data.birthdays || res.data.birthdays.length === 0) {
          return message.reply("❌ No birthdays found in the database.");
        }

        let msg = "🎂 𝐇𝐚𝐩𝐩𝐲 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲 𝐋𝐢𝐬𝐭 🎂\n" + "━".repeat(15) + "\n\n";

        const sorted = res.data.birthdays.sort((a, b) => a.date.localeCompare(b.date));
        const today = moment().tz("Asia/Dhaka").format("MM-DD");

        sorted.forEach(b => {
          const isToday = b.date === today;
          msg += `${isToday ? "🎉" : "•"} ${b.date.padEnd(7)} - ${b.name}${isToday ? " (Today!)" : ""}\n`;
        });

        // পরবর্তী কার জন্মদিন সেটা দেখানো
        const nextBday = sorted.find(b => b.date > today) || sorted[0];
        if (nextBday) {
          msg += `\n${"━".repeat(15)}\n🎀 𝐍𝐞𝐱𝐭 𝐔𝐩: ${nextBday.date} - ${nextBday.name}`;
        }

        return message.reply(msg.trim());
      }

      // ❓ সাহায্য
      else {
        return message.reply(
          "✨ 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n" +
          "━".repeat(15) + "\n" +
          "• birthday list\n" +
          "• birthday add @user MM-DD (Owner Only)\n" +
          "• birthday add UID Name MM-DD (Owner Only)"
        );
      }

    } catch (err) {
      console.error(err);
      return message.reply("❌ API এর সাথে যোগাযোগ করা যাচ্ছে না।");
    }
  },

  // 🕛 ৩. অটো উইশ লজিক (রাত ১২টায়)
  onChat: async function ({ api, usersData }) {
    try {
      const now = moment().tz("Asia/Dhaka");
      const time = now.format("HH:mm");
      const today = now.format("MM-DD");

      // ঠিক রাত ১২:০০ মিনিটে চেক করবে
      if (time !== "00:00") return;

      const res = await axios.get(`${MahmudApi}/today?date=${today}`);
      if (!res.data.success || !res.data.birthdays || res.data.birthdays.length === 0) return;

      for (const user of res.data.birthdays) {
        try {
          const data = await usersData.get(user.userId);
          const userName = data?.name || user.name || "User";

          const msg = `🎉 𝐇𝐚𝐩𝐩𝐲 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲 ${userName} 🎂🎀\n\n` +
            `𝐌𝐚𝐧𝐲 𝐌𝐚𝐧𝐲 𝐇𝐚𝐩𝐩𝐲 𝐑𝐞𝐭𝐮𝐫𝐧𝐬 𝐎𝐟 𝐓𝐡𝐞 𝐃𝐚𝐲 🌸💫\n` +
            `𝐌𝐚𝐲 𝐘𝐨𝐮𝐫 𝐋𝐢𝐟𝐞 𝐁𝐞 𝐅𝐮𝐥𝐥 𝐎𝐟 𝐋𝐨𝐯𝐞 𝐀𝐧𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 ❤️`;

          // নির্দিষ্ট থ্রেডে মেনশনসহ মেসেজ পাঠানো
          api.sendMessage({ 
            body: msg, 
            mentions: [{ tag: userName, id: user.userId }] 
          }, TID);
          
          console.log(`✅ Birthday wish sent to ${userName}`);
        } catch (err) {
          console.error("❌ Wish Error:", err.message);
        }
      }
    } catch (err) {
      // কনসোল এরর হ্যান্ডলিং (যাতে বোট ক্রাশ না করে)
    }
  }
};
