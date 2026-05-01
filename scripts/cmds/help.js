const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "2.5",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "info",
    guide: { en: "{p}help [command_name]" }
  },

  onStart: async function ({ message, event, args }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    try {
      if (!args.length) {
        const helpText = `╭────⭓ 𝐈𝐌𝐀𝐆𝐄 
│✧pin ✧write
│✧art ✧cat
│✧catsay ✧copuledp
│✧messi ✧neymar
│✧cdp ✧cdpvip
╰───────────⭓

╭─────⭓ 𝐀𝐈
│✧ai ✧baby
│✧bby ✧hinata
│✧gemini 
│✧gpt ✧gpt4 
│✧deepseek ✧qwen
│✧llama ✧gemma
╰───────────⭓

╭─────⭓ 𝐆𝐄𝐍𝐄𝐑𝐀𝐋
│✧advice ✧callad
│✧cs ✧math
│✧prefix ✧spy
│✧support ✧table
│✧uid ✧upt
╰───────────⭓

╭─────⭓ 𝐈𝐌𝐀𝐆𝐄 𝐆𝐄𝐍
│✧anigen ✧art
│✧dalle3 ✧dalle
│✧fluxpro ✧fulxultra
│✧poli ✧draw
│✧sdxl ✧xl ✧flux
│✧Infinity ✧dai
│✧edit ✧imagine 
│✧artgen ✧gptimage
╰───────────⭓

╭─────⭓ 𝐆𝐀𝐌𝐄
│✧quiz ✧flag
│✧slot ✧dice
│✧guess ✧daily
│✧ffqz ✧waifu
│✧ffqz ✧animal
│✧lottery ✧sicbo 
│✧aniqz ✧maze
│✧cartoon ✧animal
│✧football ✧cricket 
│✧actor ✧actress
╰───────────⭓

╭────⭓ 𝐀𝐃𝐌𝐈𝐍
│✧accept ✧admin
│✧banlist ✧file
│✧offbot ✧owner
│✧respect ✧wlt
│✧vip ✧whitelists
╰───────────⭓

╭────⭓ 𝐆𝐑𝐎𝐔𝐏
│✧adduser ✧all
│✧autosetname ✧badwords
│✧count ✧filteruser
│✧group ✧kick
│✧promote ✧gcimg
│✧request ✧rules
│✧setname ✧spamkick
│✧warn ✧unsend
╰───────────⭓

╭────⭓ 𝐎𝐖𝐍𝐄𝐑
│✧cmd ✧eval  
│✧shell ✧owner
╰───────────⭓

╭────⭓ 𝐅𝐔𝐍𝐍𝐘
│✧ads ✧affect
│✧buttslap ✧buttslap2
│✧fun ✧fakechat 
│✧meme ✧slap
│✧gay ✧gayfinder
│✧toilet ✧joke 
│✧spiderman ✧jail
│✧murgi ✧cockroach
│✧trash ✧trigger
│✧wanted ✧emojimix
╰───────────⭓

╭────⭓ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘
│✧age ✧weather
│✧getlink 
│✧hubble ✧linkfb
│✧numinfo ✧time
│✧quote ✧textinfo  
╰───────────⭓

╭────⭓ 𝐌𝐄𝐃𝐈𝐀
│✧album ✧ytb
│✧bike ✧car
│✧fbdl ✧pin
│✧alldl ✧autodl
│✧say ✧v2a
│✧tiksr ✧tiktok
│✧ffvideo ✧catvideo
╰───────────⭓

╭────⭓ 𝐀𝐍𝐈𝐌𝐄
│✧anime ✧aniedit
│✧anisr ✧bankai
│✧goku ✧anicdp
│✧naruto ✧onepiece
│✧anivid ✧anipic
╰───────────⭓

╭────⭓ 𝐄𝐂𝐎𝐍𝐎𝐌𝐘
│✧balance ✧bank
│✧send ✧top
╰───────────⭓

╭────⭓ 𝐋𝐎𝐕𝐄
│✧bestie ✧bestu
│✧brother ✧sister
│✧hug ✧hug4
│✧married ✧marry
│✧my ✧kiss
│✧propose ✧friend
╰───────────⭓

╭─────⭓ 𝐑𝐀𝐍𝐊
│✧rank ✧rankup
│✧ranktop ✧topexp 
╰───────────⭓

╭────⭓ 𝐓𝐎𝐎𝐋𝐒
│✧blur ✧ocr
│✧4k ✧remini
│✧split ✧imgur
│✧getlink ✧imgbb
╰───────────⭓

╭────⭓ 𝐕𝐈𝐏 𝐂𝐎𝐌𝐌𝐀𝐍𝐃
│✧sr ✧edit
│✧pairvip ✧pair69 
│✧gay ✧art
│✧mistake ✧fakechat
│✧mj ✧fluxpro
│✧bomb ✧toilet
╰───────────⭓

╭────⭓ 𝐈𝐒𝐋𝐀𝐌𝐈𝐂 
│✧namaz ✧hadis
│✧ifter
╰────────────⭓

╭────⭓ 𝐈𝐍𝐅𝐎 
│✧info ✧spy
│✧help ✧numinfo
│✧countryinfo
╰────────────⭓

╭────⭓ 𝐌𝐔𝐒𝐈𝐂
│✧sing ✧song
│✧audio ✧play
│✧video ✧videos 
╰───────────⭓

╭────⭓ 𝐅𝐎𝐑𝐊 
│✧fork 
│✧github
╰───────────⭓

╭────⭓ 𝐒𝐔𝐏𝐏𝐎𝐑𝐓 
│✧support ✧contact 
│✧join
╰───────────⭓


╭─ [ 𝐘𝐎𝐔𝐑 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐁𝐘 ]
╰‣ 𝐀𝐝𝐦𝐢𝐧: 𝐌𝐚𝐡 𝐌𝐔𝐃 🎀
╰‣ 𝐓𝐨𝐭𝐚𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬: 380
╰‣ 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: 01836298139

⭔Type !help <command> to learn usage.
⭔Type !support to join our bot support group`;
        const hh = await message.reply(helpText);
        setTimeout(() => message.unsend(hh.messageID), 80000);
        return;
      }

      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) return message.reply(`❌ Baby, command not found.`);

      const config = command.config;
      const roleText = roleTextToString(config.role);
      const aliasText = config.aliases?.join(", ") || "none";
      const categoryText = config.category || "General";
      const description = config.longDescription?.en || config.shortDescription?.en || "No description available.";
      
      // Prefix requirement logic matching your handler
      const prefixRequirement = config.prefix === true ? "noPrefix" : "Prefix Required";
      
      // Fix guide to show actual prefix or not based on config
      let guideText = config.guide?.en || "";
      if (config.prefix === true) {
          guideText = guideText.replace(/{p}/g, "").replace(/{pn}/g, config.name);
      } else {
          guideText = guideText.replace(/{p}/g, prefix).replace(/{pn}/g, config.name);
      }
      if (!guideText) guideText = config.prefix === true ? config.name : `${prefix}${config.name}`;

      const costText = config.cost ? `$${config.cost}` : "Free";
      const vipText = (config.role >= 4 || config.vip === "yes") ? "VIP User Only" : "Free to Use";

      const response = `╭──✦ [ CMD: ${config.name.toUpperCase()} ]
├‣ 📜 Name: ${config.name}
├‣ 🪶 Aliases: ${aliasText}
├‣ 👤 Credits: MahMUD
╰‣ 🔑 Role: ${roleText}

╭─✦ [ INFORMATION ]
├‣ Category: ${categoryText}
├‣ Description:
│   ${description}
╰‣ Guide: ${guideText}

╭─✦ [ SETTINGS ]
├‣ Prefix: ${prefixRequirement}
├‣ Cost: ${costText}
╰‣ Vip: ${vipText}`;

      const helpMessage = await message.reply(response);
      setTimeout(() => message.unsend(helpMessage.messageID), 80000);

    } catch (error) {
      console.error("Error sending help message:", error);
    }
  }
};

function roleTextToString(role) {
  switch (role) {
    case 0: return "Everyone";
    case 1: return "Group Admin";
    case 2: return "Bot Admin";
    case 3: return "Developer";
    case 4: return "VIP User";
    case 5: return "NSFW User";
    default: return "Everyone";
  }
}
