module.exports = {
  config: {
    name: "send",
    version: "2.1",
    author: "MahMUD",
    role: 0,
    shortDescription: {
      en: "Send money with 5% tax",
      bn: "৫% ভ্যাটসহ টাকা পাঠান"
    },
    longDescription: {
      en: "Send money to another user. A 5% transfer fee will be deducted from your balance.",
      bn: "অন্য ইউজারকে টাকা পাঠান। আপনার ব্যালেন্স থেকে ৫% ট্রান্সফার ফি কাটা হবে।"
    },
    category: "economy",
  },

  langs: {
    en: {
      invalid_amount: "❎ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐲 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐬𝐞𝐧𝐝.",
      not_enough_money: "❎ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐞𝐧𝐨𝐮𝐠𝐡 𝐦𝐨𝐧𝐞𝐲 (𝐢𝐧𝐜𝐥𝐮𝐝𝐢𝐧𝐠 𝟓% 𝐟𝐞𝐞).",
      invalid_user: "❎ 𝐓𝐡𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐢𝐞𝐝 𝐮𝐬𝐞𝐫 𝐢𝐬 𝐢𝐧𝐯𝐚𝐥𝐢𝐝 𝐨𝐫 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝.",
      transfer_success: "✅ | 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐁𝐚𝐛𝐲\n\n• 𝐓𝐨: %1: %2\n• 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐜𝐨𝐬𝐭: %3 (𝟓%)",
      transfer_fail: "❌ | 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲.",
      self_transfer: "❎ 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟.",
      invalid_command: "❎ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐜𝐨𝐦𝐦𝐚𝐧𝐝. 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: !send money @mention 100",
      no_user: "❎ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐮𝐬𝐞𝐫 𝐛𝐲 𝐫𝐞𝐩𝐥𝐲𝐢𝐧𝐠, 𝐦𝐞𝐧𝐭𝐢𝐨𝐧𝐢𝐧𝐠, 𝐨𝐫 𝐩𝐮𝐭𝐭𝐢𝐧𝐠 𝐭𝐡𝐞𝐢𝐫 𝐔𝐈𝐃.",
    },
    bn: {
      invalid_amount: "❎ অনুগ্রহ করে সঠিক পরিমাণ লিখুন।",
      not_enough_money: "❎ আপনার কাছে যথেষ্ট টাকা নেই (৫% ফি-সহ)।",
      invalid_user: "❎ ইউজার খুঁজে পাওয়া যায়নি।",
      transfer_success: "✅ | 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐁𝐚𝐛𝐲\n\n• 𝐓𝐨: %1: %2\n• 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐜𝐨𝐬𝐭: %3 (𝟓%)",
      transfer_fail: "❌ | টাকা পাঠাতে ব্যর্থ হয়েছে।",
      self_transfer: "❎ আপনি নিজেকে টাকা পাঠাতে পারবেন না।",
      invalid_command: "❎ ভুল কমান্ড। উদাহরণ: !send money @mention 100",
      no_user: "❎ রিপ্লাই বা মেনশনের মাধ্যমে ইউজার সিলেক্ট করুন।",
    }
  },

  formatMoney: function (num) {
    const units = ["", "𝐊", "𝐌", "𝐁", "𝐓"];
    let unit = 0;
    while (num >= 1000 && unit < units.length - 1) {
      num /= 1000;
      unit++;
    }
    return Number(num.toFixed(1)) + units[unit];
  },

  toBoldNumbers: function (number) {
    const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
    return number.toString().split('').map(c => bold[c] || c).join('');
  },

  toBoldUnicode: function (text) {
    const bold = {
      "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
      "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
      "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
      "A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
      "K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
      "U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙"," ":" ","'":"'",",":",",".":".","-":"-",":":":"
    };
    return text.split('').map(c => bold[c] || c).join('');
  },

  parseBetAmount: function (input) {
    input = input.toLowerCase();
    let multiplier = 1;
    if (input.endsWith("k")) { multiplier = 1000; input = input.replace("k", ""); }
    else if (input.endsWith("m")) { multiplier = 1000000; input = input.replace("m", ""); }
    else if (input.endsWith("b")) { multiplier = 1000000000; input = input.replace("b", ""); }
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) return NaN;
    return Math.floor(num * multiplier);
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const { senderID, mentions, messageReply } = event;
    let recipientID, amount;

    if (!args[0]) return message.reply(this.toBoldUnicode(getLang("invalid_command")));

    let command = args[0].toLowerCase();

    if (command === "money" || command === "-m") {
      const rawAmount = args[args.length - 1];
      amount = this.parseBetAmount(rawAmount);

      if (isNaN(amount) || amount <= 0) return message.reply(this.toBoldUnicode(getLang("invalid_amount")));

      if (messageReply && messageReply.senderID) {
        recipientID = messageReply.senderID;
      } else if (mentions && Object.keys(mentions).length > 0) {
        recipientID = Object.keys(mentions)[0];
      } else if (args.length > 2) {
        recipientID = args[1];
      } else {
        return message.reply(this.toBoldUnicode(getLang("no_user")));
      }

      if (recipientID === senderID) return message.reply(this.toBoldUnicode(getLang("self_transfer")));

      const recipientData = await usersData.get(recipientID);
      if (!recipientData) return message.reply(this.toBoldUnicode(getLang("invalid_user")));

      const senderData = await usersData.get(senderID);
      const senderBalance = senderData.money || 0;

      // ৫% ট্যাক্স ক্যালকুলেশন
      const tax = Math.floor(amount * 0.05);
      const totalDeduct = amount + tax;

      if (totalDeduct > senderBalance) return message.reply(this.toBoldUnicode(getLang("not_enough_money")));

      try {
        await usersData.set(senderID, { money: senderBalance - totalDeduct });
        await usersData.set(recipientID, { money: (recipientData.money || 0) + amount });

        const formattedAmount = this.toBoldNumbers(this.formatMoney(amount)).toLowerCase();
        const formattedTax = this.toBoldNumbers(this.formatMoney(tax)).toLowerCase();
        const recipientName = this.toBoldUnicode(recipientData.name || "Unknown User");

        return message.reply(getLang("transfer_success", recipientName, formattedAmount, formattedTax));
      } catch (error) {
        return message.reply(this.toBoldUnicode(getLang("transfer_fail")));
      }
    } else {
      return message.reply(this.toBoldUnicode(getLang("invalid_command")));
    }
  },
};
