const Canvas = require("canvas");
const mongoose = require('mongoose');
const fs = require('fs-extra');
const axios = require('axios');
const path = require("path");

// --- VIP Schema --- 
const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

// --- USERS Schema --- 
const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  name: { type: String, default: "Unknown" }, 
  exp: { type: Number, default: 0, index: true }
});
userSchema.index({ exp: -1, userID: 1 });
const Users = mongoose.models.Users || mongoose.model("Users", userSchema);

const defaultFontName = "BeVietnamPro-SemiBold";
const defaultPathFontName = `${__dirname}/assets/font/BeVietnamPro-SemiBold.ttf`;
const { randomString } = global.utils || { randomString: () => Math.random().toString(36).substring(7) };

Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-Bold.ttf`, { family: "BeVietnamPro-Bold" });
Canvas.registerFont(defaultPathFontName, { family: defaultFontName });

const expToLevel = (exp, deltaNextLevel) => Math.floor((1 + Math.sqrt(1 + 8 * (exp || 0) / deltaNextLevel)) / 2);
const levelToExp = (level, deltaNextLevel) => Math.floor(((Math.pow(level, 2) - level) * deltaNextLevel) / 2);
const percentage = total => total / 100;

module.exports = {
  config: {
    name: "rank",
    version: "4.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "rank",
    guide: { en: "{pn} [empty | @tags | top]" },
    envConfig: { deltaNext: 5 }
  },
    
  onStart: async function ({ message, event, args, commandName, envCommands, api }) {
    const deltaNext = envCommands[commandName].deltaNext;

    if (args[0] === "top") {
      const topUsers = await Users.find().sort({ exp: -1 }).limit(5).lean();
      if (!topUsers.length) return message.reply("No users found.");

      const cardBuffers = await Promise.all(topUsers.map(async (user) => {
        const stream = await makeRankCard(user.userID, deltaNext, api);
        return streamToBuffer(stream);
      }));

      const combinedStream = await combineRankCards(cardBuffers);
      const pathSave = path.join(__dirname, "cache", `${randomString(10)}.png`);
      const buffer = await streamToBuffer(combinedStream);
      fs.ensureDirSync(path.dirname(pathSave));
      fs.writeFileSync(pathSave, buffer);

      return message.reply({ 
        body: "👑 Hinata Official Leaderboard", 
        attachment: fs.createReadStream(pathSave) 
      }, () => fs.unlinkSync(pathSave));
    }

    let targetUsers = Object.keys(event.mentions).length == 0 ? [event.senderID] : Object.keys(event.mentions);
    const rankCards = await Promise.all(targetUsers.map(async userID => {
      const rankCardStream = await makeRankCard(userID, deltaNext, api); 
      const pathImg = path.join(__dirname, "cache", `${randomString(10)}.png`);
      const buffer = await streamToBuffer(rankCardStream);
      fs.ensureDirSync(path.dirname(pathImg));
      fs.writeFileSync(pathImg, buffer);
      return fs.createReadStream(pathImg);
    }));
    return message.reply({ attachment: rankCards });
  }
};

// --- Helpers ---
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// --- Leaderboard combining logic with Footer Image ---
async function combineRankCards(cardBuffers) {
  const spacing = 30, headerH = 250, footerH = 180;
  const firstImg = await Canvas.loadImage(cardBuffers[0]);
  const width = firstImg.width, cardH = firstImg.height;
  const totalHeight = headerH + (cardH * cardBuffers.length) + (spacing * (cardBuffers.length - 1)) + footerH;

  const canvas = Canvas.createCanvas(width, totalHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, width, totalHeight);

  // Header Box
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, headerH - 80);

  ctx.textAlign = "center";
  ctx.shadowBlur = 20; ctx.shadowColor = "#FFD700";
  const grad = ctx.createLinearGradient(width/2 - 400, 0, width/2 + 400, 0);
  grad.addColorStop(0, "#FFD700"); grad.addColorStop(0.5, "#FFFACD"); grad.addColorStop(1, "#FFD700");
  ctx.fillStyle = grad;
  ctx.font = "bold 110px Arial"; 
  ctx.fillText("TOP RANK LEADERBOARD", width / 2, 160);
  ctx.shadowBlur = 0;

  for (let i = 0; i < cardBuffers.length; i++) {
    const img = await Canvas.loadImage(cardBuffers[i]);
    const y = headerH + (i * (cardH + spacing));
    ctx.drawImage(img, 0, y, width, cardH);
  }

  // --- FOOTER SECTION (Updated with PNG and Box) ---
  const footerY = totalHeight - 90;
  const footerImgUrl = "https://i.imgur.com/LbIdjhE.jpeg";
  const footerText = "Hinata Baby Official";

  ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
  ctx.fillRect(width/2 - 450, footerY - 55, 900, 110);
  ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
  ctx.strokeRect(width/2 - 450, footerY - 55, 900, 110);

  try {
    const fImg = await Canvas.loadImage(footerImgUrl);
    const iconS = 100;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2 - 280, footerY, iconS / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(fImg, width / 2 - 280 - iconS / 2, footerY - iconS / 2, iconS, iconS);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold italic 55px Arial";
    ctx.fillText(footerText.toUpperCase(), width / 2 - 200, footerY + 20);
  } catch (e) {
    // Fallback if footer image fails
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold italic 55px Arial";
    ctx.fillText(footerText.toUpperCase(), width / 2, footerY + 20);
  }

  return canvas.createPNGStream();
}

async function makeRankCard(userID, deltaNext, api) {
  let userData = await Users.findOne({ userID }).lean();
  if (!userData) {
    let name = "Unknown";
    try { const info = await api.getUserInfo(userID); name = info[userID]?.name || "Unknown"; } catch (e) {}
    userData = await Users.create({ userID, exp: 0, name });
  }
  const { exp, name } = userData;
  const levelUser = expToLevel(exp, deltaNext);
  const expNextLevel = levelToExp(levelUser + 1, deltaNext) - levelToExp(levelUser, deltaNext);
  const currentExp = expNextLevel - (levelToExp(levelUser + 1, deltaNext) - exp);
  const totalUsers = await Users.countDocuments();
  const rankUsers = await Users.countDocuments({ exp: { $gt: exp } });
  const rank = rankUsers + 1;
  const isVip = !!(await VipUser.findOne({ uid: userID, expiredAt: { $gt: new Date() } }));

  const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  
  const image = new RankCard({ 
    widthCard: 2000, heightCard: 500, main_color: "#474747", 
    sub_color: "rgba(255, 255, 255, 0.5)", alpha_subcard: 0.9, 
    exp_color: "#e1e1e1", expNextLevel_color: "#3f3f3f", 
    text_color: "#000000", line_color: isVip ? "#FFD700" : "#ffffff", 
    exp: currentExp, expNextLevel, name, rank: `#${rank}/${totalUsers}`, 
    level: levelUser, avatar: avatarUrl, isVip 
  });
  return await image.buildCard();
}

