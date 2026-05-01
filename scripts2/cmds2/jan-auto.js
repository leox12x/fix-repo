const axios = require("axios");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// ==========================================
// Schema & Models
// ==========================================
const ChatModel = mongoose.models.Chat || mongoose.model('Chat', new mongoose.Schema({
  senderID: String,
  message: String,
  time: { type: Date, default: Date.now }
}));

const JantPermission = mongoose.models.JantPermission || mongoose.model('JantPermission', new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  addedBy: String,
  addedAt: { type: Date, default: Date.now }
}));

const vipSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const badWords = ["sexy", "sawa", "sex", "chudi", "cudi", "bodai","vodaii","mgi","janowar","kp","khanki","kanki","kukur","fuk","putki","sawya","fuck","mg","bitch","mc","maki","bc","maderchod","asshole","slut","dick","pussy","whore","magi","buda","voda","dhon","heda"];

function containsBadWord(text) { return badWords.some(word => text.toLowerCase().includes(word)); }

const getBaseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud + "/api/jan";
  } catch (e) { return null; }
};

const boldText = (text) => {
    const bold = { "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣","k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭","u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳","A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉","K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓","U":"𝐔","V":"𝐖","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙","0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗" };
    return text.split("").map(c => bold[c] || c).join("");
};

const specialUsers = ["61556006709662", "61582357109253", "61575279513663", "61582588881607", "61587095596896", "61580682368883"];
const allowedThreads = ["7460623087375340", "25332509896387705", "24821970854134199"];

