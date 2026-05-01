const fs = require("fs-extra");

module.exports = {
	config: {
		name: "jsontomongodb",
		aliases: ["jsontomongo"],
		version: "2.0",
		author: "mahmud (safe fix)",
		countDown: 5,
		role: 2,
		description: {
			en: "Synchronize data from JSON to MongoDB safely (no duplicate errors)"
		},
		category: "utility",
		guide: {
			en: "{pn} <thread | user | dashboard | global | all>"
		}
	},

	onStart: async function ({ args, message, threadModel, userModel, dashBoardModel, globalModel }) {
		if (global.GoatBot.config.database.type !== "mongodb")
			return message.reply("❌ Please switch database to mongodb in config.json then restart the bot");

		switch (args[0]) {
			case "thread": return syncThreadData(message, threadModel);
			case "user": return syncUserData(message, userModel);
			case "dashboard": return syncDashBoardData(message, dashBoardModel);
			case "global": return syncGlobalData(message, globalModel);
			case "all":
				await syncThreadData(message, threadModel);
				await syncUserData(message, userModel);
				await syncDashBoardData(message, dashBoardModel);
				await syncGlobalData(message, globalModel);
				return;
			default:
				return message.reply("⚠️ Usage: jsontomongodb <thread | user | dashboard | global | all>");
		}
	}
};

async function syncThreadData(message, threadModel) {
	const path = `${process.cwd()}/database/data/threadsData.json`;
	if (!fs.existsSync(path)) return message.reply("❌ threadsData.json not found");

	let data = require(path);
	delete require.cache[require.resolve(path)];

	const bulkOps = data.map(thread => ({
		updateOne: {
			filter: { threadID: thread.threadID },
			update: { $set: thread },
			upsert: true
		}
	}));

	if (bulkOps.length > 0) {
		await threadModel.bulkWrite(bulkOps, { ordered: false });
		global.db.allThreadData = await threadModel.find({}).lean();
	}

	return message.reply(`✅ Thread data sync complete! (${bulkOps.length} items)`);
}

async function syncUserData(message, userModel) {
	const path = `${process.cwd()}/database/data/usersData.json`;
	if (!fs.existsSync(path)) return message.reply("❌ usersData.json not found");

	let data = require(path);
	delete require.cache[require.resolve(path)];

	const bulkOps = data.map(user => ({
		updateOne: {
			filter: { userID: user.userID },
			update: { $set: user },
			upsert: true
		}
	}));

	if (bulkOps.length > 0) {
		await userModel.bulkWrite(bulkOps, { ordered: false });
		global.db.allUserData = await userModel.find({}).lean();
	}

	return message.reply(`✅ User data sync complete! (${bulkOps.length} items)`);
}

async function syncDashBoardData(message, dashBoardModel) {
	const path = `${process.cwd()}/database/data/dashboardData.json`;
	if (!fs.existsSync(path)) return message.reply("❌ dashboardData.json not found");

	let data = require(path);
	delete require.cache[require.resolve(path)];

	const bulkOps = data.map(dash => ({
		updateOne: {
			filter: { type: dash.type },
			update: { $set: dash },
			upsert: true
		}
	}));

	if (bulkOps.length > 0) {
		await dashBoardModel.bulkWrite(bulkOps, { ordered: false });
	}

	return message.reply(`✅ Dashboard data sync complete! (${bulkOps.length} items)`);
}

async function syncGlobalData(message, globalModel) {
	const path = `${process.cwd()}/database/data/globalData.json`;
	if (!fs.existsSync(path)) return message.reply("❌ globalData.json not found");

	let data = require(path);
	delete require.cache[require.resolve(path)];

	const bulkOps = data.map(item => ({
		updateOne: {
			filter: { key: item.key },
			update: { $set: item },
			upsert: true
		}
	}));

	if (bulkOps.length > 0) {
		await globalModel.bulkWrite(bulkOps, { ordered: false });
	}

	return message.reply(`✅ Global data sync complete! (${bulkOps.length} items)`);
}