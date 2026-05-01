const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

/**
 * @author MahMUD
 * @author: do not delete it
 */

module.exports = {
  config: {
    name: "my",
    version: "2.0",
    author: "MahMUD",
    category: "love",
    guide:
      "{pn} boy @tag | girl @tag | queen @tag | king @tag | bf @tag | gf @tag | brother @tag | sister @tag | love @tag | list"
  },

  onStart: async function ({ api, usersData, event, args }) {
    const obfuscated = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (module.exports.config.author !== obfuscated) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID);
    }

    const senderID = event.senderID;
    const type = (args[0] || "").toLowerCase();

    // ================= LIST =================
    if (type === "list") {
      return api.sendMessage(
        `#boy use:
         • my gf
         • my girl
         • my queen
         • my sister
         • my love

#girl use:
         • my bf
         • my boy
         • my king
         • my brother
         • my love`,
        event.threadID,
        event.messageID
      );
    }

    // VALID TYPES
    const validTypes = ["boy", "girl", "bf", "gf", "king", "queen", "brother", "sister", "love"];

    if (!validTypes.includes(type)) {
      return api.sendMessage(
        "Use: my boy/girl/queen/king/bf/gf/brother/sister/love @tag | reply | uid\nUse: my list",
        event.threadID,
        event.messageID
      );
    }

    // TARGET USER
    const mention = Object.keys(event.mentions)[0];
    let target =
      mention ||
      (event.messageReply && event.messageReply.senderID) ||
      (args[1] && /^\d+$/.test(args[1]) ? args[1] : null);

    if (!target)
      return api.sendMessage("Tag, reply, or give UID.", event.threadID, event.messageID);

    // CAPTIONS
    const captionText = {
      boy: "𝐓𝐇𝐀𝐓'𝐒 𝐌𝐘 𝐁𝐎𝐘 🖤",
      girl: "𝐓𝐇𝐀𝐓'𝐒 𝐌𝐘 𝐆𝐈𝐑𝐋 🖤",
      bf: "𝐌𝐲 𝐁𝐨𝐲𝐟𝐫𝐢𝐞𝐧𝐝 💙",
      gf: "𝐌𝐲 𝐆𝐢𝐫𝐥𝐟𝐫𝐢𝐞𝐧𝐝 ❤️",
      king: "𝐊𝐢𝐧𝐠 𝐨𝐟 𝐦𝐲 𝐡𝐞𝐚𝐫𝐭 👑",
      queen: "𝐐𝐮𝐞𝐞𝐧 𝐨𝐟 𝐦𝐲 𝐡𝐞𝐚𝐫𝐭 👸",
      brother: "𝐋𝐢𝐟𝐞'𝐬 𝐛𝐞𝐭𝐭𝐞𝐫 𝐰𝐢𝐭𝐡 𝐚 𝐁𝐫𝐨𝐭𝐡𝐞𝐫 𝐛𝐲 𝐲𝐨𝐮𝐫 𝐬𝐢𝐝𝐞 🎀",
      sister: "𝐋𝐢𝐟𝐞'𝐬 𝐛𝐞𝐭𝐭𝐞𝐫 𝐰𝐢𝐭𝐡 𝐚 𝐒𝐢𝐬𝐭𝐞𝐫 𝐛𝐲 𝐲𝐨𝐮𝐫 𝐬𝐢𝐝𝐞 🎀",
      love: "𝐌𝐲 𝐄𝐯𝐞𝐫𝐲𝐭𝐡𝐢𝐧𝐠 💞"
    };

    // USER ORDER SYSTEM
    let user1, user2;

    // boy-type or love: sender is second
    if (["boy", "bf", "king", "brother", "love"].includes(type)) {
      user1 = target;
      user2 = senderID;
    }

    // girl-type: sender is first
    if (["girl", "gf", "queen", "sister"].includes(type)) {
      user1 = senderID;
      user2 = target;
    }

    try {
      const info1 = await usersData.get(user1);
      const info2 = await usersData.get(user2);

      const apiUrl = await baseApiUrl();

      // ================= API SELECTION =================
      let apiLink;

      if (type === "brother" || type === "sister") {
        apiLink = `${apiUrl}/api/bro&sis?user1=${user1}&user2=${user2}&style=1`;
      } else if (type === "boy" || type === "girl") {
        apiLink = `${apiUrl}/api/myboy?user1=${user1}&user2=${user2}`;
      } else {
        // Style selection logic
        let styleNum;
        if (type === "king" || type === "queen") styleNum = 26;
        else if (type === "love") styleNum = 50;
        else styleNum = 40; // for bf/gf

        apiLink = `${apiUrl}/api/pair/mahmud?user1=${user1}&user2=${user2}&style=${styleNum}`;
      }

      const { data } = await axios.get(apiLink, { responseType: "arraybuffer" });

      const file = path.join(__dirname, `cache/my_${type}_${user1}_${user2}.png`);
      fs.writeFileSync(file, Buffer.from(data));

      const messageBody = `${captionText[type]}\n• ${info1.name}\n• ${info2.name}`;

      api.sendMessage(
        {
          body: messageBody,
          attachment: fs.createReadStream(file)
        },
        event.threadID,
        () => fs.unlinkSync(file),
        event.messageID
      );
    } catch (err) {
      api.sendMessage("🥹error, contact MahMUD. " + err.message, event.threadID);
    }
  }
};
