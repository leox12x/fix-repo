const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const threadSchema = new mongoose.Schema({
    threadID: String,
    members: [{
        userID: String,
        name: String,
        count: { type: Number, default: 0 }
    }]
});

const Threads = mongoose.models.threads || mongoose.model("threads", threadSchema);

module.exports = {
    config: {
        name: "count",
        aliases: ["c"],
        version: "7.5",
        author: "NTKhang & Mah MUD",
        countDown: 5,
        role: 0,
        description: "View message counts with local and global rankings",
        category: "box chat",
        guide: "{pn} [number] | {pn} top | {pn} all global"
    },

    onStart: async function ({ args, message, event, api }) {
        const { threadID, senderID } = event;

        // --- CANVAS TOP 17 (SAME AS TOP CMD STYLE) ---
        if (args[0]?.toLowerCase() === "top") {
            try {
                const thread = await Threads.findOne({ threadID });
                if (!thread || !thread.members) return message.reply("No data found for this group.");

                const currentMembers = await api.getThreadInfo(threadID);
                const validIDs = currentMembers.participantIDs;

                // Changed slice to 17
                let top17 = thread.members
                    .filter(u => validIDs.includes(u.userID))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 17);

                if (!top17.length) return message.reply("No active members found.");

                const width = 1000;
                const rowHeight = 90;
                const headerHeight = 700;
                const footerSpace = 120;
                const height = headerHeight + (Math.max(0, top17.length - 3) * rowHeight) + footerSpace;

                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");

                // Background (100% Same Gradient)
                const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
                bgGrad.addColorStop(0, "#0a0a24");
                bgGrad.addColorStop(0.5, "#151535");
                bgGrad.addColorStop(1, "#0a0a24");
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // Stars Effect
                for (let i = 0; i < 80; i++) {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                    ctx.beginPath(); ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2); ctx.fill();
                }

                // Title Style
                ctx.textAlign = "center";
                ctx.fillStyle = "#FFD700";
                ctx.font = "bold 50px Arial";
                ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
                ctx.fillText("GROUP MESSAGE LEADERBOARD", width / 2, 90);
                ctx.shadowBlur = 0;

                // Podiums (Top 3)
                const top3Pos = [
                    { data: top17[1], x: 250, y: 380, r: 105, color: "#C0C0C0", rank: "#2" },
                    { data: top17[0], x: 500, y: 310, r: 125, color: "#FFD700", rank: "#1" },
                    { data: top17[2], x: 750, y: 380, r: 105, color: "#CD7F32", rank: "#3" }
                ];

                for (const p of top3Pos) {
                    if (!p.data) continue;
                    ctx.save();
                    ctx.shadowBlur = 30; ctx.shadowColor = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
                    ctx.strokeStyle = p.color; ctx.lineWidth = 8; ctx.stroke();
                    ctx.restore();

                    await drawCircleImage(ctx, p.data.userID, p.x, p.y, p.r);

                    ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x + p.r - 20, p.y - p.r + 20, 35, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = "#000"; ctx.font = "bold 30px Arial";
                    ctx.fillText(p.rank, p.x + p.r - 20, p.y - p.r + 32);

                    ctx.fillStyle = "#FFF"; ctx.font = "bold 30px Arial";
                    ctx.fillText(p.data.name?.substring(0, 15) || "User", p.x, p.y + p.r + 65);
                    ctx.fillStyle = "#00ffcc"; ctx.font = "bold 28px Arial";
                    ctx.fillText(`${formatShort(p.data.count)} MSGS`, p.x, p.y + p.r + 105);
                }

                // List (4 to 17)
                let currentY = headerHeight - 30;
                const maxVal = top17[3]?.count || 1;

                for (let i = 3; i < top17.length; i++) {
                    const user = top17[i];
                    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
                    drawRoundRect(ctx, 50, currentY, width - 100, 75, 15); ctx.fill();

                    ctx.textAlign = "left";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "bold 28px Arial";
                    ctx.fillText(`#${i + 1}`, 100, currentY + 45);

                    await drawCircleImage(ctx, user.userID, 190, currentY + 38, 28);

                    ctx.fillStyle = "#FFF"; ctx.font = "bold 26px Arial";
                    ctx.fillText(user.name?.substring(0, 15) || "Unknown", 240, currentY + 45);

                    // Bar Design
                    const barMaxWidth = 250; const barX = 480;
                    const barWidth = Math.min(Math.max((user.count / maxVal) * barMaxWidth, 10), barMaxWidth);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                    drawRoundRect(ctx, barX, currentY + 32, barMaxWidth, 14, 7); ctx.fill();

                    const barGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
                    barGrad.addColorStop(0, "#4facfe"); barGrad.addColorStop(1, "#00f2fe");
                    ctx.fillStyle = barGrad;
                    drawRoundRect(ctx, barX, currentY + 32, barWidth, 14, 7); ctx.fill();

                    ctx.textAlign = "right";
                    ctx.fillStyle = "#00ffcc"; ctx.font = "bold 28px Arial";
                    ctx.fillText(`${formatShort(user.count)} MSGS`, width - 100, currentY + 45);

                    currentY += rowHeight;
                }

                // Footer
                const footerY = height - 60;
                const footerText = "Your Hinata baby official";
                const startX = (width - (56 + 15 + ctx.measureText(footerText).width)) / 2 + 28;
                ctx.save(); ctx.beginPath(); ctx.arc(startX, footerY, 28, 0, Math.PI * 2); ctx.clip();
                try { const bImg = await loadImage("https://i.imgur.com/LbIdjhE.jpeg"); ctx.drawImage(bImg, startX-28, footerY-28, 56, 56); } catch(e){}
                ctx.restore();
                ctx.textAlign = "left"; ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.font = "bold 30px Arial";
                ctx.fillText(footerText, startX + 43, footerY + 10);

                const cachePath = path.join(process.cwd(), "cache", `count_top_17_${threadID}.png`);
                fs.ensureDirSync(path.join(process.cwd(), "cache"));
                fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));
                return message.reply({ attachment: fs.createReadStream(cachePath) }, () => fs.unlinkSync(cachePath));

            } catch (err) {
                console.error(err);
                return message.reply("Error generating count leaderboard.");
            }
        }

        // --- GLOBAL & OTHERS ---
        if (args[0]?.toLowerCase() === "global" || (args[0]?.toLowerCase() === "all" && args[1]?.toLowerCase() === "global")) {
            try {
                const allGlobalStats = await Threads.aggregate([
                    { $unwind: "$members" },
                    { $group: { 
                        _id: "$members.userID", 
                        totalCount: { $sum: "$members.count" }, 
                        name: { $first: "$members.name" } 
                    }},
                    { $sort: { totalCount: -1 } }
                ]);

                if (args[0].toLowerCase() === "all") {
                    let msg = `🏆  ${toBoldUnicode("Global Top 15 Members")}:\n`;
                    const top15 = allGlobalStats.slice(0, 15);
                    top15.forEach((user, index) => {
                        const rankEmoji = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
                        msg += `\n${rankEmoji} ${toBoldUnicode(user.name)}: ${toBoldNumbers(user.totalCount)}`;
                    });
                    return message.reply(msg);
                }

                const userGlobalIndex = allGlobalStats.findIndex(u => u._id === senderID);
                if (userGlobalIndex !== -1) {
                    const userData = allGlobalStats[userGlobalIndex];
                    const msg = `>🌎\n• ${toBoldUnicode(userData.name)}\n• ${toBoldUnicode("Baby your global count Rank")} ${toBoldNumbers(userGlobalIndex + 1)} ${toBoldUnicode("with")} ${toBoldNumbers(userData.totalCount)} ${toBoldUnicode("messages")}`;
                    return message.reply(msg);
                } else {
                    return message.reply("You don't have any global data yet.");
                }
            } catch (err) {
                return message.reply("Error fetching global ranking.");
            }
        }

        const thread = await Threads.findOne({ threadID });
        if (!thread || !thread.members) return message.reply("No data found.");
        const currentMembers = await api.getThreadInfo(threadID);
        const validIDs = currentMembers.participantIDs;
        let allMembers = thread.members.filter(u => validIDs.includes(u.userID)).map(u => ({ name: u.name || "Facebook User", count: u.count || 0, uid: u.userID })).sort((a, b) => b.count - a.count);
        allMembers.forEach((item, index) => item.stt = index + 1);

        if (args[0]) {
            let limit, page = 1, isAll = false;
            if (args[0].toLowerCase() === "all") { isAll = true; limit = 50; page = parseInt(args[1]) || 1; }
            else if (!isNaN(args[0])) { limit = parseInt(args[0]); }
            if (limit) {
                const totalPages = Math.ceil(allMembers.length / (isAll ? 50 : limit));
                if (page < 1) page = 1;
                const start = (page - 1) * (isAll ? 50 : limit);
                const pageData = allMembers.slice(start, start + (isAll ? 50 : limit));
                let header = isAll ? `Group Top Members` : `Top ${limit} Active Members`;
                let msg = `👑  ${toBoldUnicode(header)}:\n`;
                for (const item of pageData) {
                    const rankEmoji = item.stt <= 3 ? [">🥇", ">🥈", ">🥉"][item.stt - 1] : `${item.stt}.`;
                    msg += `\n${rankEmoji} ${toBoldUnicode(item.name)}: ${toBoldNumbers(item.count)}`;
                }
                if (isAll) msg += `\n\n• 𝐏𝐚𝐠𝐞 [${page}/${totalPages}]\n• 𝐑𝐞𝐩𝐥𝐲: !𝐜𝐨𝐮𝐧𝐭 𝐚𝐥𝐥 ${page + 1}`;
                return message.reply(msg);
            }
        }
        const findUser = allMembers.find(u => u.uid == senderID);
        if (findUser) {
            const rankEmoji = findUser.stt <= 3 ? [">🥇", ">🥈", ">🥉"][findUser.stt - 1] : ">🎀";
            return message.reply(`${rankEmoji}\n• ${toBoldUnicode(findUser.name)}\n• 𝐁𝐚𝐛𝐲 𝐲𝐨𝐮𝐫 𝐑𝐚𝐧𝐤 ${toBoldNumbers(findUser.stt)} 𝐰𝐢𝐭𝐡 ${toBoldNumbers(findUser.count)} 𝐦𝐞𝐬𝐬𝐚𝐠𝐞𝐬`);
        }
    },

    onChat: async function ({ event, api }) {
        const { senderID, threadID } = event;
        if (!senderID || !threadID || senderID == api.getCurrentUserID()) return;
        try {
            const update = await Threads.findOneAndUpdate({ threadID, "members.userID": senderID }, { $inc: { "members.$.count": 1 } }, { new: true });
            if (!update) {
                const info = await api.getUserInfo(senderID);
                const name = info[senderID]?.name || "Facebook User";
                await Threads.findOneAndUpdate({ threadID }, { $push: { members: { userID: senderID, name, count: 1 } } }, { upsert: true });
            }
        } catch (e) { console.error(e); }
    }
};

// --- HELPERS (STAY SAME) ---
async function drawCircleImage(ctx, uid, x, y, radius) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    try {
        const baseRes = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
        const url = `${baseRes.data.mahmud}/api/pfp?mahmud=${uid}`;
        const img = await loadImage(url);
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } catch {
        try {
            const fallback = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
            ctx.drawImage(fallback, x - radius, y - radius, radius * 2, radius * 2);
        } catch(e) { ctx.fillStyle = "#333"; ctx.fill(); }
    }
    ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}

function formatShort(num) {
    if (!num) return "0";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
}

function toBoldNumbers(number) {
    const boldNumbers = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
    return number.toString().split("").map(n => boldNumbers[n] || n).join("");
}

function toBoldUnicode(text) {
    if (!text) return "";
    const bold = { a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳", A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙" };
    return text.split("").map(c => bold[c] || c).join("");
                        }
