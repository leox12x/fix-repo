 module.exports = {
	config: {
		name: "u",
		aliases: ["uns", "unsend", "unsent", "r", "un"],
		version: "1.3",
		author: "NTKhang & Gemini",
		countDown: 5,
		role: 0,
		description: {
			vi: "Gỡ tin nhắn của bot (có fallback edit)",
			en: "Unsend bot's message (with edit fallback)"
		},
		category: "box chat",
		guide: {
			vi: "reply tin nhắn muốn gỡ của bot và gọi lệnh {pn}",
			en: "reply the message you want to unsend and call the command {pn}"
		}
	},

	langs: {
		vi: {
			syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot",
			errorEdit: "Đã thay thế tin nhắn do lỗi gỡ."
		},
		en: {
			syntaxError: "Please reply the message you want to unsend",
			errorEdit: "Message edited because unsend failed."
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		// Check if replying to bot's message
		if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID()) {
			return message.reply(getLang("syntaxError"));
		}

		try {
			// Try to unsend the message
			await api.unsendMessage(event.messageReply.messageID);
		} catch (err) {
			// Fallback: If unsend fails, edit the message instead
			const fallbackText = "•𝐁𝐚𝐛𝐲 𝐮𝐧𝐬𝐞𝐧𝐝 𝐭𝐞𝐦𝐩𝐨𝐫𝐚𝐫𝐢𝐥𝐲 𝐧𝐨𝐭 𝐰𝐨𝐫𝐤𝐢𝐧𝐠 𝐬𝐨 𝐢'𝐦 𝐞𝐝𝐢𝐭 𝐭𝐡𝐢𝐬 𝐦𝐞𝐬𝐬𝐚𝐠𝐞.";
			await api.editMessage(fallbackText, event.messageReply.messageID);
		}
	}
};
