module.exports = {
	config: {
		name: "spam",
		version: "1.0",
		author: "Mah MUD彡",
		countDown: 0,
		role: 0,
		shortDescription: "spam",
		longDescription: "Do spam in a loop of any text 20 times",
		category: "owner",
		guide:  {
			en: "{pn} <TextToSpam> <Number of times to spam>"
		}
	},  
	onStart: async function({ event, api, args }) {
		const GODData = global.GoatBot.config.GOD;
			if (!GODData.includes(event.senderID)) {
				api.sendMessage(
					"❌ | Baby, only my owner can use this command.", event.threadID, event.messageID);
				return; // Exit the function to prevent the command from executing	
			}
  

  var message = args[0];
  var length = args[1] || 5;

 if (!message)
return api.sendMessage(`🐤 | Type the text that you want to spam.. `, event.threadID, event.messageID);
	var k = function (k) { api.sendMessage(k, event.threadID)};
for (i = 0; i < `${length}`; i++) 
{ k(`${message}`);} 
 }
};