class RankCard {
  constructor(options) {
    this.widthCard = 2000; this.heightCard = 500;
    this.main_color = "#474747"; this.sub_color = "rgba(255, 255, 255, 0.5)";
    this.alpha_subcard = 0.9; this.exp_color = "#e1e1e1";
    this.expNextLevel_color = "#3f3f3f"; this.text_color = "#000000";
    this.fontName = "BeVietnamPro-Bold";
    for (const key in options) this[key] = options[key];
  }

  async buildCard() {
    const { widthCard: width, heightCard: height, main_color, sub_color, alpha_subcard, exp_color, expNextLevel_color, text_color, line_color, exp, expNextLevel, name, level, rank, avatar, isVip } = this;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    const alignRim = 3 * percentage(width);
    ctx.globalAlpha = parseFloat(alpha_subcard);
    await checkColorOrImageAndDraw(alignRim, alignRim, width - alignRim * 2, height - alignRim * 2, ctx, sub_color, 20);
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "destination-out";
    const xyAvatar = height / 2, resAv = 60 * percentage(height), wL = 58 * percentage(width), hL = 2 * percentage(height), edge = (height / 2) * Math.tan(40 * Math.PI / 180);
    
    if (line_color) {
      ctx.fillStyle = ctx.strokeStyle = checkGradientColor(ctx, Array.isArray(line_color) ? line_color : [line_color], xyAvatar - resAv / 2, 0, width, 0);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.beginPath(); ctx.rect(xyAvatar + resAv / 2, height / 2 - hL / 2, wL, hL); ctx.fill();
    ctx.beginPath(); ctx.moveTo(xyAvatar + resAv / 2 + wL + edge, 0); ctx.lineTo(xyAvatar + resAv / 2 + wL - edge, height); ctx.lineWidth = hL; ctx.stroke();
    ctx.beginPath(); ctx.arc(xyAvatar, xyAvatar, resAv / 2 + hL, 0, 2 * Math.PI); ctx.fill();
    
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, width, alignRim); ctx.fillRect(0, height - alignRim, width, alignRim);
    ctx.globalCompositeOperation = "source-over";
    
    // --- Draw Avatar ---
    centerImage(ctx, await Canvas.loadImage(avatar), xyAvatar, xyAvatar, resAv, resAv);

    // --- VIP Badge ---
    if (isVip) {
      const bX = 91 * percentage(width), bY = 50 * percentage(height), bR = 64;
      ctx.save();
      ctx.fillStyle = "#FFD700"; 
      ctx.beginPath(); ctx.arc(bX, bY, bR + 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bX, bY, bR, 0, Math.PI * 2); ctx.clip();
      try {
        const badge = await Canvas.loadImage("https://i.imgur.com/zNzNEpN.jpeg");
        ctx.drawImage(badge, bX - bR, bY - bR, bR * 2, bR * 2);
      } catch (e) { ctx.fillStyle = "#FFD700"; ctx.fill(); }
      ctx.restore();
    }
    
    const radius = 6 * percentage(height), xS = 26.5 * percentage(width), yS = 67 * percentage(height), wE = 40.5 * percentage(width), hE = radius * 2;
    ctx.fillStyle = checkGradientColor(ctx, expNextLevel_color, xS, yS, xS + wE, yS);
    drawRoundedRect(ctx, xS, yS, wE, hE, radius);
    const wEC = (exp / expNextLevel) * wE;
    if (wEC > 0) {
      ctx.fillStyle = checkGradientColor(ctx, exp_color, xS, yS, xS + wE, yS);
      drawRoundedRect(ctx, xS, yS, wEC, hE, radius);
    }

    ctx.textAlign = "end";
    ctx.fillStyle = text_color;
    ctx.font = autoSizeFont(18 * percentage(width), 4 * percentage(width), rank, ctx, this.fontName);
    ctx.fillText(rank, 94 * percentage(width), 76 * percentage(height));
    ctx.font = autoSizeFont(9 * percentage(width), 3.25 * percentage(width), `Lv ${level}`, ctx, this.fontName);
    ctx.fillText(`Lv ${level}`, 94 * percentage(width), 32 * percentage(height));

    ctx.textAlign = "center";
    let nameX = 47.5 * percentage(width), maxW = 52 * percentage(width);
    let dN = name.length > 25 ? name.substring(0, 22) + "..." : name;
    ctx.font = autoSizeFont(maxW, 4 * percentage(width), dN, ctx, this.fontName);
    ctx.fillText(dN, nameX, 40 * percentage(height));
    ctx.font = autoSizeFont(49 * percentage(width), 2 * percentage(width), `Exp ${exp}/${expNextLevel}`, ctx, this.fontName);
    ctx.fillText(`Exp ${exp}/${expNextLevel}`, nameX, 61.4 * percentage(height));

    ctx.globalCompositeOperation = "destination-over";
    drawSquareRounded(ctx, 0, 0, width, height, radius, main_color);
    return canvas.createPNGStream();
  }
}

