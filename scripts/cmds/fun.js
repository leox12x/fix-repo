const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

function toBold(text) {
    const map = {
        a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤",
        l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯",
        w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
        A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊",
        L: "𝐋", M: "Ｍ", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕",
        W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
        "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
    };
    return String(text).split("").map(c => map[c] || c).join("");
}

const baseApiUrl = async () => {
    const base = await axios.get(
        "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
    );
    return base.data.mahmud;
};

const DAILY_LIMIT = 20;

module.exports = {
    config: {
        name: "fun",
        aliases: ["dig", "funny"],
        version: "2.7",
        author: "MahMUD",
        role: 0,
        cost: 1000,
        category: "fun",
        cooldown: 10,
        guide: "{pn} [type] [mention/reply/UID] | list",
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, messageReply, senderID, mentions } = event;
        const now = moment.tz("Asia/Dhaka");
        const today = now.format("DD/MM/YYYY");

        const GODData = global.GoatBot.config.GOD;
        const isOwner = GODData.includes(senderID);

        const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
        if (module.exports.config.author !== obfuscatedAuthor) {
            return api.sendMessage("You are not authorized to change the author name.", threadID, messageID);
        }

        let userData = await usersData.get(senderID);
        const type = args[0]?.toLowerCase();
        const baseUrl = await baseApiUrl();

        if (!type) return api.sendMessage("❌ Provide a DIG type! Use 'fun list' to see all.", threadID, messageID);
        
        if (type === "list") {
            try {
                const res = await axios.get(`${baseUrl}/api/dig/list`);
                let types = res.data.types || [];
                if (!types.includes("bed")) types.push("bed");
                if (!types.includes("kicked")) types.push("kicked");
                return api.sendMessage(`🎭 Available Effects:\n\n${types.join(", ")}`, threadID, messageID);
            } catch (err) {
                return api.sendMessage(`🥹 Failed to fetch list.`, threadID, messageID);
            }
        }

        // Permission Check for VIP Effects
        const vipOnlyEffects = ["gay", "toilet", "bed"];
        if (vipOnlyEffects.includes(type) && !isOwner) {
            return api.sendMessage(toBold("🥹 𝐁𝐚𝐛𝐲, 𝐭𝐡𝐢𝐬 𝐞𝐟𝐟𝐞𝐜𝐭 𝐢𝐬 𝐨𝐧𝐥𝐲 𝐟𝐨𝐫 𝐦𝐲 𝐎𝐰𝐧𝐞𝐫/𝐕𝐈𝐏."), threadID, messageID);
        }

        // Daily Limit Check
        if (!isOwner) {
            if (!userData.data.funLimit || userData.data.funLimit.lastReset !== today) {
                userData.data.funLimit = { count: 0, lastReset: today };
            }
            if (userData.data.funLimit.count >= DAILY_LIMIT) {
                const duration = moment.duration(moment.tz("Asia/Dhaka").endOf('day').diff(now));
                return api.sendMessage(toBold(`• 𝐁𝐚𝐛𝐲, 𝐅𝐮𝐧 𝐥𝐢𝐦𝐢𝐭 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 (20/20), 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 in ${duration.hours()}𝐡 ${duration.minutes()}𝐦.`), threadID, messageID);
            }
        }

        let targetID;
        if (messageReply) {
            targetID = messageReply.senderID;
        } else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } else if (args[1]) {
            targetID = args[1];
        }

        if (!targetID) return api.sendMessage("❓ Mention someone or reply to a message to apply the effect.", threadID, messageID);

        try {
            api.setMessageReaction("⏳", messageID, () => { }, true);

            let response;
            if (["bed", "kicked"].includes(type)) {
                response = await axios.post(`${baseUrl}/api/${type}`, {
                    senderID: senderID,
                    targetID: targetID
                }, { responseType: "arraybuffer" });
            } else {
                const isTwoUser = ["kiss", "fuse", "buttslap", "slap"].includes(type);
                let url = isTwoUser
                    ? `${baseUrl}/api/dig?type=${type}&user=${senderID}&user2=${targetID}`
                    : `${baseUrl}/api/dig?type=${type}&user=${targetID}`;
                response = await axios.get(url, { responseType: "arraybuffer" });
            }

            const isGif = ["trigger", "triggered"].includes(type);
            const ext = isGif ? "gif" : "png";
            
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const filePath = path.join(cacheDir, `fun_${Date.now()}.${ext}`);

            fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

            const targetData = await usersData.get(targetID);
            const targetName = targetData.name || "User";
            const usageDisplay = isOwner ? "Infinity" : `${userData.data.funLimit.count + 1}/${DAILY_LIMIT}`;

            const finalBody = [
                toBold("𝐈𝐭'𝐬 𝐣𝐮𝐬𝐭 𝐟𝐨𝐫 𝐟𝐮𝐧, 𝐝𝐨𝐧'𝐭 𝐭𝐚𝐤𝐞 𝐢𝐭 𝐬𝐞𝐫𝐢𝐨𝐮𝐬𝐥𝐲. <🐸"),
                "",
                `•${toBold("𝐔𝐬𝐞𝐫")}: ${toBold(targetName)}`,
                `•${toBold("𝐄𝐟𝐟𝐞𝐜𝐭 𝐧𝐚𝐦𝐞")}: ${toBold(type.charAt(0).toUpperCase() + type.slice(1))}`,
                `•${toBold("𝐃𝐚𝐢𝐥𝐲 𝐋𝐢𝐦𝐢𝐭")}: ${toBold(usageDisplay)}`
            ].filter(Boolean).join("\n");

            return api.sendMessage({
                body: finalBody,
                attachment: fs.createReadStream(filePath)
            }, threadID, async () => {
                api.setMessageReaction("🪽", messageID, () => { }, true);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                
                if (!isOwner) {
                    userData.data.funLimit.count++;
                    await usersData.set(senderID, userData);
                }
            }, messageID);

        } catch (err) {
            api.setMessageReaction("❌", messageID, () => { }, true);
            if (err.response && err.response.data) {
                try {
                    const errorJson = JSON.parse(err.response.data.toString());
                    if (errorJson.error) {
                        return api.sendMessage(toBold(`❌ ${errorJson.error}`), threadID, messageID);
                    }
                } catch (e) {}
            }
            console.error(err);
            return api.sendMessage(toBold("🥹 Error occurred, contact MahMUD."), threadID, messageID);
        }
    }
};
