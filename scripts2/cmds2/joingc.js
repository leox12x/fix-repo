module.exports = {
  config: {
    name: "supportgc",
    aliases: ["join", "support"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "general",
    guide: {
      en: "{pn} - Join the official support group"
    }
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const supportGroupThreadID = "7460623087375340";
    const userID = event.senderID;

    try {
      const { members } = await threadsData.get(supportGroupThreadID);
      const userInfo = await api.getUserInfo(userID);
      const senderName = event.senderName || userInfo[userID].name;

      const userAlreadyInGroup = members.some(
        member => member.userID === userID && member.inGroup
      );

      if (userAlreadyInGroup) {
        const alreadyInGroupMessage = `✅ | ${senderName} You are already a member of [ YOUR BABY WORLD ] group.

- Please follow our group rules & enjoy.`;
        return message.reply(alreadyInGroupMessage);
      }

      await api.addUserToGroup(userID, supportGroupThreadID);

      const successMessage = `╭─────────────◊
│ ✨ 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 ✨
│ [ YOUR BABY WORLD ]
╰─────────────◊

✅ You have been successfully added.
- Please follow our group rules & enjoy.`;
      return message.reply(successMessage);

    } catch (error) {
      console.error("❌ Error adding user to support group:", error);
      const failedMessage = `Join your Hinata official bot support group messenger and WhatsApp. Link 👇

• Messenger: https://m.me/j/AbaI0vNvy8EjE1ek/

• Whatsapp: https://chat.whatsapp.com/BLMzY9oF8lAC7sqH8IpyOH

Contact Admin:
wp: 01836298139`;
      return message.reply(failedMessage);
    }
  }
};
