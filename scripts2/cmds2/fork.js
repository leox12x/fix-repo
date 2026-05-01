module.exports = {
  config: {
    name: "fork",
    aliases: [],
    version: "1.8",
    author: "MahMUD",
    countDown: 0,
    role: 0,
    category: "info",
    guide: {
      en: "{pn} - Get the GitHub fork link and tutorial video."
    }
  },

  onStart: async function ({ message }) {
    const forkLink = "https://github.com/mahmudx7/hinata-baby-v2";
    const tutorialLink = "https://youtu.be/zJsemXLaRbY?si=8O-O-nSXgQlsNvnU";

    return message.reply(
`🐤 | Fork this project here:

${forkLink}

• Bot make tutorial video:
${tutorialLink}`
    );
  }
};
