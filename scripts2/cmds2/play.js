const axios = require("axios");

const mahmud = async () => {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
    return base.data.mahmud;
};

/**
 * @author MahMUD
 * @author: do not delete it
 */

module.exports = {
    config: {
        name: "play",
        version: "1.7",
        author: "MahMUD",
        countDown: 10,
        role: 0,
        category: "music",
        cost: 1000,
        guide: {
            en: "{pn} [song name]"
        }
    },

    onStart: async function ({ api, event, args, message, usersData }) {
        const _0x4b = (function () {
            const _0xarr = [
                'YXV0aG9y', 
                'WW91IGFyZSBub3QgYXV0aG9yaXplZCB0byBjaGFuZ2UgdGhlIGF1dGhvciBuYW1lLg==', 
                '4p6eIHwgUGxlYXNlIHByb3ZpZGUgYSBzb25nIG5hbWUuXG5cbkV4YW1wbGU6IHBsYXkgIG1vb2Q=', 
                'cmVwbHk=', 
                'c2VuZE1lc3NhZ2U=', 
                'L2FwaS9wbGF5P21haG11ZD0=', 
                '4pyFIHwgSGVyZSdzIHlvdXIgcmVxdWVzdGVkIHNvbmc6XG7inp4g', 
                '8J+luWVycm9yLCBDb250YWN0IE1haE1VRC4=' 
            ];
            return function (_0xi) {
                return Buffer.from(_0xarr[_0xi], 'base64').toString();
            };
        })();

        const _0xauth = String.fromCharCode(77, 97, 104, 77, 85, 68); 
        if (this.config.author !== _0xauth) {  
            return api[_0x4b(4)](_0x4b(1), event.threadID, event.messageID);  
        }  

        if (!args[0]) {  
            try { api.setMessageReaction("🥹", event.messageID, () => {}, true); } catch (e) {}
            return message[_0x4b(3)](_0x4b(2));  
        }  

        const query = encodeURIComponent(args.join(" "));  
        const apiUrl = `${await mahmud()}${_0x4b(5)}${query}`;  

        try {  
            api.setMessageReaction("🐤", event.messageID, () => {}, true);  

            const response = await axios({  
                method: "GET",  
                url: apiUrl,  
                responseType: "stream",
                headers: { [_0x4b(0)]: _0xauth }
            });  

            message[_0x4b(3)]({  
                body: _0x4b(6) + args.join(" "),  
                attachment: response.data  
            }, () => {  
                api.setMessageReaction("🪽", event.messageID, () => {}, true);  
            });  

        } catch (e) {  
            api.setMessageReaction("🥹", event.messageID, () => {}, true);
            message[_0x4b(3)](_0x4b(7));  
        }
    }
};