module.exports = {
  config: {
    name: "jant",
    version: "7.0",
    author: "MahMUD & Gemini",
    role: 0,
    category: "ai",
    guide: { en: "{pn} | {pn} task | {pn} claim <number>" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;
    const name = await usersData.getName(senderID) || "User";
    const today = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
    let userData = await usersData.get(senderID);

    // Initialization
    if (!userData.data.jantTasks) userData.data.jantTasks = { lastReset: today, claimed: [] };
    if (userData.data.jantTasks.lastReset !== today) {
        userData.data.jantTasks.claimed = [];
        userData.data.jantTasks.lastReset = today;
    }
    const currentTeach = (userData.data.jantCount && userData.data.jantCount.lastReset === today) ? userData.data.jantCount.count : 0;

    let tasks = [
        { id: "1", cur: currentTeach, req: 20, name: "Baby Teach I", desc: "Teach Baby 20 times", rew: "2M", type: "money" },
        { id: "2", cur: currentTeach, req: 30, name: "Baby Teach II", desc: "Teach Baby 30 times", rew: "4k Exp", type: "exp" },
        { id: "3", cur: currentTeach, req: 50, name: "Baby Teach III", desc: "Teach Baby 50 times", rew: "5M", type: "money" },
        { id: "4", cur: currentTeach, req: 100, name: "Master Teacher", desc: "Teach Baby 100 times", rew: "1D VIP", type: "vip" }
    ];

    if (args[0] === "task") {
        const width = 1000, height = 800;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Background Logic (Same as Daily)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, "#0f172a"); bgGrad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "rgba(102, 217, 239, 0.05)"; ctx.beginPath(); ctx.arc(900, 150, 250, 0, Math.PI * 2); ctx.fill();

        // Header Box
        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        drawRoundRect(ctx, 50, 50, width - 100, 230, 40); ctx.fill();

        // Pink Glowing Profile
        const pfpX = 170, pfpY = 165, pfpR = 80;
        ctx.save();
        ctx.beginPath(); ctx.arc(pfpX, pfpY, pfpR + 8, 0, Math.PI * 2);
        ctx.shadowBlur = 20; ctx.shadowColor = "#ff69b4";
        ctx.fillStyle = "#ff69b4"; ctx.fill();
        ctx.restore();
        await drawCircleImage(ctx, api, senderID, pfpX, pfpY, pfpR);

        ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "bold 45px Arial";
        ctx.fillText(userData.name || "User", 280, 140);
        ctx.fillStyle = "#66d9ef"; ctx.font = "bold 26px Arial";
        ctx.fillText(`Today's Teach Count: ${currentTeach}`, 280, 190);

        let dy = 340;
        ctx.fillStyle = "#fff"; ctx.font = "bold 38px Arial";
        ctx.fillText("👤 JANT MISSIONS", 50, dy);
        ctx.strokeStyle = "#bd93f9"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(50, dy + 15); ctx.lineTo(180, dy + 15); ctx.stroke();
        dy += 70;

        tasks.forEach((t, i) => {
            const isClaimed = userData.data.jantTasks.claimed.includes(t.id);
            const progress = Math.min(t.cur / t.req, 1);
            const isReady = progress >= 1 && !isClaimed;

            const x = i % 2 === 0 ? 50 : 510;
            if(i > 0 && i % 2 === 0) dy += 165; 

            // Box Style
            ctx.fillStyle = isClaimed ? "rgba(80, 250, 123, 0.08)" : "rgba(255,255,255,0.04)";
            drawRoundRect(ctx, x, dy, 440, 150, 25); ctx.fill();
            if(isReady) { ctx.strokeStyle = "#66d9ef"; ctx.lineWidth = 2; ctx.stroke(); }

            // Text
            ctx.fillStyle = "#fff"; ctx.font = "bold 26px Arial";
            ctx.fillText(`${t.id}. ${t.name}`, x + 25, dy + 40);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "18px Arial";
            ctx.fillText(t.desc, x + 25, dy + 70);

            // Progress Bar
            ctx.fillStyle = "#1e293b"; drawRoundRect(ctx, x + 25, dy + 95, 280, 10, 5); ctx.fill();
            if (progress > 0) {
                ctx.fillStyle = isClaimed ? "#50fa7b" : (isReady ? "#66d9ef" : "#ffb86c");
                drawRoundRect(ctx, x + 25, dy + 95, 280 * progress, 10, 5); ctx.fill();
            }

            ctx.textAlign = "right"; ctx.font = "bold 20px Arial"; ctx.fillStyle = "#bd93f9";
            ctx.fillText(`🎁 ${t.rew}`, x + 415, dy + 40);
            ctx.font = "bold 20px Arial"; ctx.fillStyle = isClaimed ? "#50fa7b" : (isReady ? "#66d9ef" : "#ff5555");
            ctx.fillText(isClaimed ? "✓ CLAIMED" : (isReady ? "✦ READY" : `${t.cur}/${t.req}`), x + 415, dy + 125);
            ctx.textAlign = "left";
        });

        const pathImg = `./cache/jant_task_${senderID}.png`;
        fs.ensureDirSync("./cache");
        fs.writeFileSync(pathImg, canvas.toBuffer());
        return api.sendMessage({ body: boldText(`Hey ${userData.name} 🎀\nUse !jant claim <number> to get rewards!`), attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID);
    }

    if (args[0] === "claim") {
        const id = args[1];
        const t = tasks.find(x => x.id === id);
        if (!t) return api.sendMessage(boldText("❌ Invalid Task ID"), threadID, messageID);
        if (userData.data.jantTasks.claimed.includes(id)) return api.sendMessage(boldText("❌ Already claimed!"), threadID, messageID);
        if (t.cur < t.req) return api.sendMessage(boldText("❌ Mission incomplete!"), threadID, messageID);

        let rewardMsg = "";
        if (t.type === "money") {
            const val = t.id === "1" ? 2000000 : 5000000;
            userData.money += val; rewardMsg = t.rew + " balance";
        } else if (t.type === "exp") {
            userData.exp += 4000; rewardMsg = "4000 Exp";
        } else if (t.type === "vip") {
            const existing = await VipUser.findOne({ uid: senderID });
            const base = existing && existing.expiredAt > new Date() ? moment(existing.expiredAt) : moment().tz("Asia/Dhaka");
            await VipUser.updateOne({ uid: senderID }, { uid: senderID, expiredAt: base.add(1, "days").toDate() }, { upsert: true });
            rewardMsg = "1 Day 𝐕𝐈𝐏";
        }

        userData.data.jantTasks.claimed.push(id);
        await usersData.set(senderID, userData);
        return api.sendMessage(boldText(`✅ Successfully claimed ${t.name}!\n• Reward: ${rewardMsg}`), threadID, messageID);
    }

    // --- Permission & Game Logic (Original) ---
    if (args[0] === "add" || args[0] === "remove" || args[0] === "list") {
      if (!specialUsers.includes(senderID)) return api.sendMessage("❌ Only Admins can manage permissions.", threadID, messageID);
      if (args[0] === "add") {
        const targetID = args[1] || (event.messageReply ? event.messageReply.senderID : null);
        if (!targetID) return api.sendMessage("⚠️ UID দিন।", threadID, messageID);
        await JantPermission.updateOne({ uid: targetID }, { uid: targetID, addedBy: senderID }, { upsert: true });
        return api.sendMessage(`✅ User ${targetID} added.`, threadID, messageID);
      }
      if (args[0] === "remove") {
        const targetID = args[1] || (event.messageReply ? event.messageReply.senderID : null);
        await JantPermission.deleteOne({ uid: targetID });
        return api.sendMessage(`🗑️ Removed ${targetID}.`, threadID, messageID);
      }
      if (args[0] === "list") {
        const all = await JantPermission.find();
        let msg = "📜 **Permission List:**\n\n";
        for (let p of all) msg += `• ${p.uid}\n`;
        return api.sendMessage(msg, threadID, messageID);
      }
    }

    const hasPermission = await JantPermission.findOne({ uid: senderID });
    if (!specialUsers.includes(senderID) && !hasPermission) return api.sendMessage("❌ পারমিশন নেই।", threadID, messageID);
    if (!allowedThreads.includes(threadID) && !specialUsers.includes(senderID)) return api.sendMessage("❌ নট এলাউড।", threadID, messageID);

    await this.sendQuestion(api, event, usersData);
  },

  sendQuestion: async function (api, event, usersData) {
    try {
      const replies = await ChatModel.find();
      const cleanReplies = replies.filter(r => r.message && !containsBadWord(r.message));
      if (!cleanReplies.length) return api.sendMessage("❌ DB Empty.", event.threadID);
      const randomReply = cleanReplies[Math.floor(Math.random() * cleanReplies.length)];
      const name = await usersData.getName(event.senderID);

      const qMsg = `📚 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧: ${randomReply.message}\n\n• Reply answer or 'skip'\n• ${name}`;
      api.sendMessage(qMsg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, trigger: randomReply.message, author: event.senderID, answered: false });
      }, event.messageID);
      await ChatModel.findByIdAndDelete(randomReply._id);
    } catch (err) { console.error(err); }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { senderID, threadID, messageID: replyMsgID, body } = event;
    const { trigger, author, answered } = Reply;
    const gameMessageID = event.messageReply.messageID;
    if (senderID !== author || answered) return;
    const name = await usersData.getName(senderID);

    if (body.toLowerCase() === "skip") {
      Reply.answered = true;
      api.editMessage(`✅ Skip this question\n\n• ${name}`, gameMessageID);
      api.unsendMessage(replyMsgID);
      return setTimeout(() => this.sendQuestion(api, event, usersData), 1500);
    }

    const apiUrl = await getBaseApiUrl();
    try {
      Reply.answered = true;
      const response = await axios.post(`${apiUrl}/teach2`, { trigger: trigger, responses: body, userID: senderID });

      const today = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
      let userData = await usersData.get(senderID);
      userData.money = (userData.money || 0) + 1000;
      userData.exp = (userData.exp || 0) + 50;
      if (!userData.data.jantCount || userData.data.jantCount.lastReset !== today) {
        userData.data.jantCount = { count: 1, lastReset: today };
      } else { userData.data.jantCount.count++; }
      await usersData.set(senderID, userData);

      const resultMsg = `✅ Replies added Successfully to Question "${trigger}"\nTotal Teach: ${response.data.count || 0}\nYou Earned 1000 coins & 50 exp\n\n• ${name}`;
      api.editMessage(resultMsg, gameMessageID);
      api.unsendMessage(replyMsgID);
      setTimeout(() => this.sendQuestion(api, event, usersData), 1500);
    } catch (error) {
      const errorData = error.response?.data || error.message;
      api.editMessage(`${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}\n\n• ${name}`, gameMessageID);
      api.unsendMessage(replyMsgID);
      setTimeout(() => this.sendQuestion(api, event, usersData), 1500);
    }
  }
};

async function drawCircleImage(ctx, api, uid, x, y, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    try {
        const img = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    } catch (e) { ctx.fillStyle = "#333"; ctx.fill(); }
    ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 0) w = 0;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
