const PastebinAPI = require('pastebin-js');
const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "pastebin",
		aliases:["pbin"],
		version: "1.0",
		author: "Mah MUD",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Upload files to pastebin and sends link"
		},
		longDescription: {
			en: "This command allows you to upload files to pastebin and sends the link to the file."
		},
		category: "admin",
		guide: {
			en: "To use this command, type !pastebin <filename>. The file must be located in the 'cmds' folder."
		}
	},

	onStart: async function({ api, event, args }) {
   const permission = global.GoatBot.config.DEV;
  if (!permission.includes(event.senderID)) {
    api.sendMessage("You don't have enough permission to use this command. Only My Lord Can Use It.", event.threadID, event.messageID);
    return;
  }
	const pastebin = new PastebinAPI({
			api_dev_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9',
			api_user_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9',
		});

		const fileName = args[0];
		const filePathWithoutExtension = path.join(__dirname, '..', 'cmds', fileName);
		const filePathWithExtension = path.join(__dirname, '..', 'cmds', fileName + '.js');

		if (!fs.existsSync(filePathWithoutExtension) && !fs.existsSync(filePathWithExtension)) {
			return api.sendMessage('File not found!', event.threadID);
		}

		const filePath = fs.existsSync(filePathWithoutExtension) ? filePathWithoutExtension : filePathWithExtension;

		fs.readFile(filePath, 'utf8', async (err, data) => {
			if (err) throw err;

			const paste = await pastebin
				.createPaste({
					text: data,
					title: fileName,
					format: null,
					privacy: 1,
				})
				.catch((error) => {
					console.error(error);
				});

			const rawPaste = paste.replace("pastebin.com", "pastebin.com/raw");

			api.sendMessage(`File uploaded to Pastebin: ${rawPaste}`, event.threadID);
		});
	},
};
