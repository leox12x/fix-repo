const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "delete",
    aliases: ["del"],
    version: "1.1",
    author: "Mah MUD",
    countDown: 1,
    role: 2,
    shortDescription: "Delete file and folders",
    longDescription: "Delete one or multiple command files",
    category: "utility",
    guide: "{pn} [file1.js] [file2.js] ..."
  },

  onStart: async function ({ args, message, event }) {
    const permission = ["100083010056014","61559134070491","61556006709662","61580492994318"];
    if (!permission.includes(event.senderID)) {
      return message.reply("𝐁𝐚𝐛𝐲, 𝐨𝐧𝐥𝐲 𝐌𝐚𝐡𝐌𝐔𝐃 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝.");
    }

    if (!args.length) {
      return message.reply("Type the file name(s)..\nExample: del bank.js anime.js");
    }

    let deleted = [];
    let notFound = [];
    let errors = [];

    for (const cmd of args) {
      const filePath = path.join(__dirname, '..', 'cmds', cmd);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted.push(cmd);
        } else {
          notFound.push(cmd);
        }
      } catch (err) {
        errors.push(`${cmd} (${err.message})`);
      }
    }

    let replyMsg = "";
    if (deleted.length) replyMsg += `✅ Deleted: ${deleted.join(", ")}\n`;
    if (notFound.length) replyMsg += `⚠️ Not found: ${notFound.join(", ")}\n`;
    if (errors.length) replyMsg += `❌ Errors: ${errors.join(", ")}\n`;

    return message.reply(replyMsg || "No file processed.");
  }
};