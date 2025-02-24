const fs = require('fs');
const path = require('path'); // ✅ path 모듈 추가
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config(); // 환경 변수 로드
const BOT_OWNER_ID = process.env.BOT_OWNER_ID;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const userLanguage = {};  // 사용자별 언어 설정 저장 (예: { "123456789": "en" })

// 🔹 디스코드 봇 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});
    setImmediate(async () => {
        if (message.author.bot) return;
        if (!message.guild) return;  // DM 방지

const plotData = {}; // 플롯 데이터를 저장하는 객체
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// 🔹 슬래시 명령어 정의
const commands = [
    new SlashCommandBuilder()
        .setName('플롯')
        .setDescription('플롯을 설정합니다.')
        .addStringOption(option =>
            option.setName('값')
                .setDescription('1~6 사이의 숫자를 입력하세요. 예: 1 3 5')
                .setRequired(true)
        )
].map(command => command.toJSON());

async function registerCommands(clientId) {
    try {
        console.log("⏳ 슬래시 명령어 등록 중...");
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log("✅ 슬래시 명령어가 성공적으로 등록되었습니다!");
    } catch (error) {
        console.error("❌ 슬래시 명령어 등록 실패:", error);
    }
}

// 🔹 플롯 명령어 실행
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === '플롯') {
        try {
            await interaction.deferReply({ ephemeral: true });

            const input = interaction.options.getString('값');
            const numbers = input.split(' ')
                .map(n => parseInt(n, 10))
                .filter(n => n >= 1 && n <= 6);

            if (numbers.length === 0) {
                return await interaction.editReply('❌ 1~6 사이의 숫자를 입력하세요.');
            }

            plotData[interaction.user.id] = numbers;
            await interaction.editReply(`✅ 플롯이 저장되었습니다: ${numbers.join(', ')}`);

            if (interaction.channel) {
                await interaction.channel.send(
                    `<@${interaction.user.id}> 님이 플롯을 완료했습니다! 현재 플롯 참여자: ${Object.keys(plotData).length}명`
                );
            }
        } catch (error) {
            console.error("❌ 플롯 명령어 실행 중 오류 발생:", error);

            // 오류 발생 시 관리자에게 DM 전송
            try {
                const owner = await client.users.fetch(BOT_OWNER_ID);
                await owner.send(`⚠️ **오류 발생:**\n\`\`\`${error}\`\`\``);
            } catch (dmError) {
                console.error("❌ 관리자에게 오류 DM을 보내지 못했습니다:", dmError);
            }

            await interaction.editReply('⚠️ 플롯 설정 중 오류가 발생했습니다.');
        }
    }
});


// 데이터 파일 경로 설정
const dataFilePath = path.join(__dirname, 'data.json');

// 📝 **characterData 전역 변수 선언**
let characterData = {};

// 데이터 로드 (파일이 존재하면 불러오기)
if (fs.existsSync(dataFilePath)) {
    try {
        characterData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    } catch (error) {
        console.error("❌ 데이터 로드 중 오류 발생:", error);
        characterData = {}; // 오류 발생 시 빈 객체로 초기화
    }
}

// 데이터를 저장하는 함수
const saveData = () => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(characterData, null, 2));
    } catch (error) {
        console.error("❌ 데이터 저장 실패:", error);
    }
};

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID), // .env에 BOT_ID 추가 필요
            { body: commands }
        );
        console.log("✅ 슬래시 명령어가 성공적으로 등록되었습니다!");
    } catch (error) {
        console.error("❌ 슬래시 명령어 등록 실패:", error);
    }
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    registerCommands(); // 봇이 준비되면 슬래시 명령어 등록 실행
});


// 🔹 봇 로그인 실행
client.login(process.env.DISCORD_BOT_TOKEN);

  // 🔹 봇이 서버에 처음 초대될 때 메시지 전송
client.on('guildCreate', guild => {
    const defaultChannel = guild.systemChannel || guild.channels.cache.find(channel => channel.type === 0);
    
    if (defaultChannel) {
        defaultChannel.send(
            `✅ **MGLGbot이 정상적으로 초대되었습니다!**  
            💬 명령어를 확인하려면 **\`!도움\`**을 입력하세요.`
        )
        .then(() => console.log(`✅ [${guild.name}] 서버에 초대됨 - 첫 메시지 전송 완료!`))
        .catch(err => console.error(`❌ [${guild.name}] 첫 메시지 전송 실패:`, err));
    } else {
        console.warn(`⚠️ [${guild.name}] 서버에 초대되었지만, 적절한 채널을 찾을 수 없음.`);
    }
});


