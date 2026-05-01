// Author: Rahman Leon
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "dog",
    aliases: ["puppy", "woof"],
    version: "1.0",
    author: "Rahman Leon",
    countDown: 5,
    role: 0,
    shortDescription: "Turn someone into a dog",
    longDescription: "Creates a meme with dog filter overlay on profile picture",
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
    const outputPath = path.join(__dirname, "cache", `dog_${targetID}.png`);
    
    // Ensure cache directory exists
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const canvasWidth = 600;
    const canvasHeight = 700;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#FFE5B4");
    gradient.addColorStop(1, "#FFA500");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Paw prints decoration
    ctx.fillStyle = "rgba(139, 69, 19, 0.2)";
    const pawPositions = [
      [50, 50], [550, 80], [100, 650], [500, 620],
      [150, 100], [450, 120]
    ];
    
    pawPositions.forEach(([x, y]) => {
      // Main pad
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Toes
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 3) - Math.PI / 6;
        const toeX = x + Math.cos(angle) * 20;
        const toeY = y - 15 + Math.sin(angle) * 15;
        ctx.beginPath();
        ctx.arc(toeX, toeY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Title
    ctx.shadowColor = "#8B4513";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#8B4513";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🐶 GOOD BOY/GIRL 🐶", canvasWidth / 2, 60);
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

      // Dog filter overlay
      const centerX = canvasWidth / 2;
      const centerY = profileY + profileSize / 2;
      
      // Dog ears (floppy brown ears)
      ctx.fillStyle = "#8B4513";
      
      // Left ear
      ctx.beginPath();
      ctx.ellipse(centerX - 120, centerY - 80, 40, 70, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner left ear (pink)
      ctx.fillStyle = "#FFB6C1";
      ctx.beginPath();
      ctx.ellipse(centerX - 120, centerY - 80, 25, 50, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Right ear
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.ellipse(centerX + 120, centerY - 80, 40, 70, 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner right ear (pink)
      ctx.fillStyle = "#FFB6C1";
      ctx.beginPath();
      ctx.ellipse(centerX + 120, centerY - 80, 25, 50, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Dog nose (black)
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 30);
      ctx.lineTo(centerX - 15, centerY + 10);
      ctx.lineTo(centerX + 15, centerY + 10);
      ctx.closePath();
      ctx.fill();

      // Dog mouth/tongue
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      
      // Mouth lines
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 30);
      ctx.lineTo(centerX, centerY + 50);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 50);
      ctx.quadraticCurveTo(centerX - 30, centerY + 55, centerX - 40, centerY + 45);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 50);
      ctx.quadraticCurveTo(centerX + 30, centerY + 55, centerX + 40, centerY + 45);
      ctx.stroke();

      // Tongue (pink)
      ctx.fillStyle = "#FF69B4";
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 65, 20, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = "#FF1493";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 50);
      ctx.lineTo(centerX, centerY + 75);
      ctx.stroke();

      // Border around profile
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.stroke();

    } catch (error) {
      // Fallback
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "bold 100px Arial";
      ctx.fillStyle = "#666";
      ctx.fillText("🐕", canvasWidth / 2, profileY + profileSize / 1.8);
    }

    // Bottom text
    ctx.fillStyle = "#8B4513";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${targetName}`, canvasWidth / 2, profileY + profileSize + 60);

    ctx.fillStyle = "#FF8C00";
    ctx.font = "bold 28px Arial";
    ctx.fillText("Who's a good boy/girl? 🦴", canvasWidth / 2, profileY + profileSize + 100);

    // Random dog quotes
    const quotes = [
      "Woof woof! 🐾",
      "Loyal friend forever! 🐕",
      "Best doggo in town! 🦴",
      "Tail wagging intensifies! 🐶",
      "Professional good boy/girl! 🎾"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    ctx.fillStyle = "#8B4513";
    ctx.font = "italic 22px Arial";
    ctx.fillText(randomQuote, canvasWidth / 2, profileY + profileSize + 140);

    // Save output
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    return message.reply({
      body: `🐶 ${targetName} has been transformed into a GOOD DOG! Woof! 🦴`,
      attachment: fs.createReadStream(outputPath)
    });
  }
};
