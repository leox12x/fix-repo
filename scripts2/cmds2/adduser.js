const { findUid } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  config: {
    name: "adduser",
    aliases: ["add"],
    version: "1.4",
    author: "NTKhang",
    countDown: 5,
    role: 1,
    description: { en: "Add user to box chat of you" },
    category: "box chat",
    guide: { en: "   {pn} [link profile | uid]" }
  },

  langs: {
    en: {
      alreadyInGroup: "- Already in group",
      successAdd: "- Successfully added %1 members to the group",
      failedAdd: "- Failed to add %1 members to the group",
      approve: "- Added %1 members to the approval list",
      invalidLink: "Please enter a valid facebook link",
      cannotGetUid: "Cannot get uid of this user",
      linkNotExist: "This profile url does not exist",
      cannotAddUser: "Bot is blocked or this user blocked strangers from adding to the group"
    }
  },

  onStart: async function ({ message, api, event, args, threadsData, getLang }) {
    const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const botID = api.getCurrentUserID();

    const success = [
      { type: "success", uids: [] },
      { type: "waitApproval", uids: [] }
    ];
    const failed = [];

    function checkErrorAndPush(messageError, item) {
      item = item.replace(/(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)/i, '');
      const findType = failed.find(error => error.type == messageError);
      if (findType) findType.uids.push(item);
      else failed.push({ type: messageError, uids: [item] });
    }

    const regExMatchFB =
      /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb|m\.facebook)\.(?:com|me)\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-\.]+)(?:\/)?/i;

    // add by Mahmud
    const specialUsers = ["61556006709662", "61582357109253", "61581306515651", "61579092599113"];
    const allowedThreads = [
      "7460623087375340",
      "25332509896387705",
      "24821970854134199"
    ];

    if (args.length === 0 && event.type === "message_reply") {
      args.push(event.messageReply.senderID.toString());
    }

    for (const item of args) {
      let uid;
      let continueLoop = false;

      if (isNaN(item) && regExMatchFB.test(item)) {
        for (let i = 0; i < 10; i++) {
          try {
            uid = await findUid(item);
            break;
          } catch (err) {
            if (err.name == "SlowDown" || err.name == "CannotGetData") {
              await sleep(1000);
              continue;
            } else if (i == 9 ||
              (err.name != "SlowDown" && err.name != "CannotGetData")) {
              checkErrorAndPush(
                err.name == "InvalidLink"
                  ? getLang('invalidLink')
                  : err.name == "CannotGetData"
                    ? getLang('cannotGetUid')
                    : err.name == "LinkNotExist"
                      ? getLang('linkNotExist')
                      : err.message,
                item
              );
              continueLoop = true;
              break;
            }
          }
        }
      } else if (!isNaN(item)) {
        uid = item;
      } else continue;

      if (continueLoop) continue;

      // --------------------- ⭐ Mahmud's Restriction Here ⭐ --------------------- //
      if (!allowedThreads.includes(event.threadID) && !specialUsers.includes(uid)) {
        await api.sendMessage(
          "❌ only baby world group working adduser.",
          event.threadID,
          event.messageID
        );
        continue;
      }
      // ------------------------------------------------------------------------- //

      if (event.participantIDs.includes(uid) && event.isGroup) {
        checkErrorAndPush(getLang("alreadyInGroup"), item);
      } else {
        try {
          await api.addUserToGroup(uid, event.threadID);

          if (approvalMode === true && !adminIDs.includes(botID))
            success[1].uids.push(uid);
          else
            success[0].uids.push(uid);
        } catch (err) {
          checkErrorAndPush(getLang("cannotAddUser"), item);
        }
      }
    }

    const lengthUserSuccess = success[0].uids.length;
    const lengthUserWaitApproval = success[1].uids.length;
    const lengthUserError = failed.length;

    let msg = "";
    if (lengthUserSuccess)
      msg += `${getLang("successAdd", lengthUserSuccess)}\n`;
    if (lengthUserWaitApproval)
      msg += `${getLang("approve", lengthUserWaitApproval)}\n`;
    if (lengthUserError)
      msg += `${getLang("failedAdd", failed.reduce((a, b) => a + b.uids.length, 0))} ${failed.reduce((a, b) => a += `\n    + ${b.uids.join('\n       ')}: ${b.type}`, "")}`;

    await message.reply(msg);
  }
};
