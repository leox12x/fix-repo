 const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// API কনফিগারেশন
const API_URL = "https://dall-e-tau-steel.vercel.app/kshitiz";

async function downloadImage(url, cacheDir, index) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const filePath = path.join(cacheDir, `genx_${Date.now()}_${index}.jpg`);
        await fs.outputFile(filePath, response.data);
        return filePath;
    } catch (e) {
        throw new Error("Image download failed");
    }
}

async function createGrid(imagePaths, outputPath) {
    const images = await Promise.all(imagePaths.map(p => loadImage(p)));
    const size = 512; // প্রতিটি ছবির সাইজ
    const padding = 10;
    
    const canvas = createCanvas((size * 2) + (padding * 3), (size * 2) + (padding * 3));
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000'; // ব্যাকগ্রাউন্ড কালার
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pos = [
        { x: padding, y: padding },
        { x: size + (padding * 2), y: padding },
        { x: padding, y: size + (padding * 2) },
        { x: size + (padding * 2), y: size + (padding * 2) }
    ];

    images.forEach((img, i) => {
        ctx.drawImage(img, pos[i].x, pos[i].y, size, size);
        // নাম্বার সার্কেল
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(pos[i].x + 35, pos[i].y + 35, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), pos[i].x + 35, pos[i].y + 35);
    });

    const buffer = canvas.toBuffer('image/jpeg');
    await fs.outputFile(outputPath, buffer);
}

module.exports = {
  config: {
    name: "dalle",
    version: "2.0",
    author: "Vex_Kshitiz",
    countDown: 30,
    role: 0,
    cost: 5000,
    longDescription: "Generate 4 images in a Midjourney-style grid.",
    category: "ai",
    guide: { en: "{pn} <prompt>" }
  },

  onStart: async function ({ api, event, usersData, args, commandName }) {
    const prompt = args.join(' ');
    if (!prompt) return api.sendMessage("❌ Please provide a prompt.", event.threadID, event.messageID);

    const cacheDir = path.join(__dirname, 'cache');
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      // ৪টি ছবি একই সাথে রিকোয়েস্ট করা (Concurrent Requests)
      const tasks = [1, 2, 3, 4].map(() => axios.get(`${API_URL}?prompt=${encodeURIComponent(prompt)}`));
      const responses = await Promise.all(tasks);
      const urls = responses.map(res => res.data.response);

      // সব ছবি ডাউনলোড করা
      const tempPaths = await Promise.all(urls.map((url, i) => downloadImage(url, cacheDir, i)));

      // গ্রিড তৈরি করা
      const gridPath = path.join(cacheDir, `grid_${Date.now()}.jpg`);
      await createGrid(tempPaths, gridPath);

      return api.sendMessage({
        body: `✅ Dalle - 4 Images Generated\n\nReply with 1-4 to get the full image or 'all' to get all separate images.`,
        attachment: fs.createReadStream(gridPath)
      }, event.threadID, (err, info) => {
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                author: event.senderID,
                tempPaths: tempPaths
            });
        }
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Error generating grid images.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { tempPaths, author } = Reply;
    if (event.senderID !== author) return;

    const input = event.body.trim().toLowerCase();
    
    try {
        if (input === 'all') {
            const streams = tempPaths.map(p => fs.createReadStream(p));
            await api.sendMessage({ body: "✨ All images:", attachment: streams }, event.threadID);
        } else {
            const index = parseInt(input) - 1;
            if (index >= 0 && index < 4) {
                await api.sendMessage({
                    body: `✨ Image ${input} selected:`,
                    attachment: fs.createReadStream(tempPaths[index])
                }, event.threadID);
            }
        }
    } catch (e) {
        api.sendMessage("❌ Error sending the image.", event.threadID);
    }
  }
};
