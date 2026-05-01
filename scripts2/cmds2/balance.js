module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "1.9",
        author: "NTKhang + MahMUD",
        countDown: 5,
        role: 0,
        description: {
            vi: "xem số tiền hiện có của bạn hoặc người được tag",
            en: "view your money, someone else's or see top richest users"
        },
        category: "economy",
        guide: {
            en: "   {pn}: view your money"
                + "\n   {pn} <@tag>: view the money of the tagged person"
                + "\n   {pn} top: view top 15 richest users"
                + "\n   {pn} rank: view your global money rank"
                + "\n   {pn} transfer <@tag/reply/UID> <amount>: send money"
        }
    },

    langs: {
        en: {
            money: ">🎀 %1\n\n𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: %2",
            moneyOf: ">🎀 %1\n\n𝐡𝐚𝐬 %2",
            top: "👑 | 𝐓𝐨𝐩 𝟏𝟓 𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬:\n\n%1",
            rank: "> 🎀 %1\n\n𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐌𝐨𝐧𝐞𝐲 𝐑𝐚𝐧𝐤:\n• 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: %3\n• 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 𝐓𝐨𝐩: %2",
            invalid_amount: "❎ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐲 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐬𝐞𝐧𝐝.",
            not_enough_money: "❎ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐞𝐧𝐨𝐮𝐠𝐡 𝐦𝐨𝐧𝐞𝐲 (𝐢𝐧𝐜𝐥𝐮𝐝𝐢𝐧𝐠 𝟓% 𝐟𝐞𝐞).",
            invalid_user: "❎ 𝐓𝐡𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐢𝐞𝐝 𝐮𝐬𝐞𝐫 𝐢𝐬 𝐢𝐧𝐯𝐚𝐥𝐢𝐝 𝐨𝐫 𝐧𝐨𝐭 𝐟𝐨𝐮𝐧𝐝.",
            transfer_success: "✅ | 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐁𝐚𝐛𝐲\n\n• 𝐓𝐨: %1: %2\n• 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐜𝐨𝐬𝐭: %3 (𝟓%)",
            transfer_fail: "❌ | 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲.",
            self_transfer: "❎ 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐬𝐞𝐧𝐝 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟.",
            invalid_command: "❎ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐜𝐨𝐦𝐦𝐚𝐧𝐝. 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: !balance transfer @mention 100",
            no_user: "❎ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐮𝐬𝐞𝐫 𝐛𝐲 𝐫𝐞𝐩𝐥𝐲𝐢𝐧𝐠, 𝐦𝐞𝐧𝐭𝐢𝐨𝐧𝐢𝐧𝐠, 𝐨𝐫 𝐩𝐮𝐭𝐭𝐢𝐧𝐠 𝐭𝐡𝐞𝐢𝐫 𝐔𝐈𝐃."
        }
    },

    toBoldNumbers(number) {
        const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
        return number.toString().split('').map(c => bold[c] || c).join('');
    },

    toBoldUnicode(text) {
        const bold = {
            "a": "𝐚","b": "𝐛","c": "𝐜","d": "𝐝","e": "𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
            "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
            "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
            "A": "𝐀","B": "𝐁","C": "𝐂","D": "𝐃","E": "𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
            "K": "𝐊","L": "𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
            "U": "𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙"," ":" ","'":"'",",":",",".":".","-":"-",":":":"
        };
        return text.split('').map(c => bold[c] || c).join('');
    },

    formatMoney(num) {
        const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
        let unit = 0;
        while (num >= 1000 && unit < units.length - 1) {
            num /= 1000;
            unit++;
        }
        const value = num.toFixed(1).replace(/\.0$/, "");
        return `${this.toBoldNumbers(value)}${units[unit]}`;
    },
    
    parseBetAmount(input) {
        input = input.toLowerCase();
        let multiplier = 1;
        if (input.endsWith("k")) multiplier = 1000, input = input.replace("k", "");
        else if (input.endsWith("m")) multiplier = 1000000, input = input.replace("m", "");
        else if (input.endsWith("b")) multiplier = 1000000000, input = input.replace("b", "");
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) return NaN;
        return Math.floor(num * multiplier);
    },

    onStart: async function ({ args, message, event, usersData, getLang }) {
        const type = args[0]?.toLowerCase();

        if (type === "top") {
            const allUsers = await usersData.getAll();
            const usersWithMoney = allUsers.filter(u => u.money > 0);
            if (!usersWithMoney.length) return message.reply(this.toBoldUnicode("𝐓𝐡𝐞𝐫𝐞 𝐚𝐫𝐞 𝐧𝐨 𝐮𝐬𝐞𝐫𝐬 𝐰𝐢𝐭𝐡 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐝𝐢𝐬𝐩𝐥𝐚𝐲."));
            const topBal = usersWithMoney.sort((a, b) => b.money - a.money).slice(0, 15);
            const medals = ["🥇", "🥈", "🥉"];
            const topList = topBal.map((user, idx) => {
                const rank = idx < 3 ? medals[idx] : this.toBoldNumbers(idx + 1);
                const name = this.toBoldUnicode(user.name || "Unknown User");
                return `${rank}. ${name}: $${this.formatMoney(user.money)}`;
            });
            return message.reply(getLang("top", topList.join("\n")));
        }

        if (type === "rank") {
            const allUsers = await usersData.getAll();
            const sorted = allUsers.sort((a, b) => b.money - a.money);
            const userIndex = sorted.findIndex(u => u.userID == event.senderID);
            const userRank = userIndex !== -1 ? userIndex + 1 : "N/A";
            const userData = await usersData.get(event.senderID) || {};
            return message.reply(getLang(
                "rank",
                this.toBoldUnicode(event.senderName || userData.name || "Unknown User"),
                this.toBoldNumbers(userRank),
                `$${this.formatMoney(userData.money || 0)}`
            ));
        }

        if (type === "transfer" || type === "-t") {
            const { senderID, mentions, messageReply } = event;
            let recipientID, rawAmount;

            if (messageReply?.senderID) {
                recipientID = messageReply.senderID;
                rawAmount = args[1];
            } else if (mentions && Object.keys(mentions).length) {
                recipientID = Object.keys(mentions)[0];
                rawAmount = args[args.length - 1];
            } else if (args[1]) {
                recipientID = args[1];
                rawAmount = args[2];
            } else return message.reply(this.toBoldUnicode(getLang("no_user")));

            const amount = this.parseBetAmount(rawAmount);
            if (isNaN(amount) || amount <= 0) return message.reply(this.toBoldUnicode(getLang("invalid_amount")));
            if (recipientID == senderID) return message.reply(this.toBoldUnicode(getLang("self_transfer")));

            const tax = Math.floor(amount * 0.05);
            const totalDeduct = amount + tax;

            const senderData = await usersData.get(senderID) || {};
            if ((senderData.money || 0) < totalDeduct) return message.reply(this.toBoldUnicode(getLang("not_enough_money")));

            const recipientData = await usersData.get(recipientID) || {};
            const recipientName = this.toBoldUnicode(recipientData.name || "Unknown User");

            try {
                await usersData.set(senderID, { money: (senderData.money || 0) - totalDeduct });
                await usersData.set(recipientID, { money: (recipientData.money || 0) + amount });

                const formattedAmount = this.formatMoney(amount).toLowerCase();
                const formattedTax = this.formatMoney(tax).toLowerCase();

                return message.reply(getLang("transfer_success", recipientName, formattedAmount, formattedTax));
            } catch (e) {
                return message.reply(this.toBoldUnicode(getLang("transfer_fail")));
            }
        }

        // Rest of the logic (reply/mentions/default)
        if (event.type === "message_reply") {
            const reply = event.messageReply;
            const userData = await usersData.get(reply.senderID) || {};
            return message.reply(getLang("moneyOf", this.toBoldUnicode(reply.senderName || userData.name || "Unknown User"), `$${this.formatMoney(userData.money || 0)}`));
        }

        if (Object.keys(event.mentions).length) {
            let msg = "";
            for (const uid of Object.keys(event.mentions)) {
                const userData = await usersData.get(uid) || {};
                const userName = this.toBoldUnicode(event.mentions[uid]?.replace("@", "") || userData.name || "Unknown User");
                msg += getLang("moneyOf", userName, `$${this.formatMoney(userData.money || 0)}`) + "\n";
            }
            return message.reply(msg);
        }

        const userData = await usersData.get(event.senderID) || {};
        return message.reply(getLang("money", this.toBoldUnicode(event.senderName || userData.name || "Unknown User"), `$${this.formatMoney(userData.money || 0)}`));
    }
};
