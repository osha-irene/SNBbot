const fs = require('fs');
const path = require('path'); // ✅ Added path module
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config(); // Load environment variables
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔹 Create Discord bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

const plotData = {}; // Object to store plot data
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// 🔹 Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('plot')
        .setDescription('Set up a plot.')
        .addStringOption(option =>
            option.setName('value')
                .setDescription('Enter numbers between 1-6. Example: 1 3 5')
                .setRequired(true)
        )
].map(command => command.toJSON());

async function registerCommands(clientId) {
    try {
        console.log("⏳ Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log("✅ Slash commands successfully registered!");
    } catch (error) {
        console.error("❌ Failed to register slash commands:", error);
    }
}

// 🔹 Execute plot command
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'plot') {
        try {
            await interaction.deferReply({ ephemeral: true });

            const input = interaction.options.getString('value');
            const numbers = input.split(' ')
                .map(n => parseInt(n, 10))
                .filter(n => n >= 1 && n <= 6);

            if (numbers.length === 0) {
                return await interaction.editReply('❌ Enter numbers between 1-6.');
            }

            plotData[interaction.user.id] = numbers;
            await interaction.editReply(`✅ Plot saved: ${numbers.join(', ')}`);

            if (interaction.channel) {
                await interaction.channel.send(
                    `<@${interaction.user.id}> has completed the plot! Current participants: ${Object.keys(plotData).length}`
                );
            }
        } catch (error) {
            console.error("❌ Error executing plot command:", error);

            // Send error DM to admin
            try {
                const owner = await client.users.fetch(BOT_OWNER_ID);
                await owner.send(`⚠️ **Error occurred:**\n\`\`\`${error}\`\`\``);
            } catch (dmError) {
                console.error("❌ Failed to send error DM to admin:", dmError);
            }

            await interaction.editReply('⚠️ An error occurred while setting up the plot.');
        }
    }
});

// Set data file path
const dataFilePath = path.join(__dirname, 'data.json');

// 📝 **Declare global variable for characterData**
let characterData = {};

// Load data (if file exists, load it)
if (fs.existsSync(dataFilePath)) {
    try {
        characterData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (error) {
        console.error("❌ Error loading data:", error);
        characterData = {}; // Initialize with an empty object in case of an error
    }
}

// Function to save data
const saveData = () => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(characterData, null, 2));
    } catch (error) {
        console.error("❌ Failed to save data:", error);
    }
};

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID), // Ensure BOT_ID is added in .env
            { body: commands }
        );
        console.log("✅ Slash commands successfully registered!");
    } catch (error) {
        console.error("❌ Failed to register slash commands:", error);
    }
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    registerCommands(); // Register slash commands when the bot is ready
});

// 🔹 Bot login execution
client.login(process.env.DISCORD_BOT_TOKEN);

