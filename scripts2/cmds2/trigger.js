const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "trigger",
    aliases: ["triggered"],
    version: "1.2", // Incremented version for the updated functionality
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "Triggered image generator",
    longDescription: "Generate a triggered image from a user's avatar or from a replied image.",
    category: "fun",
    guide: {
      vi: "{pn} [@tag | để trống]",
      en: "{pn} [@tag | empty]"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    let imageURL;

    // Check if the message is a reply
    if (event.type === "message_reply") {
      const reply = event.messageReply;

      // Check if the replied message contains an image
      if (reply.attachments && reply.attachments.length > 0 && reply.attachments[0].type === 'photo') {
        imageURL = reply.attachments[0].url; // Get the image URL from the reply
      }
    }

    // If no replied image, get the mentioned user's avatar or fallback to the sender's avatar
    if (!imageURL) {
      const uid = Object.keys(event.mentions)[0] || event.senderID;
      imageURL = await usersData.getAvatarUrl(uid);
    }

    try {
      // Generate the triggered image
      const img = await new DIG.Triggered().getImage(imageURL);

      // Define the path to save the generated image
      const pathSave = `${__dirname}/tmp/${event.senderID}_Trigger.gif`;

      // Save the image to the specified path
      fs.writeFileSync(pathSave, Buffer.from(img));

      // Send the generated image as a reply
      message.reply({
        attachment: fs.createReadStream(pathSave)
      }, () => fs.unlinkSync(pathSave)); // Cleanup: delete the file after sending
    } catch (error) {
      console.error("Error generating triggered image: ", error);
      message.reply("Sorry, something went wrong while generating the triggered image.");
    }
  }
};
