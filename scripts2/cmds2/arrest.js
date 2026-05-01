const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs")

function formatMoney(num) {
  const units = ["", "K", "M", "B"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}

module.exports = {
	config: {
		name: "arrest",
		aliases: ["arrest"],
		version: "1.0",
		author: "milan-says",
		countDown: 5,
		role: 0,
		shortDescription: "arret the rapist",
		longDescription: "",
		category: "image",
		guide:  {
			vi: "{pn} [@tag]",
			en: "{pn} [@tag]"
		}
	},

	onStart: async function ({ message, args, api, event, usersData, user }) {
       const COST = 1000;
    const userData = await usersData.get(event.senderID);
    const balance = userData.money || 0;

    if (balance < COST) {
      return api.sendMessage(
        `𝐁𝐚𝐛𝐲, 𝐧𝐞𝐞𝐝 ${formatMoney(COST)} 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐦𝐝, 𝐛𝐮𝐭 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 ${formatMoney(balance)} 🥹\n\n• 𝐔𝐬𝐞 𝐝𝐚𝐢𝐥𝐲 𝐟𝐨𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐫 𝐩𝐥𝐚𝐲 𝐠𝐚𝐦𝐞𝐬`,
        event.threadID,
        event.messageID
      );
    }

    const newBalance = balance - COST;
    await usersData.set(event.senderID, { money: newBalance });
		
		const mention = Object.keys(event.mentions);
        if (mention.length == 0) return message.reply("please mention someone");
        else if (mention.length == 1) {
            const one = event.senderID, two = mention[0];
            bal(one, two).then(ptth => { message.reply({ body: "You are under arrest", attachment: fs.createReadStream(ptth) }) })
        } else {
            const one = mention[1], two = mention[0];
            bal(one, two).then(ptth => { message.reply({ body: "You are under arrest", attachment: fs.createReadStream(ptth) }) })
        }
    }


};

async function bal(one, two) {

   let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avone.circle()
    let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avtwo.circle()
    let pth = "fak.png"
    let img = await jimp.read("https://i.imgur.com/ep1gG3r.png")
    img.resize(500, 500).composite(avone.resize(100, 100), 375, 9).composite(avtwo.resize(100, 100), 160, 92);

    await img.writeAsync(pth)
    return pth
}
