const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const Users = mongoose.models.users || mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Threads = mongoose.models.threads || mongoose.model("threads", new mongoose.Schema({}, { strict: false }));

module.exports = {
  config: {
    name: "top",
    version: "8.5",
    author: "MahMUD / Gemini",
    role: 0,
    category: "economy",
    guide: { en: "{pn} [bal | exp | cnt] [--style 1/2]" }
  },

  onStart: async function ({ api, args, message }) {
    try {
      const argString = args.join(" ").toLowerCase();
      const isStyle2 = argString.includes("--style 2") || argString.includes("style 2");
      const type = args.find(a => ["bal", "exp", "count"].includes(a.toLowerCase())) || "bal";
      const isExp = type === "exp";
      const isCnt = type === "count";
      const sortField = isExp ? "exp" : "money";

      let users = [];

      // --- DATA FETCHING (Same Logic, New Category) ---
      if (isCnt) {
        // Global Message Count Aggregation
        users = await Threads.aggregate([
          { $unwind: "$members" },
          { $group: { 
              _id: "$members.userID", 
              userID: { $first: "$members.userID" },
              name: { $first: "$members.name" },
              count: { $sum: "$members.count" } 
          }},
          { $sort: { count: -1 } },
          { $limit: 17 }
        ]);
        // Map to standard field for Canvas
        users = users.map(u => ({ ...u, value: u.count }));
      } else {
        const rawUsers = await Users.find({ [sortField]: { $gt: 0 } }).sort({ [sortField]: -1 }).limit(17);
        users = rawUsers.map(u => ({
          userID: u.userID,
          name: u.name || "Unknown",
          value: u[sortField]
        }));
      }

      if (!users.length) return message.reply(`No data found for ${type}.`);

      // --- STYLE 2: TEXT BASED ---
      if (isStyle2) {
        const medals = ["🥇", "🥈", "🥉"];
        const topList = users.slice(0, 15).map((user, index) => {
          const rank = index < 3 ? medals[index] : `${toBoldNumbers(index + 1)}.`;
          const name = toBoldUnicode(user.name || "Unknown");
          const valStr = isCnt ? `${toBoldNumbers(formatShortNumber(user.value))} 𝐌𝐒𝐆𝐒` : (isExp ? `${toBoldNumbers(formatShortNumber(user.value))} 𝐄𝐗𝐏` : formatMoneyBold(user.value));
          return `${rank} ${name}: ${valStr}`;
        });
        const header = `👑 | 𝐓𝐨𝐩 𝟏𝟓 ${isCnt ? "𝐆𝐥𝐨𝐛𝐚𝐥 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐫𝐬" : (isExp ? "𝐄𝐗𝐏 𝐔𝐬𝐞𝐫𝐬" : "𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬")}:`;
        return message.reply(`${header}\n\n${topList.join("\n")}`);
      }

      // --- STYLE 1: CANVAS (100% SAME DESIGN) ---
      const width = 1000;
      const rowHeight = 90;
      const headerHeight = 650;
      const footerSpace = 120;
      const height = headerHeight + (Math.max(0, users.length - 3) * rowHeight) + footerSpace;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background (Same Gradient)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0a0a24");
      bgGrad.addColorStop(0.5, "#151535");
      bgGrad.addColorStop(1, "#0a0a24");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars (Same Effect)
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Title
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 55px Arial";
      ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
      const titleMain = isCnt ? "MESSAGE" : (isExp ? "EXPERIENCE" : "BALANCE");
      ctx.fillText(`TOP ${titleMain} LEADERBOARD`, width / 2, 100);
      ctx.shadowBlur = 0;

      // Podiums
      const top3Pos = [
        { data: users[1], x: 250, y: 350, r: 110, color: "#C0C0C0", rank: "#2" },
        { data: users[0], x: 500, y: 280, r: 130, color: "#FFD700", rank: "#1" },
        { data: users[2], x: 750, y: 350, r: 110, color: "#CD7F32", rank: "#3" }
      ];

      for (const p of top3Pos) {
        if (!p.data) continue;
        ctx.save();
        ctx.shadowBlur = 30; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = p.color; ctx.lineWidth = 8; ctx.stroke();
        ctx.restore();

        await drawCircleImage(ctx, p.data.userID, p.x, p.y, p.r);

        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x + p.r - 20, p.y - p.r + 20, 35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = "bold 30px Arial";
        ctx.fillText(p.rank, p.x + p.r - 20, p.y - p.r + 32);

        ctx.fillStyle = "#FFF"; ctx.font = "bold 32px Arial";
        ctx.fillText(p.data.name || "User", p.x, p.y + p.r + 60);
        
        ctx.fillStyle = "#00ffcc"; ctx.font = "28px Arial";
        const valLabel = isCnt ? "MSGS" : (isExp ? "XP" : "$");
        const valDisplay = isCnt || isExp ? `${formatShort(p.data.value)} ${valLabel}` : `$${formatShort(p.data.value)}`;
        ctx.fillText(valDisplay, p.x, p.y + p.r + 100);
      }

      // List Ranks 4+
      let currentY = headerHeight;
      const maxVal = users[3]?.value || 1;

      for (let i = 3; i < users.length; i++) {
        const user = users[i];
        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        drawRoundRect(ctx, 50, currentY, width - 100, 75, 15); ctx.fill();

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "bold 28px Arial";
        ctx.fillText(`#${i + 1}`, 100, currentY + 45);

        await drawCircleImage(ctx, user.userID, 190, currentY + 38, 28);

        ctx.fillStyle = "#FFF"; ctx.font = "bold 26px Arial";
        ctx.fillText(user.name?.substring(0, 15) || "Unknown", 240, currentY + 45);

        const barMaxWidth = 250; const barX = 480;
        const barWidth = Math.min(Math.max((user.value / maxVal) * barMaxWidth, 10), barMaxWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        drawRoundRect(ctx, barX, currentY + 32, barMaxWidth, 14, 7); ctx.fill();

        const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        barGrad.addColorStop(0, "#4facfe"); barGrad.addColorStop(1, "#00f2fe");
        ctx.fillStyle = barGrad;
        drawRoundRect(ctx, barX, currentY + 32, barWidth, 14, 7); ctx.fill();

        ctx.textAlign = "right";
        ctx.fillStyle = "#00ffcc"; ctx.font = "bold 28px Arial";
        const listVal = isCnt || isExp ? `${formatShort(user.value)} ${isCnt ? "MSGS" : "XP"}` : `$${formatShort(user.value)}`;
        ctx.fillText(listVal, width - 100, currentY + 45);

        currentY += rowHeight;
      }

      // Footer
      const footerY = height - 60;
      const footerText = "Your Hinata baby official";
      const startX = (width - (56 + 15 + ctx.measureText(footerText).width)) / 2 + 28;
      ctx.save(); ctx.beginPath(); ctx.arc(startX, footerY, 28, 0, Math.PI * 2); ctx.clip();
      try { const bImg = await loadImage("https://i.imgur.com/LbIdjhE.jpeg"); ctx.drawImage(bImg, startX-28, footerY-28, 56, 56); } catch(e){}
      ctx.restore();
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.font = "bold 30px Arial";
      ctx.fillText(footerText, startX + 43, footerY + 10);

      const cachePath = path.join(process.cwd(), "cache", `top_all_${Date.now()}.png`);
      fs.ensureDirSync(path.join(process.cwd(), "cache"));
      fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));
      message.reply({ attachment: fs.createReadStream(cachePath) }, () => fs.unlinkSync(cachePath));

    } catch (err) {
      console.error(err);
      message.reply("Error generating leaderboard.");
    }
  }
};

// --- HELPER FUNCTIONS (Preserved 100%) ---
async function drawCircleImage(ctx, uid, x, y, radius) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
  try {
    const baseRes = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    const url = `${baseRes.data.mahmud}/api/pfp?mahmud=${uid}`;
    const img = await loadImage(url);
    ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
  } catch {
    try {
        const fallback = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        ctx.drawImage(fallback, x - radius, y - radius, radius * 2, radius * 2);
    } catch(e) { ctx.fillStyle = "#333"; ctx.fill(); }
  }
  ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}

function formatShort(num) {
  if (!num) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toString();
}

function formatMoneyBold(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) { num /= 1000; unit++; }
  const value = Number(num.toFixed(1)).toString();
  return `$${toBoldNumbers(value)}${units[unit]}`;
}

function formatShortNumber(num) {
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) { num /= 1000; unit++; }
  return Number(num.toFixed(1)) + units[unit];
}

function toBoldNumbers(text) {
  const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗", ".": "." };
  return text.toString().split("").map(c => bold[c] || c).join("");
}

function toBoldUnicode(text) {
  const boldMap = {
    a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
    A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙"
  };
  return (text || "").split("").map(c => boldMap[c] || c).join("");
                }
