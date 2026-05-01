const moment = require("moment-timezone");
const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const boldText = (text) => {
  const bold = {
    "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
    "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
    "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
    "A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
    "K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
    "U":"𝐔","V":"𝐖","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙",
    "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗"
  };
  return text.split("").map(c => bold[c] || c).join("");
};

function formatMoney(num) {
  const units = ["","𝐊","𝐌","𝐁","𝐓"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) { num /= 1000; unit++; }
  return Number(num.toFixed(1)) + units[unit];
}

module.exports = {
  config: {
    name: "vip",
    version: "13.1",
    author: "MahMUD & Gemini",
    countDown: 5,
    role: 0,
    category: "admin",
    guide: { en: "{pn} buy | {pn} info | {pn} list | {pn} add <uid/reply> <days> | {pn} remove <uid/reply> | {pn} cmd" }
  },

  onStart: async function ({ message, args, event, usersData }) {
    const { senderID } = event;
    const userData = await usersData.get(senderID);
    const senderName = userData.name;
    
    await VipUser.deleteMany({ expiredAt: { $lte: new Date() } });

    const admins = ["61580492994318", "100083010056014", "100051067476600", "61585770072511", "61580056291787", "61580682368883", "61587095596896", "61578666041935"];

    const plans = {
      1: { days: 1, cost: 10000000, label: "1 DAY VIP" },
      2: { days: 2, cost: 18000000, label: "2 DAYS VIP" },
      3: { days: 3, cost: 25000000, label: "3 DAYS VIP" },
      4: { days: 5, cost: 40000000, label: "5 DAYS VIP" },
      5: { days: 7, cost: 60000000, label: "7 DAYS VIP" },
      6: { days: 10, cost: 85000000, label: "10 DAYS VIP" },
      7: { days: 15, cost: 120000000, label: "15 DAYS VIP" },
      8: { days: 20, cost: 160000000, label: "20 DAYS VIP" },
      9: { days: 25, cost: 200000000, label: "25 DAYS VIP" },
      10: { days: 30, cost: 240000000, label: "30 DAYS VIP" }
    };

    switch (args[0]) {
      case "add": {
        if (!admins.includes(senderID)) return message.reply(boldText(">🥹\nBaby, Only MahMUD can use this"));
        let uids = [];
        if (Object.keys(event.mentions).length > 0) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else if (args[1] && !isNaN(args[1])) uids.push(args[1]);

        if (!uids.length) return message.reply(boldText("⚠️ | Mention or reply to someone."));
        const days = parseInt(args[2] || args[1]);
        if (isNaN(days)) return message.reply(boldText("⚠️ | Please provide number of days."));

        for (const uid of uids) {
          const current = await VipUser.findOne({ uid });
          const base = current && current.expiredAt > new Date() ? moment(current.expiredAt) : moment().tz("Asia/Dhaka");
          const newExpire = base.add(days, "days").toDate();
          await VipUser.updateOne({ uid }, { uid, expiredAt: newExpire }, { upsert: true });
        }
        return message.reply(boldText(`✅ | Added 𝐕𝐈𝐏 for ${days} days to ${uids.length} user(s).`));
      }

      case "remove": {
        if (!admins.includes(senderID)) return message.reply(boldText(">🥹\nBaby, Only MahMUD can use this"));
        let uids = [];
        if (Object.keys(event.mentions).length > 0) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else if (args[1] && !isNaN(args[1])) uids.push(args[1]);

        if (!uids.length) return message.reply(boldText("⚠️ | Mention or reply to someone to remove."));

        let count = 0;
        for (const uid of uids) {
          const result = await VipUser.deleteOne({ uid });
          if (result.deletedCount > 0) count++;
        }
        
        if (count === 0) return message.reply(boldText("❌ | User(s) not found in 𝐕𝐈𝐏 list."));
        return message.reply(boldText(`✅ | Removed 𝐕𝐈𝐏 access for ${count} user(s).`));
      }

      case "buy": {
        const option = parseInt(args[1]);
        if (!option) {
          const pathImg = path.join(process.cwd(), "cache", `vip_store_${senderID}.png`);
          await createVipCanvas(senderID, senderName, userData.money, plans, "store", null, pathImg);
          return message.reply({
            body: boldText(`Hey ${senderName} 🎀\nSelect a plan using '𝐕𝐈𝐏 buy <number>'\nMax Limit: 30 Days`),
            attachment: fs.createReadStream(pathImg)
          }, () => fs.unlinkSync(pathImg));
        }

        const plan = plans[option];
        if (!plan) return message.reply(boldText("❌ | Invalid option."));

        const existing = await VipUser.findOne({ uid: senderID });
        const now = moment().tz("Asia/Dhaka");
        let currentRemainingDays = 0;

        if (existing && existing.expiredAt > new Date()) {
          const expiration = moment(existing.expiredAt).tz("Asia/Dhaka");
          currentRemainingDays = expiration.diff(now, 'days');
        }

        if (currentRemainingDays + plan.days > 30) {
          return message.reply(boldText(`⚠️ | You cannot accumulate more than 30 days of 𝐕𝐈𝐏.\n• Your current duration: ${currentRemainingDays} days.`));
        }

        if ((userData.money || 0) < plan.cost) return message.reply(boldText(`🥹 | Need ${formatMoney(plan.cost)} Balance.`));

        const base = existing && existing.expiredAt > new Date() ? moment(existing.expiredAt).tz("Asia/Dhaka") : now;
        const newExpire = base.add(plan.days, "days").toDate();

        await VipUser.updateOne({ uid: senderID }, { uid: senderID, expiredAt: newExpire }, { upsert: true });
        await usersData.set(senderID, { money: (userData.money || 0) - plan.cost });
        return message.reply(boldText(`✅ | Success! You are now 𝐕𝐈𝐏 until ${moment(newExpire).format("DD-MM-YYYY")}`));
      }

      case "info": {
        const user = await VipUser.findOne({ uid: senderID });
        if (!user) return message.reply(boldText("❌ | You are not a 𝐕𝐈𝐏 user."));
        
        const pathImg = path.join(process.cwd(), "cache", `vip_status_${senderID}.png`);
        await createVipCanvas(senderID, senderName, userData.money, null, "status", user.expiredAt, pathImg);
        
        return message.reply({
          body: boldText(`👑 | 𝐕𝐈𝐏 ACCOUNT STATUS\n🎀 Holder: ${senderName}`),
          attachment: fs.createReadStream(pathImg)
        }, () => fs.unlinkSync(pathImg));
      }

      case "list": {
        const vips = await VipUser.find({ expiredAt: { $gt: new Date() } }).sort({ expiredAt: -1 });
        if (!vips.length) return message.reply(boldText("❌ | No 𝐕𝐈𝐏 users found."));

        const list = await Promise.all(vips.map(async (u) => {
          const name = await usersData.getName(u.uid);
          const fromDate = moment().tz("Asia/Dhaka").format("DD-MM-YYYY");
          const expDate = moment(u.expiredAt).format("DD-MM-YYYY");
          return `╭─ ${boldText(name)}\n╰‣ ${boldText("From")}: ${boldText(fromDate)}\n╰‣ ${boldText("Exp")}: ${boldText(expDate)}`;
        }));

        const totalVips = boldText(`• TOTAL 𝐕𝐈𝐏 USER: ${vips.length}`);
        const header = `👑 | ${boldText("𝐕𝐈𝐏 Users List")}:\n\n`;
        
        return message.reply(header + list.join("\n\n") + "\n\n" + totalVips);
      }

      case "cmd": {
        const cmdList = 
          "Available 𝐕𝐈𝐏 command\n\n" +
          "1. Art\n" +
          "2. Edit\n" +
          "3. Fakechat\n" +
          "4. Gay\n" +
          "5. Mistake\n" +
          "6. Pair mention\n" +
          "7. Pair msg Reply\n" +
          "8. Fluxpro\n" +
          "9. Sr\n" +
          "10. Toilet\n" +
          "11. Ghibli\n" +
          "12. Bomb\n" +
          "13. numinfo\n" +
          "14. Editpro\n" +
          "15. Coverphoto\n\n" +
          "• More 𝐕𝐈𝐏 command coming soon";
        return message.reply(boldText(cmdList));
      }

      default: {
        const menu = 
`╭─ [ HINATA 𝐕𝐈𝐏 MENU ]
╰‣ Add
╰‣ Remove
╰‣ List
╰‣ info
╰‣ Buy
╰‣ Cmd

• ${senderName}`;
        return message.reply(boldText(menu));
      }
    }
  }
};

