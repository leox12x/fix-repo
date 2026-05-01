module.exports = {
  config: {
    name: "offbot",
    version: "1.0",
    author: "Mah MUD",
    countDown: 45,
    role: 0,
    shortDescription: "Turn off bot",
    longDescription: "Turn off bot",
    category: "admin",
    guide: "{p}{n}"
  },
  onStart: async function ({event, api}) {
    const permission = [ "61556006709662" ];
  if (!permission.includes(event.senderID)) {
    api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nYou don't have permission to use this command.\n═══ஜ۩۞۩ஜ═══╝", event.threadID, event.messageID);
    return;
  }
    api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nsuccessfully Turned Off System ✅\═══ஜ۩۞۩ஜ═══╝",event.threadID, () =>process.exit(0))}
};
