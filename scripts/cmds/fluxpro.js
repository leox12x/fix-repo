const axios = require("axios");
const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require('canvas');

const vipSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

module.exports.config = {
  name: "fluxpro",
  version: "2.6",
  role: 0,
  author: "MahMUD",
  vip: "yes",
  description: "Flux Image Generator with Accurate Selection",
  category: "Image gen",
  guide: "{pn} [prompt] --ratio 1:1",
  countDown: 20,
};

module.exports.onStart = async ({ event, args, api, commandName }) => {
  const { threadID, messageID, senderID } = event;
  const cacheDir = path.join(__dirname, 'cache', `flux_${senderID}`);

  if (mongoose.connection.readyState !== 1) return api.sendMessage("❌ DB Error", threadID, messageID);
  
  try {
    const vip = await VipUser.findOne({ uid: senderID, expiredAt: { $gt: new Date() } });
    if (!vip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", threadID, messageID);
  } catch (err) { return api.sendMessage("❌ VIP Error", threadID, messageID); }

  const text = args.join(" ");
  if (!text) return api.sendMessage("❌ Prompt missing!", threadID, messageID);

  const [prompt, ratioPart] = text.split("--ratio");
  const ratio = ratioPart ? ratioPart.trim() : "1:1";

  api.setMessageReaction("⌛", messageID, () => {}, true);
  if (!fs.existsSync(cacheDir)) await fs.mkdirp(cacheDir);

  try {
    const baseApi = "https://api.noobs-api.rf.gd/dipto/flux";
    const savedPaths = [];

    // 1. Download 4 images and SAVE them locally
    for (let i = 0; i < 4; i++) {
        const res = await axios.get(`${baseApi}?prompt=${encodeURIComponent(prompt.trim())}&ratio=${encodeURIComponent(ratio)}`, { responseType: "arraybuffer" });
        const filePath = path.join(cacheDir, `img_${i + 1}.png`);
        await fs.writeFile(filePath, res.data);
        savedPaths.push(filePath);
    }

    // 2. Create Grid from those SAVED images
    const images = await Promise.all(savedPaths.map(p => loadImage(p)));
    const { width, height } = images[0];
    const canvas = createCanvas((width * 2) + 20, (height * 2) + 20);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pos = [{x:10, y:10}, {x:width+20, y:10}, {x:10, y:height+20}, {x:width+20, y:height+20}];
    images.forEach((img, i) => {
        ctx.drawImage(img, pos[i].x, pos[i].y, width, height);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.arc(pos[i].x+40, pos[i].y+40, 35, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 35px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(i+1, pos[i].x+40, pos[i].y+40);
    });

    const gridPath = path.join(cacheDir, 'grid.png');
    await fs.writeFile(gridPath, canvas.toBuffer('image/png'));

    return api.sendMessage({
      body: `𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐟𝐥𝐮𝐱𝐩𝐫𝐨 𝐈𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲 <😘\n\nReply 1-4 or 'all' to get the same image.`,
      attachment: fs.createReadStream(gridPath)
    }, threadID, (err, info) => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
              commandName,
              author: senderID,
              paths: savedPaths
          });
      }
    }, messageID);

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ Failed: ${err.message}`, threadID, messageID);
  }
};

module.exports.onReply = async ({ message, event, Reply, api }) => {
    const { author, paths } = Reply;
    if (event.senderID !== author) return;

    const input = event.body.trim().toLowerCase();
    const cacheDir = path.dirname(paths[0]);

    try {
        if (input === 'all') {
            await api.sendMessage({
                body: "✨ Here are all 4 images:",
                attachment: paths.map(p => fs.createReadStream(p))
            }, event.threadID, event.messageID);
        } else if (['1','2','3','4'].includes(input)) {
            const index = parseInt(input) - 1;
            await api.sendMessage({
                body: `✨ Here is image ${input}:`,
                attachment: fs.createReadStream(paths[index])
            }, event.threadID, event.messageID);
        } else {
            return; // Invalid input
        }

        // Cleanup: Selection hoye gele folder delete kore dibe
        global.GoatBot.onReply.delete(Reply.messageID);
        setTimeout(() => fs.removeSync(cacheDir), 5000); 

    } catch (e) {
        api.sendMessage("❌ Error sending image.", event.threadID);
    }
};
