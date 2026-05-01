 module.exports = {
  config: {
    name: "npx",
    version: "17.0",
    author: "MahMUD",
    countDown: 5,
    role: 2,
    category: "system",
    prefix: false,
    guide: {
      en: "{pn} add -p <cmd> (Personal)\n{pn} add -g <cmd> (Global Admin)\n{pn} remove -p/-g <cmd>\n{pn} info / list",
      bn: "{pn} add -p <cmd> (ব্যক্তিগত)\n{pn} add -g <cmd> (গ্লোবাল অ্যাডমিন)\n{pn} remove -p/-g <cmd>\n{pn} info / list"
    }
  },

  langs: {
    bn: {
      adminOnly: "❌ শুধুমাত্র অ্যাডমিন গ্লোবাল কমান্ড কন্ট্রোল করতে পারবেন।",
      cmdNotFound: "❌ কমান্ডটি খুঁজে পাওয়া যায়নি।",
      enterCmd: "❌ সঠিক ফরম্যাট ব্যবহার করুন। উদাহরণ: {pn} add -p sim",
      gAdded: "🌍 %1 এখন সবার জন্য নো-প্রিফিক্স হিসেবে সেট করা হয়েছে।",
      uAdded: "✅ %1 এখন আপনার পার্সোনাল লিস্টে যোগ হয়েছে।",
      removed: "✅ %1 থেকে নো-প্রিফিক্স সুবিধা সরানো হয়েছে।",
      userLimit: "⚠️ আপনি সর্বোচ্চ ৫টি ব্যক্তিগত কমান্ড যোগ করতে পারবেন!",
      usage: "❓ ব্যবহার:\n!npx add -p/-g <cmd>\n!npx remove -p/-g <cmd>\n!npx info / list"
    },
    en: {
      adminOnly: "❌ Only admin can manage global commands.",
      cmdNotFound: "❌ Command not found.",
      enterCmd: "❌ Use correct format. Example: {pn} add -p sim",
      gAdded: "🌍 %1 is now set to No-Prefix for everyone.",
      uAdded: "✅ %1 added to your personal no-prefix list.",
      removed: "✅ No-Prefix removed from %1.",
      userLimit: "⚠️ Max 5 personal commands allowed!",
      usage: "❓ Usage:\n!npx add -p/-g <cmd>\n!npx remove -p/-g <cmd>\n!npx info / list"
    }
  },

  onLoad: async function ({ globalData }) {
    const npxSettings = await globalData.get("npxCustom", "data", {});
    for (const cmdName in npxSettings) {
      const command = global.GoatBot.commands.get(cmdName);
      if (command && command.config) {
        command.config.prefix = npxSettings[cmdName];
      }
    }
  },

  onStart: async function ({ message, args, event, usersData, globalData, getLang }) {
    const { commands } = global.GoatBot;
    const uid = event.senderID;
    const isAdmin = global.GoatBot.config.adminBot.includes(uid);

    const action = args[0]?.toLowerCase(); 
    const type = args[1]?.toLowerCase();   
    const cmdName = args[2]?.toLowerCase();

    let npxSettings = await globalData.get("npxCustom", "data", {});
    let userSettings = await usersData.get(uid, "npxUser", { list: [] });

    const isGlobal = type === "-g" || type === "global";
    const isPersonal = type === "-p" || type === "personal";

    if (action === "add") {
      if (!type || !cmdName) return message.reply(getLang("enterCmd"));
      const command = commands.get(cmdName);
      if (!command) return message.reply(getLang("cmdNotFound"));

      if (isGlobal) {
        if (!isAdmin) return message.reply(getLang("adminOnly"));
        command.config.prefix = true; 
        npxSettings[cmdName] = true;
        await globalData.set("npxCustom", npxSettings, "data");
        return message.reply(getLang("gAdded", cmdName));
      } else if (isPersonal) {
        if (userSettings.list.length >= 5) return message.reply(getLang("userLimit"));
        if (!userSettings.list.includes(cmdName)) userSettings.list.push(cmdName);
        await usersData.set(uid, userSettings, "npxUser");
        return message.reply(getLang("uAdded", cmdName));
      }
    }

    if (action === "remove") {
      if (!type || !cmdName) return message.reply(getLang("enterCmd"));
      const command = commands.get(cmdName);
      if (isGlobal) {
        if (!isAdmin) return message.reply(getLang("adminOnly"));
        if (command) command.config.prefix = false; 
        delete npxSettings[cmdName];
        await globalData.set("npxCustom", npxSettings, "data");
        return message.reply(getLang("removed", cmdName));
      } else if (isPersonal) {
        userSettings.list = userSettings.list.filter(c => c !== cmdName);
        await usersData.set(uid, userSettings, "npxUser");
        return message.reply(getLang("removed", cmdName));
      }
    }

    if (action === "list") {
      const noPrefixList = [];
      commands.forEach((cmd, name) => {
        if (cmd.config && cmd.config.prefix === true) noPrefixList.push(name);
      });
      return message.reply(`🌍 GLOBAL NO-PREFIX:\n${noPrefixList.length === 0 ? "Empty" : noPrefixList.sort().join(", ")}`);
    }

    if (action === "info") {
      return message.reply(`👤 YOUR LIST:\n${userSettings.list.length === 0 ? "Empty" : userSettings.list.join(", ")}\nLimit: ${userSettings.list.length}/5`);
    }

    return message.reply(getLang("usage"));
  },

  onChat: async function (params) {
    const { api, event, message, usersData, globalData, threadsData } = params;
    const { commands } = global.GoatBot;
    const body = event.body?.trim();
    if (!body || body.startsWith(global.GoatBot.config.prefix)) return;

    const args = body.split(/\s+/);
    const cmdName = args[0].toLowerCase();
    const command = commands.get(cmdName);
    
    if (!command || command.config.prefix === true) return;

    const userSettings = await usersData.get(event.senderID, "npxUser", { list: [] });
    if (userSettings.list.includes(cmdName)) {
      try {
        // সব প্যারামিটার হুবহু পাস করা হচ্ছে যাতে কমান্ডটি বুঝতে পারে এটি আসল কল
        return command.onStart({
          ...params,
          args: args.slice(1),
          getLang: (key, ...val) => global.GoatBot.getLang(command.config.name, event.senderID, key, ...val)
        });
      } catch (e) {
        console.error("NPX Error:", e);
      }
    }
  }
};
