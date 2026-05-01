const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 2,
    category: "admin",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest } = Reply;
    if (author !== event.senderID) return;

    const args = event.body.trim().toLowerCase().split(" ");
    let action;
    let doc_id;

    if (args[0] === "add") {
      action = "accepted";
      doc_id = "3147613905362928"; // Confirm friend request
    } else if (args[0] === "del") {
      action = "deleted";
      doc_id = "4108254489275063"; // Delete friend request
    } else {
      return api.sendMessage("❌ Invalid command! Use:\n• `add <number|all>` to accept\n• `del <number|all>` to delete", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") {
      targetIDs = listRequest.map((_, index) => index + 1);
    }

    const success = [];
    const failed = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`❌ Can't find request #${stt}`);
        continue;
      }

      // Create a new form object for each request to avoid overwriting
      const form = {
        av: api.getCurrentUserID(),
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: action === "accepted" 
          ? "FriendingCometFriendRequestConfirmMutation" 
          : "FriendingCometFriendRequestDeleteMutation",
        doc_id,
        variables: JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: user.node.id, // Set friend ID
            client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          scale: 3,
          refresh_num: 0
        })
      };

      try {
        const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (JSON.parse(response).errors) {
          failed.push(`❌ ${user.node.name}`);
        } else {
          success.push(`>🎀 ${user.node.name}`);
        }
      } catch (e) {
        failed.push(`❌ ${user.node.name}`);
      }
    }

    let resultMsg = `✅ ${action.charAt(0).toUpperCase() + action.slice(1)} ${success.length} requests:\n${success.join("\n")}`;
    if (failed.length > 0) {
      resultMsg += `\n❌ Failed to process ${failed.length} requests:\n${failed.join("\n")}`;
    }
    api.sendMessage(resultMsg, event.threadID, event.messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    try {
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;
      if (!listRequest.length) return api.sendMessage("📌 No pending friend requests.", event.threadID, event.messageID);

      let msg = `╭─╮\n│ 𝐓𝐨𝐭𝐚𝐥 𝐑𝐞𝐪𝐮𝐞𝐬𝐭𝐬: ${listRequest.length}`;
      listRequest.forEach((user, index) => {
        msg += `\n│ ${index + 1}. ${user.node.name}\n│ 𝐔𝐈𝐃: ${user.node.id}`;
      });
      msg += "\n╰───────────ꔪ\n\n𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 add <number|all> to accept or del <number|all> to delete.";

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
        });
      }, event.messageID);
    } catch (e) {
      api.sendMessage("❌ Failed to fetch friend requests.", event.threadID, event.messageID);
    }
  },
};