client.on('messageCreate', async message => {
    if (message.author.bot) return; // 봇 메시지는 무시

    const args = message.content.trim().split(/\s+/); // 공백 기준으로 명령어와 인자 분리
    const command = args.shift()?.toLowerCase(); // 첫 번째 단어를 명령어로 설정
    setImmediate(async () => {

    if (!command) return; // 명령어가 없는 경우 종료

    try {
        if (message.author.bot) return;
        if (!message.guild) return;

        // 명령어 인자 가져오기
        let args = message.content.trim().split(/\s+/);

        // ❗ args가 null이 아닌지 확인 후 shift() 실행
        if (!args || args.length === 0) {
            console.warn(`⚠️ 명령어 분석 중 오류 발생: args가 비어 있음.`);
            return;
        }

        let command = args.shift().toLowerCase(); // 첫 번째 단어를 명령어로 사용

    } catch (error) {
        console.error("🚨 [명령어 처리 중 오류 발생]:", error);

        // 🔹 오류 발생 시 DM으로 알림 (선택 사항)
        try {
            const owner = await message.guild.fetchOwner();
            if (owner) {
                owner.send(`❌ DX3bot에서 오류가 발생했습니다. 로그를 확인하세요.`);
            }
        } catch (dmError) {
            console.error(`🚫 서버 소유자에게 DM을 보낼 수 없습니다:`, dmError);
        }
    }

	
	// 특기 및 영역 목록
    const languageData = {
        ko: {
            영역목록: ["별", "짐승", "힘", "노래", "꿈", "어둠"],
            특기목록: [
                ["황금", "살", "중력", "이야기", "추억", "심연"],
                ["대지", "벌레", "바람", "선율", "수수께끼", "부패"],
                ["숲", "꽃", "흐름", "눈물", "거짓", "배신"],
                ["길", "피", "물", "이별", "불안", "방황"],
                ["바다", "비늘", "파문", "미소", "잠", "나태"],
                ["정적", "혼돈", "자유", "마음", "우연", "왜곡"],
                ["비", "이빨", "충격", "승리", "환각", "불행"],
                ["폭풍", "외침", "우레", "사랑", "광기", "바보"],
                ["태양", "분노", "불", "정열", "기도", "악의"],
                ["천공", "날개", "빛", "치유", "희망", "절망"],
                ["이계", "에로스", "원환", "시간", "미래", "죽음"]
            ]
        },
        en: {
            domain: ["Planet", "Animalism", "Dynamics", "Poetics", "Visions", "Shadows"],
            Stamp: [
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
            ]
        }
    };
    
    // 사용자별 언어 설정 저장 (기본값: 한국어)
    const userLanguage = {}; // { userId: "ko" 또는 "en" }
    
    // 🔹 언어 변경 명령어
    client.on("messageCreate", async message => {
        if (message.content.startsWith("!언어")) {
            const args = message.content.split(" ");
            if (args.length < 2 || !["ko", "en"].includes(args[1])) {
                return message.reply("❌ 사용법: `!언어 ko` 또는 `!언어 en`");
            }
    
            userLanguage[message.author.id] = args[1];
            message.reply(`✅ 언어가 **${args[1] === "ko" ? "한국어" : "English"}**로 변경되었습니다.`);
        }
    });
    
    // 🔹 특정 유저의 언어 데이터 가져오기
    function getUserLanguage(userId) {
        return userLanguage[userId] || "ko"; // 기본값: 한국어
    }
    
    // 🔹 영역 및 특기 데이터 반환
    function getLocalizedData(userId) {
        const lang = getUserLanguage(userId);
        return languageData[lang];
    }
    
    // 예시: 사용자 언어에 따라 특기 목록 가져오기
    client.on("messageCreate", async message => {
        if (message.content === "!특기목록") {
            const data = getLocalizedData(message.author.id);
            let response = "📜 **특기 목록**\n";
            for (let i = 0; i < data.영역목록.length; i++) {
                response += `🔹 **${data.영역목록[i]}**: ${data.특기목록[i].join(", ")}\n`;
            }
            message.reply(response);
        }
    });

    const 영역이모지 = {
        "별": "🌟",       // Star → Planet  
        "짐승": "🐾",     // Beast → Animalism  
        "힘": "⚡",       // Strength → Dynamics  
        "노래": "🎵",     // Song → Poetics  
        "꿈": "💤",       // Dream → Visions  
        "어둠": "🌑",     // Darkness → Shadows  
        "가변": "🎲",     // Variable → Random  
    };
    
    const 영역이모지_en = {
        "Planet": "🌟",
        "Animalism": "🐾",
        "Dynamics": "⚡",
        "Poetics": "🎵",
        "Visions": "💤",
        "Shadows": "🌑",
        "Random": "🎲"
    };
    
    // 사용자 언어에 맞는 영역 이모지 반환
    function getLocalizedEmoji(userId, key) {
        const lang = getUserLanguage(userId);
        return lang === "ko" ? 영역이모지[key] : 영역이모지_en[key] || "❓";
    }

if (message.content.startsWith('!업데이트')) {
    if (message.author.id !== BOT_OWNER_ID) {
        return message.channel.send("❌ 이 명령어는 봇 소유자만 사용할 수 있습니다.");
    }

    // 🏷️ 업데이트 방식 설정
    let args = message.content.split(' ').slice(1);
    let updateType = args[0] || "patch"; // 기본값은 패치 업데이트
    let announcementMessage = args.slice(1).join(' ');

    // 🔹 버전 업데이트 처리
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

    // 🔹 새로운 버전 정보 저장
    saveVersion(currentVersion);

    // 📌 새 버전 문자열
    let newVersion = `v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`;
    let finalMessage = `📢 **DX3bot 업데이트: ${newVersion}**\n${announcementMessage || "새로운 기능이 추가되었습니다!"}`;

    // ✅ 모든 서버에 공지 전송
    client.guilds.cache.forEach((guild) => {
        try {
            const announcementChannelId = serverAnnouncementChannels[guild.id];

            if (announcementChannelId) {
                const channel = guild.channels.cache.get(announcementChannelId);
                if (channel) {
                    channel.send(finalMessage)
                        .then(() => console.log(`✅ 서버 "${guild.name}"에 업데이트 공지를 전송했습니다.`))
                        .catch(err => console.error(`❌ 서버 "${guild.name}"에 공지를 보내는 중 오류 발생:`, err));
                    return;
                }
            }

            // 📩 공지 채널이 없는 경우 서버 관리자에게 DM 전송
            guild.fetchOwner()
                .then(owner => {
                    if (owner) {
                        owner.send(finalMessage)
                            .then(() => console.log(`📩 서버 "${guild.name}"의 관리자 (${owner.user.tag})에게 DM으로 공지를 전송했습니다.`))
                            .catch(err => console.error(`❌ 서버 관리자 DM 전송 실패 (${guild.name}):`, err));
                    }
                })
                .catch(err => console.error(`⚠️ 서버 "${guild.name}"의 관리자 정보를 가져올 수 없습니다.`, err));

        } catch (error) {
            console.error(`❌ 서버 "${guild.name}"에 공지를 보내는 중 오류 발생:`, error);
        }
    });

    // ✅ 봇 소유자(당신)에게도 DM 전송
    client.users.fetch(BOT_OWNER_ID)
        .then(botOwner => {
            if (botOwner) {
                botOwner.send(finalMessage)
                    .then(() => console.log(`📩 봇 소유자(${botOwner.tag})에게 업데이트 공지를 DM으로 보냈습니다.`))
                    .catch(err => console.error("❌ 봇 소유자 DM 전송 실패:", err));
            }
        })
        .catch(err => console.error("❌ 봇 소유자 정보 가져오기 실패:", err));

    // ✅ 명령어 실행한 채널에도 메시지 출력
    message.channel.send(`✅ **업데이트 완료! 현재 버전: ${newVersion}**`);
}



// 🔹 캐릭터 입력 (특기 필수 입력 + 기본 장서 추가)
if (command === '!시트입력') {
    if (args.length < 6) {
        return message.reply('❌ 사용법: `!시트입력 [이름] [특기1] [특기2] [특기3] [특기4] [특기5]` (특기 5개 필수)');
    }

    const name = args.shift();
    const 특기목록 = args.slice(0, 5);

    characterData[message.author.id] = { 
        이름: name,
        특기: 특기목록,
        원형: null,
        능력치: { 공격력: 3, 방어력: 3, 근원력: 3 },
        장서: {
            "긴급 소환": {
                판정특기: "가변",
                내용: "1D6을 굴려 분야를 무작위로 정하고, 그 뒤에 2D6을 굴려 무작위로 특기 하나를 선택한다. 그것이 지정특기가 된다. 해당 특기로 판정에 성공하면 그 특기에 대응하는 정령 1개체를 소환할 수 있다."
            }
        },
        영역: null,
        앵커: {}
    };

    saveData();
    message.reply(`✅ 캐릭터 **${name}**이(가) 등록되었습니다.  
🔹 **특기**: ${특기목록.join(', ')}  
📖 기본 장서 **"긴급 소환"**이 추가되었습니다.`);
}

   // 🔹 캐릭터 데이터 자동 초기화 함수
    function initializeCharacter(userId) {
        if (!characterData[userId]) {
            characterData[userId] = { 원형: {}, 능력치: { 공격력: 3, 방어력: 3, 근원력: 3 } };
        }
        if (!characterData[userId].능력치) {
            characterData[userId].능력치 = { 공격력: 3, 방어력: 3, 근원력: 3 };
        }
	}

    // 🔹 마력 결정

    if (command === '!마력결정') {
        if (!characterData[message.author.id]) {
            return message.reply('❌ 먼저 `!시트입력`으로 캐릭터를 생성하세요.');
        }
    
        // 🎲 1D6 주사위 굴리기
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        const 근원력 = characterData[message.author.id].능력치?.근원력 || 3;
        const 마력 = 근원력 + diceRoll;
    
        // 마력 저장
        characterData[message.author.id].마력 = 마력;
        saveData();
    
        message.reply(`🎲 **마력을 결정합니다.**\n1D6 + ${근원력} → **${diceRoll} + ${근원력} = ${마력}**`);
    }

    if (command === '!DTEther') {
        if (!characterData[message.author.id]) {
            return message.reply('❌ Please create a character first using `!createSheet`.');
        }
    
        // 🎲 Roll 1D6
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        const source = characterData[message.author.id].stats?.source || 3;
        const ether = source + diceRoll;
    
        // Save Ether
        characterData[message.author.id].ether = ether;
        saveData();
    
        message.reply(`🎲 **Determining Ether.**\n1D6 + ${source} → **${diceRoll} + ${source} = ${ether}**`);
    }
    

  
// 🔹 언어별 메시지 데이터
const messages = {
    setDomain: {
        ko: "✅ 영역이 **{value}**(으)로 설정되었습니다.",
        en: "✅ Domain set to **{value}**."
    },
    invalidDomain: {
        ko: "❌ 존재하지 않는 영역입니다. (별, 짐승, 힘, 노래, 꿈, 어둠 중 선택)",
        en: "❌ Invalid domain. Please choose from (Planet, Animalism, Dynamics, Poetics, Visions, Shadows)."
    },
    setSkills: {
        ko: "✅ 특기가 설정되었습니다: {value}",
        en: "✅ Skills set: {value}"
    },
    checkSkills: {
        ko: "📝 현재 특기: {value}",
        en: "📝 Current Skills: {value}"
    },
    noSkills: {
        ko: "❌ 설정된 특기가 없습니다.",
        en: "❌ No skills have been set."
    }
};

// 🔹 영역 설정
client.on("messageCreate", async message => {
    const args = message.content.split(" ");
    const command = args.shift();

    if (command === "!영역" || command === "!setDomain") {
        const domain = args[0];
        const lang = getUserLanguage(message.author.id);

        if (!영역목록.includes(domain)) {
            return message.reply(messages.invalidDomain[lang]);
        }

        if (!characterData[message.author.id]) characterData[message.author.id] = {};
        characterData[message.author.id].영역 = domain;
        saveData();

        message.reply(messages.setDomain[lang].replace("{value}", domain));
    }

    // 🔹 특기 설정
    if (command === "!특기설정" || command === "!setSkills") {
        const lang = getUserLanguage(message.author.id);

        if (args.length !== 5) {
            return message.reply(lang === "ko" ? "❌ 5개의 특기를 입력해야 합니다." : "❌ You must enter exactly 5 skills.");
        }

        if (!characterData[message.author.id]) characterData[message.author.id] = {};
        characterData[message.author.id].특기 = args;
        saveData();

        message.reply(messages.setSkills[lang].replace("{value}", args.join(", ")));
    }

    // 🔹 특기 확인
    if (command === "!특기확인" || command === "!checkSkills") {
        const lang = getUserLanguage(message.author.id);
        const char = characterData[message.author.id];

        if (!char || !char.특기) {
            return message.reply(messages.noSkills[lang]);
        }

        message.reply(messages.checkSkills[lang].replace("{value}", char.특기.join(", ")));
    }
});

// 🔹 혼의 특기 설정 (Stamp of Spirit, SS)
if (command === '!혼의특기' || command === '!SS') {
    if (!characterData[message.author.id]) {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? '❌ 먼저 `!시트입력`으로 캐릭터를 생성하세요.' 
            : '❌ Please create a character first using `!create_sheet`.');
    }
    
    if (args.length !== 1) {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? '❌ 사용법: `!혼의특기 [특기명]` (한 단어로 입력하세요)' 
            : '❌ Usage: `!SS [skill_name]` (Enter a single word)');
    }

    const 혼의특기 = args[0];
    const 모든특기 = 특기목록.flat(); // 2D 배열을 1D 배열로 변환
    if (모든특기.includes(혼의특기)) {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? `❌ **${혼의특기}**는 이미 존재하는 특기입니다! 혼의 특기는 기존 특기와 달라야 합니다.`
            : `❌ **${혼의특기}** already exists! SS must be unique.`);
    }

    characterData[message.author.id].혼의특기 = 혼의특기;
    saveData();

    message.reply(getUserLanguage(message.author.id) === "ko" 
        ? `**혼의 특기**가 **"${혼의특기}"**(으)로 설정되었습니다. 💠 이 특기의 목표값은 항상 **6**입니다.`
        : `**SS** has been set to **"${혼의특기}"**. 💠 This skill always has a target value of **6**.`);
}

// 🔹 혼의 특기 확인 (Check SS)
if (command === '!혼특확인' || command === '!SS_check') {
    const char = characterData[message.author.id];
    if (!char || !char.혼의특기) {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? '❌ 설정된 혼의 특기가 없습니다.' 
            : '❌ No SS has been set.');
    }
    
    message.reply(getUserLanguage(message.author.id) === "ko" 
        ? `💠 **혼의 특기**: ${char.혼의특기}`
        : `💠 **SS**: ${char.혼의특기}`);
}

