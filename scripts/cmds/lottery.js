const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoose = require('mongoose');

const CONFIG = {
  TICKET_PRICE: 500000,
  MAX_TICKETS_USER: 3,
  MAX_TICKETS_TOTAL: 20,
  ADMIN_UIDS: ["100086629038499", "61575279513663", "100065343379315", "61587059954884", "61561299937137", "61581306515651"],
  };

function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

const lotterySchema = new mongoose.Schema({
  tickets: { type: Map, of: [Number] },
  ticketCount: { type: Number, default: 0 },
  pool: { type: Number, default: 0 },
  lastDraw: { type: Date, default: null },
  winner: { type: Object, default: null },
});

const Lottery = mongoose.models.Lottery || mongoose.model('Lottery', lotterySchema);

module.exports = {
  config: {
    name: "lottery",
    version: "1.7",
    author: "MahMUD",
    category: "game",
    guide: "{pn} [buy - my - info - draw - list]"
  },

  onStart: async function ({ args, message, event, usersData }) {
    const { senderID } = event;
    const now = moment();

    let lotteryData = await Lottery.findOne();
    if (!lotteryData) {
      lotteryData = await Lottery.create({
        tickets: new Map(),
        ticketCount: 0,
        pool: 0,
        lastDraw: null,
        winner: null
      });
    }

    if (args.length === 0 || args[0].toLowerCase() === "usage") {
      return message.reply(
        `Commands:\n` +
        `buy [1-3] - Purchase tickets\n` +
        `my - View your tickets\n` +
        `info - Lottery status\n` +
        `draw - Admin only, draw winner\n` +
        `list - Show last winner info`
      );
    }

    const cmd = args[0].toLowerCase();

    if (cmd === "buy") {
      const amount = Math.min(Math.max(parseInt(args[1]) || 1, 1), CONFIG.MAX_TICKETS_USER);
      const userTickets = lotteryData.tickets.get(senderID)?.length || 0;

      if (userTickets + amount > CONFIG.MAX_TICKETS_USER) {
        return message.reply(`𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐜𝐚𝐧 𝐛𝐮𝐲 𝐦𝐚𝐱𝐢𝐦𝐮𝐦 ${CONFIG.MAX_TICKETS_USER} 𝐭𝐢𝐜𝐤𝐞𝐭𝐬 𝐩𝐞𝐫 𝐮𝐬𝐞𝐫.`);
      }

      if (lotteryData.ticketCount + amount > CONFIG.MAX_TICKETS_TOTAL) {
        return message.reply(`${CONFIG.MAX_TICKETS_TOTAL} 𝐓𝐢𝐜𝐤𝐞𝐭𝐬 𝐚𝐫𝐞 𝐬𝐨𝐥𝐝. 𝐖𝐚𝐢𝐭 𝐟𝐨𝐫 𝐭𝐡𝐞 𝐧𝐞𝐱𝐭 𝐝𝐫𝐚𝐰.`);
      }

      const cost = CONFIG.TICKET_PRICE * amount;
      const userMoney = await usersData.get(senderID, "money") || 0;

      if (userMoney < cost) {
        return message.reply(`𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 $${formatMoney(CONFIG.TICKET_PRICE)} 𝐩𝐞𝐫 𝐭𝐢𝐜𝐤𝐞𝐭. 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 $${formatMoney(userMoney)}.`);
      }

      await usersData.set(senderID, { money: userMoney - cost });

      const numbers = [];
      for (let i = 0; i < amount; i++) {
        const number = lotteryData.ticketCount + 1;
        if (!lotteryData.tickets.has(senderID)) lotteryData.tickets.set(senderID, []);
        lotteryData.tickets.get(senderID).push(number);
        numbers.push(number);
        lotteryData.ticketCount++;
      }

      lotteryData.pool += cost;
      await lotteryData.save();

      return message.reply(
        `𝐘𝐨𝐮 𝐩𝐮𝐫𝐜𝐡𝐚𝐬𝐞𝐝 ${amount} ticket(s).\n` +
        `𝐓𝐢𝐜𝐤𝐞𝐭 𝐧𝐮𝐦𝐛𝐞𝐫𝐬: ${numbers.join(", ")}\n` +
        `𝐓𝐨𝐭𝐚𝐥 𝐜𝐨𝐬𝐭: $${formatMoney(cost)}`
      );
    }

    if (cmd === "my") {
  const userTickets = lotteryData.tickets.get(senderID) || [];

  if (userTickets.length === 0) {
    return message.reply("𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐚𝐧𝐲 𝐭𝐢𝐜𝐤𝐞𝐭𝐬.");
  }

  const ticketList = userTickets.join(", ");
  return message.reply(
    `╭── 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐓𝐢𝐜𝐤𝐞𝐭𝐬\n` +
    `╰‣ ${ticketList}`
  );
}

    if (cmd === "info") {
  let ticketSummary = "";

  for (const [uid, tickets] of lotteryData.tickets.entries()) {
    let name = await usersData.get(uid, "name") || "Unknown";

    name = name.normalize("NFC").replace(/\s+/g, " ").trim();
    const isRTL = /[\u0590-\u06FF]/.test(name);

    // Reverse format for Arabic names
    const displayName = isRTL ? `buy ${name}` : `${name} buy`;

    ticketSummary += `╭─ ${displayName}:\n╰──‣ ${tickets.length} Ticket\n`;
  }

  return message.reply(
    `𝐋𝐨𝐭𝐭𝐞𝐫𝐲 𝐒𝐭𝐚𝐭𝐮𝐬:\n\n` +
    `🎟 𝐓𝐢𝐜𝐤𝐞𝐭𝐬 𝐬𝐨𝐥𝐝: ${lotteryData.ticketCount}/${CONFIG.MAX_TICKETS_TOTAL}\n` +
    `💰 𝐏𝐫𝐢𝐳𝐞 𝐩𝐨𝐨𝐥: $${formatMoney(lotteryData.pool)}\n\n` +
    ticketSummary.trim()
  );
}

    if (cmd === "draw") {
      if (!CONFIG.ADMIN_UIDS.includes(senderID)) return message.reply("𝐁𝐚𝐛𝐲, 𝐎𝐧𝐥𝐲 𝐌𝐚𝐡𝐌𝐔𝐃 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐝𝐫𝐚𝐰.");
      if (lotteryData.ticketCount < 9) return message.reply("At least 9 tickets must be sold to draw.");

      const winnerNum = Math.floor(Math.random() * lotteryData.ticketCount) + 1;

      let winnerID;
      for (const [id, tickets] of lotteryData.tickets.entries()) {
        if (tickets.includes(winnerNum)) {
          winnerID = id;
          break;
        }
      }

      if (!winnerID) {
        return message.reply("No winner found.");
      }

      const prize = lotteryData.pool;
      const currentMoney = await usersData.get(winnerID, "money") || 0;
      await usersData.set(winnerID, { money: currentMoney + prize });

      lotteryData.winner = { id: winnerID, ticket: winnerNum, prize };
      lotteryData.lastDraw = now.toDate();

      const winnerName = await usersData.get(winnerID, "name") || "Unknown";

      lotteryData.tickets.clear();
      lotteryData.ticketCount = 0;
      lotteryData.pool = 0;

      await lotteryData.save();

      return message.reply(
        `╭──────────────⭓\n` +
        `├ 🏅 𝐖𝐢𝐧𝐧𝐞𝐫 𝐚𝐧𝐧𝐨𝐮𝐧𝐜𝐞𝐝\n` +
        `├ 🎀 𝐖𝐢𝐧𝐧𝐞𝐫: ${winnerName}\n` +
        `├ 🎟 𝐓𝐢𝐜𝐤𝐞𝐭 𝐧𝐮𝐦𝐛𝐞𝐫: #${winnerNum}\n` +
        `├ 💰 𝐏𝐫𝐢𝐳𝐞: $${formatMoney(prize)}\n` +
        `╰──────────────⭓\n\n` +
        `• Prize money has been deposited automatically.`
      );
    }

    if (cmd === "list") {
      if (!lotteryData.winner) return message.reply("No winners yet.");
      const w = lotteryData.winner;
      const winnerName = await usersData.get(w.id, "name") || "Unknown";
      return message.reply(
        `Last Winner Info:\n` +
        `👤 𝐍𝐚𝐦𝐞: ${winnerName}\n` +
        `🎟 𝐓𝐢𝐜𝐤𝐞𝐭 #: ${w.ticket}\n` +
        `💰 𝐏𝐫𝐢𝐳𝐞: $${formatMoney(w.prize)}`
      );
    }

    return message.reply(
      `Lottery Status:\n` +
      `Tickets sold: ${lotteryData.ticketCount}/${CONFIG.MAX_TICKETS_TOTAL}\n` +
      `Prize pool: $${formatMoney(lotteryData.pool)}`
    );
  }
};
