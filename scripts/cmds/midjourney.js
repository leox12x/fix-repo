const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const API_ENDPOINT = "https://dev.oculux.xyz/api/imagen3";

async function downloadSingleImage(url, tempDir, index) {
    let tempFilePath = '';
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            timeout: 60000
        });
        tempFilePath = path.join(tempDir, `img3_single_${Date.now()}_${index}.png`);
        await fs.writeFile(tempFilePath, response.data);
        return { path: tempFilePath };
    } catch (e) {
        throw new Error("Failed to download an image component.");
    }
}

async function createGridImage(imagePaths, outputPath) {
    const images = await Promise.all(imagePaths.map(p => loadImage(p)));
    const imgWidth = images[0].width;
    const imgHeight = images[0].height;
    const padding = 10;
    const numberSize = 40;

    const canvasWidth = (imgWidth * 2) + (padding * 3);
    const canvasHeight = (imgHeight * 2) + (padding * 3);

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e'; // Background color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const positions = [
        { x: padding, y: padding },
        { x: imgWidth + (padding * 2), y: padding },
        { x: padding, y: imgHeight + (padding * 2) },
        { x: imgWidth + (padding * 2), y: imgHeight + (padding * 2) }
    ];

    for (let i = 0; i < images.length && i < 4; i++) {
        const { x, y } = positions[i];
        ctx.drawImage(images[i], x, y, imgWidth, imgHeight);
        
        // Draw Number Circle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(x + numberSize, y + numberSize, numberSize - 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), x + numberSize, y + numberSize);
    }

    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
    return outputPath;
}

module.exports = {
  config: {
    name: "mj2",
    aliases: ["midjourney2"],
    version: "2.0",
    author: "MahMUD",
    countDown: 20,
    vip: "yes",
    role: 0,
    longDescription: "Generate 4 Imagen3 images in a grid and select one.",
    category: "ai-image",
    guide: { en: "{pn} <prompt>" }
  },

  onStart: async function({ message, args, event, commandName }) {
    let prompt = args.join(" ");
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);

    if (!prompt) return message.reply("❌ Please provide a prompt.");

    message.reaction("⏳", event.messageID);
    const tempPaths = [];
    let gridPath = '';

    try {
      const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt.trim())}`;
      
      // concurrent requests for 4 images
      const tasks = [1, 2, 3, 4].map(() => downloadSingleImage(fullApiUrl, cacheDir, Math.random()));
      const results = await Promise.all(tasks);
      
      results.forEach(r => tempPaths.push(r.path));

      gridPath = path.join(cacheDir, `img3_grid_${Date.now()}.png`);
      await createGridImage(tempPaths, gridPath);

      message.reply({
        body: `✨ mj: 4 images generated\n\nReply 1-4 to select or 'all' for all images.`,
        attachment: fs.createReadStream(gridPath)
      }, (err, info) => {
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                tempPaths: tempPaths,
                gridPath: gridPath
            });
        }
      });
      message.reaction("✅", event.messageID);

    } catch (error) {
      console.error(error);
      message.reply(`❌ Error: ${error.message}`);
    }
  },

  onReply: async function({ message, event, Reply }) {
    const { tempPaths, gridPath, author } = Reply;
    if (event.senderID !== author) return;

    const userReply = event.body.trim().toLowerCase();
    
    try {
        if (userReply === 'all') {
            await message.reply({
                body: `✨ Here are all images:`,
                attachment: tempPaths.map(p => fs.createReadStream(p))
            });
        } else {
            const index = parseInt(userReply) - 1;
            if (index >= 0 && index < 4) {
                await message.reply({
                    body: `✨ Image ${userReply} selected:`,
                    attachment: fs.createReadStream(tempPaths[index])
                });
            }
        }
    } catch (e) {
        message.reply("❌ Error sending image.");
    } finally {
        // Cleanup logic could be added here or in a timeout
    }
  }
};
