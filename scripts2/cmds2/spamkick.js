module.exports.config = {
  name: "spamkick",
  version: "1.0.0",
  role: 0, 
  author: "xx",
  usePrefix: true,
  description: { en:"auto spamkick a user who spam messages in a group chat"},
  category: "box chat",
  guide: { en:"[on/off] or [settings]"},
  cooldowns: 5
};
module.exports.onChat = async ({ api, event, usersData }) => {
  const { senderID, threadID } = event;
  if (!global.antispam) global.antispam = new Map();

  const threadInfo = global.antispam.has(threadID) ? global.antispam.get(threadID) : { users: {} };
  if (!(senderID in threadInfo.users)) {
    threadInfo.users[senderID] = { count: 1, time: Date.now() };
  } else {
    threadInfo.users[senderID].count++;
    const timePassed = Date.now() - threadInfo.users[senderID].time;
    const messages = threadInfo.users[senderID].count;
    const timeLimit = 80000;
    const messageLimit = 14; //Limit of message

    if (messages > messageLimit && timePassed < timeLimit) {
      api.removeUserFromGroup(senderID, threadID, async (err) => {
        if (err) {
          console.error(err);
        } else {
          api.sendMessage({body: `${await usersData.getName(senderID)} has been removed for spamming.\nUser ID: ${senderID}`}, threadID);
        }
      });
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    } else if (timePassed > timeLimit) {
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    }
  }

  global.antispam.set(threadID, threadInfo);
};

module.exports.onStart = async ({ api, event, args, client, __GLOBAL }) => {
  switch (args[0]) {
      case "on":
        if (!global.antispam) global.antispam = new Map();
        global.antispam.set(event.threadID, { users: {} });
        api.sendMessage("✅ | Spam kick has been turned on for this Group.", event.threadID,event.messageID);
        break;
      case "off":
        if (global.antispam && global.antispam.has(event.threadID)) {
          global.antispam.delete(event.threadID);
          api.sendMessage("❎ | Spam kick has been turned off for this thread", event.threadID,event.messageID);
        } else {
          api.sendMessage("❎ | Spam kick is not active on this thread", event.threadID,event.messageID);
        }
        break;
      default:
        api.sendMessage("Please use 'on' to activate or 'off' to deactivate the Spam kick.", event.threadID,event.messageID);
    }
  };
