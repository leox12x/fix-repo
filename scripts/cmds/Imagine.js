const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');

const API_ENDPOINT = "https://neokex-img-api.vercel.app/generate";

module.exports.config = {
  name: "Imagine",
  version: "2.1",
  author: "MahMUD",
  countDown: 20,
  role: 0,
  description: "Generate 4 different images in a grid using Imagen 4",
  category: "ai-image",
  guide: "{pn} <prompt>"
};

module.exports.onStart = async ({ event, args, api, commandName }) => {
  const { threadID, messageID, senderID } = event;
  const prompt = args.join(" ");

  if (!prompt) return api.sendMessage("❌ Please provide a prompt!", threadID, messageID);

  const cacheDir = path.join(__dirname, 'cache', `imagen4_${senderID}_${Date.now()}`);
  api.setMessageReaction("⌛", messageID, () => {}, true);

  try {
    if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);
    const savedPaths = [];

    // loop er bhitore protibar alada request pathano hocche
    for (let i = 0; i < 4; i++) {
      // PROMPT FIX: Random seed add kora hoyeche jate 4 ta image alada hoy
      const randomSeed = Math.floor(Math.random() * 1000000);
      const finalPrompt = `${prompt} --seed ${randomSeed}`; 
      
      // API call with unique prompt or timestamp to bypass cache
      const res = await axios.get(`${API_ENDPOINT}?prompt=${encodeURIComponent(finalPrompt)}&m=imagen4&_t=${Date.now() + i}`, { 
        responseType: "arraybuffer",
        timeout: 90000 
      });
      
      const filePath = path.join(cacheDir, `img_${i + 1}.png`);
      await fs.writeFile(filePath, res.data);
      savedPaths.push(filePath);
    }

    const images = await Promise.all(savedPaths.map(p => loadImage(p)));
    const { width, height } = images[0];
    const canvas = createCanvas((width * 2) + 20, (height * 2) + 20);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pos = [
      { x: 10, y: 10 }, { x: width + 20, y: 10 }, 
      { x: 10, y: height + 20 }, { x: width + 20, y: height + 20 }
    ];

    images.forEach((img, i) => {
      ctx.drawImage(img, pos[i].x, pos[i].y, width, height);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath(); ctx.arc(pos[i].x + 50, pos[i].y + 50, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, pos[i].x + 50, pos[i].y + 50);
    });

    const gridPath = path.join(cacheDir, 'grid_main.png');
    await fs.writeFile(gridPath, canvas.toBuffer('image/png'));

    return api.sendMessage({
      body: `✨ Here your imagine image\n\nReply with 1-4 or 'all' to get the image.`,
      attachment: fs.createReadStream(gridPath)
    }, threadID, (err, info) => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          author: senderID,
          paths: savedPaths,
          cacheDir
        });
      }
    }, messageID);

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    if (fs.existsSync(cacheDir)) fs.removeSync(cacheDir);
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};

// onReply section remains the same...
module.exports.onReply = async ({ event, Reply, api }) => {
  const { author, paths, cacheDir } = Reply;
  if (event.senderID !== author) return;
  const input = event.body.trim().toLowerCase();

  try {
    if (input === 'all') {
      await api.sendMessage({
        body: "✨ Here are all 4 images:",
        attachment: paths.map(p => fs.createReadStream(p))
      }, event.threadID, event.messageID);
    } else if (['1', '2', '3', '4'].includes(input)) {
      const index = parseInt(input) - 1;
      await api.sendMessage({
        body: `✨ Here is your selected image (${input}):`,
        attachment: fs.createReadStream(paths[index])
      }, event.threadID, event.messageID);
    } else {
      return;
    }
    global.GoatBot.onReply.delete(Reply.messageID);
    setTimeout(() => { if (fs.existsSync(cacheDir)) fs.removeSync(cacheDir); }, 10000);
  } catch (e) {
    api.sendMessage("❌ Failed to send image.", event.threadID);
  }
};
