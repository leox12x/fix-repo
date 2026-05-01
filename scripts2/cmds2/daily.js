const moment = require("moment-timezone");
const mongoose = require("mongoose");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const vipSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    expiredAt: { type: Date, required: true }
});
const VipUser = mongoose.models.VipUser || mongoose.model("VipUser", vipSchema);

const boldText = (text) => {
    const bold = {
        "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
        "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
        "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
        "A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
        "K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
        "U":"𝐔","V":"𝐖","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙",
        "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗"
    };
    return text.split("").map(c => bold[c] || c).join("");
};

const BABY_WORLD_TID = "7460623087375340";

module.exports = {
    config: {
        name: "daily",
        version: "15.9",
        author: "MahMUD & Gemini",
        countDown: 20,
        role: 0,
        description: "Strict Date Check & Data Reset Fixed",
        category: "game",
        guide: { en: "{pn} | {pn} task | {pn} claim <number>" }
    },

    onStart: async function ({ args, message, event, usersData }) {
        const { senderID } = event;
        let userData = await usersData.get(senderID);
        const today = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");

        // --- STRICT RESET LOGIC (SAME AS DAILY2) ---
        if (!userData.data.dailyTasks) {
            userData.data.dailyTasks = { lastReset: today, msgCount: 0, usedCmds: [], claimed: [] };
            await usersData.set(senderID, userData);
        }

        if (userData.data.dailyTasks.lastReset !== today) {
            userData.data.dailyTasks = {
                lastReset: today,
                msgCount: 0,
                usedCmds: [],
                claimed: []
            };
            await usersData.set(senderID, userData);
            userData = await usersData.get(senderID); // Refresh to ensure old claimed data is gone
        }

        const dailyData = userData.data.dailyTasks;

        const getValidCount = (key) => {
            const game = userData.data[key];
            return (game && game.lastReset === today) ? (game.count || 0) : 0;
        };

        let tasks = [
            { id: "1", cur: dailyData.msgCount, req: 1, name: "Chat 1 Message", desc: "Send 1 msg in Baby World Group", rew: "10k" },
            { id: "2", cur: dailyData.msgCount, req: 100, name: "Chat 100 Message", desc: "Send 100 msg in Baby World Group", rew: "2M" },
            { id: "3", cur: getValidCount('quizs'), req: 15, name: "Quiz Game", desc: "Play 15 Quiz Games", rew: "1M" },
            { id: "4", cur: getValidCount('flagAttempts'), req: 15, name: "Flag Game", desc: "Play 15 Flag Games", rew: "1M" },
            { id: "5", cur: getValidCount('slots'), req: 20, name: "Slot Game", desc: "Play 20 Slot Games", rew: "1M" },
            { id: "6", cur: dailyData.msgCount, req: 200, name: "Chat 200 Message", desc: "Send 200 msg in Baby World Group", rew: "1D VIP" },
            { id: "7", cur: getValidCount('cartoons'), req: 15, name: "Cartoon Quiz", desc: "Play 15 Cartoon Games", rew: "1M" },
            { id: "8", cur: getValidCount('ffAttempts'), req: 10, name: "Frefire Quiz", desc: "Play 10 Free Fire Quiz", rew: "1M" },
            { id: "9", cur: getValidCount('animes'), req: 15, name: "Aniqiz", desc: "Play 15 Anime Quiz", rew: "1M" },
            { id: "10", cur: getValidCount('maths'), req: 10, name: "Math Game", desc: "Play 10 Math Games", rew: "1M" },
            { id: "11", cur: getValidCount('actorAttempts'), req: 10, name: "Actor Quiz", desc: "Play 10 Actor Games", rew: "1M" },
            { id: "12", cur: getValidCount('actressAttempts'), req: 10, name: "Actress Quiz", desc: "Play 10 Actress Games", rew: "800k" },
            { id: "13", cur: getValidCount('waifu'), req: 10, name: "Waifu Game", desc: "Play 10 Waifu Quiz", rew: "800k" },
            { id: "14", cur: getValidCount('animalAttempts'), req: 10, name: "Animal Game", desc: "Play 10 Animal Games", rew: "800k" },
            { id: "15", cur: (dailyData.usedCmds || []).length, req: 30, name: "Command Use", desc: "Use 30 Different Commands", rew: "1M" },
            { id: "16", cur: (dailyData.claimed || []).filter(id => id !== "16").length, req: 15, name: "Completionist", desc: "Claim all 15 missions", rew: "5M" }
        ];

        if (args[0] === "task") {
            const width = 1000, height = 1850;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0, "#0f172a"); bgGrad.addColorStop(1, "#1e1b4b");
            ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = "rgba(102, 217, 239, 0.05)"; ctx.beginPath(); ctx.arc(900, 150, 250, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(189, 147, 249, 0.05)"; ctx.beginPath(); ctx.arc(100, 1700, 350, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
            drawRoundRect(ctx, 50, 50, width - 100, 230, 40); ctx.fill();

            const pfpX = 170, pfpY = 165, pfpR = 80;
            ctx.save();
            ctx.beginPath(); ctx.arc(pfpX, pfpY, pfpR + 8, 0, Math.PI * 2);
            ctx.shadowBlur = 20; ctx.shadowColor = "#ff69b4";
            ctx.fillStyle = "#ff69b4"; ctx.fill();
            ctx.restore();

            await drawCircleImage(ctx, senderID, pfpX, pfpY, pfpR);
            
            ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "bold 45px Arial";
            ctx.fillText(userData.name || "User", 280, 140);
            ctx.fillStyle = "#66d9ef"; ctx.font = "bold 26px Arial";
            ctx.fillText(`Missions Completed: ${dailyData.claimed.length}/${tasks.length - 1}`, 280, 190);

            let dy = 340;
            ctx.fillStyle = "#fff"; ctx.font = "bold 38px Arial";
            ctx.fillText("👤 DAILY TASK LIST", 50, dy);
            ctx.strokeStyle = "#bd93f9"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(50, dy + 15); ctx.lineTo(180, dy + 15); ctx.stroke();
            dy += 70;

            tasks.forEach((t, i) => {
                const isClaimed = dailyData.claimed.includes(t.id);
                const progress = Math.min(t.cur / t.req, 1);
                const isReady = progress >= 1 && !isClaimed;

                const x = i % 2 === 0 ? 50 : 510;
                if(i > 0 && i % 2 === 0) dy += 165; 

                ctx.fillStyle = isClaimed ? "rgba(80, 250, 123, 0.08)" : "rgba(255,255,255,0.04)";
                drawRoundRect(ctx, x, dy, 440, 150, 25); ctx.fill();
                if(isReady) { ctx.strokeStyle = "#66d9ef"; ctx.lineWidth = 2; ctx.stroke(); }

                ctx.fillStyle = "#fff"; ctx.font = "bold 26px Arial";
                ctx.fillText(`${t.id}. ${t.name}`, x + 25, dy + 40);
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "18px Arial";
                ctx.fillText(t.desc, x + 25, dy + 70);

                ctx.fillStyle = "#1e293b"; 
                drawRoundRect(ctx, x + 25, dy + 95, 280, 10, 5); ctx.fill();
                
                if (progress > 0) {
                    ctx.fillStyle = isClaimed ? "#50fa7b" : (isReady ? "#66d9ef" : "#ffb86c");
                    drawRoundRect(ctx, x + 25, dy + 95, 280 * progress, 10, 5); ctx.fill();
                }

                ctx.textAlign = "right";
                ctx.font = "bold 20px Arial"; ctx.fillStyle = "#bd93f9";
                ctx.fillText(`🎁 ${t.rew}`, x + 415, dy + 40);
                
                ctx.font = "bold 20px Arial"; ctx.fillStyle = isClaimed ? "#50fa7b" : (isReady ? "#66d9ef" : "#ff5555");
                ctx.fillText(isClaimed ? "✓ COMPLETE" : (isReady ? "✦ CLAIM" : `${t.cur}/${t.req}`), x + 415, dy + 125);
                ctx.textAlign = "left";
            });

            const cachePath = path.join(process.cwd(), "cache", `daily_${senderID}.png`);
            fs.ensureDirSync(path.join(process.cwd(), "cache"));
            fs.writeFileSync(cachePath, canvas.toBuffer("image/png"));

            return message.reply({
                body: boldText(`Hey ${userData.name} 🎀\nUse !daily claim <number> to get rewards!`),
                attachment: fs.createReadStream(cachePath)
            }, () => fs.unlinkSync(cachePath));
        }

        if (args[0] === "claim") {
            const taskNum = args[1];
            if (!taskNum) return message.reply(boldText("❌ Please provide a task number."));
            if (dailyData.claimed.includes(taskNum)) return message.reply(boldText("❌ Already claimed today!"));

            let rewardMsg = "", taskName = "", rewardApplied = false;

            if (taskNum === "16") {
                const othersDone = tasks.filter(t => t.id !== "16").every(t => dailyData.claimed.includes(t.id));
                if (othersDone) {
                    userData.money += 5000000;
                    rewardMsg = "5,000,000 balance"; taskName = "Completionist"; rewardApplied = true;
                }
            } else {
                const t = tasks.find(x => x.id === taskNum);
                if (t && t.cur >= t.req) {
                    if (taskNum === "6") {
                        const existing = await VipUser.findOne({ uid: senderID });
                        const base = existing && existing.expiredAt > new Date() ? moment(existing.expiredAt) : moment().tz("Asia/Dhaka");
                        await VipUser.updateOne({ uid: senderID }, { uid: senderID, expiredAt: base.add(1, "days").toDate() }, { upsert: true });
                        rewardMsg = "1 Day 𝐕𝐈𝐏";
                    } else {
                        const amt = t.rew.includes("M") ? parseFloat(t.rew) * 1000000 : parseFloat(t.rew) * 1000;
                        userData.money += amt;
                        rewardMsg = t.rew + " balance";
                    }
                    taskName = t.name; rewardApplied = true;
                }
            }

            if (rewardApplied) {
                dailyData.claimed.push(taskNum);
                await usersData.set(senderID, userData);
                return message.reply(boldText(`✅ Successfully claimed ${taskName}!\n• Reward: ${rewardMsg}`));
            } else return message.reply(boldText("❌ Mission incomplete!"));
        }

        if (userData.data.lastTimeGetReward === today) return message.reply(boldText("Already checked in today! Use 'daily task' to see missions."));
        userData.data.lastTimeGetReward = today;
        userData.money += 1000;
        await usersData.set(senderID, userData);
        message.reply(boldText(">🎀 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐜𝐞𝐢𝐯𝐞𝐝 𝟏𝟎𝟎𝟎 𝐜𝐨𝐢𝐧𝐬 𝐚𝐧𝐝 𝟏𝟓𝟎 𝐞𝐱𝐩."));
    },

    onChat: async function ({ event, usersData, isUserCallCommand, commandName }) {
        const { senderID, threadID } = event;
        if (!senderID || isNaN(senderID)) return;

        let userData = await usersData.get(senderID);
        const today = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
        
        if (!userData.data.dailyTasks || userData.data.dailyTasks.lastReset !== today) {
            userData.data.dailyTasks = { lastReset: today, msgCount: (threadID === BABY_WORLD_TID ? 1 : 0), usedCmds: [], claimed: [] };
        } else if (threadID === BABY_WORLD_TID) {
            userData.data.dailyTasks.msgCount++;
        }

        if (isUserCallCommand && commandName && commandName !== "daily") {
            if (!userData.data.dailyTasks.usedCmds) userData.data.dailyTasks.usedCmds = [];
            if (!userData.data.dailyTasks.usedCmds.includes(commandName)) {
                userData.data.dailyTasks.usedCmds.push(commandName);
            }
        }

        await usersData.set(senderID, userData);
    }
};

async function drawCircleImage(ctx, uid, x, y, radius) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    try {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const img = await loadImage(avatarUrl);
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } catch (e) { ctx.fillStyle = "#333"; ctx.fill(); }
    ctx.restore();
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 0) w = 0;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
            }
