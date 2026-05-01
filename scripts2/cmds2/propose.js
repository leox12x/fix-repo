const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

function toBoldUnicode(name) {
  const boldAlphabet = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣",
    k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭",
    u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉",
    K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓",
    U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
  };
  return String(name).split("").map(c => boldAlphabet[c] || c).join("");
}

module.exports = {
  config: {
    name: "propose",
    version: "2.1",
    author: "MahMUD",
    category: "love",
    countDown: 10,
    cost: 1000, // <--- Handler (index.js) eikhan theke cost logic nibe
    guide: "{pn} [1|2|3|4|5] or {pn} list (mention or reply to someone)",
  },

  onStart: async function ({ api, usersData, event, args }) {
    const { senderID, threadID, messageID } = event;

    // --- Cost check and deduction is now handled automatically by index.js ---

    // Style Handling
    let style = "1";
    if (args[0]?.toLowerCase() === "list") {
      return api.sendMessage(
        `Total Propose styles: 5\n\n• Example: propose @someone`,
        threadID,
        messageID
      );
    }
    if (args[0] && /^[1-5]$/.test(args[0])) style = args[0];

    // Mentions & Reply Handling
    const mentions = Object.keys(event.mentions || {});
    const reply = event.messageReply;
    let id1, id2;

    if (mentions.length >= 2) {
      id1 = mentions[0];
      id2 = mentions[1];
    } else if (mentions.length === 1) {
      id1 = senderID;
      id2 = mentions[0];
    } else if (reply && reply.senderID && reply.senderID !== senderID) {
      id1 = senderID;
      id2 = reply.senderID;
    } else {
      // Note: If no one is mentioned/replied, command stops here.
      return api.sendMessage(
        "❌ Please mention, reply, or provide UID to propose someone.",
        threadID,
        messageID
      );
    }

    try {
      const [userData1, userData2] = await Promise.all([
        usersData.get(id1),
        usersData.get(id2)
      ]);

      let name1 = userData1.name;
      let name2 = userData2.name;

      // Gender Swap Logic (Female first if sender is female)
      let senderGender = userData1.gender === 1 ? "female" : userData1.gender === 2 ? "male" : "unknown";
      if (senderGender === "female" && id1 === senderID) {
        [id1, id2] = [id2, id1];
        [name1, name2] = [name2, name1];
      }

      const apiUrl = await baseApiUrl();
      const { data } = await axios.get(
        `${apiUrl}/api/propose?user1=${id1}&user2=${id2}&style=${style}`,
        { responseType: "arraybuffer" }
      );

      if (!data) {
        return api.sendMessage("❌ Failed to generate image.", threadID, messageID);
      }

      const outputPath = path.join(__dirname, `propose_${senderID}.png`);
      fs.writeFileSync(outputPath, Buffer.from(data));

      const styledName1 = toBoldUnicode(name1);
      const styledName2 = toBoldUnicode(name2);
      const lovePercentage = Math.floor(Math.random() * 100) + 1;

      await api.sendMessage(
        {
          body: `𝐏𝐫𝐨𝐩𝐨𝐬𝐞 𝐌𝐚𝐭𝐜𝐡 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥🫶🏻\n• ${styledName1} 🎀\n• ${styledName2} 🎀\n💌 𝐖𝐢𝐥𝐥 𝐲𝐨𝐮 𝐦𝐚𝐫𝐫𝐲 𝐦𝐞 𝐦𝐲 𝐩𝐨𝐨𝐤𝐢𝐞 💕\n\n💙 Propose percentage: ${lovePercentage}%`,
          attachment: fs.createReadStream(outputPath),
        },
        threadID,
        () => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        },
        messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error: " + err.message, threadID, messageID);
    }
  },
};
