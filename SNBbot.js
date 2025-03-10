console.log("봇 시작 시도...");
process.on('uncaughtException', error => {
  console.error('치명적 오류:', error);
});

const { Client, GatewayIntentBits, SlashCommandBuilder, Collection, REST, Routes } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ======================= 데이터 관리 시스템 =======================
const DATA_PATH = path.join(__dirname, 'data.json');
let characterData = {};

function loadData() {
  try {
    let data = {};
    if (fs.existsSync(DATA_PATH)) {
      data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      Object.values(data).forEach(user => {
        user.생명력 = user.생명력 || { 기본: 6, 추가: 0 };
        user.분야상실 = user.분야상실 || [];
      });
    }
    return data;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return {};
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(characterData, null, 2));
  } catch (error) {
    console.error('데이터 저장 실패:', error);
  }
}

characterData = loadData();

// ======================= 시스템 상수 정의 =======================
const RANKS = {
  "쿠사": { inbo: 1, skills: 4, secretArts: 0 },
  "하급닌자": { inbo: 2, skills: 5, secretArts: 0 },
  "하급닌자 지휘관": { inbo: 3, skills: 5, secretArts: 0 },
  "중급닌자": { inbo: 4, skills: 6, secretArts: 1 },
  "중급닌자 지휘관": { inbo: 5, skills: 6, secretArts: 1 },
  "상급닌자": { inbo: 6, skills: 7, secretArts: 2 },
  "상급닌자 지휘관": { inbo: 7, skills: 7, secretArts: 2 },
  "두령": { inbo: 8, skills: 8, secretArts: 3 }
};

const CLANS = [
  "하스바인군", "쿠라마신류", "하구레모노", 
  "히라사카 기관", "사립 오토기 학원", "오니의 혈통"
];

// ======================= 유틸리티 함수 =======================
function parseArgs(input) {
  const regex = /"([^"]*)"|([^\s]+)/g;
  const args = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    const value = match[1] || match[2];
    if (value) args.push(value.trim());
  }
  return args;
}

const fields = ["기술", "체술", "인술", "모술", "전술", "요술"];
const skillLists = [
  ["기기술", "불의술", "물의술", "침술", "암기", "의상술", "포승술", "등반술", "고문술", "손괴술", "굴삭술"],
  ["기승술", "포술", "수리검술", "손놀림", "신체조작", "보법", "주법", "비행술", "격투술", "도검술", "괴력"],
  ["생존술", "잠복술", "도주술", "도청술", "복화술", "은형술", "변장술", "향술", "분신술", "은폐술", "제육감"],
  ["의술", "독술", "함정술", "조사술", "사기술", "대인술", "예능", "미인계", "괴뢰술", "유언비어", "경제력"],
  ["병량술", "동물사역", "야전술", "지형활용", "의지", "용병술", "기억술", "색적술", "암호술", "전달술", "인맥"],
  ["이형화", "소환술", "사령술", "결계술", "봉인술", "언령술", "환술", "동술", "천리안", "빙의술", "주술"]
];

// 1. 특기명 정규화 함수 추가 (띄어쓰기 무시)
function normalizeSkill(skillName) {
  return skillName.replace(/\s+/g, '');
}

// 2. 특기 좌표 검색 함수 수정
function findSkillCoordinate(skillName) {
  const normalized = normalizeSkill(skillName);
  for (let col = 0; col < skillLists.length; col++) {
    const row = skillLists[col].findIndex(s => normalizeSkill(s) === normalized);
    if (row !== -1) return { x: col, y: row };
  }
  return null;
}

// 3. 거리 계산 로직 보정
function calculateTargetWithDistance(skillName, char) {
  const targetCoord = findSkillCoordinate(skillName);
  if (!targetCoord) return 12;

  const targetField = fields[targetCoord.x];
  if ((char.분야상실 || []).includes(targetField)) return 12;

  let minDistance = Infinity;

  for (const mySkill of char.특기) {
    const myCoord = findSkillCoordinate(mySkill);
    if (!myCoord) continue;

    // ▼ 목련 인법: 같은 분야 첫-끝 특기 거리 1 ▼
    if (char.인법?.목련 && myCoord.x === targetCoord.x) {
      const isEdgePair = (myCoord.y === 0 && targetCoord.y === 10) || (myCoord.y === 10 && targetCoord.y === 0);
      if (isEdgePair) {
        minDistance = 1;
        break;
      }
    }

    // ▼ 기본 거리 계산 (전문분야 가중치 적용) ▼
    const vertical = Math.abs(myCoord.y - targetCoord.y);
    const horizontal = Math.abs(myCoord.x - targetCoord.x) * (myCoord.x === fields.indexOf(char.전문분야) ? 1 : 2);
    minDistance = Math.min(minDistance, vertical + horizontal);
  }

  // ▼ 최종 목표치 계산 (최대 7 제한) ▼
  return 5 + Math.min(minDistance, 7);
}