// 🔹 판정 기능 (Judgment & SS)
if (command === '!판정' || command === '!DT_judgment') {
    if (!characterData[message.author.id]) {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? '❌ 먼저 `!시트입력`으로 캐릭터를 생성하세요.'
            : '❌ Please create a character first using `!create_sheet`.');
    }

    let 원형사용 = false;
    let 원형이름 = null;
    let 판정특기 = null;
    let 목표값 = 5;

    if (args.length === 1) {
        판정특기 = args[0];
    } else if (args.length === 2) {
        원형이름 = args[0].replace(/"/g, '');
        판정특기 = args[1];
        원형사용 = true;
    } else {
        return message.reply(getUserLanguage(message.author.id) === "ko" 
            ? '❌ 사용법: `!판정 [특기]` 또는 `!판정 "원형명" [특기]`'
            : '❌ Usage: `!DT_judgment [skill]` or `!DT_judgment "archetype" [skill]`');
    }

    const char = characterData[message.author.id];
    if (char.혼의특기 === 판정특기) {
        목표값 = 6;
    } else {
        let 특기좌표 = null;
        for (let i = 0; i < 특기목록.length; i++) {
            for (let j = 0; j < 특기목록[i].length; j++) {
                if (특기목록[i][j] === 판정특기) {
                    특기좌표 = { x: i, y: j };
                    break;
                }
            }
            if (특기좌표) break;
        }

        if (!특기좌표) {
            return message.reply(getUserLanguage(message.author.id) === "ko" 
                ? `❌ 존재하지 않는 특기입니다: **${판정특기}**`
                : `❌ Invalid skill: **${판정특기}**`);
        }
    }

    // 🎲 주사위 굴리기
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const diceRoll = dice1 + dice2;
    const 성공여부 = diceRoll >= 목표값 ? '✅ **성공!**' : '❌ **실패!**';

    // 📜 결과 출력
    if (원형사용) {
        if (!char.원형 || char.원형.이름 !== 원형이름) {
            return message.reply(getUserLanguage(message.author.id) === "ko" 
                ? `❌ 당신의 원형 **"${원형이름}"**(은)는 존재하지 않습니다.`
                : `❌ Your archetype **"${원형이름}"** does not exist.`);
        }
        message.reply(`2D6>=${목표값} **${판정특기} 판정** (원형: ${원형이름}) 🎲`);
    } else {
        message.reply(`2D6>=${목표값} **${판정특기} 판정** 🎲`);
    }
}

	
	
    // Character Management
    if (command === '!시트삭제') {
        delete characterData[message.author.id];
        saveData();
        message.reply('❌ 캐릭터 시트가 삭제되었습니다.');
    }

