const fs = require("fs-extra");
const request = require("request");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "write",
    aliases: ["wr"],
    version: "1.8",
    author: "RL", 
    countDown: 5,
    role: 2,
    shortDescription: { en: "Write text on a replied image with auto-sized text" },
    longDescription: { en: "Writes auto-sized text on a replied image with the selected color and sends it back." },
    category: "image",
    guide: { 
      en: "{p}write3 [color] - <text>\n\nUse `{p}write3 list` to see available colors. If no color is provided, white will be used by default." 
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    const colorMap = {
      b: "black",
      w: "white",
      r: "red",
      bl: "blue",
      g: "green",
      y: "yellow",
      o: "orange",
      p: "purple",
      pk: "pink"
    };

    if (args[0]?.toLowerCase() === "list") {
      return api.sendMessage(
        `🎨 Available colors:\n${Object.entries(colorMap).map(([short, full]) => `${short} → ${full}`).join("\n")}\n\nIf no color is specified, white will be used by default.`,
        threadID,
        messageID
      );
    }

    let input = args.join(" ");
    let color, text;

    if (input.includes(" - ")) {
      [color, text] = input.split(" - ").map(item => item.trim());
      color = colorMap[color.toLowerCase()] || color.toLowerCase();
      if (!Object.values(colorMap).includes(color)) color = "white"; 
    } else {
      color = "white";
      text = input.trim();
    }

    if (!text) return api.sendMessage("Please provide text to write.", threadID, messageID);

    if (!event.messageReply?.attachments?.[0]?.url) {
      return api.sendMessage("Please reply to an image.", threadID, messageID);
    }

    const imageUrl = event.messageReply.attachments[0].url;

    request({ url: imageUrl, encoding: null }, async (error, response, body) => {
      if (error) return api.sendMessage("Error downloading the image.", threadID, messageID);

      try {
        const img = await loadImage(Buffer.from(body));
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0);

        let fontSize = Math.floor(img.width / 10);
        ctx.font = `${fontSize}px "Segoe UI Emoji"`;

        while (ctx.measureText(text).width > img.width * 0.9) { 
          fontSize--;
          ctx.font = `${fontSize}px "Segoe UI Emoji"`;
          if (fontSize < 10) break;
        }

        ctx.fillStyle = color;
        ctx.textAlign = "center";

        const x = canvas.width / 2;
        const y = canvas.height - fontSize * 1.5;

        ctx.fillText(text, x, y);

        const tempFilePath = __dirname + "/tmp/modified_image.png";
        await fs.ensureDir(__dirname + "/tmp");
        const out = fs.createWriteStream(tempFilePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on("finish", () => {
          api.sendMessage(
            { attachment: fs.createReadStream(tempFilePath) },
            threadID,
            () => fs.unlinkSync(tempFilePath),
            messageID
          );
        });

      } catch (err) {
        console.error(err);
        return api.sendMessage("Error processing the image.", threadID, messageID);
      }
    });
  }
};
