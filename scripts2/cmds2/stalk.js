module.exports = {
  config: {
    name: "stalk",
    version: "1.0",
    author: "Samir Œ",
    countDown: 5,
    role: 0,
    shortDescription: "stalk",
    longDescription: "multi stalk command",
    category: "𝗜𝗡𝗙𝗢",
  },

  getTargetUID: (event) => {
    if (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) {
      return event.messageReply.senderID;
    } else {
      return event.senderID;
    }
  },

  onStart: async function({ api, event }) {
    try {
      const threadID = event.threadID;
      const targetID = this.getTargetUID(event);

      const data = await api.getUserInfo(targetID);
      const userInfo = data[targetID];
      if (!userInfo) {
        return api.sendMessage("User info not found.", threadID);
      }

      // Extract fields with fallback values
      const name = userInfo.name || "undefined";
      const firstName = userInfo.firstName || "undefined";
      const uid = targetID || "undefined";
      const username = userInfo.username || "undefined";
      const profileLink = userInfo.profileUrl || `https://www.facebook.com/${username !== "undefined" ? username : uid}`;

      const created = userInfo.createdAt || userInfo.created_time || userInfo.join_date || "Unknown";
      const verified = userInfo.isVerified ? true : false;

      const birthday = userInfo.birthday || "No Data";
      const birthdayWords = userInfo.birthdayInWords || "No Data";
      const genderRaw = userInfo.gender;
      const gender = genderRaw === 2 ? "👨 Male" : genderRaw === 1 ? "👩‍🦰 Female" : "undefined";

      const relationship = userInfo.relationshipStatus || "undefined";
      const nickname = userInfo.nickname || "None";
      const loveStatus = userInfo.loveStatus || "None";
      const about = userInfo.about || "Not provided";
      const quotes = userInfo.quotes || "Not provided";

      const hometown = userInfo.hometown || "Unknown";
      const locale = userInfo.locale || "Unknown";
      const website = userInfo.website || "None";

      const followers = userInfo.followersCount || "No Data";
      const worksAt = userInfo.workplace || "No Data";

      // Build the message with your simple style
      const message = 
`Facebook Stalk Report
---------------------

Name           : ${name}
First Name     : ${firstName}
UID            : ${uid}
Username       : ${username}
Profile Link   : ${profileLink}
Account Created: ${created}
Verified       : ${verified ? "Yes" : "No"}

Birthday       : ${birthday}
Birthday (Words): ${birthdayWords}
Gender         : ${gender}
Relationship   : ${relationship}
Nickname       : ${nickname}
Love Status    : ${loveStatus}
About          : ${about}
Quotes         : ${quotes}

Hometown       : ${hometown}
Locale         : ${locale}
Website        : ${website}

Followers      : ${followers}
Works At       : ${worksAt}
`;

      return api.sendMessage(message, threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("An error occurred while fetching user information.", event.threadID);
    }
  },
};