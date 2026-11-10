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

  const channelId = process.env.TICKET_CHANNEL_ID;
  if (!channelId) {
    console.error('❌ ไม่พบ TICKET_CHANNEL_ID ในไฟล์ .env');
    process.exit(1);
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    console.error(`❌ ไม่พบห้องปลายทางสำหรับ ID: ${channelId}`);
    process.exit(1);
  }

  const embed = new EmbedBuilder()
    .setColor(0x050505)
    .setTitle('IDONTKNOW — SERVICES & SUPPORT')
    .setDescription(
      '⋆ ˚ ติดต่อสอบถาม / สั่งซื้อบริการ\n' +
      '› กดปุ่มด้านล่างเพื่อเปิดห้องคุยกับแอดมิน\n' +
      '› พิมพ์ปัญหาหรือแพ็กเกจที่สนใจทิ้งไว้ได้เลยครับ'
    )
    .setImage('https://i.pinimg.com/originals/c7/23/7f/c7237fcc2343117c27da5978e511d796.gif')
    .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_open_ticket')
      .setLabel('SUPPORT & ORDER')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🖤')
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log(`✅ ส่งป้าย Ticket ลงห้อง #${channel.name} สำเร็จแล้ว`);
  process.exit();
});

client.login(process.env.DISCORD_TOKEN);