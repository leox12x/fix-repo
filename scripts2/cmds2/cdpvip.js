const axios = require("axios");

function formatMoney(num) {
  const units = ["", "K", "M", "B"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}

// ---------- Helper: Stream images ----------
const getStream = async (url) => {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  return res.data;
};

// ===== Helper: Upload to Imgur =====
const uploadToImgur = async (url) => {
  try {
    const res = await axios.post(
      "https://api.imgur.com/3/image",
      { image: url, type: "url" },
      { headers: { Authorization: "Client-ID 137256035dcfdcc" } }
    );
    return res.data?.data?.link || null;
  } catch (err) {
    console.error("❌ Imgur upload failed:", err.response?.data || err.message);
    return null;
  }
};

module.exports = {
  config: {
    name: "cdpvip",
    version: "1.7",
    author: "MahMUD 🐤",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{p}cdpx <category>\n{p}cdpx list\n{p}cdpx add <category> [reply 2–5 images]"
  },

  onStart: async function ({ api, usersData, message, args, event, user }) {
    const COST = 1000;
    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;

    if (balance < COST) {
      return api.sendMessage(
        `𝐁𝐚𝐛𝐲, 𝐧𝐞𝐞𝐝 ${formatMoney(COST)} 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝, 𝐛𝐮𝐭 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 ${formatMoney(balance)} 🥹\n\n• 𝐔𝐬𝐞 𝐝𝐚𝐢𝐥𝐲 𝐟𝐨𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐫 𝐩𝐥𝐚𝐲 𝐠𝐚𝐦𝐞𝐬`,
        event.threadID,
        event.messageID
      );
    }

    const newBalance = balance - COST;
    await usersData.set(event.senderID, { money: newBalance });
    
    const baseUrl = "https://mahmud-global-apis.onrender.com/api/cdpvip2";

    if (!args.length)
      return message.reply(
        "⚠ Usage:\n!cdpx <category>\n!cdpx list\n!cdpx add <category> [reply 2–5 images]"
      );

    const command = args[0].toLowerCase();

    try {
      // ---------------- LIST ----------------
      if (command === "list") {
        const res = await axios.get(`${baseUrl}/list`);
        const summary = res.data?.summary || {};
        if (!Object.keys(summary).length)
          return message.reply("⚠ No categories found.");

        let msg = "🎀 Available categories:\n";
        for (const [cat, count] of Object.entries(summary)) {
          msg += `- ${cat}: ${count}\n`;
        }
        return message.reply(msg);
      }

    // ================= ADD =================
      if (command === "add") {
        const category = args[1]?.toLowerCase();
        if (!category)
          return message.reply("❌ Please specify a category name (e.g. !cdpx add cat)");

        if (!event.messageReply || !event.messageReply.attachments?.length)
          return message.reply("❌ Reply to 1–5 images to add.");

        const attachments = event.messageReply.attachments;
        const attachment = attachments[0]; // first image reference

        if (attachments.length < 1)
          return message.reply("❌ At least 1 image required.");
        if (attachments.length > 5)
          return message.reply("❌ Maximum 5 images allowed per group.");

        message.reply("⏳ Uploading images to Imgur...");

        const uploaded = [];
        for (const att of attachments) {
          const imgur = await uploadToImgur(att.url);
          if (imgur) uploaded.push(imgur);
        }

        if (uploaded.length < 1)
          return message.reply("❌ Failed to upload images to Imgur.");

        const addRes = await axios.post(`${baseUrl}/add`, {
          category,
          attachmentUrls: uploaded
        });

        if (addRes.data?.message)
          return message.reply(`✅ ${addRes.data.message}`);
        else return message.reply("✅ Images added successfully!");
      }

      // ---------------- RANDOM GROUP ----------------
      // Fetch available categories dynamically
      const listRes = await axios.get(`${baseUrl}/list`);
      const availableCategories = Object.keys(listRes.data?.summary || {});

      if (!availableCategories.includes(command)) {
        let msg = `🥹 Category not found. Available categories:\n`;
        availableCategories.forEach((cat) => (msg += `- ${cat}\n`));
        return message.reply(msg);
      }

      const res = await axios.get(`${baseUrl}?category=${command}`);
      if (!res.data.group?.length)
        return message.reply(`⚠ No DP found in "${command}" category.`);

      const groupImages = res.data.group; // full group
      const streamAttachments = [];
      for (const url of groupImages) streamAttachments.push(await getStream(url));

      return message.reply({
        body: `🎀 Here's your random "${command}" DP group (${groupImages.length} images)`,
        attachment: streamAttachments
      });

    } catch (err) {
      console.error("❌ Full error:", err.response?.data || err.message);
      return message.reply("❌ Error fetching DP. Try again later.");
    }
  }
};
