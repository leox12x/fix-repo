const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
  config: {
    name: 'shell',
    aliases: ['$','×'],
    version: '1.0',
    author: 'Mah MUD彡',
    role: 0,
    category: 'owner',
    shortDescription: {
      en: 'Executes terminal commands.',
    },
    longDescription: {
      en: 'Executes terminal commands and returns the output.',
    },
    guide: {
      en: '{pn} [command]',
    },
  },
  onStart: async function ({ api, args, message, event }) {
   const GODData = global.GoatBot.config.GOD;
			if (!GODData.includes(event.senderID)) {
				api.sendMessage(
					"❌ | Baby, only my owner can use this command.", event.threadID, event.messageID);
				return; // Exit the function to prevent the command from executing	
             }
    
    if (args.length === 0) {
      message.reply('Usage: {pn} [command]');
      return;
    }

    const command = args.join(' ');

    try {
      const { stdout, stderr } = await exec(command);

      if (stderr) {
        message.send(`${stderr}`);
      } else {
        message.send(`${stdout}`);
      }
    } catch (error) {
      console.error(error);
      message.reply(`Error: ${error.message}`);
    }
  },
}; 
