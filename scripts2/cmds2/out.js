module.exports = {
  config: {
    name: "out",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 2,
    category: "admin",
    guide: {
      en: "out bot from the group"
    }
  },
  onStart: async function ({ message, args, api, event }) {
   const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.\n\nPlease author name MahMUD to working this cmd", event.threadID, event.messageID);
    }

    if (!args[0]) {
      return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
    }
    if (!isNaN(args[0])) {
      return api.removeUserFromGroup(api.getCurrentUserID(), args.join(" "));
    }
  }
};