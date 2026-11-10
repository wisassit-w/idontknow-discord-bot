const { 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getAvailableKey } = require('./keyService');

const productsFilePath = path.join(__dirname, '../../data/products.json');
const LOW_STOCK_THRESHOLD = 2; // กำหนดเกณฑ์แจ้งเตือนเมื่อเหลือต่ำกว่าหรือเท่ากับ 2 คีย์

async function deliverInternetNiran(guild, member) {
  const licenseKey = getAvailableKey(member.id);

  // ตรวจสอบสต็อกคงเหลือใน data/products.json เพื่อแจ้งเตือนแอดมิน
  await checkStockAndAlert(guild);

  const categoryId = process.env.TICKET_CATEGORY_ID;
  const staffRoleIds = process.env.STAFF_ROLE_ID 
    ? process.env.STAFF_ROLE_ID.trim().split(/\s+/) 
    : [];

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  staffRoleIds.forEach((roleId) => {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  });

  // 1. สร้างห้องตั๋วสำหรับออเดอร์นี้
  const ticketChannel = await guild.channels.create({
    name: `order-${member.user.username}`,
    type: ChannelType.GuildText,
    parent: categoryId || null,
    topic: member.id,
    permissionOverwrites,
  });

  // กรณีคีย์ในสต็อกหมด
  if (!licenseKey) {
    await ticketChannel.send({
      content: `⚠️ ${member} สั่งซื้อสำเร็จ แต่คีย์ในสต็อกชั่วคราวหมด กรุณารอแอดมินส่งคีย์ให้ทางนี้ครับ!`,
    });
    return ticketChannel;
  }

  // 2. ป้ายส่งมอบคีย์สไตล์ Dark Minimal
  const deliveryEmbed = new EmbedBuilder()
    .setColor(0x050505)
    .setTitle('⚡ IDONTKNOW — INTERNET NIRAN DELIVERY')
    .setDescription(
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
      `ขอบคุณสำหรับการสั่งซื้อคุณ ${member}!\n` +
      'ระบบทำการตัดคีย์และจัดเตรียมไฟล์ติดตั้งให้คุณเรียบร้อยแล้ว\n\n' +
      '╭─── ✦ **ข้อมูลไลเซนส์ของคุณ (LICENSE KEY)**\n' +
      `\`\`\`\n${licenseKey}\n\`\`\`\n` +
      `│ ✦ ลูกค้า : ${member.user.tag} (\`${member.id}\`)\n` +
      `│ ✦ สถานะ : **พร้อมใช้งาน (Active)**\n` +
      '╰───────────────────────────────\n\n' +
      '╭─── ✦ **ขั้นตอนการใช้งาน**\n' +
      '│ 1. ดาวน์โหลดไฟล์ติดตั้งจากปุ่มด้านล่าง\n' +
      '│ 2. แตกไฟล์แล้วเปิดโปรแกรมขึ้นมา\n' +
      '│ 3. นำ License Key ด้านบนไปกรอกในโปรแกรม\n' +
      '╰───────────────────────────────\n\n' +
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
    )
    .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' })
    .setTimestamp();

  // ปุ่มดาวน์โหลดไฟล์และปุ่มปิดตั๋ว
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('ดาวน์โหลดโปรแกรม')
      .setEmoji('📥')
      .setStyle(ButtonStyle.Link)
      .setURL('https://your-download-link.com'), // ใส่ลิงก์ดาวน์โหลดไฟล์ที่นี่
    new ButtonBuilder()
      .setCustomId('btn_complete_ticket')
      .setLabel('งานเสร็จสิ้น')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  await ticketChannel.send({
    content: `${member} ระบบจัดส่งสินค้าของคุณเรียบร้อยแล้ว!`,
    embeds: [deliveryEmbed],
    components: [row],
  });

  return ticketChannel;
}

/** ฟังก์ชันตรวจสอบจำนวนสต็อกคงเหลือและแจ้งเตือนแอดมินอัตโนมัติ */
async function checkStockAndAlert(guild) {
  try {
    if (!fs.existsSync(productsFilePath)) return;

    const productsData = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

    // ค้นหาสินค้า Internet Niran
    let targetProduct = null;
    for (const cat of productsData) {
      const found = cat.products.find(p => p.id === 'item_internet_niran');
      if (found) {
        targetProduct = found;
        break;
      }
    }

    if (!targetProduct || !Array.isArray(targetProduct.stock)) return;

    const remainingStock = targetProduct.stock.length;

    // ถ้าสต็อกเหลือมากกว่าเกณฑ์ที่ตั้งไว้ ไม่ต้องแจ้งเตือน
    if (remainingStock > LOW_STOCK_THRESHOLD) return;

    const logChannelId = process.env.LOG_CHANNEL_ID;
    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId) || 
                       await guild.channels.fetch(logChannelId).catch(() => null);

    if (!logChannel) return;

    const staffRoleIds = process.env.STAFF_ROLE_ID 
      ? process.env.STAFF_ROLE_ID.trim().split(/\s+/) 
      : [];
    const staffPings = staffRoleIds.map((id) => `<@&${id}>`).join(' ');

    const alertEmbed = new EmbedBuilder()
      .setColor(remainingStock === 0 ? 0xff0000 : 0xffaa00)
      .setTitle(remainingStock === 0 ? '🚨 [EMERGENCY] คีย์ในสต็อกหมดแล้ว!' : '⚠️ [ALERT] สต็อกคีย์ใกล้หมดแล้ว!')
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `› **สินค้า** : **${targetProduct.name}**\n` +
        `› **สต็อกคงเหลือปัจจุบัน** : **${remainingStock} คีย์**\n` +
        `› **คำแนะนำ** : ${remainingStock === 0 
          ? '❌ คีย์หมดเกลี้ยงแล้ว ลูกค้าที่ซื้อถัดไปจะไม่ได้คีย์อัตโนมัติ กรุณาเติมคีย์เข้า `products.json` ทันที!' 
          : '⚠️ สต็อกเหลือน้อยมาก กรุณาเตรียมนำคีย์มาเติมเข้าระบบ'}\n\n` +
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
      )
      .setFooter({ text: 'IDONTKNOW BOT • Low Stock Monitor' })
      .setTimestamp();

    await logChannel.send({
      content: staffPings ? `🔔 **แจ้งเตือนทีมงาน** ${staffPings}` : '🔔 **แจ้งเตือนทีมงาน**',
      embeds: [alertEmbed],
    });

  } catch (error) {
    console.error('[Low Stock Alert Error]:', error);
  }
}

module.exports = { deliverInternetNiran };