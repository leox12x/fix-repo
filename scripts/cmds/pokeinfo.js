const axios = require("axios");

module.exports = {
  config: {
    name: "pokemoninfo",
    version: "1.2",
    author: "moye moye 🐤",
    countDown: 5,
    role: 0,
    shortDescription: "Show Pokémon info using PokéAPI",
    longDescription: "Get detailed Pokémon data from the PokéAPI including image",
    category: "fun",
    guide: "{pn} pikachu"
  },

  onStart: async function ({ args, message, api }) {
    const name = args.join(" ").toLowerCase();
    if (!name) return message.reply("Please enter a Pokémon name (e.g., pikachu)");

    try {
      const { data: pokeData } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const { data: speciesData } = await axios.get(pokeData.species.url);

      const types = pokeData.types.map(t => t.type.name).join(", ");
      const abilities = pokeData.abilities.map(a => a.ability.name).join(", ");
      const moves = pokeData.moves.slice(0, 3).map(m => m.move.name).join(", ");
      const stats = {};
      pokeData.stats.forEach(stat => stats[stat.stat.name] = stat.base_stat);

      const genderRate = speciesData.gender_rate;
      const habitat = speciesData.habitat?.name || "unknown";
      const color = speciesData.color.name;
      const isLegendary = speciesData.is_legendary ? "Yes" : "No";
      const isMythical = speciesData.is_mythical ? "Yes" : "No";
      const catchRate = speciesData.capture_rate;
      const baseFriendship = speciesData.base_happiness;
      const eggGroups = speciesData.egg_groups.map(e => e.name).join(", ");

      let gender = "Genderless";
      if (genderRate >= 0) {
        const female = (genderRate / 8) * 100;
        const male = 100 - female;
        gender = `♂ ${male.toFixed(0)}% | ♀ ${female.toFixed(0)}%`;
      }

      const bar = (n) => "█".repeat(Math.floor(n / 15)).padEnd(10, " ");

      const info = 
`📌 Name: ${pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1)} (#${pokeData.id})
🛡 Type(s): ${types}
📏 Height: ${pokeData.height / 10}m | ⚖ Weight: ${pokeData.weight / 10}kg
⭐ Abilities: ${abilities}
🎖 Base XP: ${pokeData.base_experience}
📍 Habitat: ${habitat}
🔥 Weaknesses: (not provided directly by API)
🎯 Top Moves: ${moves}
🔄 Evolutions: (evolution support coming soon)
🎯 Catch Rate: ${catchRate}/255 
💖 Base Friendship: ${baseFriendship}/255
🌟 Legendary: ${isLegendary} | ✨ Mythical: ${isMythical}
🎨 Pokédex Color: ${color}
🔵 Egg Groups: ${eggGroups} | 🥚 Hatch Time: ${speciesData.hatch_counter * 255} steps
⚤ Gender Ratio: ${gender}

📊 Stats:
❤ HP: [${bar(stats.hp)}] ${stats.hp}
⚔ Attack: [${bar(stats.attack)}] ${stats.attack}
🛡 Defense: [${bar(stats.defense)}] ${stats.defense}
⚡ Speed: [${bar(stats.speed)}] ${stats.speed}`;

      const imageUrl = pokeData.sprites.other["official-artwork"].front_default;

      const imgData = (await axios.get(imageUrl, { responseType: 'stream' })).data;
      return message.reply({ body: info, attachment: imgData });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Pokémon not found. Please check the name and try again.");
    }
  }
};