function rollSkill(userId, targetSkillName) {
  const user = characterData[userId];
  if (!user) return "❌ 캐릭터 정보가 없습니다.";
  
  const target = calculateTargetWithDistance(targetSkillName, user); // 순서 변경
  const roll = Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
  
  let result = `\`${targetSkillName}의 목표치 → ${target}\`\n> 🎲 **${roll}**`;
  result += roll >= 12 ? " → 🎉 크리티컬!" : roll <= 2 ? " → 💀 펌블!" : "";
  return result;
}


// ======================= 이벤트 핸들러 =======================


client.login(process.env.DISCORD_BOT_TOKEN)
  .catch(error => {
    console.error('⚠️ 로그인 실패 상세:', error); // 추가
  });

// 벨로시티 시스템 정의
const VELOCITY_SYSTEM = {
  0: '零 정지한 시간',
  1: '壱 유령걸음',
  2: '弐 그림자걸음',
  3: '参 사고속도',
  4: '肆 음속',
  5: '伍 탄속',
  6: '陸 광속',
  7: '死地 초광속'
};

// 플롯 데이터 저장 파일
const PLOT_FILE = './plots.json';

// 플롯 데이터 로드하기
let plotData = {};
if (fs.existsSync(PLOT_FILE)) {
plotData = JSON.parse(fs.readFileSync(PLOT_FILE, 'utf-8'));
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  if (commandName === '플롯') {
      const speed = options.getInteger('속도');
      
      
      if (!plotData[user.id]) plotData[user.id] = [];

      plotData[user.id].push({
          speed,
          
          timestamp: Date.now()
      });
      
      fs.writeFileSync(PLOT_FILE, JSON.stringify(plotData, null, 2));

      await interaction.reply(`✅ 플롯이 등록되었습니다: 속도 ${speed}`);
  }

  if (commandName === '랜덤플롯') {
      const speed = Math.floor(Math.random() * 6) + 1;
      

      if (!plotData[user.id]) plotData[user.id] = [];

      plotData[user.id].push({
          speed,
          
          timestamp: Date.now()
      });

      fs.writeFileSync(PLOT_FILE, JSON.stringify(plotData, null, 2));

      await interaction.reply(`🎲 랜덤 플롯 등록: 속도 ${speed}`);
  }

  if (commandName === '플롯공개') {
      const allPlots = [];

      for (const userId in plotData) {
          plotData[userId].forEach(plot => {
              allPlots.push({ userId, ...plot });
          });
      }

      allPlots.sort((a, b) => b.speed - a.speed || a.timestamp - b.timestamp);

      const plotList = allPlots.map(plot => {
          const username = client.users.cache.get(plot.userId)?.tag || plot.userId;
          const velocityName = VELOCITY_SYSTEM[plot.speed] || `속도 ${plot.speed}`;
          return `**${velocityName}** - ${username}`;
      }).join('\n');
      

      await interaction.reply(plotList || '❌ 등록된 플롯이 없습니다.');
  }

  if (commandName === '플롯리셋') {
    if (plotData[user.id]) {
        delete plotData[user.id];
        fs.writeFileSync(PLOT_FILE, JSON.stringify(plotData, null, 2));
        await interaction.reply('✅ 플롯 데이터가 초기화되었습니다.');
    } else {
        await interaction.reply('❌ 초기화할 플롯 데이터가 없습니다.');
    }
}

});

/*
client.on('ready', async () => {
  const commands = [
      new SlashCommandBuilder()
          .setName('플롯')
          .setDescription('속도와 내용을 입력하여 플롯을 등록합니다.')
          .addIntegerOption(option =>
              option.setName('속도')
                  .setDescription('0 (정지된 시간) ~ 7 (초광속)')
                  .setRequired(true)
          ),
      new SlashCommandBuilder()
          .setName('랜덤플롯')
          .setDescription('랜덤한 속도로 플롯을 등록합니다.'),
      new SlashCommandBuilder()
          .setName('플롯공개')
          .setDescription('모든 플롯을 빠른 순서로 공개합니다.'),
          new SlashCommandBuilder()
          .setName('플롯리셋')
          .setDescription('내 플롯 데이터를 초기화합니다.')
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  

  await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
  );

  console.log('✅ 슬래시 명령어가 등록되었습니다.');
});

**/



