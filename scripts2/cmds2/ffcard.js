const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// This command generates a custom Free Fire ID card image based on user input.
module.exports = {
  config: {
    name: "ffcard",
    author: 'MahMUD', // Original author specified by user
    countDown: 10,
    category: "fun",
    guide: "ffcard [Name] - [Date Of Account] - [Server Name] - [UID]",
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const input = args.join(" ");
      
      // Check for the correct separator
      if (!input.includes(" - ")) {
        return api.sendMessage(
          "❌ Wrong format! Use:\nffcard [Name] - [Date Of Account] - [Server Name] - [UID]",
          event.threadID,
          event.messageID
        );
      }

      // Split and trim the inputs based on the separator " - "
      const [name, dateOfAccount, serverName, uid] = input.split(" - ").map(x => x.trim());
      
      if (!name || !dateOfAccount || !serverName || !uid) {
        return api.sendMessage(
          "❌ Missing parameters! Format:\nffcard [Name] - [Date Of Account] - [Server Name] - [UID]",
          event.threadID,
          event.messageID
        );
      }

      // --- Canvas Setup ---
      // Dimensions based on the uploaded image (1248x832, derived from typical scaling for the layout)
      const canvas = createCanvas(1248, 832);
      const ctx = canvas.getContext('2d');

      // Load the background template (URL provided in the user's code)
      // NOTE: Using a static placeholder image if the original link is not available or correct
      const backgroundUrl = "https://i.imgur.com/zEcp8Pd.png";
      const background = await loadImage(backgroundUrl).catch(() => {
          console.error("Could not load background image from URL.");
          // Fallback if background fails to load (optional: could stop here or draw a blank white background)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, 1248, 832);
          return null;
      });
      if (background) {
          ctx.drawImage(background, 0, 0, 1248, 832);
      }
      
      // --- Avatar Processing ---
      // Get the sender's avatar URL
      let avatarUrl = await usersData.getAvatarUrl(event.senderID);
      if (!avatarUrl) {
          // Placeholder if no avatar is found
          avatarUrl = "https://placehold.co/355x415/AAAAAA/FFFFFF?text=No+Avatar"; 
      }

      const senderAvatar = await loadImage(avatarUrl);
      
      // Draw the avatar inside the specific cropped area (based on user's original coordinates)
      // Coordinates for the black frame in the template image (20, 310) with size (355x415)
      const avatarX = 20;
      const avatarY = 310;
      const avatarWidth = 355;
      const avatarHeight = 415;

      // Clip path to match the rounded corners of the card template's avatar box
      // These values are estimated to match the visual aesthetic of the template
      const radius = 25; 

      ctx.save(); 
      ctx.beginPath();
      ctx.moveTo(avatarX + radius, avatarY);
      ctx.lineTo(avatarX + avatarWidth - radius, avatarY);
      ctx.quadraticCurveTo(avatarX + avatarWidth, avatarY, avatarX + avatarWidth, avatarY + radius);
      ctx.lineTo(avatarX + avatarWidth, avatarY + avatarHeight - radius);
      ctx.quadraticCurveTo(avatarX + avatarWidth, avatarY + avatarHeight, avatarX + avatarWidth - radius, avatarY + avatarHeight);
      ctx.lineTo(avatarX + radius, avatarY + avatarHeight);
      ctx.quadraticCurveTo(avatarX, avatarY + avatarHeight, avatarX, avatarY + avatarHeight - radius);
      ctx.lineTo(avatarX, avatarY + radius);
      ctx.quadraticCurveTo(avatarX, avatarY, avatarX + radius, avatarY);
      ctx.closePath();
      ctx.clip(); // Clip the avatar to this rounded shape
      
      ctx.drawImage(senderAvatar, avatarX, avatarY, avatarWidth, avatarHeight);
      ctx.restore(); // Restore the canvas context to remove the clipping mask

      // --- Add Text Data ---
      // Set text style based on the template's look
      ctx.font = "bold 50px Arial";
      ctx.fillStyle = "#000000"; // Black color for text

      // Draw Name
      // Centered or adjusted relative to the 'Name:' label
      ctx.fillText(`${name}`, 595, 360);       
      
      // Draw Date of Account (Birthday in user's original code, adjusted to template)
      ctx.fillText(`${dateOfAccount}`, 730, 452);   
      
      // Draw Server Name
      ctx.fillText(`${serverName}`, 744, 537);     
      
      // Draw UID
      ctx.fillText(`${uid}`, 560, 638);        

      // --- Output File ---
      const outputPath = path.join(__dirname, 'ffcard_output.png');
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on('finish', () => {
        // Send the message and then clean up the temporary file
        api.sendMessage(
          {
            body: `🎮 Free Fire Card Generated for ${name}!`,
            attachment: fs.createReadStream(outputPath)
          },
          event.threadID,
          () => fs.unlinkSync(outputPath), // Callback to delete the file
          event.messageID
        );
      });

    } catch (error) {
      console.error("FFCARD Error:", error);
      api.sendMessage("❌ An error occurred during card generation: " + error.message, event.threadID, event.messageID);
    }
  }
};