// 🔹 시트 확인 (영역, 장서, 앵커 포함)
if (command === '!시트확인') {
    if (!characterData[message.author.id]) {
        return message.reply('❌ 등록된 캐릭터가 없습니다.');
    }

    const char = characterData[message.author.id];

    // `이름` 필드가 정상적으로 존재하는지 확인 후 출력
    const 캐릭터이름 = char.이름 || '미설정';

    // 📝 특기 목록 출력
    const 특기목록출력 = char.특기 && char.특기.length > 0 ? char.특기.join(', ') : '없음';

    // 📜 장서 목록 출력 (긴급 소환 포함, 장서가 없을 경우 기본값 설정)
    if (!char.장서) char.장서 = {}; // 🔥 장서가 undefined일 경우 빈 객체로 초기화
	
const 장서출력 = Object.keys(char.장서).length > 0
    ? Object.entries(char.장서)
        .map(([이름, { 타입, 판정특기, 마소영역, 마소코스트, 현재마소 }]) => {
            // 🔹 해당 마소 영역의 이모지를 가져오기 (없으면 기본 📖 이모지)
            const 이모지 = 마소영역 && 영역이모지[마소영역] ? 영역이모지[마소영역] : '📖';

            // 🔹 개별 장서의 현재 마소가 없을 경우 기본값 0 설정
            if (현재마소 === undefined) 현재마소 = 0;

            // 🔹 마소 정보 출력 조건 (마소코스트가 0이면 "없음" 처리)
            const 마소표시 = 마소코스트 && 마소코스트 > 0 ? `${현재마소} / ${char.능력치?.근원력 || 계제출력}` : '없음';

            return `${이모지} **${이름}** | ${타입 || "없음"} | ${판정특기} | ${마소표시}`;
        })
        .join('\n')
    : '없음';

  const 기관출력 = char.기관 || '미설정';
    const 계제출력 = char.계제 || 3; // 기본값 3
    const 위계출력 = char.위계 || '미설정';

    // 🔮 마력 출력
    const 마력출력 = char.마력 ? `마력 ${char.마력} | ` : '🔮 마력: (미결정)'; 

    // 💠 혼의 특기 출력
    const 혼의특기출력 = char.혼의특기 ? `💠 ${char.혼의특기}` : '없음';

    // 🌀 원형 출력
    const 원형출력 = char.원형 ? `🌀 ${char.원형.이름}` : '없음';

    // 🔹 능력치 출력
    const 능력치출력 = `공격력 ${char.능력치?.공격력 || 계제출력} | 방어력 ${char.능력치?.방어력 || 계제출력} | 근원력 ${char.능력치?.근원력 || 계제출력}`;

    const 영역출력 = char.영역 ? `**${char.영역}**` : '미설정';

    // 🔹 마법명 출력
    const 마법명출력 = char.마법명 ? `**${char.마법명}**` : '미설정';

    // 🎭 앵커 출력
    const 앵커출력 = char.앵커 && Object.keys(char.앵커).length > 0
        ? Object.entries(char.앵커)
            .map(([이름, { 속성, 운명점 }]) => `**${이름}** (${속성}, 운명점 ${운명점})`)
            .join('\n')
        : '없음';
// 📜 **최종 출력 (인용 블록을 활용한 정리)**
message.reply(`
📖 **캐릭터 정보**
> **제 ${계제출력}계제 ${기관출력}의 ${위계출력}**
> 🔹 ${영역출력}의 마법사 **「${마법명출력}」**
> 🔹 ${캐릭터이름}
> 🔹 ${마력출력} ${능력치출력}

🔹 **특기 목록**
> ${특기목록출력}
🔹 **혼의 특기**
> ${혼의특기출력}

🔹 **장서 목록**
${장서출력 ? 장서출력.split('\n').map(line => `> ${line}`).join('\n') : '> 없음'}

🔹 **앵커 목록**
${앵커출력 ? 앵커출력.split('\n').map(line => `> ${line}`).join('\n') : '> 없음'}
`);


}

const 기관목록 = ["원탁", "천애", "학원", "문호", "엽귀", "아방궁"];
const 위계목록 = ["서경", "사서", "서공", "방문자", "이단자", "외전"];

if (command === '!기관') {
    const 기관 = args[0];
    if (!기관목록.includes(기관)) {
        return message.reply(`❌ 존재하지 않는 기관입니다. (사용 가능: ${기관목록.join(', ')})`);
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].기관 = 기관;
    saveData();
    message.reply(`✅ 기관이 **${기관}**(으)로 설정되었습니다.`);
}

