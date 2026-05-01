const axios = require("axios");
const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

// --- Database Models ---
const Users = mongoose.models.users || mongoose.model("users", new mongoose.Schema({}, { strict: false }));
const Bank = mongoose.models.Bank || mongoose.model("Bank", new mongoose.Schema({
    userID: String, bank: Number, loan: Number
}, { strict: false }));
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", new mongoose.Schema({
    uid: String, expiredAt: Date
}, { strict: false }));

// --- Helpers ---
const deltaNext = 5;
const expToLevel = (exp, delta) => Math.floor((1 + Math.sqrt(1 + 8 * (exp || 0) / delta)) / 2);

function formatMoney(num) {
    if (!num) return "0";
    let n = typeof num !== "number" ? parseInt(num) || 0 : num;
    const units = ["", "K", "M", "B", "T"];
    let unit = 0;
    while (n >= 1000 && ++unit < units.length) n /= 1000;
    return n.toFixed(1).replace(/\.0$/, "") + units[unit];
}

const getBaseApi = async () => {
    try {
        const res = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
        return res.data.mahmud + "/api/jan";
    } catch (e) { return "https://mahmud.up.railway.app/api/jan"; }
};

module.exports = {
    config: {
        name: "spy",
        version: "16.0",
        author: "MahMUD & Gemini",
        category: "general",
        countDown: 5
    },

    onStart: async function ({ event, message, api, args }) {
        const { senderID, mentions, type, messageReply } = event;
        let uid = type === "message_reply" ? messageReply.senderID : Object.keys(mentions)[0] || senderID;
        if (args[0] && /^\d+$/.test(args[0])) uid = args[0];

        // --- FETCH DATA ---
        const userInfo = await api.getUserInfo(uid).catch(() => ({ [uid]: { name: "Facebook User", gender: 0, isFriend: false } }));
        const user = userInfo[uid];
        let userData = await Users.findOne({ userID: uid }).lean() || { exp: 0, money: 0, name: user.name, createdAt: new Date() };
        let userBank = await Bank.findOne({ userID: uid }) || { bank: 0, loan: 0 };
        const vip = await VipUser.findOne({ uid, expiredAt: { $gt: new Date() } });

        const levelUser = expToLevel(userData.exp, deltaNext);
        const genderText = user.gender === 1 ? "Female" : user.gender === 2 ? "Male" : "Unknown";
        const joinedDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-GB") : "Recently";

        let janTeach = "0", janRank = "N/A";
        try {
            const apiUrl = await getBaseApi();
            const res = await axios.get(`${apiUrl}/list/all`);
            const sorted = Object.entries(res.data?.data || {}).map(([id, val]) => ({ id, val: parseInt(val) })).sort((a, b) => b.val - a.val);
            const tIdx = sorted.findIndex(d => d.id === uid);
            if (tIdx !== -1) { janTeach = sorted[tIdx].val; janRank = tIdx + 1; }
        } catch (e) {}

        // --- CANVAS UI ---
        const width = 1000, height = 1850; 
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // Background (Original Deep Blue Gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, "#0f172a"); bgGrad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);
        
        // Glows (Original Cyan & Pink Glow)
        ctx.fillStyle = "rgba(102, 217, 239, 0.05)";
        ctx.beginPath(); ctx.arc(900, 100, 250, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255, 121, 198, 0.05)";
        ctx.beginPath(); ctx.arc(100, 1600, 350, 0, Math.PI * 2); ctx.fill();

        // Top Card (User Profile Section)
        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        drawRoundRect(ctx, 50, 50, width - 100, 320, 40); ctx.fill();
        ctx.strokeStyle = vip ? "#ff79c6" : "#66d9ef"; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(190, 210, 105, 0, Math.PI * 2); ctx.stroke();
        await drawCircleImage(ctx, uid, 190, 210, 100);

        // Name & ID
        ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "bold 55px Arial";
        ctx.fillText(userData.name.length > 18 ? userData.name.substring(0, 18) + "..." : userData.name, 330, 150);
        ctx.fillStyle = "#66d9ef"; ctx.font = "bold 28px Arial";
        ctx.fillText(`ID: ${uid}`, 330, 200);
        if (vip) { ctx.fillStyle = "#ff79c6"; ctx.font = "bold 24px Arial"; ctx.fillText("✨ PREMIUM VIP MEMBER", 330, 250); }

        // Money/Level Stats Row
        const drawStat = (x, y, label, val, color) => {
            ctx.fillStyle = "rgba(255,255,255,0.05)"; drawRoundRect(ctx, x, y, 290, 140, 25); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "22px Arial"; ctx.fillText(label, x + 25, y + 45);
            ctx.fillStyle = color; ctx.font = "bold 40px Arial"; ctx.fillText(val, x + 25, y + 100);
        };
        drawStat(50, 400, "BALANCE", formatMoney(userData.money), "#50fa7b");
        drawStat(355, 400, "BANK BALANCE", formatMoney(userBank.bank), "#f1fa8c");
        drawStat(660, 400, "CURRENT LEVEL", levelUser, "#ffb86c");

        // USER DETAILS
        ctx.fillStyle = "#fff"; ctx.font = "bold 40px Arial";
        ctx.fillText("👤 USER DETAILS", 50, 620);
        ctx.beginPath(); ctx.strokeStyle = "#bd93f9"; ctx.lineWidth = 4;
        ctx.moveTo(50, 640); ctx.lineTo(180, 640); ctx.stroke();

        const details = [
            { label: "Gender", val: genderText }, { label: "Bot Friend", val: user.isFriend ? "Yes" : "No" },
            { label: "Teach Pts", val: janTeach }, { label: "Teach Rank", val: `#${janRank}` },
            { label: "Join Date", val: joinedDate }, { label: "Bank Loan", val: userBank.loan > 0 ? formatMoney(userBank.loan) : "Clear" }
        ];

        let dy = 680;
        details.forEach((d, i) => {
            const x = i % 2 === 0 ? 50 : 510;
            if(i > 0 && i % 2 === 0) dy += 110;
            ctx.fillStyle = "rgba(255,255,255,0.04)"; drawRoundRect(ctx, x, dy, 440, 90, 20); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 28px Arial"; ctx.fillText(d.label, x + 30, dy + 55);
            ctx.textAlign = "right"; ctx.fillStyle = "#bd93f9"; ctx.font = "bold 28px Arial";
            ctx.fillText(d.val, x + 410, dy + 55); ctx.textAlign = "left";
        });

        // --- GLOBAL GAME ACHIEVEMENTS (API Based) ---
        ctx.fillStyle = "#fff"; ctx.font = "bold 40px Arial";
        ctx.fillText("🎮 GAME ACHIEVEMENTS", 50, dy + 160);
        ctx.beginPath(); ctx.strokeStyle = "#66d9ef"; ctx.lineWidth = 4;
        ctx.moveTo(50, dy + 180); ctx.lineTo(180, dy + 180); ctx.stroke();
        
        let gy = dy + 230;
        const gameStats = await getGlobalGameStats(uid);

        gameStats.forEach((g, i) => {
            const x = i % 2 === 0 ? 50 : 510;
            if(i > 0 && i % 2 === 0) gy += 120;
            ctx.fillStyle = "rgba(255,255,255,0.03)"; drawRoundRect(ctx, x, gy, 440, 105, 20); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 28px Arial"; ctx.fillText(g.name, x + 30, gy + 60);
            ctx.textAlign = "right"; ctx.fillStyle = "#66d9ef"; ctx.font = "24px Arial";
            ctx.fillText(`${g.wins} Wins`, x + 410, gy + 45);
            ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "18px Arial";
            ctx.fillText(`Rank: #${g.rank}`, x + 410, gy + 75); ctx.textAlign = "left";
        });

        const cachePath = path.join(process.cwd(), "cache", `spy_original_${uid}.png`);
        fs.ensureDirSync(path.join(process.cwd(), "cache"));
        fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

        return message.reply({
            body: `>🎀 ${userData.name}\n𝐁𝐚𝐛𝐲, 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐬𝐩𝐲 𝐑𝐞𝐩𝐨𝐫𝐭.`,
            attachment: fs.createReadStream(cachePath)
        }, () => fs.unlinkSync(cachePath));
    }
};

