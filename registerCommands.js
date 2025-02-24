const { registerCommands } = require('./registerCommands');

client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    await registerCommands(client.user.id, commands); // 슬래시 명령어 등록 실행
});