if (command === '!계제') {
    let 계제 = parseInt(args[0]);
    if (isNaN(계제) || 계제 < 1 || 계제 > 7) {
        return message.reply('❌ 계제는 1부터 7까지 설정할 수 있습니다.');
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].계제 = 계제;
    characterData[message.author.id].능력치 = { 공격력: 계제, 방어력: 계제, 근원력: 계제 }; // 계제와 동일하게 설정
    saveData();
    message.reply(`✅ 계제가 **${계제}**(으)로 설정되었습니다.`);
}

if (command === '!위계') {
    const 위계 = args[0];
    if (!위계목록.includes(위계)) {
        return message.reply(`❌ 존재하지 않는 위계입니다. (사용 가능: ${위계목록.join(', ')})`);
    }
    if (!characterData[message.author.id]) characterData[message.author.id] = {};
    characterData[message.author.id].위계 = 위계;
    saveData();
    message.reply(`✅ 위계가 **${위계}**(으)로 설정되었습니다.`);
}

	
	// 🔹 마법명 설정
    if (command === '!마법명') {
        if (!args || args.length < 1) return message.reply('❌ 사용법: `!마법명 "마법 이름"` (큰따옴표 필수)');

        let 마법명 = args.join(' '); 
        마법명 = 마법명.replace(/(^"|"$)/g, ''); // 앞뒤 따옴표 제거

        if (!characterData[message.author.id]) {
            return message.reply('❌ 먼저 `!시트입력`으로 캐릭터를 생성하세요.');
        }

        characterData[message.author.id].마법명 = 마법명;
        saveData();

        message.reply(`✅ 마법명이 **${마법명}**(으)로 설정되었습니다.`);
		
	}

    // 서버 ID가 존재하면 서버별로, DM이면 'DM'으로 구분
    const guildId = message.guild ? message.guild.id : "DM";

    // 🔹 캐릭터 지정 (서버별로 다른 캐릭터 지정 가능)
    if (command === '!지정') {
        if (!characterData[message.author.id]) return message.reply('❌ 먼저 캐릭터를 생성하세요.');

        if (!characterData[message.author.id].활성) {
            characterData[message.author.id].활성 = {}; // 서버별 지정 가능하도록 구조 변경
        }
        characterData[message.author.id].활성[guildId] = true;
        saveData();

        message.reply(`✅ 캐릭터 **${characterData[message.author.id].이름}**이(가) **${message.guild ? '이 서버에서' : 'DM에서'}** 활성화되었습니다.`);
    }

    // 🔹 캐릭터 지정 해제 (서버별로 관리)
    if (command === '!지정해제') {
        if (!characterData[message.author.id] || !characterData[message.author.id].활성 || !characterData[message.author.id].활성[guildId]) {
            return message.reply('❌ 활성화된 캐릭터가 없습니다.');
        }
        delete characterData[message.author.id].활성[guildId];
        saveData();
        message.reply(`❌ **${message.guild ? '이 서버에서' : 'DM에서'}** 캐릭터 활성화가 해제되었습니다.`);
    }
	  // 🔹 랜덤 플롯 생성
    if (command === '!랜덤플롯') {
        let count = parseInt(args[0]);
        if (isNaN(count) || count < 1 || count > 6) return message.reply('❌ 플롯 개수는 1~6 사이여야 합니다.');
        
        const numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
        plotData[message.author.id] = numbers;
        message.reply(`✅ 랜덤 플롯이 설정되었습니다: ${numbers.join(', ')}`);
    }

    // 🔹 플롯 공개 (플롯 참여자 목록 출력)
    if (command === '!플롯공개') {
        if (Object.keys(plotData).length === 0) {
            return message.reply('❌ 현재 저장된 플롯이 없습니다.');
        }

        let result = `🎲 **플롯 공개**:\n`;
        for (const [userId, numbers] of Object.entries(plotData)) {
            result += `<@${userId}>: ${numbers.join(', ')}\n`;
        }

        // 플롯 데이터 초기화
        plotData = {};
        message.channel.send(result);
    }

// 기존 args 변수를 유지하면서 새 변수로 따옴표 처리된 데이터 분리
    let parsedArgs = message.content.match(/"([^"]+)"|\S+/g);
    if (!parsedArgs) return;

    let parsedArgsCommand = parsedArgs.shift(); // 첫 번째 단어가 명령어


if (command === '!장서추가') {
    const commandPattern = /^!장서추가\s+"([^"]+)"\s+(\S+)\s+(\S+)\s+(\S+)\s*(\d*)\s+(.+)$/s;
    const match = message.content.match(commandPattern);

    if (!match) {
        return message.reply(
            '❌ 사용법: `!장서추가 "장서명" [타입] [판정특기] [마소영역] [코스트] [설명]`\n' +
            '예: `!장서추가 "마검 소환" 공격 선율 노래 2 강력한 검을 소환한다.`'
        );
    }

    let 장서명 = match[1].trim();
    let 타입 = match[2].trim();
    let 판정특기 = match[3].trim();
    let 마소영역 = match[4].trim();
    let 마소코스트 = match[5].trim();
    const 내용 = match[6].trim();

    // 🔹 "없음"을 입력한 경우 처리
    if (타입 === "없음") 타입 = null;
    if (마소영역 === "없음") {
        마소영역 = null;
        마소코스트 = 0;
    } else if (!Object.keys(영역이모지).includes(마소영역)) {
        return message.reply(`❌ 유효하지 않은 마소 영역입니다: **${마소영역}**\n(사용 가능: 별, 짐승, 힘, 노래, 꿈, 어둠, 없음)`);
    }

    // 🔹 마소코스트가 비어 있거나 "없음"일 경우 0으로 설정
    마소코스트 = 마소코스트 === "" || isNaN(마소코스트) ? 0 : parseInt(마소코스트, 10);

    // 🔹 캐릭터 데이터 초기화
    if (!characterData[message.author.id]) {
        characterData[message.author.id] = { 장서: {} };
    }
    if (!characterData[message.author.id].장서) {
        characterData[message.author.id].장서 = {};
    }

    // 🔹 장서 추가
    characterData[message.author.id].장서[장서명] = { 타입, 판정특기, 마소영역, 마소코스트, 내용 };
    saveData();

    message.reply(
        `📖  장서 **"${장서명}"**(이)가 추가되었습니다.\n` +
        `🔹 **타입**: ${타입 ? 타입 : "없음"}\n` +
        `🔹 **판정특기**: ${판정특기}\n` +
        `🔹 **코스트**: ${마소영역 ? `${마소영역} ${마소코스트}` : "없음"}\n` +
        `**설명**: ${내용}`
    );
}


