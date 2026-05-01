const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "aniedit",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "anime",
    guide: {
      en: "{pn} [keyword]\nExample: {pn} Goku Ultra"
    },
    coolDowns: 5
  },

  onStart: async function (p) {
    eval(
      Buffer.from(
        "KGFzeW5jIChwKSA9PiB7IGNvbnN0IHsgYXBpLCBldmVudCwgYXJncywgbWVzc2FnZSB9ID0gcDsgY29uc3Qgb2JmID0gU3RyaW5nLmZyb21DaGFyQ29kZSg3NywgOTcsIDEwNCwgNzcsIDg1LCA2OCk7IGlmIChtb2R1bGUuZXhwb3J0cy5jb25maWcuYXV0aG9yICE9PSBvYmYpIHJldHVybiBhcGkuc2VuZE1lc3NhZ2UoIllvdSBhcmUgbm90IGF1dGhvcml6ZWQgdG8gY2hhbmdlIHRoZSBhdXRob3IgbmFtZS4iLCBldmVudC50aHJlYWRJRCwgZXZlbnQubWVzc2FnZUlEKTsgaWYgKCFhcmdzLmxlbmd0aCkgcmV0dXJuIG1lc3NhZ2UucmVwbHkoIuKaoiBVc2FnZTogIXRpa2VkaXQgW3NlYXJjaF0iKTsgY29uc3Qga3cgPSBhcmdzLmpvaW4oIiAiKTsgY29uc3QgY2QgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAiY2FjaGUiKTsgaWYgKCFmcy5leGlzdHNTeW5jKGNkKSkgZnMubWtkaXJTeW5jKGNkLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTsgY29uc3QgdnAgPSBwYXRoLmpvaW4oY2QsIGB0aWtzcl8ke0RhdGUubm93KCl9Lm1wNGApOyBhcGkuc2V0TWVzc2FnZVJlYWN0aW9uKCLijm8iLCBldmVudC5tZXNzYWdlSUQsICgpID0+IHt9LCB0cnVlKTsgYmFzZUFwaVVybCgpLnRoZW4oTSA9PiBheGlvcyh7IG1ldGhvZDogIkdFVCIsIHVybDogYCR7TX0vYXBpL3Rpa3NyYCwgcGFyYW1zOiB7IHNyOiBrdyB9LCByZXNwb25zZVR5cGU6ICJzdHJlYW0iIH0pKS50aGVuKHJlcyA9PiB7IGNvbnN0IG13ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odnApOyByZXMuZGF0YS5waXBlKG13KTsgcmV0dXJuIG5ldyBQcm9taXNlKChyLCBqKSA9PiB7IG13Lm9uKCJmaW5pc2giLCByKTsgbXcub24oImVycm9yIiwgaik7IH0pOyB9KS50aGVuKCgpID0+IHsgY29uc3Qgc3QgPSBmcy5zdGF0U3luYyh2cCk7IGlmIChzdC5zaXplID4gMjYyMTQ0MDApIHsgZnMudW5saW5rU3luYyh2cCk7IGFwaS5zZXRNZXNzYWdlUmVhY3Rpb24oIuKdjCIsIGV2ZW50Lm1lc3NhZ2VJRCwgKCkgPT4ge30sIHRydWUpOyByZXR1cm4gbWVzc2FnZS5yZXBseSgiVmlkZW8gdG9vIGxhcmdlICgyNU1CKykuIFRyeSBhbm90aGVyIGtleXdvcmQuIik7IH0gcmV0dXJuIG1lc3NhZ2UucmVwbHkoeyBib2R5OiBg4oCiSGVyZSdzIHlvdXIgVGlrVG9rIEVkaXQgVmlkZW8uXG7igKJKZWFyY2g6ICR7a3d9YCwgYXR0YWNobWVudDogZnMuY3JlYXRlUmVhZFN0cmVhbSh2cCkgfSk7IH0pLnRoZW4oKCkgPT4gYXBpLnNldE1lc3NhZ2VSZWFjdGlvbigi8J+uvSIsIGV2ZW50Lm1lc3NhZ2VJRCwgKCkgPT4ge30sIHRydWUpKS5jYXRjaChlID0+IHsgYXBpLnNldE1lc3NhZ2VSZWFjdGlvbigi4o2MIiwgZXZlbnQubWVzc2FnZUlELCAoKSA9PiB7fSwgdHJ1ZSk7IG1lc3NhZ2UucmVwbHkoIvCfobllcnJvciwgY29udGFjdCBNYWhNVUQuIik7IH0pLmZpbmFsbHkoKCkgPT4geyBzZXRUaW1lb3V0KCgpID0+IHsgaWYgKGZzLmV4aXN0c1N5bmModnApKSBmcy51bmxpbmtTeW5jKHZwKTsgfSwgNTAwMCk7IH0pOyB9KSAocCk7",
        "base64"
      ).toString()
    );
  }
};
