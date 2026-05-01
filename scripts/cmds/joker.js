// Author: Rahman Leon
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "joker",
    aliases: ["clown"],
    version: "1.0",
    author: "Rahman Leon",
    countDown: 5,
    role: 0,
    shortDescription: "Turn someone into a joker",
    longDescription: "Creates a meme with joker makeup overlay on profile picture",
    category: "fun",
    guide: "{pn} [@tag or reply to message]"
  },

  onStart: async function ({ event, message, usersData, args }) {
    // Get target user
    let targetID = event.senderID;
    let targetName = await usersData.getName(targetID);
    
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
      targetName = await usersData.getName(targetID);
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      targetName = event.mentions[targetID];
    }

    const profileUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const outputPath = path.join(__dirname, "cache", `joker_${targetID}.png`);
    
    // Ensure cache directory exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const canvasWidth = 600;
    const canvasHeight = 700;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0f0f1e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Title text with glow
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🃏 JOKER ALERT 🃏", canvasWidth / 2, 60);
    ctx.shadowBlur = 0;

    // Profile image
    const profileSize = 300;
    const profileX = canvasWidth / 2 - profileSize / 2;
    const profileY = 120;

    try {
      const img = await loadImage(profileUrl);
      
      // Draw circular profile
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, profileX, profileY, profileSize, profileSize);
      ctx.restore();

      // Draw joker makeup overlay
      const centerX = canvasWidth / 2;
      const centerY = profileY + profileSize / 2;
      
      // Red nose
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Joker smile - red arc
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY + 20, 80, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Smile lines extending to sides
      ctx.beginPath();
      ctx.moveTo(centerX - 80, centerY + 5);
      ctx.lineTo(centerX - 110, centerY - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 80, centerY + 5);
      ctx.lineTo(centerX + 110, centerY - 20);
      ctx.stroke();

      // Eye makeup - black circles
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(centerX - 50, centerY - 40, 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX + 50, centerY - 40, 30, 0, Math.PI * 2);
      ctx.fill();

      // Border around profile
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.stroke();

    } catch {
      // Fallback
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "#666";
      ctx.fillText("🤡", canvasWidth / 2, profileY + profileSize / 1.8);
    }

    // Bottom text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${targetName}`, canvasWidth / 2, profileY + profileSize + 60);

    ctx.fillStyle = "#ff0000";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Why so serious? 🤡", canvasWidth / 2, profileY + profileSize + 100);

    // Random joker quote
    const quotes = [
      "The clown of the group!",
      "Always making us laugh!",
      "Professional joker certified!",
      "Comedy king/queen!",
      "Class clown detected!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    ctx.fillStyle = "#fff";
    ctx.font = "italic 20px Arial";
    ctx.fillText(randomQuote, canvasWidth / 2, profileY + profileSize + 140);

    // Save output
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    return message.reply({
      body: `🃏 ${targetName} has been transformed into a JOKER! 🤡`,
      attachment: fs.createReadStream(outputPath)
    });
  }
};