// 🔹 개별 장서에 마소 충전 및 감소 (`!장서명+1`, `!장서명-1`, `!장서명+3` 등 숫자 가능)
if (/^!(?!공격력|방어력|근원력).+\s?[\+\-]\d+$/.test(command)) {  
    // 🔹 증가 또는 감소 값 추출
    const changeMatch = command.match(/([+\-]\d+)$/);
    if (!changeMatch) return;

    const changeValue = parseInt(changeMatch[1]); // +숫자, -숫자
    if (isNaN(changeValue)) return;

    // 🔍 명령어에서 장서명 추출 (`+숫자` 부분 제거)
    let 입력장서명 = command.replace(/^!/, '').replace(/\s?[\+\-]\d+$/, '').trim();

    // 캐릭터 데이터 확인
    const char = characterData[message.author.id];
    if (!char || !char.장서) {
        return message.reply('❌ 현재 등록된 장서가 없습니다. 먼저 `!장서등록 [장서명]`을 사용해 등록하세요.');
    }

    // 🔍 입력값과 저장된 장서명 비교 (공백 제거 후 매칭)
    const 장서키 = Object.keys(char.장서).find(장서 => 
        장서.replace(/\s+/g, '') === 입력장서명.replace(/\s+/g, '')
    );

    if (!장서키) {
        return message.reply(`❌ **"${입력장서명}"** 장서를 보유하고 있지 않습니다. \n등록된 장서를 확인하려면 \`!장서목록\`을 사용하세요.`);
    }

    // 장서 데이터 가져오기
    let 장서 = char.장서[장서키];

    // ✅ 개별 장서 마소 충전량 관리
    if (장서.현재마소 === undefined) 장서.현재마소 = 0;
    if (!장서.마소영역) 장서.마소영역 = 장서키; // 마소영역이 없으면 기본값으로 설정

    // 캐릭터 근원력 값 가져오기
    const 근원력 = char.능력치?.근원력 || 3; // 기본값 3 (설정 안 되어 있을 경우 대비)

    // 🔹 마소 충전 (최대 근원력 제한)
    if (changeValue > 0) {
        if (장서.현재마소 + changeValue > 근원력) {
            return message.reply(`❌ **${장서.마소영역} 마소**는 최대 근원력(${근원력})을 초과할 수 없습니다!`);
        }
        장서.현재마소 += changeValue;
    }

    // 🔻 마소 감소 (최소 0 이상)
    if (changeValue < 0) {
        if (장서.현재마소 + changeValue < 0) {
            return message.reply(`❌ **${장서.마소영역} 마소**가 부족하여 감소할 수 없습니다.`);
        }
        장서.현재마소 += changeValue;
    }

    saveData();
    return message.reply(`✅ **"${장서키}"** → **${장서.마소영역} 마소 ${changeValue > 0 ? '+' : ''}${changeValue}** (현재: ${장서.현재마소} / ${근원력})`);
}



// 🔹 장서 판정 (띄어쓰기 포함)
if (command === '!장서') {
    let 입력장서명 = args.join(' ').trim(); // 사용자 입력값에서 공백을 포함한 전체 장서명
    const char = characterData[message.author.id];

    if (!char || !char.장서) {
        return message.reply('❌ 등록된 장서가 없습니다.');
    }

    // 🔍 입력값과 저장된 장서명 비교 (공백 제거 후 매칭)
    const 장서키 = Object.keys(char.장서).find(장서 => 장서.replace(/\s+/g, '') === 입력장서명.replace(/\s+/g, ''));

    if (!장서키) {
        return message.reply(`❌ 해당 장서를 보유하고 있지 않습니다.  
📖 **보유한 장서**: ${Object.keys(char.장서).join(', ') || '없음'}`);
    }

    let 장서 = char.장서[장서키];
    let { 타입, 판정특기, 마소영역, 마소코스트, 내용 } = 장서;

    // 🌀 `가변` 특기 처리 (랜덤 특기 선택)
    if (판정특기 === "가변") {
        const 랜덤분야 = Math.floor(Math.random() * 6);
        const 랜덤특기 = Math.floor(Math.random() * 11);
        판정특기 = 특기목록[랜덤특기][랜덤분야];
        장서.판정특기 = 판정특기;
        saveData();
    }

    // 🌀 `영역` 특기 처리 (해당 영역 내에서 랜덤 선택)
    if (영역목록.includes(판정특기)) {
        const 영역인덱스 = 영역목록.indexOf(판정특기);
        const 랜덤특기 = Math.floor(Math.random() * 11);
        판정특기 = 특기목록[랜덤특기][영역인덱스];
        장서.판정특기 = 판정특기;
        saveData();
    }

    // 🔹 장서 사용 시 개별 마소 확인
    if (장서.현재마소 === undefined) 장서.현재마소 = 0;
    let 현재마소 = 장서.현재마소;

    // 🔹 **마소가 부족하면 타입과 관계없이 사용 불가**
    if (현재마소 < 마소코스트) {
        return message.reply(`❌ 마소가 부족합니다!  
**필요 마소**: ${마소영역} ${마소코스트}개  
**현재 마소**: ${현재마소}개`);
    }

    // 🔻 **마소 차감 (장비는 차감 없음, 그러나 필요 마소는 유지)**
    if (타입 !== "장비") {
        장서.현재마소 -= 마소코스트;
        현재마소 = 장서.현재마소;
        saveData();
    }

    // 🔹 **판정특기가 "없음"이면 내용만 출력**
    if (판정특기 === "없음") {
        return message.reply(
            `📖 **${장서키}**  
**타입**: ${타입 || "없음"}  
**설명**: ${내용}  
🔹 **현재 마소**: ${현재마소} / ${char.능력치.근원력}`
        );
    }

    // 🔹 목표값 계산 (기본값: 5)
    let 목표값 = 5;
    const 영역 = char.영역 ? 영역목록.indexOf(char.영역) : null;
    let 특기위치 = null;

    // 🔍 판정특기의 위치 찾기
    특기목록.some((row, y) => row.some((특기, x) => {
        if (특기 === 판정특기) {
            특기위치 = { x, y };
            return true;
        }
    }));

    if (!특기위치) return message.reply('❌ 유효하지 않은 특기입니다.');

    // 🔹 가장 가까운 설정 특기와의 거리 계산
    let 최소거리 = Infinity;
    char.특기.forEach(설정특기 => {
        특기목록.some((row, y) => row.some((특기, x) => {
            if (특기 === 설정특기) {
                let 거리X = Math.abs(특기위치.x - x);
                let 거리Y = Math.abs(특기위치.y - y);
                let 가로이동값 = (영역 !== null && (x === 영역 || 특기위치.x === 영역)) ? 1 : 2;
                let 현재거리 = 거리Y + (거리X * 가로이동값);
                최소거리 = Math.min(최소거리, 현재거리);
                return true;
            }
        }));
    });

    목표값 += 최소거리;
    // 📜 결과 메시지 (마소메시지가 없으면 출력하지 않음)
    message.reply(
`🔹 ${장서키}
**타입**: ${장서.타입 || "없음"}   **판정특기**: ${판정특기}  
**설명**: ${내용}
현재  **${현재마소} / ${char.능력치.근원력}**개의 마소가 남았습니다.`);
 
 message.reply(`2D6>=${목표값} **${판정특기} 판정**`);
 }



    // 🔹 장서 삭제 (띄어쓰기 포함)
    if (command === '!장서삭제') {
        const 장서명 = args.join(' '); // 띄어쓰기 포함
        if (!characterData[message.author.id] || !characterData[message.author.id].장서[장서명]) {
            return message.reply('❌ 해당 장서를 보유하고 있지 않습니다.');
        }

        delete characterData[message.author.id].장서[장서명];
        saveData();
        message.reply(`❌ 장서 **"${장서명}"**(이)가 삭제되었습니다.`);
    }
	
