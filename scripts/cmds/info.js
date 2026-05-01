const axios = require("axios");

const fancyMap = {
  "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
  "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
  "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
  "A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
  "K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
  "U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙",
  "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗"
};

function toFancy(text="") {
  return String(text).split("").map(c => fancyMap[c] || c).join('');
}

const API_BASE = "https://mahmud-global-apis.onrender.com/api/info";

module.exports = {
  config: {
    name: "info",
    version: "1.9",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "info"
  },

  onStart: async function({ message, args, event, api }) {
    if (!message || message.replySent) return;

    const commandArg = args[0]?.toLowerCase();
    const fullInput = args.join(" "); 
    const inputAfterSub = args.slice(1).join(" ");
    
    // Owner Check logic
    const GODData = global.GoatBot.config.GOD;
    const isOwner = GODData.includes(event.senderID);

    if (commandArg === "add") {
      if (!isOwner) return message.reply("❌ | Baby, only my owner can use this command.");
      this.addUser(message, inputAfterSub);
    } else if (commandArg === "list") {
      this.listUsers(message);
    } else if (commandArg === "delete") {
      if (!isOwner) return message.reply("❌ | Baby, only my owner can use this command.");
      this.deleteUser(message, inputAfterSub);
    } else {
      this.getUser(message, fullInput);
    }
  },

  listUsers: async function(message) {
    try {
      const res = await axios.get(`${API_BASE}/list`);
      const users = res.data.users;
      if (!users || users.length === 0) return message.reply("⚠ No user info found.");
      const userList = users.map((u,i) => `${i+1}. ${u.allowed_ids[0].name}`).join("\n");
      message.reply(`🎀 𝐔𝐬𝐞𝐫 𝐯𝐢𝐩 𝐢𝐧𝐟𝐨 𝐥𝐢𝐬𝐭:\n${userList}`);
    } catch (err) {
      message.reply("⚠ Failed to fetch user list.");
    }
  },

  getUser: async function(message, idOrName) {
    const target = (idOrName && idOrName.trim()) ? idOrName.trim() : "mahmud";
    try {
      const res = await axios.get(`${API_BASE}/user`, { params: { idOrName: target } });
      const user = res.data.user;
      if (!user) return message.reply(`⚠ User "${target}" not found.`);
      const finalMessage = toFancy(user.message || "");
      const response = await axios({
        method: "GET",
        url: user.image,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      message.reply({ body: finalMessage, attachment: response.data });
    } catch (err) {
      message.reply("⚠ Failed to fetch user info.");
    }
  },

  addUser: async function(message, userData) {
    const parts = userData.split(" - ");
    if (parts.length < 4) return message.reply("⚠ Format: info add <uid> - <name> - <message> - <image_url>");
    try {
      await axios.post(`${API_BASE}/add`, {
        id: parts[0].trim(),
        name: parts[1].trim(),
        message: parts[2].trim(),
        image: parts[3].trim()
      });
      message.reply(`✔ User info added for: ${parts[1].trim()}!`);
    } catch (err) {
      message.reply("⚠ Failed to add user info.");
    }
  },

  deleteUser: async function(message, idOrName) {
    if (!idOrName) return message.reply("⚠ Provide a name/ID to delete.");
    try {
      const res = await axios.get(`${API_BASE}/list`);
      const users = res.data.users || [];
      const matches = users.filter(u => u.allowed_ids[0].name.toLowerCase() === idOrName.trim().toLowerCase());
      if (matches.length === 0) return message.reply(`⚠ No user found.`);
      for (const user of matches) {
        await axios.delete(`${API_BASE}/delete`, { params: { idOrName: user.allowed_ids[0].name } });
      }
      message.reply(`✔ Deleted ${matches.length} user(s).`);
    } catch (err) {
      message.reply("⚠ Failed to delete.");
    }
  }
};
