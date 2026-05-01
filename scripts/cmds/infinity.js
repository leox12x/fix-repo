const axios = require('axios');
const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
  return base.data.api;
};
module.exports.config = {
  name: "infinity",
  version: "2.0",
  role: 2,
  author: "Dipto",
  description: "infinity Image Generator",
  category: "Image gen",
  guide: "{pn} [prompt] --ratio 1024x1024\n{pn} [prompt]",
  countDown: 15,
};

module.exports.onStart = async ({ message, event, args, api }) => {
  try {
  const prompt = args.join(" ");
  /*let prompt2, ratio;
  if (prompt.includes("--ratio")) {
    const parts = prompt.split("--ratio");
    prompt2 = parts[0].trim();
    ratio = parts[1].trim();
  } else {
    prompt2 = prompt;
    ratio = "1024x1024";
  }*/
    const ok = message.reply('wait baby <😘')
    api.setMessageReaction("⌛", event.messageID, (err) => {}, true);
    const { data } = await axios.get(
      `${await baseApiUrl()}/infinity?prompt=${prompt}`
    );
    api.setMessageReaction("✅", event.messageID, (err) => {}, true);
     message.unsend(ok.messageID)
    await message.reply({
          body: `Here's your image`, 
          attachment: await global.utils.getStreamFromURL(data.data) 
      });
  } catch (e) {
    console.log(e);
    message.reply("Error: " + e.message);
  }
};