/// 📜 장서 목록 출력 (각 장서별 마소 충전량 표시)
if (command === '!장서목록') {
    const char = characterData[message.author.id];
    if (!char || !char.장서 || Object.keys(char.장서).length === 0) {
        return message.reply('📖 보유한 장서가 없습니다.');
    }

    // 📜 장서 목록 정리
 const 장서리스트 = Object.entries(char.장서)
    .map(([이름, { 타입, 판정특기, 마소영역, 마소코스트, 현재마소 = 0 }]) => {
            // 🔹 판정특기가 속한 영역 찾기
            let 특기영역이름 = '없음';
            for (let i = 0; i < 영역목록.length; i++) {
                if (특기목록.some(row => row[i] === 판정특기)) {
                    특기영역이름 = 영역목록[i];
                    break;
                }
            }

            // 마소영역 또는 마소코스트가 없는 경우 "없음" 처리
            const 마소표시 = 마소영역 && 마소코스트 ? `${마소영역} ${마소코스트}` : '없음';

            return `**${이름}** | ${타입 || "없음"} | **${판정특기}** | **${마소표시}** | **${현재마소} / ${char.능력치.근원력}**`;
        })
        .join('\n');

    message.reply(`📖 **장서 목록**\n${장서리스트}`);
}

	// 🔹 장서 리셋 (모든 장서 삭제, "긴급 소환" 유지)
if (command === '!장서리셋') {
    const char = characterData[message.author.id];

    if (!char || !char.장서 || Object.keys(char.장서).length === 0) {
        return message.reply('❌ 삭제할 장서가 없습니다.');
    }

    // 🔹 "긴급 소환"만 유지하고 나머지 장서 삭제
    char.장서 = {
        "긴급 소환": {
            판정특기: "가변",
            내용: "1D6을 굴려 분야를 무작위로 정하고, 그 뒤에 2D6을 굴려 무작위로 특기 하나를 선택한다. 그것이 지정특기가 된다. 해당 특기로 판정에 성공하면 그 특기에 대응하는 정령 1개체를 소환할 수 있다."
        }
    };

    saveData();
    message.reply('🚨 모든 장서가 삭제되었습니다. `"긴급 소환"`은 유지됩니다.');
}


// 🔹 앵커 추가 명령어 (운명점 설정 가능)
if (command === '!앵커추가') {
    if (args.length < 2) {
        return message.reply('❌ 사용법: `!앵커추가 [이름] [속성] (운명점)`');
    }

    const 앵커이름 = args[0];
    const 속성 = args[1];
    let 운명점 = args[2] ? parseInt(args[2]) : 1; // 기본값 1, 입력값이 있으면 변환

    const 속성목록 = ["흥미", "혈연", "지배", "숙적", "연애", "존경"];
    if (!속성목록.includes(속성)) {
        return message.reply('❌ 유효한 속성이 아닙니다. (가능한 값: 흥미, 혈연, 지배, 숙적, 연애, 존경)');
    }

    if (isNaN(운명점) || 운명점 < 1 || 운명점 > 5) {
        return message.reply('❌ 운명점은 1~5 사이의 숫자로 설정해야 합니다.');
    }

    // 🔹 캐릭터 데이터 확인
    const char = characterData[message.author.id];
    if (!char) {
        return message.reply('❌ 먼저 `!시트입력 [이름]` 명령어로 캐릭터를 생성하세요.');
    }

    // 🔹 앵커 데이터가 없으면 초기화
    if (!char.앵커) {
        char.앵커 = {};
    }

    // 🔹 앵커 추가
    char.앵커[앵커이름] = { 속성, 운명점 };
    saveData();

    return message.reply(`✅ 앵커 **"${앵커이름}"**(이)가 추가되었습니다.  
🔹 **속성**: ${속성}  
🔹 **운명점**: ${운명점}`);
}

    // 🔹 앵커 삭제
    if (command === '!앵커삭제') {
        const 앵커이름 = args.join(' ');
        const char = characterData[message.author.id];

        if (!char || !char.앵커[앵커이름]) {
            return message.reply('❌ 해당 앵커를 보유하고 있지 않습니다.');
        }

        delete char.앵커[앵커이름];
        saveData();
        message.reply(`❌ 앵커 **"${앵커이름}"**(이)가 삭제되었습니다.`);
    }
	
// 🔹 공격계약 / 방어계약 실행 (운명점 +1 증가 후 주사위 굴리기)
if (command === '!공격계약' || command === '!방어계약') {
    const 앵커이름 = args.join(' ');
    const char = characterData[message.author.id];

    if (!char || !char.앵커 || !char.앵커[앵커이름]) {
        return message.reply('❌ 해당 앵커를 보유하고 있지 않습니다.');
    }

    if (char.앵커[앵커이름].운명점 < 5) {
        char.앵커[앵커이름].운명점 += 1;
        const 새로운운명점 = char.앵커[앵커이름].운명점;
        saveData();

        // ✅ 계약 실행 메시지
        message.reply(` ${command === '!공격계약' ? '공격계약' : '방어계약'}이 실행되었습니다.  
🔹 앵커 **"${앵커이름}"** → 운명점 **${새로운운명점}**`);

        // 🎲 자동으로 다이스 굴리기 (디스코드 주사위 봇 반응)
        message.channel.send(`${새로운운명점}B6`);
    } else {
        message.reply(`⚠️ 앵커 **"${앵커이름}"**의 운명점이 이미 최대(5)입니다.`);
    }
}

	
	
const abilityStats = ["공격력", "방어력", "근원력"]; // 능력치 목록