client.on('messageCreate', async (message) => {
  try { // 모든 명령어를 감싸는 try 블록 시작
    if (message.author.bot) return;
    const args = parseArgs(message.content);
    if (!args.length) return;
    
    const command = args.shift().toLowerCase();
    const guildId = message.guild?.id || 'dm';
  
  if (command === '!도움') {
    const helpMessage = `
**[캐릭터 시트 관리]**
\`!시트입력 "이름" "특기1" "특기2" ... "유파" "전문분야" "계급" "인물" "배경"\`  
  • 캐릭터 시트를 생성합니다. (최소 5개 특기 필요)
\`!시트확인\`  
  • 입력된 캐릭터 시트를 확인합니다.

**[캐릭터 활성화/비활성화]**
\`!지정\`  
  • 해당 채널(서버 또는 DM)에서 캐릭터를 활성화합니다.
\`!지정해제\`  
  • 활성화된 캐릭터를 비활성화합니다.

  **[생명력 시스템]**
\`!HP±숫자\` - 생명력 증감 (예: !HP-3, !HP+2)
  • -1당 랜덤 분야 1개 상실
  • +1당 최근 상실 분야 1개 복구
  ※ 생명력 0시 모든 판정 목표치 12

**[판정 시스템]**
\`!판정 [특기명]\`  
  • 해당 특기로 판정을 수행합니다. (2d6 굴림, 목표치 산출 포함)

**[캐릭터 정보 설정]**
\`!유파 [메인유파] (하위유파...)\`  
  • 캐릭터의 유파를 설정합니다.  
  • 사용 가능한 유파: 하스바인군, 쿠라마신류, 하구레모노, 히라사카 기관, 사립 오토기 학원, 오니의 혈통
\`!전문분야 [분야명]\`  
  • 캐릭터의 전문분야를 설정합니다.  
  • 사용 가능한 분야: 기술, 체술, 인술, 모술, 전술, 요술
\`!계급 [계급명]\`  
  • 캐릭터의 계급을 설정합니다.  
  • 사용 가능한 계급: 쿠사, 하급닌자, 하급닌자 지휘관, 중급닌자, 중급닌자 지휘관, 상급닌자, 상급닌자 지휘관, 두령
\`!인물 [설명]\`  
  • 캐릭터의 인물 정보를 설정합니다.
\`!배경 [설명]\`  
  • 캐릭터의 배경 정보를 설정합니다.

**[인법 시스템]**
\`!인법추가 "이름" "타입" "특기" "간격" "코스트" "내용"\`  
  • 새로운 인법(협정)을 추가합니다.
\`![인법명]\`  
  • 등록된 인법의 상세 정보를 확인합니다. (예: \`!인법추가\`로 추가한 인법을 \`!인법명\`으로 조회)

**[플롯 시스템 (슬래시 명령어)]**
\`/플롯 [속도]\`  
  • 플롯을 등록합니다. 속도는 0 (정지한 시간)부터 7 (초광속)까지 지정할 수 있습니다.
\`/랜덤플롯\`  
  • 랜덤한 속도로 플롯을 등록합니다.
\`/플롯공개\`  
  • 등록된 모든 플롯을 속도(내림차순) 및 등록 순서(오름차순)로 공개합니다.

**[데이터 관리]**
  • 캐릭터 데이터는 \`data.json\`에 저장됩니다.
  • 플롯 데이터는 \`plots.json\`에 저장됩니다.
    `;
    message.reply(helpMessage);
  }
  

    // 1. 캐릭터 생성
    if (command === '!시트입력') {
      if (args.length < 6) throw '사용법: !시트입력 "이름" "특기1" "특기2" ...';

      const name = args.shift();
      const skills = args
        .filter(arg => Object.values(skillLists).flat().includes(arg))
        .slice(0, 7);

      if (skills.length < 5) throw `최소 5개 특기 필요 (현재 ${skills.length}개)`;

      const [clan, specialty, rank, person, background] = args.slice(skills.length);
      
      characterData[message.author.id] = {
        이름: name,
        특기: skills,
        생명력: {
          기본: 6,
          추가: 0 // ✅ 강건함 보정용
        },
        분야상실: [], // 추가
        인법: { 
          "접근전 공격": { 
            판정특기: "자유", 
            내용: "접근전 대미지 1점" 
          }
        },
        전문분야: specialty || '미정',
        유파: clan ? { main: clan, sub: [] } : null,
        계급: rank || '미정',
        인물: person || '미정',
        배경: background || '미정',
        활성: {}
      };

      saveData();
      message.reply(`✅ ${name} 생성 완료!\n특기: ${skills.join(', ')}`);
    }


    // 2. 판정 시스템
    else if (command === '!판정') {
      const user = characterData[message.author.id];
      if (!user?.활성?.[guildId]) throw '캐릭터를 먼저 지정하세요 (!지정)';
      if (!args.length) throw '사용법: !판정 [특기명]';
      
      const skill = args.join(' ');
      message.reply(rollSkill(message.author.id, skill));
    }


    // 3. 캐릭터 정보 확인// 
// ======================= !시트확인 명령어 처리 부분 =======================
else if (command === '!시트확인') {
  const user = characterData[message.author.id];
  if (!user) throw '등록된 캐릭터가 없습니다';

  // ▼ 생명력 기본값 처리 추가 ▼
  const 생명력 = user.생명력 || { 기본: 6, 추가: 0 };
  const 분야상실 = Array.isArray(user.분야상실) ? user.분야상실 : [];
  
  const lostFieldsDisplay = 분야상실.length === 6 ? 
    '모든 분야 상실‼' : 
    분야상실.join(', ') || '없음';

  // ▼ hpBars 계산 로직 수정 ▼
  const hpInfo = 
  `기본: ${생명력.기본} / 추가: ${생명력.추가}`;

  message.reply(`
### 🌟 「 ${user.이름 || "이름 없음"} 」
  🔸 ${user.유파?.main || "미설정"} ${user.유파?.sub?.length ?`: ${user.유파.sub.join(', ')}` : ''}의 ${user.계급 || "미설정"}
  🔸 전문분야: ${user.전문분야 || "미설정"}
  
  🔸 생명력: ${hpInfo}
  🔸 상실 분야: ${lostFieldsDisplay}
  🔸 보유 특기
> ${user.특기?.join(' · ') || "없음"}
  
  🔸 등록 인법
> ${user.인법 ? Object.keys(user.인법).join('\n> ') : "없음"}
  
  🔸 추가 정보
> 인물: ${user.인물 || "미설정"}
> 배경: ${user.배경 || "미설정"}
  `);
}
    // 4. 유파 설정
    else if (command === '!유파') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      if (args.length < 1) throw '사용법: !유파 [메인유파] (하위유파...)';

      const main = args[0];
      if (!CLANS.includes(main)) throw `6대 유파만 가능: ${CLANS.join(', ')}`;

      user.유파 = { main, sub: args.slice(1) };
      saveData();
      message.reply(`✅ 유파 설정: ${main}${user.유파.sub.length ? ` (하위: ${user.유파.sub.join(', ')})` : ''}`);
    }

    // 5. 전문분야 설정
    else if (command === '!전문분야') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      if (!args.length) throw '사용법: !전문분야 [분야명]';

      const field = args[0];
      if (!fields.includes(field)) throw `유효한 분야: ${fields.join(', ')}`;

      user.전문분야 = field;
      saveData();
      message.reply(`✅ 전문분야 설정: ${field}`);
    }

    // 6. 계급 설정
    else if (command === '!계급') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      if (!args.length) throw '사용법: !계급 [계급명]';

      const rank = args.join(' ');
      if (!Object.keys(RANKS).includes(rank)) throw `유효한 계급: ${Object.keys(RANKS).join(', ')}`;

      user.계급 = rank;
      saveData();
      message.reply(`✅ 계급 설정: ${rank}`);
    }

    // 7. 인물 설정
    else if (command === '!인물') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      if (!args.length) throw '사용법: !인물 [설명]';

      user.인물 = args.join(' ');
      saveData();
      message.reply('✅ 인물 정보 업데이트');
    }

    // 8. 배경 설정
    else if (command === '!배경') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      if (!args.length) throw '사용법: !배경 [설명]';

      user.배경 = args.join(' ');
      saveData();
      message.reply('✅ 배경 정보 업데이트');
    }

    // 9. 캐릭터 지정
    else if (command === '!지정') {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';

      user.활성 = user.활성 || {};
      user.활성[guildId] = true;
      saveData();
      message.reply(`✅ ${user.이름} 활성화 (${message.guild ? '서버' : 'DM'})`);
    }

    // 10. 캐릭터 지정 해제
    else if (command === '!지정해제') {
      const user = characterData[message.author.id];
      if (!user?.활성?.[guildId]) throw '활성화된 캐릭터 없음';

      delete user.활성[guildId];
      saveData();
      message.reply(`❌ 캐릭터 비활성화 (${message.guild ? '서버' : 'DM'})`);
    }

      
    else if (command === '!인법추가') {
      if (args.length < 6) throw '❌ 사용법: !인법추가 "이름" "타입" "특기" "간격" "코스트" "내용"';
    
      // ▼ 변수 선언을 먼저 해야 함
      const [name, type, skill, interval, cost, ...desc] = args; // 이동
    
      // 강건함 체크 (변수 선언 후 가능)
      if (name === '강건함') {
        const current = characterData[message.author.id].생명력.추가;
        characterData[message.author.id].생명력.추가 += current === 0 ? 2 : 1;
      }

      const newArt = {
        이름: name.replace(/"/g, ''),
        타입: type.replace(/"/g, ''),
        판정특기: skill.replace(/"/g, ''),
        간격: interval,
        코스트: parseInt(cost),
        내용: desc.join(' ').replace(/"/g, ''),
      };
      characterData[message.author.id].인법[name] = newArt;
      saveData();
      message.reply(`✅ 신규 인법 등록 완료!`);
      console.log(characterData[message.author.id].인법); // 추가된 인법 로그 출력
      saveData();
    } 

  
  // 인법 정보 출력: 사용법 예시 "!인법 인법이름"
  else if (command === '!인법') { // ← 독립된 else if
    if (args.length < 1) {
      return message.reply("사용법: !인법 인법이름");
    }
    const artName = args.join(" ");
    const user = characterData[message.author.id];
    if (!user || !user.인법 || !user.인법[artName]) {
      return message.reply("해당 인법 정보를 찾을 수 없습니다.");
    }
    const art = user.인법[artName];
    const output = `
** 🔸 ${art.이름}**
지정 특기: ${art.판정특기}        코스트: ${art.코스트}
타입: ${art.타입}                간격: ${art.간격}
설명: ${art.내용}
    `.trim();
    return message.reply(output);
  }

//HP 상승 코드
  else if (command.startsWith('!hp')) {
      const user = characterData[message.author.id];
      if (!user) throw '캐릭터를 먼저 생성하세요';
      
      // ▼ 생명력 객체 강제 초기화 ▼
      user.생명력 = user.생명력 || { 기본: 6, 추가: 0 };
      
      const match = message.content.match(/!hp([+-])(\d+)/i);
      if (!match) throw '사용법: !HP+3 또는 !HP-2';
    
    const [operator, amount] = [match[1], parseInt(match[2])];
    let result = '';
  
    if (operator === '+') {
      const recover = Math.min(amount, user.분야상실.length);
      user.분야상실.splice(-recover);
      user.생명력.기본 = Math.min(6, user.생명력.기본 + recover);
      result = `💙 생명력 +${recover} (현재: ${user.생명력.기본 + user.생명력.추가})`;
    } else {
      let damage = amount;
      // 추가 생명력 먼저 차감
      const bonusDmg = Math.min(damage, user.생명력.추가);
      user.생명력.추가 -= bonusDmg;
      damage -= bonusDmg;
  
      // 분야 상실 처리
      const lostFields = [];
      while (damage-- > 0 && user.생명력.기본 > 0) {
        const remain = fields.filter(f => !user.분야상실.includes(f));
        if (remain.length === 0) break;
        const lost = remain[Math.floor(Math.random()*remain.length)];
        user.분야상실.push(lost);
        lostFields.push(lost);
        user.생명력.기본--;
      }
      result = `💔 생명력 -${amount} (상실: ${lostFields.join(', ') || '없음'})`;
    

      saveData();
      message.reply(result);
    }
  }
  } catch (error) { // 모든 오류를 여기서 캐치
    console.error('메시지 처리 오류:', error);
    message.reply(`❌ 오류 발생: ${error.message || error}`);
  }
});

// ======================= 봇 실행 =======================
client.login(process.env.DISCORD_BOT_TOKEN)
  .catch(error => console.error('⚠ 로그인 실패:', error));

  