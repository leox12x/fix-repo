const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true },
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

function toBold(text) {
  const map = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤",
    l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯",
    w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊",
    L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕",
    W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
    "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
  };
  return String(text).split("").map(c => map[c] || c).join("");
}

function getGenderString(genderNum) {
  return genderNum === 1 ? "female" : genderNum === 2 ? "male" : "unknown";
}

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

const DAILY_LIMIT = 20;

module.exports = {
  config: {
    name: "pair",
    version: "2.7",
    author: "MahMUD",
    countDown: 10,
    cost: 1000, // <--- Handler eikhan theke cost logic nibe
    category: "love",
    guide: "{pn} [style] | {pn} @mention [style] | {pn} list",
  },

  onStart: async function ({ api, usersData, event, args }) {
    const { senderID, threadID, messageID } = event;
    const now = moment.tz("Asia/Dhaka");
    const today = now.format("DD/MM/YYYY");

    let userData = await usersData.get(senderID);

    const vip = await VipUser.findOne({
      uid: senderID,
      expiredAt: { $gt: new Date() },
    });

    // Daily Limit Check
    if (!vip) {
      if (!userData.data.pairLimit || userData.data.pairLimit.lastReset !== today) {
        userData.data.pairLimit = { count: 0, lastReset: today };
      }
      if (userData.data.pairLimit.count >= DAILY_LIMIT) {
        const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
        return api.sendMessage(toBold(`• 𝐁𝐚𝐛𝐲, 𝐏𝐚𝐢𝐫 𝐥𝐢𝐦𝐢𝐭 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 (20/20), 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 ${duration.hours()}𝐡 ${duration.minutes()}𝐦.`), threadID, messageID);
      }
    }

    let style = args.find(a => /^\d+$/.test(a)) || "1";
    if (args[0] && ["list", "rules"].includes(args[0].toLowerCase())) {
      return api.sendMessage(
        toBold("𝐏𝐀𝐈𝐑 𝐔𝐒𝐄 𝐑𝐔𝐋𝐄𝐒 🎀\n\n• pair — random\n• pair <style> — random with style\n• pair @mention \n• pair <style> @mention \n• pair <reply message>\n• pair <style> @user1 @user2\n• note — pair mention or message reply only VIP user\n\nTotal Styles: 30\nExample:\n• pair 5\n• pair 5 @mention"),
        threadID,
        messageID
      );
    }

    let id1 = senderID;
    let id2;
    const mentions = Object.keys(event.mentions || {});
    const reply = event.messageReply;
    let genderNotice = "";

    // Mention/Reply Logic
    if (mentions.length > 0 || (reply && reply.senderID && reply.senderID !== senderID)) {
      if (!vip) {
        return api.sendMessage(toBold("🥹 𝐁𝐚𝐛𝐲, 𝐨𝐧𝐥𝐲 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐦𝐞𝐧𝐭𝐢𝐨𝐧 𝐨𝐫 𝐫𝐞𝐩𝐥𝐲 𝐩𝐚𝐢𝐫𝐢𝐧𝐠."), threadID, messageID);
      }

      if (mentions.length >= 2) {
        id1 = mentions[0];
        id2 = mentions[1];
      } else if (mentions.length === 1) {
        id2 = mentions[0];
      } else if (reply) {
        id2 = reply.senderID;
      }

      const [uD1, uD2] = await Promise.all([usersData.get(id1), usersData.get(id2)]);
      const g1 = getGenderString(uD1.gender);
      const g2 = getGenderString(uD2.gender);
      if (g1 === g2 && g1 !== "unknown") {
        genderNotice = toBold(`⚠️ Note: Both users are ${g1}s.`);
      }
    } else {
      // Random Match Logic (Cost handle hobe index.js theke)
      const threadInfo = await api.getThreadInfo(threadID);
      const users = threadInfo.userInfo;
      const myData = users.find(u => u.id === senderID);
      const myGender = myData ? myData.gender : 0;

      let matchCandidates = users.filter(u => u.id !== senderID && u.gender !== 0 && u.gender !== myGender);
      
      if (matchCandidates.length === 0) {
        matchCandidates = users.filter(u => u.id !== senderID);
        if (matchCandidates.length > 0) {
          const pick = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
          const pG = pick.gender;
          if (myGender === pG && myGender !== 0) {
            genderNotice = toBold(`⚠️ Note: Could not find an opposite gender match. Same gender pairing occurred.`);
          } else if (pG === 0) {
            genderNotice = toBold(`⚠️ Note: No opposite gender found. Paired with a user with unknown gender.`);
          }
          id2 = pick.id;
        }
      } else {
        id2 = matchCandidates[Math.floor(Math.random() * matchCandidates.length)].id;
      }
    }

    if (!id2) return api.sendMessage(toBold("No suitable match found in this group."), threadID, messageID);

    const [finalU1, finalU2] = await Promise.all([usersData.get(id1), usersData.get(id2)]);
    let name1 = finalU1.name, name2 = finalU2.name;

    if (finalU2.gender === 2 && finalU1.gender !== 2) {
      [id1, id2] = [id2, id1];
      [name1, name2] = [name2, name1];
    }

    const checkU1 = await usersData.get(id1);
    const checkU2 = await usersData.get(id2);
    const marker1 = checkU1.gender === 2 ? "💙" : "🎀";
    const marker2 = checkU2.gender === 1 ? "🎀" : "💙";

    try {
      const apiUrl = await baseApiUrl();
      const { data } = await axios.get(
        `${apiUrl}/api/pair/mahmud?user1=${id1}&user2=${id2}&style=${style}`, 
        { responseType: "arraybuffer" }
      );
      
      const outputPath = path.join(__dirname, `pair_${senderID}.png`);
      fs.writeFileSync(outputPath, Buffer.from(data));

      const lovePercentage = Math.floor(Math.random() * 100) + 1;
      const usageDisplay = vip ? "Infinity" : `${userData.data.pairLimit.count + 1}/${DAILY_LIMIT}`;

      const finalBody = [
        `🥰 ${toBold("𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐏𝐚𝐢𝐫𝐢𝐧𝐠")}`,
        `• ${toBold(name1)} ${marker1}`,
        `• ${toBold(name2)} ${marker2}`,
        `💌 ${toBold("𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞")}: ${toBold(lovePercentage)}%`,
        "",
        `•${toBold("𝐏𝐚𝐢𝐫 𝐒𝐭𝐲𝐥𝐞")}: ${toBold(style)}`,
        `•${toBold("𝐃𝐚𝐢𝐥𝐲 𝐋𝐢𝐦𝐢𝐭")}: ${toBold(usageDisplay)}`,
        genderNotice ? `\n${genderNotice}` : ""
      ].join("\n").trim();

      await api.sendMessage({
        body: finalBody,
        attachment: fs.createReadStream(outputPath)
      }, threadID, async () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (!vip) {
          userData.data.pairLimit.count++;
          await usersData.set(senderID, userData);
        }
      }, messageID);

    } catch (err) {
      console.error(err);
      const errorMsg = err.response && err.response.data instanceof Buffer 
        ? Buffer.from(err.response.data).toString() 
        : err.message;
      
      return api.sendMessage(`${errorMsg}`, threadID, messageID);
    }
  }
};
