const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

// Define downloadFile if it isn't imported from elsewhere
const downloadFile = async (url, dest) => {
  const writer = fs.createWriteStream(dest);
  const response = await axios({ url, responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

module.exports = {
  config: {
    name: "boyfriend",
    aliases: ["bf"],
    countDown: 10,
    author: "Mah MUD",
    role: 0,
    shortDescription: {
      en: "Get to know your bf",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}",
    },
  },

  onLoad: async () => {
    const dirMaterial = path.resolve(__dirname, 'cache', 'canvas');
    const imagePath = path.resolve(dirMaterial, 'arr2.png');

    if (!fs.existsSync(dirMaterial)) {
      fs.mkdirSync(dirMaterial, { recursive: true });
    }

    if (!fs.existsSync(imagePath)) {
      await downloadFile("https://i.imgur.com/iaOiAXe.jpeg", imagePath);
    }
  },

  async makeImage({ one, two }) {
    const __root = path.resolve(__dirname, "cache", "canvas");

    let batgiam_img = await jimp.read(path.resolve(__root, "arr2.png"));
    let pathImg = path.resolve(__root, `batman${one}_${two}.png`);
    let avatarOne = path.resolve(__root, `avt_${one}.png`);
    let avatarTwo = path.resolve(__root, `avt_${two}.png`);

    let getAvatarOne = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));

    let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));

    let circleOne = await jimp.read(await this.circle(avatarOne));
    let circleTwo = await jimp.read(await this.circle(avatarTwo));
    batgiam_img.composite(circleOne.resize(200, 200), 70, 110)
      .composite(circleTwo.resize(200, 200), 465, 110);

    let raw = await batgiam_img.getBufferAsync("image/png");

    fs.writeFileSync(pathImg, raw);
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);

    return pathImg;
  },

  async circle(image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
  },

  onStart: async function ({ event, api, args }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    if (!mention[0]) {
      return api.sendMessage("Please mention 1 person.", threadID, messageID);
    } else {
      const one = senderID, two = mention[0];
      try {
        const imagePath = await this.makeImage({ one, two });
        return api.sendMessage({
          body: "𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐁𝐨𝐲𝐟𝐫𝐢𝐞𝐧𝐝 𝐛𝐚𝐛𝐲 <😘",
          attachment: fs.createReadStream(imagePath)
        }, threadID, () => fs.unlinkSync(imagePath), messageID);
      } catch (error) {
        console.error("Error making image:", error);
        return api.sendMessage("An error occurred while processing the image.", threadID, messageID);
      }
    }
  }
};
