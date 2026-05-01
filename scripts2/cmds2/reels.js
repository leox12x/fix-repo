const axios = require("axios");
const fs = require("fs");
const path = require("path");

const usernames = [
  "bishaleey","dear_diary056","anmolxet.tri13",
  // Add more usernames as per choice
];


const paginationTokens = [
  // dont add pagination token if you are using multiple usernames.

];

module.exports = {
  config: {
    name: "reels", // name your cmd
    aliases: ["reel"], // add aliases if need otherwise make it []
    author: "Vex_Kshitiz",// dont change this saar
    version: "1.0",
    cooldowns: 5, // increase it if you want to avoid spams
    role: 0,
    shortDescription: "Get a random video from Instagram user",
    longDescription: "Get a random video from a specified Instagram user.",
    category: "media",
    guide: "{p}instauser",
  },

  // dont change anything below if you dont know how it works
  onStart: async function ({ api, event, args, message }) {
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);

    try {
      let username, token, apiUrl;

      if (paginationTokens.length > 0) {
        const randomUsernameIndex = Math.floor(Math.random() * usernames.length);
        const randomTokenIndex = Math.floor(Math.random() * paginationTokens.length);
        username = usernames[randomUsernameIndex];
        token = paginationTokens[randomTokenIndex];
        apiUrl = `https://insta-scrapper-kappa.vercel.app/kshitiz?username=${username}&token=${token}`;
      } else {
        const randomUsernameIndex = Math.floor(Math.random() * usernames.length);
        username = usernames[randomUsernameIndex];
        apiUrl = `https://insta-scrapper-kappa.vercel.app/kshitiz?username=${username}`;
      }

      const apiResponse = await axios.get(apiUrl);

      const videoURL = apiResponse.data.videoURL;

      const videoResponse = await axios.get(videoURL, { responseType: "stream" });

      const tempVideoPath = path.join(__dirname, "cache", `insta_video.mp4`);

      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);

      writer.on("finish", async () => {
        const stream = fs.createReadStream(tempVideoPath);

        message.reply({
          body: "",
          attachment: stream,
        });

        api.setMessageReaction("🐤", event.messageID, (err) => {}, true);
      });
    } catch (error) {
      console.error(error);
      message.reply("Sorry, an error occurred.");
    }
  }
};
