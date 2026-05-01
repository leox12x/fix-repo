const fs = require('fs-extra');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
    config: {
        name: "eid",
        aliases: [],
        version: "2.0",
        author: "RL",
        countDown: 5,
        role: 0,
        category: "Islamic",
        shortDescription: { en: "Create stunning Eid Mubarak banner" },
        description: { en: "Generates a beautiful Eid Mubarak banner with Islamic patterns and your profile picture" },
        guide: { en: "Use: {pn} - Creates banner with your profile\n{pn} @user - Creates banner with mentioned user's profile\nReply to someone with: {pn} - Creates banner with their profile" }
    },

    onStart: async function ({ api, event, message, args, usersData }) {
        try {
            let targetID = event.senderID;

            // Determine whose profile picture to use
            if (event.type === "message_reply") {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            }

            const userData = await usersData.get(targetID);
            const userName = userData.name || "User";

            message.reaction('⏳');

            // Facebook Graph API URLs for the profile picture
            const avatarUrls = [
                `https://graph.facebook.com/${targetID}/picture?width=500&height=500&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`,
                `https://graph.facebook.com/${targetID}/picture?width=500&height=500`,
                `https://avatars.githubusercontent.com/u/1?v=4` // Fallback
            ];

            let imageBuffer;
            for (const url of avatarUrls) {
                try {
                    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                    imageBuffer = Buffer.from(response.data);
                    break;
                } catch (err) {
                    console.error(`Failed to fetch from ${url}, trying next...`);
                }
            }

            if (!imageBuffer) throw new Error("Could not fetch profile picture");

            // Canvas Setup
            const canvas = createCanvas(1000, 600);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Background Gradient
            const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGradient.addColorStop(0, '#0f2027');
            bgGradient.addColorStop(0.5, '#203a43');
            bgGradient.addColorStop(1, '#2c5364');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Islamic Geometric Patterns (Diamonds)
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            for (let x = 0; x < canvas.width; x += 80) {
                for (let y = 0; y < canvas.height; y += 80) {
                    ctx.beginPath();
                    ctx.moveTo(x + 40, y);
                    ctx.lineTo(x + 80, y + 40);
                    ctx.lineTo(x + 40, y + 80);
                    ctx.lineTo(x, y + 40);
                    ctx.closePath();
                    ctx.stroke();
                    // Small circles in pattern
                    ctx.beginPath();
                    ctx.arc(x + 40, y + 40, 20, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Draw Moon/Crescent
            const moonX = canvas.width - 150, moonY = 100, moonRadius = 60;
            const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 2);
            moonGrad.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            moonGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = moonGrad;
            ctx.fillRect(moonX - moonRadius * 2, moonY - moonRadius * 2, moonRadius * 4, moonRadius * 4);

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            // Create crescent effect
            ctx.fillStyle = '#203a43'; 
            ctx.beginPath();
            ctx.arc(moonX + 20, moonY - 10, moonRadius - 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw Decorative Stars
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#FFD700';
            const stars = [
                { x: moonX - 100, y: moonY - 50, size: 3 },
                { x: moonX - 80, y: moonY + 60, size: 2 },
                { x: moonX + 80, y: moonY - 80, size: 4 },
                { x: moonX + 50, y: moonY + 70, size: 2 },
                { x: moonX - 120, y: moonY + 20, size: 3 }
            ];
            stars.forEach(star => {
                ctx.save();
                ctx.translate(star.x, star.y);
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos(i * 4 * Math.PI / 5) * star.size, Math.sin(i * 4 * Math.PI / 5) * star.size);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });

            // Profile Picture Section
            const avatarX = 200, avatarY = canvas.height / 2, avatarRadius = 100;
            const borderGrad = ctx.createLinearGradient(avatarX - avatarRadius, avatarY - avatarRadius, avatarX + avatarRadius, avatarY + avatarRadius);
            borderGrad.addColorStop(0, '#FFD700');
            borderGrad.addColorStop(0.5, '#FFA500');
            borderGrad.addColorStop(1, '#FF8C00');

            ctx.fillStyle = borderGrad;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius + 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius + 4, 0, Math.PI * 2);
            ctx.fill();

            const profileImg = await loadImage(imageBuffer);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(profileImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.restore();

            // Text Styles
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textCenterX = canvas.width / 2 + 150;
            const textCenterY = canvas.height / 2 - 50;

            // Shadow for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.font = 'bold 72px Georgia';
            ctx.fillText('EID', textCenterX + 3, textCenterY - 23);
            ctx.font = '300 52px Georgia';
            ctx.fillText('MUBARAK', textCenterX + 3, textCenterY + 37);

            // Main Text Gradient
            const textGrad = ctx.createLinearGradient(textCenterX - 200, textCenterY - 50, textCenterX + 200, textCenterY + 50);
            textGrad.addColorStop(0, '#FFD700');
            textGrad.addColorStop(0.5, '#FFA500');
            textGrad.addColorStop(1, '#FF6B6B');

            ctx.fillStyle = textGrad;
            ctx.font = 'bold 72px Georgia';
            ctx.fillText('EID', textCenterX, textCenterY - 25);
            ctx.font = '300 52px Georgia';
            ctx.fillText('MUBARAK', textCenterX, textCenterY + 35);

            // Subtitle
            ctx.font = 'italic 24px Georgia';
            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.fillText('May this blessed day bring joy and peace', textCenterX, textCenterY + 100);

            // User Name Label
            ctx.font = '28px Georgia';
            ctx.fillStyle = '#4ECDC4';
            ctx.fillText('' + userName, avatarX, avatarY + avatarRadius + 40);

            // Gold Underline
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(textCenterX - 150, textCenterY + 130);
            ctx.lineTo(textCenterX + 150, textCenterY + 130);
            ctx.stroke();

            // File Handling
            const cachePath = path.join(__dirname, 'cache');
            await fs.ensureDir(cachePath);
            const fileName = path.join(cachePath, `eid_mubarak_${targetID}_${Date.now()}.png`);
            const buffer = canvas.toBuffer('image/png');
            
            await fs.writeFile(fileName, buffer);
            message.reaction('✅');

            await message.reply({
                body: `🌙✨ Eid Mubarak ${userName}! ✨🌙\n\nMay this blessed celebration bring you endless joy, peace, and prosperity. May Allah's blessings be with you and your loved ones. 🤲💫`,
                attachment: fs.createReadStream(fileName)
            });

            // Cleanup
            setTimeout(() => {
                fs.unlink(fileName).catch(console.error);
            }, 60000);

        } catch (error) {
            console.error("[EID MUBARAK ERROR]", error);
            message.reaction('❌');
            const errors = [
                '❌ Unable to create your Eid banner. Please try again in a moment.',
                '⚠ Banner creation failed. Check your internet connection and try again.',
                '🔧 Something went wrong while generating the banner. Please retry.'
            ];
            message.reply(errors[Math.floor(Math.random() * errors.length)]);
        }
    }
};