// 🔹 Send message when the bot is first invited to a server
client.on('guildCreate', guild => {
    const defaultChannel = guild.systemChannel || guild.channels.cache.find(channel => channel.type === 0);
    
    if (defaultChannel) {
        defaultChannel.send(
            `✅ **MGLGbot has been successfully invited!**  
            💬 To check commands, type **\`!help\`**.`
        )
        .then(() => console.log(`✅ Invited to [${guild.name}] - First message sent!`))
        .catch(err => console.error(`❌ Failed to send first message in [${guild.name}]:`, err));
    } else {
        console.warn(`⚠️ Invited to [${guild.name}], but no suitable channel found.`);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore bot messages

    const args = message.content.trim().split(/\s+/); // Split command and arguments by spaces
    const command = args.shift()?.toLowerCase(); // Set the first word as the command
    setImmediate(async () => {

    if (!command) return; // Exit if there's no command

    try {
        if (message.author.bot) return;
        if (!message.guild) return;

        // Retrieve command arguments
        let args = message.content.trim().split(/\s+/);

        // ❗ Ensure args is not null before executing shift()
        if (!args || args.length === 0) {
            console.warn(`⚠️ Error parsing command: args is empty.`);
            return;
        }

        let command = args.shift().toLowerCase(); // Use the first word as the command

    } catch (error) {
        console.error("🚨 [Error processing command]:", error);

        // 🔹 Notify via DM in case of an error (optional)
        try {
            const owner = await message.guild.fetchOwner();
            if (owner) {
                owner.send(`❌ An error occurred in MGLGbot. Check logs.`);
            }
        } catch (dmError) {
            console.error(`🚫 Failed to send DM to the server owner:`, dmError);
        }
    }
});


	// Realm and Stamp List
const realmList = ["Planet", "Animalism", "Dynamics", "Poetics", "Visions", "Shadows"];
const stampList = [
    ["Gold", "Flesh", "Gravity", "Story", "Memories", "Abyss"],
    ["Earth", "Insects", "Wind", "Melody", "Mystery", "Decay"],
    ["Forest", "Flowers", "Flow", "Tear", "Falsehood", "Betrayal"],
    ["Paths", "Blood", "Water", "Farewell", "Anxiety", "Wandering"],
    ["Sea", "Scales", "Wave", "Smile", "Sleep", "Sloth"],
    ["Silence", "Chaos", "Freedom", "Heart", "Chance", "Perversion"],
    ["Rain", "Fangs", "Shock", "Victory", "Illusion", "Misfortune"],
    ["Storm", "Cry", "Thunder", "Love", "Madness", "Fool"],
    ["Sun", "Rage", "Fire", "Passion", "Pray", "Malice"],
    ["Sky", "Wing", "Light", "Cure", "Hope", "Despair"],
    ["Otherworlds", "Eros", "Cycle", "Time", "Future", "Death"]
];

const realmEmoji = {
    "Planet": "🌟",
    "Animalism": "🐾",
    "Dynamics": "⚡",
    "Poetics": "🎵",
    "Visions": "💤",
    "Shadows": "🌑",
    "Variable": "🎲" // Added variable stamp
};

if (message.content.startsWith('!update')) {
    if (message.author.id !== BOT_OWNER_ID) {
        return message.channel.send("❌ This command can only be used by the bot owner.");
    }

    // 🏷️ Set update type
    let args = message.content.split(' ').slice(1);
    let updateType = args[0] || "patch"; // Default to patch update
    let announcementMessage = args.slice(1).join(' ');

    // 🔹 Process version update
    if (updateType === "major") {
        currentVersion.major += 1;
        currentVersion.minor = 0;
        currentVersion.patch = 0;
    } else if (updateType === "minor") {
        currentVersion.minor += 1;
        currentVersion.patch = 0;
    } else {
        currentVersion.patch += 1;
    }

    // 🔹 Save new version information
    saveVersion(currentVersion);

    // 📌 Create new version string
    let newVersion = `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
    let finalMessage = `📢 **DX3bot Update: ${newVersion}**\n${announcementMessage || "New features have been added!"}`;

    // ✅ Send announcement to all servers
    client.guilds.cache.forEach((guild) => {
        try {
            const announcementChannelId = serverAnnouncementChannels[guild.id];

            if (announcementChannelId) {
                const channel = guild.channels.cache.get(announcementChannelId);
                if (channel) {
                    channel.send(finalMessage)
                        .then(() => console.log(`✅ Update announcement sent to server "${guild.name}".`))
                        .catch(err => console.error(`❌ Error sending announcement to server "${guild.name}":`, err));
                    return;
                }
            }

            // 📩 If no announcement channel exists, send a DM to the server owner
            guild.fetchOwner()
                .then(owner => {
                    if (owner) {
                        owner.send(finalMessage)
                            .then(() => console.log(`📩 Update announcement sent via DM to server owner (${owner.user.tag}) of "${guild.name}".`))
                            .catch(err => console.error(`❌ Failed to send DM to server owner (${guild.name}):`, err));
                    }
                })
                .catch(err => console.error(`⚠️ Unable to fetch owner information for server "${guild.name}".`, err));

        } catch (error) {
            console.error(`❌ Error sending announcement to server "${guild.name}":`, error);
        }
    });

    // ✅ Also send DM to bot owner
    client.users.fetch(BOT_OWNER_ID)
        .then(botOwner => {
            if (botOwner) {
                botOwner.send(finalMessage)
                    .then(() => console.log(`📩 Update announcement sent via DM to bot owner (${botOwner.tag}).`))
                    .catch(err => console.error("❌ Failed to send DM to bot owner:", err));
            }
        })
        .catch(err => console.error("❌ Failed to fetch bot owner information:", err));

    // ✅ Output message in the channel where the command was executed
    message.channel.send(`✅ **Update complete! Current version: ${newVersion}**`);
}
// Character Registration (Requires Stamps + Default Book Added)
if (command === '!register_character') {
    if (args.length < 6) {
        return message.reply('❌ Usage: `!register_character [Name] [Stamp1] [Stamp2] [Stamp3] [Stamp4] [Stamp5]` (5 Stamps required)');
    }

    const name = args.shift();
    const stampList = args.slice(0, 5);

    characterData[message.author.id] = { 
        name: name,
        stamps: stampList,
        anchor: {},
        attributes: { attack: 3, defense: 3, source: 3 },
        book: {
            "Calling": {
                checkStamp: "Variable",
                description: "Roll 1D6 to determine the field at random, then roll 2D6 to randomly select a stamp. That becomes the designated stamp. If the check succeeds, a spirit corresponding to the stamp can be summoned."
            }
        },
        realm: null
    };

    saveData();
    message.reply(`✅ Character **${name}** has been registered.  
🔹 **Stamps**: ${stampList.join(', ')}  
📖 Default Book **"Calling"** has been added.`);
}

// Initialize character data
function initializeCharacter(userId) {
    if (!characterData[userId]) {
        characterData[userId] = { anchor: {}, attributes: { attack: 3, defense: 3, source: 3 } };
    }
    if (!characterData[userId].attributes) {
        characterData[userId].attributes = { attack: 3, defense: 3, source: 3 };
    }
}

// Determine Ether
if (command === '!determine_ether') {
    if (!characterData[message.author.id]) {
        return message.reply('❌ Please create a character first using `!register_character`.');
    }

    // 🎲 Roll 1D6
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const source = characterData[message.author.id].attributes?.source || 3;
    const ether = source + diceRoll;

    // Save Ether
    characterData[message.author.id].ether = ether;
    saveData();

    message.reply(`🎲 **Determining Ether.**\n1D6 + ${source} → **${diceRoll} + ${source} = ${ether}**`);
}

// Set Realm
if (command === '!set_realm') {
    const realm = args[0];
    if (!realmList.includes(realm)) return message.reply('❌ Invalid realm. Choose from: (Planet, Animalism, Dynamics, Poetics, Visions, Shadows)');
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].realm = realm;
    saveData();
    message.reply(`✅ Realm has been set to **${realm}**.`);
}

// Set Stamps
if (command === '!set_stamps') {
    if (args.length !== 5) return message.reply('❌ You must enter exactly 5 stamps.');
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].stamps = args;
    saveData();
    message.reply(`✅ Stamps have been set: ${args.join(', ')}`);
}

// Check Stamps
if (command === '!check_stamps') {
    const char = characterData[message.author.id];
    if (!char || !char.stamps) return message.reply('❌ No stamps have been set.');
    message.reply(`📝 Current Stamps: ${char.stamps.join(', ')}`);
}

// Set Stamp of Spirit (SS)
if (command === '!set_ss') {
    if (!characterData[message.author.id]) {
        return message.reply('❌ Please create a character first using `!register_character`.');
    }
    
    if (args.length !== 1) {
        return message.reply('❌ Usage: `!set_ss [StampName]` (Enter a single word)');
    }

    const ss = args[0];

    // Check if the stamp already exists
    const allStamps = stampList.flat(); // Convert 2D array to 1D
    if (allStamps.includes(ss)) {
        return message.reply(`❌ **${ss}** already exists! The Stamp of Spirit must be unique.`);
    }

    // Save Stamp of Spirit
    characterData[message.author.id].ss = ss;
    saveData();

    message.reply(`**Stamp of Spirit** has been set to **"${ss}"**.  
💠 This stamp always has a target value of **6**.`);
}
// Check Stamp of Spirit (SS)
if (command === '!check_ss') {
    const char = characterData[message.author.id];
    if (!char || !char.ss) {
        return message.reply('❌ No Stamp of Spirit has been set.');
    }

    message.reply(`💠 **Stamp of Spirit**: ${char.ss}`);
}

// Roll Check (SS & Anchor)
if (command === '!roll') {
    if (!characterData[message.author.id]) {
        return message.reply('❌ Please create a character first using `!register_character`.');
    }

    let usingAnchor = false;
    let anchorName = null;
    let checkStamp = null;
    let targetValue = 5; // Default target value

    if (args.length === 1) {
        checkStamp = args[0];
    } else if (args.length === 2) {
        anchorName = args[0].replace(/"/g, '');
        checkStamp = args[1];
        usingAnchor = true;
    } else {
        return message.reply('❌ Usage: `!roll [Stamp]` or `!roll "AnchorName" [Stamp]`');
    }

    const char = characterData[message.author.id];

    // 🎯 SS Roll (Target value fixed at 6)
    if (char.ss === checkStamp) {
        targetValue = 6;
    } else {
        // 🎯 General Stamp Distance Calculation
        let stampPosition = null;
        for (let i = 0; i < stampList.length; i++) {
            for (let j = 0; j < stampList[i].length; j++) {
                if (stampList[i][j] === checkStamp) {
                    stampPosition = { x: i, y: j };
                    break;
                }
            }
            if (stampPosition) break;
        }

        if (!stampPosition) {
            return message.reply(`❌ Invalid stamp: **${checkStamp}**`);
        }

        let targetValue = 5;
        if (!char.stamps.includes(checkStamp)) {
            let minDistance = 99;
            for (const myStamp of char.stamps) {
                for (let i = 0; i < stampList.length; i++) {
                    for (let j = 0; j < stampList[i].length; j++) {
                        if (stampList[i][j] === myStamp) {
                            let distance = Math.abs(i - stampPosition.x) + Math.abs(j - stampPosition.y) * 2;
                            if (char.realm && (stampPosition.y === j || stampPosition.y === j - 1 || stampPosition.y === j + 1)) {
                                distance = Math.abs(i - stampPosition.x) + Math.abs(j - stampPosition.y);
                            }
                            minDistance = Math.min(minDistance, distance);
                        }
                    }
                }
            }
            targetValue = 5 + minDistance;
        }
    }

    // 🎲 Roll Dice
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const diceRoll = dice1 + dice2;
    const success = diceRoll >= targetValue ? '✅ **Success!**' : '❌ **Failure!**';

    // 📜 Display Roll Result
    if (usingAnchor) {
        if (!char.anchor || char.anchor.name !== anchorName) {
            return message.reply(`❌ Your anchor **"${anchorName}"** does not exist.`);
        }
        message.reply(`2D6>=${targetValue} **${checkStamp} Roll** (Anchor: ${anchorName}) 🎲`);
    } else {
        message.reply(`2D6>=${targetValue} **${checkStamp} Roll** 🎲`);
    }
}

// Delete Character Sheet
if (command === '!delete_sheet') {
    delete characterData[message.author.id];
    saveData();
    message.reply('❌ Your character sheet has been deleted.');
}

// 🔹 Check Character Sheet (Includes Realm, Book, and Anchor)
if (command === '!check_sheet') {
    if (!characterData[message.author.id]) {
        return message.reply('❌ No registered character.');
    }

    const char = characterData[message.author.id];

    // Ensure the name field exists before displaying
    const characterName = char.name || 'Unset';

    // 📝 Display Stamps List
    const stampListOutput = char.stamps && char.stamps.length > 0 ? char.stamps.join(', ') : 'None';

    // 📜 Display Book List (Includes Calling, Defaults to Empty)
    if (!char.books) char.books = {}; // Initialize as empty if undefined
    
const bookOutput = Object.keys(char.books).length > 0
    ? Object.entries(char.books)
        .map(([name, { type, rollStamp, etherRealm, etherCost, currentEther }]) => {
            // 🔹 Get the corresponding emoji for the Ether Realm (default to 📖 if none)
            const emoji = etherRealm && realmEmojis[etherRealm] ? realmEmojis[etherRealm] : '📖';

            // 🔹 Default Ether to 0 if undefined
            if (currentEther === undefined) currentEther = 0;

            // 🔹 Display Ether Information (If etherCost is 0, mark as "None")
            const etherDisplay = etherCost && etherCost > 0 ? `${currentEther} / ${char.stats?.source || courseOutput}` : 'None';

            return `${emoji} **${name}** | ${type || "None"} | ${rollStamp} | ${etherDisplay}`;
        })
        .join('\n')
    : 'None';

  const instituteOutput = char.institute || 'Unset';
    const courseOutput = char.course || 3; // Default value is 3
    const hierarchyOutput = char.hierarchy || 'Unset';

    // 🔮 Display Ether
    const etherOutput = char.ether ? `Ether ${char.ether} | ` : '🔮 Ether: (Undetermined)'; 

    // 💠 Display Stamp of Spirit
    const ssOutput = char.ss ? `💠 ${char.ss}` : 'None';

    // 🌀 Display Anchor
    const anchorOutput = char.anchor && Object.keys(char.anchor).length > 0
        ? Object.entries(char.anchor)
            .map(([name, { attribute, fatePoints }]) => `**${name}** (${attribute}, Fate Points ${fatePoints})`)
            .join('\n')
        : 'None';

// 📜 **Final Output (Formatted with block quotes)**
message.reply(
`📖 **Character Information**
> **${courseOutput}th Course ${instituteOutput} - ${hierarchyOutput}**
> 🔹 Magician of ${realmOutput} **「${magicNameOutput}」**
> 🔹 ${characterName}
> 🔹 ${etherOutput} ${statsOutput}

🔹 **Stamps List**
> ${stampListOutput}
🔹 **Stamp of Spirit**
> ${ssOutput}

🔹 **Book List**
${bookOutput ? bookOutput.split('\n').map(line => `> ${line}`).join('\n') : '> None'}

🔹 **Anchor List**
${anchorOutput ? anchorOutput.split('\n').map(line => `> ${line}`).join('\n') : '> None'}
`
);
}

const instituteList = ["Table of Contents", "Horizon", "Academy", "Portal", "Cyclops", "Laboratory"];
const hierarchyList = ["Book Watcher", "Librarian", "Artisan", "Guest", "Outsider", "Apocrypha"];

if (command === '!institute') {
    const institute = args[0];
    if (!instituteList.includes(institute)) {
        return message.reply(`❌ Invalid institute. (Available: ${instituteList.join(', ')})`);
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].institute = institute;
    saveData();
    message.reply(`✅ Institute set to **${institute}**.`);
}

if (command === '!course') {
    let course = parseInt(args[0]);
    if (isNaN(course) || course < 1 || course > 7) {
        return message.reply('❌ Course must be set between 1 and 7.');
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].course = course;
    characterData[message.author.id].stats = { attack: course, defense: course, source: course }; // Set stats equal to course
    saveData();
    message.reply(`✅ Course set to **${course}**.`);
}

// 🔹 Set Hierarchy
if (command === '!hierarchy') {
    const hierarchy = args[0];
    if (!hierarchyList.includes(hierarchy)) {
        return message.reply(`❌ Invalid hierarchy. (Available options: ${hierarchyList.join(', ')})`);
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].hierarchy = hierarchy;
    saveData();
    message.reply(`✅ Hierarchy set to **${hierarchy}**.`);
}

// 🔹 Set Magical Name
if (command === '!magicalname') {
    if (!args || args.length < 1) return message.reply('❌ Usage: `!magicalname "Magical Name"` (Quotes required)');

    let magicalName = args.join(' ');
    magicalName = magicalName.replace(/(^"|"$)/g, ''); // Remove surrounding quotes

    if (!characterData[message.author.id]) {
        return message.reply('❌ Please create a character first using `!create_sheet`.');
    }

    characterData[message.author.id].magicalName = magicalName;
    saveData();

    message.reply(`✅ Magical Name set to **${magicalName}**.`);
}

// Server ID check (if DM, set as 'DM')
const guildId = message.guild ? message.guild.id : "DM";

// 🔹 Set Active Character (Different for each server)
if (command === '!set') {
    if (!characterData[message.author.id]) return message.reply('❌ Please create a character first.');

    if (!characterData[message.author.id].active) {
        characterData[message.author.id].active = {}; // Allow per-server setting
    }
    characterData[message.author.id].active[guildId] = true;
    saveData();

    message.reply(`✅ Character **${characterData[message.author.id].name}** is now active **${message.guild ? 'on this server' : 'in DM'}**.`);
}

// 🔹 Deactivate Character (Manage per server)
if (command === '!unset') {
    if (!characterData[message.author.id] || !characterData[message.author.id].active || !characterData[message.author.id].active[guildId]) {
        return message.reply('❌ No active character found.');
    }
    delete characterData[message.author.id].active[guildId];
    saveData();
    message.reply(`❌ Character deactivated **${message.guild ? 'on this server' : 'in DM'}**.`);
}

// 🔹 Generate Random Plot
if (command === '!randomplot') {
    let count = parseInt(args[0]);
    if (isNaN(count) || count < 1 || count > 6) return message.reply('❌ Plot count must be between 1 and 6.');

    const numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
    plotData[message.author.id] = numbers;
    message.reply(`✅ Random plot set: ${numbers.join(', ')}`);
}

// 🔹 Reveal Plot (Display participants)
if (command === '!revealplot') {
    if (Object.keys(plotData).length === 0) {
        return message.reply('❌ No saved plot found.');
    }

    let result = `🎲 **Plot Reveal**:\n`;
    for (const [userId, numbers] of Object.entries(plotData)) {
        result += `<@${userId}>: ${numbers.join(', ')}\n`;
    }

    // Clear plot data
    plotData = {};
    message.channel.send(result);
}

// Keep existing args while extracting quoted arguments
let parsedArgs = message.content.match(/"([^"]+)"|\S+/g);
if (!parsedArgs) return;

let parsedArgsCommand = parsedArgs.shift(); // First word is the command
if (command === '!addbook') {
    const commandPattern = /^!addbook\s+"([^"]+)"\s+(\S+)\s+(\S+)\s+(\S+)\s*(\d*)\s+(.+)$/s;
    const match = message.content.match(commandPattern);

    if (!match) {
        return message.reply(
            '❌ Usage: `!addbook "Book Name" [Type] [Target Stamp] [Vita Realm] [Cost] [Description]`\n' +
            'Example: `!addbook "Summon Magic Sword" Attack Melody Poetics 2 Summons a powerful sword.`'
        );
    }

    let bookName = match[1].trim();
    let type = match[2].trim();
    let targetStamp = match[3].trim();
    let vitaRealm = match[4].trim();
    let vitaCost = match[5].trim();
    const description = match[6].trim();

    // 🔹 Handle "None" input
    if (type === "None") type = null;
    if (vitaRealm === "None") {
        vitaRealm = null;
        vitaCost = 0;
    } else if (!Object.keys(realmEmojis).includes(vitaRealm)) {
        return message.reply(`❌ Invalid Vita Realm: **${vitaRealm}**\n(Available: Planet, Animalism, Dynamics, Poetics, Visions, Shadows, None)`);
    }

    // 🔹 Set Vita Cost to 0 if empty or "None"
    vitaCost = vitaCost === "" || isNaN(vitaCost) ? 0 : parseInt(vitaCost, 10);

    // 🔹 Initialize character data
    if (!characterData[message.author.id]) {
        characterData[message.author.id] = { books: {} };
    }
    if (!characterData[message.author.id].books) {
        characterData[message.author.id].books = {};
    }

    // 🔹 Add Book
    characterData[message.author.id].books[bookName] = { type, targetStamp, vitaRealm, vitaCost, description };
    saveData();

    message.reply(
        `📖 Book **"${bookName}"** has been added.\n` +
        `🔹 **Type**: ${type ? type : "None"}\n` +
        `🔹 **Target Stamp**: ${targetStamp}\n` +
        `🔹 **Cost**: ${vitaRealm ? `${vitaRealm} ${vitaCost}` : "None"}\n` +
        `**Description**: ${description}`
    );
}

// 🔹 Charge or Decrease Vita for Individual Books (`!bookname+1`, `!bookname-1`, `!bookname+3`, etc.)
if (/^!(?!attack|defense|source).+\s?[\+\-]\d+$/.test(command)) {  
    // 🔹 Extract Increase or Decrease Value
    const changeMatch = command.match(/([+\-]\d+)$/);
    if (!changeMatch) return;

    const changeValue = parseInt(changeMatch[1]); // +Number, -Number
    if (isNaN(changeValue)) return;

    // 🔍 Extract Book Name from Command (Remove `+number` part)
    let inputBookName = command.replace(/^!/, '').replace(/\s?[\+\-]\d+$/, '').trim();

    // Check Character Data
    const char = characterData[message.author.id];
    if (!char || !char.books) {
        return message.reply('❌ No registered books found. Use `!registerbook [Book Name]` first.');
    }

    // 🔍 Compare Input with Stored Book Names (Remove Spaces for Matching)
    const bookKey = Object.keys(char.books).find(book => 
        book.replace(/\s+/g, '') === inputBookName.replace(/\s+/g, '')
    );

    if (!bookKey) {
        return message.reply(`❌ You do not own the book **"${inputBookName}"**.\nUse \`!listbooks\` to check registered books.`);
    }

    // Retrieve Book Data
    let book = char.books[bookKey];

    // ✅ Manage Individual Book Vita Charge
    if (book.currentVita === undefined) book.currentVita = 0;
    if (!book.vitaRealm) book.vitaRealm = bookKey; // Set default if vitaRealm is missing

    // Retrieve Character's Source Value
    const source = char.stats?.source || 3; // Default value 3 (if not set)

    // 🔹 Charge Vita (Max Limit = Source)
    if (changeValue > 0) {
        if (book.currentVita + changeValue > source) {
            return message.reply(`❌ **${book.vitaRealm} Vita** cannot exceed the maximum source (${source})!`);
        }
        book.currentVita += changeValue;
    }

    // 🔻 Decrease Vita (Minimum 0)
    if (changeValue < 0) {
        if (book.currentVita + changeValue < 0) {
            return message.reply(`❌ **${book.vitaRealm} Vita** is insufficient to decrease.`);
        }
        book.currentVita += changeValue;
    }

    saveData();
    return message.reply(`✅ **"${bookKey}"** → **${book.vitaRealm} Vita ${changeValue > 0 ? '+' : ''}${changeValue}** (Current: ${book.currentVita} / ${source})`);
}

// 🔹 Use Book (Including Spaces)
if (command === '!usebook') {
    let inputBookName = args.join(' ').trim(); // Capture book name including spaces
    const char = characterData[message.author.id];

    if (!char || !char.books) {
        return message.reply('❌ No registered books found.');
    }

    // 🔍 Match Input with Stored Book Names (Ignoring Spaces)
    const bookKey = Object.keys(char.books).find(book => book.replace(/\s+/g, '') === inputBookName.replace(/\s+/g, ''));

    if (!bookKey) {
        return message.reply(`❌ You do not own this book.  
📖 **Owned Books**: ${Object.keys(char.books).join(', ') || 'None'}`);
    }

    let book = char.books[bookKey];
    let { type, targetStamp, vitaRealm, vitaCost, description } = book;

    // 🌀 Handle "Variable" Target Stamp (Randomly Select One)
    if (targetStamp === "Variable") {
        const randomField = Math.floor(Math.random() * 6);
        const randomStamp = Math.floor(Math.random() * 11);
        targetStamp = stampList[randomStamp][randomField];
        book.targetStamp = targetStamp;
        saveData();
    }

    // 🌀 Handle "Realm" Target Stamp (Randomly Select Within Realm)
    if (realmList.includes(targetStamp)) {
        const realmIndex = realmList.indexOf(targetStamp);
        const randomStamp = Math.floor(Math.random() * 11);
        targetStamp = stampList[randomStamp][realmIndex];
        book.targetStamp = targetStamp;
        saveData();
    }

    // 🔹 Check Individual Vita for Book Usage
    if (book.currentVita === undefined) book.currentVita = 0;
    let currentVita = book.currentVita;

    // 🔹 **If Vita is Insufficient, Book Cannot Be Used**
    if (currentVita < vitaCost) {
        return message.reply(`❌ Insufficient Vita!  
**Required Vita**: ${vitaRealm} ${vitaCost}  
**Current Vita**: ${currentVita}`);
    }

    // 🔻 **Deduct Vita (No Deduction for Gear, but Cost Remains)**
    if (type !== "Gear") {
        book.currentVita -= vitaCost;
        currentVita = book.currentVita;
        saveData();
    }

    // 🔹 **If Target Stamp is "None", Only Show Description**
    if (targetStamp === "None") {
        return message.reply(
            `📖 **${bookKey}**  
**Type**: ${type || "None"}  
**Description**: ${description}  
🔹 **Current Vita**: ${currentVita} / ${char.stats.source}`
        );
    }

    // 🔹 Determine Target Value (Default: 5)
    let targetValue = 5;
    const realm = char.realm ? realmList.indexOf(char.realm) : null;
    let stampPosition = null;

    // 🔍 Find Target Stamp Position
    stampList.some((row, y) => row.some((stamp, x) => {
        if (stamp === targetStamp) {
            stampPosition = { x, y };
            return true;
        }
    }));

    if (!stampPosition) return message.reply('❌ Invalid Target Stamp.');

    // 🔹 Calculate Distance to Closest Assigned Stamp
    let minDistance = Infinity;
    char.stamps.forEach(assignedStamp => {
        stampList.some((row, y) => row.some((stamp, x) => {
            if (stamp === assignedStamp) {
                let distanceX = Math.abs(stampPosition.x - x);
                let distanceY = Math.abs(stampPosition.y - y);
                let horizontalMove = (realm !== null && (x === realm || stampPosition.x === realm)) ? 1 : 2;
                let currentDistance = distanceY + (distanceX * horizontalMove);
                minDistance = Math.min(minDistance, currentDistance);
                return true;
            }
        }));
    });

    targetValue += minDistance;
    // 📜 Result Message (Exclude Vita Message If Not Needed)
    message.reply(
`🔹 ${bookKey}
**Type**: ${book.type || "None"}   **Target Stamp**: ${targetStamp}  
**Description**: ${description}
Current **${currentVita} / ${char.stats.source}** Vita remaining.`);

    message.reply(`2D6>=${targetValue} **${targetStamp} Roll**`);
}

// 🔹 Delete Book (Including Spaces)
if (command === '!deletebook') {
    const bookName = args.join(' '); // Including spaces
    if (!characterData[message.author.id] || !characterData[message.author.id].books[bookName]) {
        return message.reply('❌ You do not own this book.');
    }

    delete characterData[message.author.id].books[bookName];
    saveData();
    message.reply(`❌ Book **"${bookName}"** has been deleted.`);
}

/// 📜 Book List Output (Displays Vita Charge for Each Book)
if (command === '!booklist') {
    const char = characterData[message.author.id];
    if (!char || !char.books || Object.keys(char.books).length === 0) {
        return message.reply('📖 No books owned.');
    }

    // 📜 Organize Book List
    const bookList = Object.entries(char.books)
        .map(([name, { type, targetStamp, vitaRealm, vitaCost, currentVita = 0 }]) => {
            // 🔹 Find the Realm of the Target Stamp
            let stampRealmName = 'None';
            for (let i = 0; i < realmList.length; i++) {
                if (stampList.some(row => row[i] === targetStamp)) {
                    stampRealmName = realmList[i];
                    break;
                }
            }

            // If Vita Realm or Vita Cost is missing, mark as "None"
            const vitaDisplay = vitaRealm && vitaCost ? `${vitaRealm} ${vitaCost}` : 'None';

            return `**${name}** | ${type || "None"} | **${targetStamp}** | **${vitaDisplay}** | **${currentVita} / ${char.stats.source}**`;
        })
        .join('\n');

    message.reply(`📖 **Book List**\n${bookList}`);
}

/// 🔹 Reset Books (Deletes All Books Except "Calling")
if (command === '!resetbooks') {
    const char = characterData[message.author.id];

    if (!char || !char.books || Object.keys(char.books).length === 0) {
        return message.reply('❌ No books to delete.');
    }

    // 🔹 Keep Only "Calling" and Delete the Rest
    char.books = {
        "Calling": {
            targetStamp: "Variable",
            description: "Roll 1D6 to randomly determine the field, then roll 2D6 to randomly select a target stamp. That stamp becomes the designated stamp. If you succeed in rolling with this stamp, you can summon a spirit corresponding to that stamp."
        }
    };

    saveData();
    message.reply('🚨 All books have been deleted. `"Calling"` has been retained.');
}

/// 🔹 Add Anchor (Allows Setting Fate Points)
if (command === '!addanchor') {
    if (args.length < 2) {
        return message.reply('❌ Usage: `!addanchor [name] [attribute] (fate points)`');
    }

    const anchorName = args[0];
    const attribute = args[1];
    let fatePoints = args[2] ? parseInt(args[2]) : 1; // Default is 1, convert input if provided

    const attributeList = ["Interest", "Bloodline", "Domination", "Nemesis", "Romance", "Respect"];
    if (!attributeList.includes(attribute)) {
        return message.reply('❌ Invalid attribute. (Valid values: Interest, Bloodline, Domination, Nemesis, Romance, Respect)');
    }

    if (isNaN(fatePoints) || fatePoints < 1 || fatePoints > 5) {
        return message.reply('❌ Fate points must be set between 1 and 5.');
    }

    // 🔹 Verify Character Data
    const char = characterData[message.author.id];
    if (!char) {
        return message.reply('❌ First create a character using `!create_sheet [name]`.');
    }

    // 🔹 Initialize Anchor Data If Missing
    if (!char.anchors) {
        char.anchors = {};
    }

    // 🔹 Add Anchor
    char.anchors[anchorName] = { attribute, fatePoints };
    saveData();

    return message.reply(`✅ Anchor **"${anchorName}"** has been added.  
🔹 **Attribute**: ${attribute}  
🔹 **Fate Points**: ${fatePoints}`);
}

/// 🔹 Delete Anchor
if (command === '!deleteanchor') {
    const anchorName = args.join(' ');
    const char = characterData[message.author.id];

    if (!char || !char.anchors[anchorName]) {
        return message.reply('❌ You do not own this anchor.');
    }

    delete char.anchors[anchorName];
    saveData();
    message.reply(`❌ Anchor **"${anchorName}"** has been deleted.`);
}

/// 🔹 Execute Attack Contract / Defense Contract (Increase Fate Points by 1, Then Roll Dice)
if (command === '!attackcontract' || command === '!defensecontract') {
    const anchorName = args.join(' ');
    const char = characterData[message.author.id];

    if (!char || !char.anchors || !char.anchors[anchorName]) {
        return message.reply('❌ You do not own this anchor.');
    }

    if (char.anchors[anchorName].fatePoints < 5) {
        char.anchors[anchorName].fatePoints += 1;
        const newFatePoints = char.anchors[anchorName].fatePoints;
        saveData();

        // ✅ Execute Contract Message
        message.reply(`${command === '!attackcontract' ? 'Attack Contract' : 'Defense Contract'} has been executed.  
🔹 Anchor **"${anchorName}"** → Fate Points **${newFatePoints}**`);

        // 🎲 Automatically Roll Dice (Trigger Discord Dice Bot)
        message.channel.send(`${newFatePoints}B6`);
    } else {
        message.reply(`⚠️ Anchor **"${anchorName}"** already has the maximum fate points (5).`);
    }
}

const abilityStats = ["Attack", "Defense", "Source"]; // Ability list

// 🔹 Change Ability Stats (Attack, Defense, Source)
if (/^!(Attack|Defense|Source)[+\-]\d+$/.test(command)) {  
    const statMatch = command.match(/^!(Attack|Defense|Source)([+\-]\d+)$/);
    if (!statMatch) return;

    const statType = statMatch[1];  // Attack, Defense, or Source
    const changeValue = parseInt(statMatch[2]); // Extract +number or -number

    if (!characterData[message.author.id].stats) {
        characterData[message.author.id].stats = { Attack: 3, Defense: 3, Source: 3 }; // Default values
    }

    // Adjust stats (Minimum 1, Maximum 7)
    characterData[message.author.id].stats[statType] = Math.max(1, Math.min(7, characterData[message.author.id].stats[statType] + changeValue));
    saveData();

    return message.reply(`✅ **${statType}** has been changed to **${characterData[message.author.id].stats[statType]}**.`);
}

// 🔹 Summon Archetype (Improved Naming Format)
if (command === '!summonarchetype') {
    if (args.length < 2) return message.reply('❌ Usage: `!summonarchetype [Archetype Name] [Stamp]`');

    const archetypeName = args[0];
    const stamp = args[1];

    const archetypeList = ["Blade", "Maiden", "Knight", "Nightmare", "Kingdom", "Chariot", "Spirit", "Legion", "Daemon", "Lord", "Abyssal Gate"];
    if (!archetypeList.includes(archetypeName)) {
        return message.reply('❌ Invalid Archetype. (Available: Blade, Maiden, Knight, Nightmare, Kingdom, Chariot, Spirit, Legion, Daemon, Lord, Abyssal Gate)');
    }

    // Add Archetype (Saved in format: Stamp + Archetype Name)
    characterData[message.author.id].archetype = { name: `${stamp} of ${archetypeName}` };
    saveData();

    message.reply(`✅ Archetype **"${stamp} of ${archetypeName}"** has been set.`);
}

// 🔹 Delete Archetype
if (command === '!deletearchetype') {
    if (!characterData[message.author.id] || !characterData[message.author.id].archetype) {
        return message.reply('❌ No archetype is set.');
    }

    delete characterData[message.author.id].archetype;
    saveData();
    message.reply('❌ Archetype has been deleted.');
}

// Help Message
if (message.content === '!help') {
    const helpMessages = [
        {
            color: 0x0099ff,
            title: '📖 DX3bot Command List (1/3)',
            fields: [
                {
                    name: '🎭 **Character Management**',
                    value: '> `!createsheet "Name" Stamp1 Stamp2 Stamp3 Stamp4 Stamp5` - Register character\n' +
                           '> `!setcharacter "Character Name"` / `!unsetcharacter` - Activate/deactivate character\n' +
                           '> `!checksheet` - View current character info\n' +
                           '> `!setcourse [1~7]` - Set Course (Adjusts stats)\n' +
                           '> `!setinstitute [Table of Contents/Horizon/.../Laboratory]` - Set Institute\n' +
                           '> `!sethierarchy [Book Watcher/Librarian/.../Apocrypha]` - Set Hierarchy\n\n' +
                           '**🎭 Stamp of Spirit**\n' +
                           '> `!setSS [Stamp Name]` - Set Stamp of Spirit (Fixed target value 6)\n' +
                           '> `!checkSS` - Check set Stamp of Spirit\n'
                }
            ]
        },
        {
            color: 0x0099ff,
            title: '📖 DX3bot Command List (2/3)',
            fields: [
                {
                    name: '🎭 **Archetype & Rolling System**',
                    value: '> `!summonarchetype "Archetype Name" Stamp` / `!deletearchetype` - Set/Delete Archetype\n' +
                           '> `!roll [Stamp]` - Perform a normal roll\n' +
                           '> `!roll "Archetype" [Stamp]` - Perform a roll using Archetype\n\n' +
                           '**📌 Plot System**\n' +
                           '> `/plot [1~6]...` - Set plot (Up to 6)\n' +
                           '> `!randomplot [Count]` - Generate random plot\n' +
                           '> `!revealplot` - Reveal stored plots\n\n' +
                           '**📌 Book Management**\n' +
                           '> `!addbook "Book Name" Type Stamp Vita Realm Vita Cost Description` - Add a book\n' +
                           '> `!usebook "Book Name"` - Use a book for a roll\n' +
                           '> `!deletebook "Book Name"` / `!resetbooks` - Delete/Reset books\n' +
                           '> `!booklist` - View owned books\n' +
                           '> `!bookname+1`, `!bookname-1` - Charge or decrease vita in a book\n'
                }
            ]
        },
        {
            color: 0x0099ff,
            title: '📖 DX3bot Command List (3/3)',
            fields: [
                {
                    name: '🎭 **Other Functions**',
                    value: '> `!Attack+1` / `!Defense-1` / `!Source+1` - Adjust stats\n' +
                           '> `!attackcontract "Anchor"` / `!defensecontract "Anchor"` - Increase fate points and roll\n' +
                           '> `!addanchor "Name" Attribute (Fate Points)` - Add an anchor\n' +
                           '> `!deleteanchor "Name"` - Delete an anchor\n\n' +
                           '📌 For inquiries and feedback, contact Osha (@TRPG_sha/o3o_sha).'
                }
            ]
        }
    ];

    for (const msg of helpMessages) {
        await message.channel.send({ embeds: [msg] }).catch(err => console.error("❌ Failed to send message:", err));
    }
}

// Automatically Send Command to BCdicebot#8116 Every 12 Hours
const targetBotTag = "BCdicebot#8116";
const diceCommand = "bcdice set MagicaLogia:English";
const interval = 12 * 60 * 60 * 1000; // 12-hour interval (in milliseconds)

setInterval(() => {
    client.guilds.cache.forEach(guild => {
        const targetBot = guild.members.cache.find(member => member.user.tag === targetBotTag);
        if (targetBot) {
            const textChannel = guild.channels.cache.find(channel => 
                channel.type === 0 && channel.permissionsFor(client.user).has("SEND_MESSAGES")
            );
            if (textChannel) {
                textChannel.send(diceCommand)
                    .then(() => console.log(`✅ Woke up BCdicebot in: ${guild.name}`))
                    .catch(err => console.error(`❌ Failed to send message to BCdicebot (${guild.name}):`, err));
            }
        }
    });
}, interval);

// Retrieve Bot Token from Environment Variables
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error("❌ DISCORD_BOT_TOKEN environment variable is not set!");
    process.exit(1); // Stop execution if environment variable is missing
}
});

