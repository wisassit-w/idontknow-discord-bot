const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ID ห้อง affiliate
const AFFILIATE_CHANNEL_ID = '1550199231632113736';

client.once('clientReady', async () => {
  console.log(`[Affiliate Panel] Logged in as ${client.user.tag}`);

  const channel = client.channels.cache.get(AFFILIATE_CHANNEL_ID)
    || await client.channels.fetch(AFFILIATE_CHANNEL_ID).catch(() => null);

  if (!channel) {
    console.error('❌ ไม่พบห้อง AFFILIATE_CHANNEL_ID');
    process.exit(1);
  }

  const embed = new EmbedBuilder()
    .setColor(0x050505)
    .setAuthor({ 
      name: '✦  IDONTKNOW STORE ・ AFFILIATE & REWARDS  ✦',
      iconURL: client.user.displayAvatarURL()
    })
    .setDescription(
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
      '╭─── ✦ **ระบบสะสมแต้ม & แนะนำเพื่อน**\n' +
      '│ ✦ รับโค้ดส่วนลดประจำตัวไปแจกให้เพื่อนใช้ในร้าน\n' +
      '│ ✦ เพื่อนได้รับส่วนลดทันที **5 บาท** เมื่อสั่งซื้อสินค้า\n' +
      '│ ✦ คุณได้รับเครดิตเงินคืนเข้ากระเป๋า **+5 บาท / คน**\n' +
      '╰───────────────────────────────\n\n' +
      '🎁 **ภารกิจพิเศษ (Milestone)** :\n' +
      '› ชวนเพื่อนมาใช้โค้ดซื้อสินค้าครบ **5 คน**\n' +
      '› **รับสิทธิ์ส่วนลดพิเศษ 15 บาท ในการสั่งซื้อทันที!**\n\n' +
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
    )
    .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_open_my_affiliate')
      .setLabel('ดูโค้ดของฉัน & เช็คแต้มสะสม')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎟️')
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });

  console.log('✅ ส่งป้ายระบบ Affiliate เข้าห้องเรียบร้อยแล้ว!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);