// --- Common Helpers ---
function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
}
async function checkColorOrImageAndDraw(x, y, w, h, ctx, res, r) {
  if (!isUrl(res)) drawSquareRounded(ctx, x, y, w, h, r, res);
  else {
    const img = await Canvas.loadImage(res);
    ctx.save(); drawRoundedRect(ctx, x, y, w, h, r); ctx.clip(); ctx.drawImage(img, x, y, w, h); ctx.restore();
  }
}
function drawSquareRounded(ctx, x, y, w, h, r, color) {
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.fillStyle = color; ctx.fill();
}
function centerImage(ctx, img, xC, yC, w, h) {
  ctx.save(); ctx.beginPath(); ctx.arc(xC, yC, w/2, 0, 2*Math.PI); ctx.clip(); ctx.drawImage(img, xC-w/2, yC-h/2, w, h); ctx.restore();
}
function autoSizeFont(maxW, maxS, text, ctx, font) {
  let s = maxS; ctx.font = s + "px " + font;
  while (ctx.measureText(text).width > maxW && s > 10) { s--; ctx.font = s + "px " + font; }
  return s + "px " + font;
}
function checkGradientColor(ctx, color, x1, y1, x2, y2) {
  if (Array.isArray(color)) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    color.forEach((c, i) => g.addColorStop(i/(color.length-1), c)); return g;
  }
  return color;
}
function isUrl(s) { try { new URL(s); return true; } catch { return false; } }
