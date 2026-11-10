const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PAYMENT_CHANNEL_ID = '1548291605058818149';
const QR_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1548295045583609917/1550192814883606528/Instagram_Post.png?ex=6aad7110&is=6aac1f90&hm=847d620480cecc434a3050443a4b37c897a73cec3286b45e7fc4875d8cdbcd5d&';

client.once('clientReady', async () => {
  console.log(`[Payment Panel] Logged in as ${client.user.tag}`);

  const channel = client.channels.cache.get(PAYMENT_CHANNEL_ID) 
    || await client.channels.fetch(PAYMENT_CHANNEL_ID).catch(() => null);

  if (!channel) {
    console.error('❌ ไม่พบห้อง payment');
    process.exit(1);
  }

  const paymentEmbed = new EmbedBuilder()
    .setColor(0x050505)
    .setTitle('! Payment !')
    .setDescription(
`• **K-Bank** : \`1581674232\`
• **Wallet** : \`0806920637\` (โอน Wallet +10 บาท)
• **ตรวจสอบเลขบัญชีหรือชื่อบัญชีให้ละเอียดก่อนชำระเงิน**`
    )
    .setImage(QR_IMAGE_URL);

  await channel.send({
    embeds: [paymentEmbed]
  });

  console.log('✅ ส่งป้ายชำระเงินเรียบร้อยแล้ว!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);