// Canvas and helper functions remain unchanged
async function createVipCanvas(uid, name, money, plans, type, expiry, savePath) {
  const width = 1000, height = type === "store" ? 1300 : 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, "#0f172a"); bgGrad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(102, 217, 239, 0.05)"; ctx.beginPath(); ctx.arc(900, 150, 250, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(189, 147, 249, 0.05)"; ctx.beginPath(); ctx.arc(100, height - 100, 350, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  drawRoundRect(ctx, 50, 50, width - 100, 230, 40); ctx.fill();
  const pX = 170, pY = 165, pR = 80;
  ctx.save();
  ctx.beginPath(); ctx.arc(pX, pY, pR + 8, 0, Math.PI * 2);
  ctx.shadowBlur = 25; ctx.shadowColor = "#ff69b4";
  ctx.fillStyle = "#ff69b4"; ctx.fill();
  ctx.restore();
  await drawCircleImage(ctx, uid, pX, pY, pR);
  if (type === "status") {
      ctx.save();
      const bX = pX + 55, bY = pY + 55, bR = 30;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bX, bY, bR + 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bX, bY, bR, 0, Math.PI * 2); ctx.clip();
      try {
        const badgeUrl = "https://i.imgur.com/zNzNEpN.jpeg";
        const badgeImg = await loadImage(badgeUrl);
        ctx.drawImage(badgeImg, bX - bR, bY - bR, bR * 2, bR * 2);
      } catch (e) { ctx.fillStyle = "#1D9BF0"; ctx.fill(); }
      ctx.restore();
  }
  ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "bold 45px Arial";
  ctx.fillText(name || "User", 280, 140);
  if (type === "store") {
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 26px Arial";
    ctx.fillText(`Baby, Your Balance: ${formatMoney(money || 0)}`, 280, 190);
    let dy = 340;
    ctx.fillStyle = "#fff"; ctx.font = "bold 38px Arial";
    ctx.fillText("👑 VIP PREMIUM STORE", 50, dy);
    ctx.strokeStyle = "#bd93f9"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(50, dy + 15); ctx.lineTo(180, dy + 15); ctx.stroke();
    dy += 70;
    const planKeys = Object.keys(plans);
    for (let i = 0; i < planKeys.length; i++) {
      const plan = plans[planKeys[i]];
      const x = (i % 2 === 0) ? 50 : 510;
      if (i > 0 && i % 2 === 0) dy += 160;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      drawRoundRect(ctx, x, dy, 440, 140, 25); ctx.fill();
      ctx.fillStyle = "#FFD700"; ctx.font = "bold 28px Arial";
      ctx.fillText(`${planKeys[i]}. ${plan.label}`, x + 25, dy + 55);
      ctx.fillStyle = "#00FFCC"; ctx.font = "bold 24px Arial";
      ctx.fillText(`Cost: ${formatMoney(plan.cost)}`, x + 25, dy + 100);
    }
  } else if (type === "status") {
    ctx.fillStyle = "#ff69b4"; ctx.font = "bold 28px Arial";
    ctx.fillText("Baby, You are VIP User", 280, 190);
    let dy = 350;
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    drawRoundRect(ctx, 50, dy, 900, 420, 30); ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#00FFCC"; ctx.font = "bold 45px Arial";
    ctx.fillText("PREMIUM ELITE MEMBERSHIP", width / 2, dy + 80);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff"; ctx.font = "bold 34px Arial";
    const fromDate = moment().tz("Asia/Dhaka").format("DD MMMM, YYYY");
    const expDate = moment(expiry).format("DD MMMM, YYYY");
    ctx.fillText(`FROM    :  ${fromDate}`, 150, dy + 180);
    ctx.fillText(`EXPIRE :  ${expDate}`, 150, dy + 250);
    const now = moment().tz("Asia/Dhaka");
    const end = moment(expiry);
    const maxBarWidth = 700;
    const daysLeft = Math.max(0, end.diff(now, 'days'));
    const progressPercentage = Math.min(1, daysLeft / 30); 
    const progressWidth = progressPercentage * maxBarWidth;
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    drawRoundRect(ctx, 150, dy + 300, maxBarWidth, 20, 10); ctx.fill();
    if (progressWidth > 0) {
      ctx.fillStyle = "#00FFCC";
      drawRoundRect(ctx, 150, dy + 300, progressWidth, 20, 10); ctx.fill();
    }
    ctx.fillStyle = "#fff"; ctx.font = "italic 24px Arial"; ctx.textAlign = "center";
    ctx.fillText(`Time Remaining: ${daysLeft} Days`, width / 2, dy + 360);
    ctx.font = "bold 22px Arial"; ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("Thank you for being with us", width / 2, dy + 400);
  }
  fs.writeFileSync(savePath, canvas.toBuffer("image/png"));
}

async function drawCircleImage(ctx, uid, x, y, radius) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
  try {
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const img = await loadImage(avatarUrl);
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  } catch (e) { ctx.fillStyle = "#333"; ctx.fill(); }
  ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
