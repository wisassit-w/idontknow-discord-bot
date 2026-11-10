const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOPUP_CHANNEL_ID = '1548291605058818149'; // ID ห้องสำหรับวางเมนูเติมเงิน

client.once('clientReady', async () => {
  console.log(`[Topup Menu] Logged in as ${client.user.tag}`);

  const channel = client.channels.cache.get(TOPUP_CHANNEL_ID)
    || await client.channels.fetch(TOPUP_CHANNEL_ID).catch(() => null);

  if (!channel) {
    console.error('❌ ไม่พบห้องเติมเงิน');
    process.exit(1);
  }

  const menuEmbed = new EmbedBuilder()
    .setColor(0x111214)
    .setTitle('💰 เติมเงินเข้าบัญชี')
    .setDescription('กรุณาเลือกช่องทางที่ต้องการเติมเงินจากเมนูด้านล่าง')
    .setFooter({ text: 'IDONTKNOW SHOP • Auto Delivery 24/7' });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_payment_method')
    .setPlaceholder('เลือกช่องทางการชำระเงิน...')
    .addOptions(
      {
        label: 'โอนผ่านบัญชีธนาคาร / QR Code',
        description: 'ธนาคารกสิกรไทย (K-Bank) และระบบ PromptPay',
        value: 'pay_bank',
        emoji: '🏦',
      },
      {
        label: 'ทรูมันนี่ วอลเล็ท (TrueMoney)',
        description: 'โอนผ่าน TrueMoney Wallet (มีค่าธรรมเนียม +10 บาท)',
        value: 'pay_truemoney',
        emoji: '📱',
      }
    );

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await channel.send({
    embeds: [menuEmbed],
    components: [row],
  });

  console.log('✅ ส่งเมนูเติมเงินสำเร็จ!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);