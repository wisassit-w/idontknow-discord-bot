require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`[BOT] ล็อกอินสำเร็จในชื่อ: ${client.user.tag}`);

  const channelId = process.env.VERIFY_CHANNEL_ID;
  if (!channelId) {
    console.error('❌ ไม่พบ VERIFY_CHANNEL_ID ใน .env');
    process.exit(1);
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    console.error(`❌ ไม่พบห้องปลายทางสำหรับ ID: ${channelId}`);
    process.exit(1);
  }

  const embed = new EmbedBuilder()
    .setColor(0x050505)
    .setTitle('IDONTKNOW — VERIFY SYSTEM')
    .setDescription(
      '⋆ ₊ **ยืนยันตัวตนเพื่อเข้าสู่เซิร์ฟเวอร์**\n\n' +
      'ยินดีต้อนรับสู่ **IDONTKNOW**\n' +
      'ศูนย์รวม Reshade Preset • FiveM Setting\n\n' +
      'กดปุ่ม **[ ยืนยันตัวตน ]** ด้านล่างเพื่อรับยศ\n\n' +
      '> ⋆ ซื้อ-ขาย และติดต่อสอบถามผ่านระบบ Ticket เท่านั้น'
    )
    .setImage('https://i.pinimg.com/originals/c7/23/7f/c7237fcc2343117c27da5978e511d796.gif')
    .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_verify_member')
      .setLabel('ยืนยันตัวตน')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🖤')
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log(`✅ ส่งป้าย Verify ลงห้อง #${channel.name} สำเร็จแล้ว`);
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);