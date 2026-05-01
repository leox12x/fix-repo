const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

function formatMoney(num) {
  const units = ["", "K", "M", "B"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "friend",
    version: "1.8",
    author: "MahMUD",
    category: "love",
    guide: "{pn} [1|2|3|4|5] or {pn} list (mention, reply, or UID)",
  },

  onStart: async function ({ api, usersData, event, args }) {
    const senderID = event.senderID;
    const COST = 1000;

    const userData = await usersData.get(senderID);
    const balance = userData.money || 0;

    if (balance < COST) {
    return api.sendMessage(
        `𝐁𝐚𝐛𝐲, 𝐧𝐞𝐞𝐝 ${formatMoney(COST)} 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝, 𝐛𝐮𝐭 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 ${formatMoney(balance)} 🥹\n\n• 𝐔𝐬𝐞 𝐝𝐚𝐢𝐥𝐲 𝐟𝐨𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐫 𝐩𝐥𝐚𝐲 𝐠𝐚𝐦𝐞𝐬`,
        event.threadID,
        event.messageID
      );
    }

    await usersData.set(senderID, { money: balance - COST });
    let style = "1";
    if (args[0]?.toLowerCase() === "list") {
      return api.sendMessage(
        `Total friend styles: 5\n\n• Example: propose @someone`,
        event.threadID,
        event.messageID
      );
    }
    if (args[0] && /^[1-5]$/.test(args[0])) style = args[0];

    let id1 = senderID;
    let id2;

    const mentions = Object.keys(event.mentions || {});
    const reply = event.messageReply;

    if (mentions.length >= 2) {
      id1 = mentions[0];
      id2 = mentions[1];
    } else if (mentions.length === 1) {
      id2 = mentions[0];
    } else if (reply && reply.senderID && reply.senderID !== senderID) {
      id2 = reply.senderID;
    } else if (args[0] && /^\d+$/.test(args[0])) {
      
      id2 = args[0];
    }

    if (!id2) {
      return api.sendMessage(
        "❌ Please mention, reply, or provide UID to Friend someone.",
        event.threadID,
        event.messageID
      );
    }
    
    const userData1 = await usersData.get(id1);
    const userData2 = await usersData.get(id2);
    let name1 = userData1.name;
    let name2 = userData2.name;

    const senderData = await usersData.get(senderID);
    let senderGender = senderData.gender;
    if (senderGender === 1) senderGender = "female";
    else if (senderGender === 2) senderGender = "male";
    else senderGender = "unknown";

    if (senderGender === "female" && id1 === senderID) {
      [id1, id2] = [id2, id1];
      [name1, name2] = [name2, name1];
    }

    try {
      const apiUrl = await baseApiUrl();
      const { data } = await axios.get(
        `${apiUrl}/api/friend?user1=${id1}&user2=${id2}&style=${style}`,
        { responseType: "arraybuffer" }
      );

      if (!data) {
        return api.sendMessage("❌ Failed to generate image.", event.threadID, event.messageID);
      }

      const outputPath = path.join(__dirname, `propose_${senderID}.png`);
      fs.writeFileSync(outputPath, Buffer.from(data));

      // Bold unicode
      function toBoldUnicode(name) {
        const boldAlphabet = {
          a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
          k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
          u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
          A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
          K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
          U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
        };
        return name.split("").map(c => boldAlphabet[c] || c).join("");
      }

      const styledName1 = toBoldUnicode(name1);
      const styledName2 = toBoldUnicode(name2);
      const lovePercentage = Math.floor(Math.random() * 100) + 1;

      await api.sendMessage(
        {
          body: `𝐅𝐫𝐢𝐞𝐧𝐝 𝐌𝐚𝐭𝐜𝐡 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥🫶🏻\n• ${styledName1} 🎀\n• ${styledName2} 🎀\n💌 𝐆𝐨𝐥𝐝𝐞𝐧 𝐦𝐨𝐦𝐞𝐧𝐭𝐬 𝐰𝐢𝐭𝐡 𝐠𝐨𝐥𝐝𝐞𝐧 𝐬𝐨𝐮𝐥𝐬.💕\n\n💙 Friend percentage: ${lovePercentage}%`,
          attachment: fs.createReadStream(outputPath),
        },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error: " + err.message, event.threadID, event.messageID);
    }
  },
};
