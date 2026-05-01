const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "gcinfo",
    aliases: ["boxinfo", "groupinfo"],
    version: "1.0",
    author: "BADBOYシ",
    countDown: 5,
    role: 2,
    shortDescription: "See Info box",
    longDescription: "",
    category: "box chat",
    guide: {
      en: "{p} [groupinfo|boxinfo]",
    }
  },

  onStart: async function ({ api, event, args }) {
    let threadInfo = await api.getThreadInfo(event.threadID);

    let threadMem = threadInfo.participantIDs.length;

    var gendernam = [];
    var gendernu = [];
    var nope = [];

    for (let z in threadInfo.userInfo) {
      var gioitinhone = threadInfo.userInfo[z].gender;
      var nName = threadInfo.userInfo[z].name;

      if (gioitinhone == "MALE") {
        gendernam.push(z + gioitinhone);
      } else if (gioitinhone == "FEMALE") {
        gendernu.push(gioitinhone);
      } else {
        nope.push(nName);
      }
    }

    var nam = gendernam.length;
    var nu = gendernu.length;

    var listad = '';
    var qtv2 = threadInfo.adminIDs;
    let qtv = threadInfo.adminIDs.length;
    let sl = threadInfo.messageCount;
    let icon = threadInfo.emoji;
    let id = threadInfo.threadID;

    for (let i = 0; i < qtv2.length; i++) {
      const infu = (await api.getUserInfo(qtv2[i].id));
      const name = infu[qtv2[i].id].name;
      listad += '• ' + name + '\n';
    }

    let sex = threadInfo.approvalMode;
    var pd = sex == false ? 'Turned off' : sex == true ? 'Turned on' : 'Kh';

    var callback = () =>
      api.sendMessage(
        {
          body: `🚀[ 𝐆𝐂 INFO ]:
🚀[ 𝐆𝐫𝐨𝐮𝐩 𝐈𝐃 ]: ${id}
🚀[ 𝐀𝐩𝐩𝐫𝐨𝐯𝐚𝐥 ]: ${pd}
🚀[ 𝐄𝐦𝐨𝐣𝐢 ]: ${icon}
🚀[ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 ]: Including ${threadMem} Members
🚀[ 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐌𝐚𝐥𝐞𝐬 ]: ${nam}
🚀[ 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐅𝐞𝐦𝐚𝐥𝐞𝐬 ]: ${nu}
🚀[ 𝐓𝐨𝐭𝐚𝐥 𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐨𝐫𝐬 ]: ${qtv}
[ 𝐈𝐧𝐜𝐥𝐮𝐝𝐞 ]:
${listad}
🚀[ 𝐓𝐨𝐭𝐚𝐥 𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬 ]: ${sl} msgs.

𝐌𝐚𝐝𝐞 𝐖𝐢𝐭 ❤ 𝐁𝐲: MahMUD`,
          attachment: fs.createReadStream(__dirname + '/cache/1.png')
        },
        event.threadID,
        () => fs.unlinkSync(__dirname + '/cache/1.png'),
        event.messageID
      );

    return request(encodeURI(threadInfo.imageSrc))
      .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
      .on('close', () => callback());
  }
};