// 🔹 능력치 변경 (공격력, 방어력, 근원력)
if (/^!(공격력|방어력|근원력)[+\-]\d+$/.test(command)) {  
    const statMatch = command.match(/^!(공격력|방어력|근원력)([+\-]\d+)$/);
    if (!statMatch) return;

    const statType = statMatch[1];  // 공격력, 방어력, 근원력 중 하나
    const changeValue = parseInt(statMatch[2]); // +숫자, -숫자 추출

    if (!characterData[message.author.id].능력치) {
        characterData[message.author.id].능력치 = { 공격력: 3, 방어력: 3, 근원력: 3 }; // 기본값 설정
    }

    // 능력치 조정 (최소 1, 최대 7)
    characterData[message.author.id].능력치[statType] = Math.max(1, Math.min(7, characterData[message.author.id].능력치[statType] + changeValue));
    saveData();

    return message.reply(`✅ **${statType}**이(가) **${characterData[message.author.id].능력치[statType]}**(으)로 변경되었습니다.`);
}

	// 🔹 원형 설정 (이름 형식 개선)
    if (command === '!원형소환') {
        if (args.length < 2) return message.reply('❌ 사용법: `!원형소환 [원형이름] [특기]`');

        const 원형이름 = args[0];
        const 특기 = args[1];

        const 원형목록 = ["마검", "처녀", "기사", "악몽", "왕국", "전차", "정령", "군단", "마신", "마왕", "나락문"];
        if (!원형목록.includes(원형이름)) {
            return message.reply('❌ 유효한 원형이 아닙니다. (가능한 값: 마검, 처녀, 기사, 악몽, 왕국, 전차, 정령, 군단, 마신, 마왕, 나락문)');
        }

        // 원형 추가 (특기 + 원형이름 형식으로 저장)
        characterData[message.author.id].원형 = { 이름: `${특기}의 ${원형이름}` };
        saveData();

        message.reply(`✅ 원형 **"${특기}의 ${원형이름}"**(이)가 설정되었습니다.`);
    }

    // 🔹 원형 삭제
    if (command === '!원형삭제') {
        if (!characterData[message.author.id] || !characterData[message.author.id].원형) {
            return message.reply('❌ 설정된 원형이 없습니다.');
        }

        delete characterData[message.author.id].원형;
        saveData();
        message.reply('❌ 원형이 삭제되었습니다.');
    }

// 도움 메세지
    if (message.content === '!도움') {
        const helpMessages = [
            "📜 **MGLGbot 명령어 목록 (1/3)**\n"
            + "**📌 캐릭터 관리**\n"
            + "`!시트입력 \"이름\" 특기1 특기2 특기3 특기4 특기5` - 캐릭터 등록\n"
            + "`!지정 \"캐릭터 이름\"` / `!지정해제` - 캐릭터 활성화/해제\n"
            + "`!시트확인` - 현재 캐릭터 정보 확인\n"
            + "`!계제 [1~7]` - 계제 설정 (능력치 조정)\n"
            + "`!기관 [원탁/천애/.../아방궁]` - 기관 설정\n"
            + "`!위계 [서경/사서/.../외전]` - 위계 설정\n\n"
            + "**📌 혼의 특기**\n"
            + "`!혼의특기 [특기명]` - 혼의 특기 설정 (목표값 6 고정)\n"
            + "`!혼특확인` - 설정된 혼의 특기 확인\n",

            "📜 **MGLGbot 명령어 목록 (2/3)**\n"
            + "**📌 원형 & 판정 시스템**\n"
            + "`!원형소환 \"원형이름\" 특기` / `!원형삭제` - 원형 설정/삭제\n"
            + "`!판정 [특기]` - 일반 판정 수행\n"
            + "`!판정 \"원형\" [특기]` - 원형 사용 판정\n\n"
            + "**📌 플롯 시스템**\n"
            + "`/플롯 [1~6]...` - 플롯 설정 (최대 6개)\n"
            + "`!랜덤플롯 [개수]` - 랜덤 플롯 생성\n"
            + "`!플롯공개` - 저장된 플롯 공개\n\n"
            + "**📌 장서 관리**\n"
            + "`!장서추가 \"장서명\" 타입 특기 마소영역 마소개수 설명` - 장서 추가\n"
            + "`!장서 \"장서명\"` - 장서 사용 판정\n"
            + "`!장서삭제 \"장서명\"` / `!장서리셋` - 장서 삭제/초기화\n"
            + "`!장서목록` - 보유 장서 목록 확인\n",
	    + "`!장서이름+1, !장서이름-1` - 보유 장서에 마소 충전, 감소\n",

            "📜 **MGLGbot 명령어 목록 (3/3)**\n"
            + "**📌 기타 기능**\n"
            + "`!공격력+1` / `!방어력-1` / `!근원력+1` - 능력치 조정\n"
            + "`!공격계약 \"앵커\"` / `!방어계약 \"앵커\"` - 운명점 증가 후 판정\n"
            + "`!앵커추가 \"이름\" 속성 (운명점)` - 앵커 추가\n"
            + "`!앵커삭제 \"이름\"` - 앵커 삭제\n\n"
            + "📌 문의 및 피드백은 오샤(@TRPG_sha/o3o_sha)로 부탁드려요."
        ];

for (const msg of helpMessages.filter(m => typeof m === 'string' && !Number.isNaN(m) && m.trim() !== '')) {
    await message.reply(msg).catch(err => console.error("❌ 메시지 전송 실패:", err));
}

}	
	;


// 12시간마다 BCdicebot#8116에게 명령어 전송
const targetBotTag = "BCdicebot#8116";
const diceCommand = "bcdice set MagicaLogia:Korean";
const interval = 12 * 60 * 60 * 1000; // 12시간 간격 (밀리초 단위)

setInterval(() => {
    client.guilds.cache.forEach(guild => {
        const targetBot = guild.members.cache.find(member => member.user.tag === targetBotTag);
        if (targetBot) {
            const textChannel = guild.channels.cache.find(channel => 
                channel.type === 0 && channel.permissionsFor(client.user).has("SEND_MESSAGES")
            );
            if (textChannel) {
                textChannel.send(diceCommand)
                    .then(() => console.log(`✅ BCdicebot을 깨웠습니다: ${guild.name}`))
                    .catch(err => console.error(`❌ BCdicebot 메시지 전송 실패 (${guild.name}):`, err));
            }
        }
    });
}, interval);

// 환경 변수에서 봇 토큰 가져오기
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error("❌ DISCORD_BOT_TOKEN 환경 변수가 설정되지 않았습니다!");
    process.exit(1); // 환경 변수가 없으면 실행 중지
}
});
});})