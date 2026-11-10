const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TIKTOK_URL = 'https://www.tiktok.com/@n1ran36?is_from_webapp=1&sender_device=pc';
const QUEST_CHANNEL_ID = process.env.QUEST_CHANNEL_ID || '1550100795251499149';
const PROOF_CHANNEL_ID = process.env.FREE_REWARD_CHANNEL_ID || '1550100827765473400';
const REWARD_ROLE_ID = process.env.FREE_REWARD_ROLE_ID || '1550100479785312316';

client.once('ready', async () => {
  console.log(`[Quest] Logged in as ${client.user.tag}`);
  
  const channel = client.channels.cache.get(QUEST_CHANNEL_ID) || await client.channels.fetch(QUEST_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error('❌ ไม่พบห้องเควสต์ กรุณาเช็ค QUEST_CHANNEL_ID');
    process.exit(1);
  }

  const questEmbed = new EmbedBuilder()
    .setColor(0x050505)
    .setAuthor({ 
      name: '✦  COMMUNITY QUEST ・ FREE ACCESS PASS  ✦', 
      iconURL: client.user.displayAvatarURL() 
    })
    .setDescription(
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
      'กิจกรรมพิเศษสำหรับสมาชิก **IDONTKNOW Official**\n' +
      'เพียงทำภารกิจติดตามช่องทางหลัก รับยศพิเศษปลดล็อกห้องลับฟรีทันที\n\n' +
      '╭─── ✦ **กติกาและขั้นตอนการเข้าร่วม**\n' +
      '│ 1. กดปุ่ม **`Follow TikTok`** ด้านล่างเพื่อไปยังหน้าโปรไฟล์\n' +
      '│ 2. กด **ติดตาม (Follow)** ช่อง `@n1ran36`\n' +
      '│ 3. แคปเจอร์ภาพหน้าจอหลักฐานที่เห็นสถานะการติดตามชัดเจน\n' +
      `│ 4. ส่งภาพหลักฐานลงในห้อง <#${PROOF_CHANNEL_ID}>\n` +
      '╰───────────────────────────────\n\n' +
      '› **รางวัลที่จะได้รับ** :\n' +
      `╰┈➤ ยศ <@&${REWARD_ROLE_ID}> (ปลดล็อกห้องดาวน์โหลดฟรี)\n\n' +
      '✧ *เมื่อแอดมินตรวจสอบความถูกต้องแล้ว ระบบจะมอบยศให้อัตโนมัติทันที*\n\n' +
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
    )
    .setFooter({ text: 'IDONTKNOW OFFICIAL • House of Darkness' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Follow TikTok (@n1ran36)')
      .setStyle(ButtonStyle.Link)
      .setURL(TIKTOK_URL)
      .setEmoji('🖤')
  );

  await channel.send({ embeds: [questEmbed], components: [row] });
  console.log('✅ ส่งการ์ดเควสต์ TikTok เรียบร้อยแล้ว!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);