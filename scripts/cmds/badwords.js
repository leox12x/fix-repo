module.exports = {
	config: {
		name: "badwords",
		aliases: ["badword"],
		version: "1.5",
		author: "NTKhang & MahMUD",
		countDown: 5,
		role: 0, 
		description: {
			vi: "Bật/tắt/thêm/xóa cảnh báo vi phạm từ thô tục, nếu thành viên vi phạm sẽ bị cảnh báo, lần 2 sẽ kick khỏi box chat",
			en: "Turn on/off/add/remove bad words warning, if a member violates, he will be warned, the second time he will be kicked out of the chat box"
		},
		category: "box chat",
		guide: {
			en: "   {pn} add <words>: add banned words (comma or | separated)"
				+ "\n   {pn} delete <words>: delete banned words"
				+ "\n   {pn} list <hide | leave blank>: show banned words"
				+ "\n   {pn} unwarn [<userID> | <@tag>]: remove 1 warning"
				+ "\n   {pn} on: turn on warning"
				+ "\n   {pn} off: turn off warning"
		}
	},

	langs: {
		en: {
			onText: "on",
			offText: "off",
			onlyOwner: "❌ | Baby, only my owner can use this command.",
			missingWords: "⚠️ | You haven't entered the banned words",
			addedSuccess: "✅ | Added %1 banned words to the list",
			alreadyExist: "❌ | %1 banned words already exist in the list: %2",
			deletedSuccess: "✅ | Deleted %1 banned words from the list",
			notExist: "❌ | %1 banned words do not exist in the list: %2",
			emptyList: "⚠️ | The list of banned words in your group is currently empty",
			badWordsList: "📑 | Banned words list: %1",
			turnedOnOrOff: "✅ | Banned words warning has been %1",
			missingTarget: "⚠️ | You haven't entered user ID or tagged user",
			notWarned: "⚠️ | User %1 has not been warned yet",
			warned: "⚠️ | Banned word \"%1\" detected! Next time you will be kicked from the group.",
			warned2: "⚠️ | Banned word \"%1\" detected! You have been kicked for repeating the violation.",
			needAdmin: "Bot needs admin privileges to kick members",
			unwarned: "✅ | Removed banned words warning of user %1 | %2"
		}
	},

	onStart: async function ({ message, event, api, args, threadsData, usersData, getLang }) {
		// --- Only Owner (GOD) Check ---
		const GODData = global.GoatBot.config.GOD || [];
		if (!GODData.includes(event.senderID)) {
			return api.sendMessage(getLang("onlyOwner"), event.threadID, event.messageID);
		}
		// ------------------------------

		if (!await threadsData.get(event.threadID, "data.badWords")) {
			await threadsData.set(event.threadID, {
				words: [],
				violationUsers: {}
			}, "data.badWords");
		}

		const threadData = await threadsData.get(event.threadID);
		const badWords = threadData.data.badWords.words || [];

		switch (args[0]) {
			case "add": {
				const words = args.slice(1).join(" ").split(/[,|]/).map(w => w.trim()).filter(w => w.length > 0);
				if (words.length === 0) return message.reply(getLang("missingWords"));
				
				const success = [], exist = [];
				for (const word of words) {
					if (!badWords.includes(word.toLowerCase())) {
						badWords.push(word.toLowerCase());
						success.push(word);
					} else {
						exist.push(word);
					}
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					(success.length > 0 ? getLang("addedSuccess", success.length) : "") +
					(exist.length > 0 ? "\n" + getLang("alreadyExist", exist.length, exist.map(w => hideWord(w)).join(", ")) : "")
				);
				break;
			}
			case "delete":
			case "del": {
				const words = args.slice(1).join(" ").split(/[,|]/).map(w => w.trim());
				if (words.length === 0) return message.reply(getLang("missingWords"));
				
				const success = [], failed = [];
				for (const word of words) {
					const index = badWords.indexOf(word.toLowerCase());
					if (index > -1) {
						badWords.splice(index, 1);
						success.push(word);
					} else {
						failed.push(word);
					}
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					(success.length > 0 ? getLang("deletedSuccess", success.length) : "") +
					(failed.length > 0 ? "\n" + getLang("notExist", failed.length, failed.join(", ")) : "")
				);
				break;
			}
			case "list": {
				if (badWords.length === 0) return message.reply(getLang("emptyList"));
				const display = args[1] === "hide" ? badWords.map(w => hideWord(w)) : badWords;
				message.reply(getLang("badWordsList", display.join(", ")));
				break;
			}
			case "on": {
				await threadsData.set(event.threadID, true, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("onText")));
				break;
			}
			case "off": {
				await threadsData.set(event.threadID, false, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("offText")));
				break;
			}
			case "unwarn": {
				let userID = Object.keys(event.mentions)[0] || args[1] || (event.messageReply ? event.messageReply.senderID : null);
				if (!userID || isNaN(userID)) return message.reply(getLang("missingTarget"));
				
				const violationUsers = threadData.data.badWords.violationUsers || {};
				if (!violationUsers[userID]) return message.reply(getLang("notWarned", userID));
				
				violationUsers[userID] = Math.max(0, violationUsers[userID] - 1);
				await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
				const userName = await usersData.getName(userID);
				message.reply(getLang("unwarned", userID, userName));
				break;
			}
			default:
				message.reply("Use: add, delete, list, on, off, or unwarn");
				break;
		}
	},

	onChat: async function ({ message, event, api, threadsData, prefix, getLang }) {
		if (!event.body || event.senderID === api.getCurrentUserID()) return;

		// সরাসরি ডাটাবেস থেকে অন/অফ চেক
		const isEnabled = await threadsData.get(event.threadID, "settings.badWords");
		if (!isEnabled) return;

		const threadData = await threadsData.get(event.threadID);
		const badWordList = threadData.data?.badWords?.words || [];
		if (badWordList.length === 0) return;

		// কমান্ড মেসেজ হলে ডিটেকশন বন্ধ রাখা
		if (event.body.startsWith(prefix)) return;

		// অনার বা অ্যাডমিনকে কিক হওয়া থেকে বাঁচাতে চাইলে নিচের লাইনটি ব্যবহার করতে পারেন:
		// const GODData = global.GoatBot.config.GOD || [];
		// if (GODData.includes(event.senderID)) return;

		const msg = event.body.toLowerCase();
		for (const word of badWordList) {
			if (msg.includes(word.toLowerCase())) {
				const violationUsers = threadData.data.badWords.violationUsers || {};
				const currentCount = violationUsers[event.senderID] || 0;

				if (currentCount < 1) {
					violationUsers[event.senderID] = 1;
					await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
					return message.reply(getLang("warned", word));
				} else {
					await message.reply(getLang("warned2", word));
					api.removeUserFromGroup(event.senderID, event.threadID, async (err) => {
						if (err) return message.reply(getLang("needAdmin"));
						
						// কিক সফল হলে ওয়ার্নিং রিসেট
						violationUsers[event.senderID] = 0;
						await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
					});
					return;
				}
			}
		}
	}
};

function hideWord(str) {
	if (str.length <= 2) return str[0] + "*";
	return str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}