async function getGlobalGameStats(uid) {
    const games = [
        { name: "Quiz", api: "quiz" }, { name: "Flag", api: "flag" },
        { name: "Cartoon", api: "cartoon" }, { name: "Free Fire", api: "ff" },
        { name: "Waifu", api: "waifu" }, { name: "Aniquiz", api: "aniqz" },
        { name: "Word Game", api: "word" }, { name: "Football", api: "football" },
        { name: "Actor", api: "actor" }, { name: "Actress", api: "actress" },
        { name: "Animal", api: "animal" }, { name: "Cricket", api: "cricket" }
    ];

    const results = [];
    for (const game of games) {
        try {
            const res = await axios.get(`https://mahmud-infinity-api.onrender.com/api/game/${game.api}?list=true`);
            const apiStats = res.data || [];
            const index = apiStats.findIndex(u => u.userID == uid);
            const userStats = apiStats[index] || { win: 0 };
            results.push({
                name: game.name,
                wins: userStats.win || 0,
                rank: index === -1 ? "N/A" : index + 1
            });
        } catch (e) {
            results.push({ name: game.name, wins: 0, rank: "N/A" });
        }
    }
    return results;
}

async function drawCircleImage(ctx, uid, x, y, radius) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    try {
        const img = await loadImage(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } catch (e) { ctx.fillStyle = "#1e293b"; ctx.fill(); }
    ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
                }
