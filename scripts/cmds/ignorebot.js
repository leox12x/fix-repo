const mongoose = require("mongoose");

// MongoDB Schema definition
const autoleaveSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }
});
const Blacklist = mongoose.models.Autoleave || mongoose.model("Autoleave", autoleaveSchema);

module.exports.config = {
    name: "ignorebot",
    version: "8.0.1", // Incremented version
    role: 0,
    author: "MahMUD & Gemini",
    usePrefix: true,
    description: { en: "Manage blacklisted IDs and auto-leave logic" },
    category: "system",
    guide: { en: "[add/remove/list] [ID]" },
    cooldowns: 2
};

module.exports.onChat = async ({ api, event }) => {
    const { senderID, threadID, isGroup } = event;
    if (!isGroup) return;
    
    const currentBotID = api.getCurrentUserID();
    if (String(senderID) === String(currentBotID)) return;

    const whitelistedThread = "7460623087375340"; 
    if (String(threadID) === whitelistedThread) return;

    try {
        const blacklistedUser = await Blacklist.findOne({ id: String(senderID) });
        if (blacklistedUser) {
            const userInfo = await api.getUserInfo(senderID);
            const targetName = userInfo[senderID] ? userInfo[senderID].name : "Unknown User";

            const leaveMsg = `✅ 𝐃𝐞𝐭𝐞𝐜𝐭𝐞𝐝 𝐨𝐭𝐡𝐞𝐫 𝐛𝐨𝐭, 𝐓𝐨𝐨 𝐦𝐚𝐧𝐲 𝐛𝐨𝐭𝐬 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐆𝐫𝐨𝐮𝐩 𝐬𝐨 𝐢'𝐦 𝐋𝐞𝐚𝐯𝐢𝐧𝐠.\n\n` +
                             `• 𝐍𝐀𝐌𝐄: ${targetName}\n` +
                             `• 𝐔𝐈𝐃: ${senderID}\n\n` +
                             `𝐃𝐨 𝐲𝐨𝐮 𝐮𝐬𝐞 𝐇𝐢𝐧𝐚𝐭𝐚𝐁𝐨𝐭? 𝐊𝐢𝐜𝐤 𝐨𝐭𝐡𝐞𝐫 𝐛𝐨𝐭𝐬 𝐭𝐡𝐞𝐧 𝐚𝐝𝐝 𝐦𝐞. 𝐓𝐡𝐚𝐧𝐤𝐬!`;

            await api.sendMessage(leaveMsg, threadID);
            setTimeout(() => {
                api.removeUserFromGroup(currentBotID, threadID);
            }, 2000);
        }
    } catch (e) {
        console.error(e);
    }
};

// FIXED: Changed 'ent' to 'event' in the arguments below
module.exports.onStart = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();
    const targetID = args[1];

    // List view
    if (!action || action === "list") {
        const list = await Blacklist.find({});
        if (list.length === 0) return api.sendMessage("✅ Ignore bot list is empty.", threadID, messageID);

        let msg = "📊 **Ignore Bot List:**\n\n";
        for (const item of list) {
            try {
                const info = await api.getUserInfo(item.id);
                const name = info[item.id] ? info[item.id].name : "Unknown User";
                msg += `👤 Name: ${name}\n🆔 UID: ${item.id}\n\n`;
            } catch (e) {
                msg += `👤 Name: Fetching Error\n🆔 UID: ${item.id}\n\n`;
            }
        }
        return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // --- OWNER ONLY SECTION ---
    const GODData = global.GoatBot.config.GOD;
    if (!GODData.includes(senderID)) {
        return api.sendMessage("❌ | Baby, only my owner can use this command.", threadID, messageID);
    }
    // --------------------------

    if (!targetID) return api.sendMessage("❌ Please provide a User ID.", threadID, messageID);

    if (action === "add") {
        if (targetID == senderID || targetID == api.getCurrentUserID()) {
            return api.sendMessage("❌ Cannot add yourself or the bot.", threadID, messageID);
        }
        try {
            await Blacklist.create({ id: String(targetID) });
            return api.sendMessage(`✅ Added ID ${targetID} to ignore list.`, threadID, messageID);
        } catch (e) {
            return api.sendMessage("❌ This ID is already in the list.", threadID, messageID);
        }
    }

    if (action === "remove") {
        const deleted = await Blacklist.findOneAndDelete({ id: String(targetID) });
        return api.sendMessage(deleted ? `✅ Removed ID ${targetID}` : "❌ ID not found in list.", threadID, messageID);
    }

    return api.sendMessage("❓ Use: /ignorebot [add/remove/list] [ID]", threadID, messageID);
};
