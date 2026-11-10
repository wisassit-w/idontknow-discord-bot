const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder, 
  ChannelType, 
  PermissionFlagsBits,
  MessageFlags 
} = require('discord.js');
const { getBalance, deductBalance } = require('../services/userService');
const { buildTopupMethodSelectRow } = require('../components/shopPanel');
const { baseEmbed } = require('../utils/embeds');
const { handleAdminVerificationButton } = require('./freeRewardHandler');
const { getUserAffiliate } = require('../utils/affiliateManager');
const { deliverInternetNiran } = require('../services/orderDeliveryService');
const { sendOrderFeed } = require('../services/orderFeedService');

const CUSTOMER_ROLE_ID = process.env.CUSTOMER_ROLE_ID || '1548300156246556793';

const PRODUCT_ROLES = {
  item_dontcry_v1: '1550079711735062528',
  item_dontcry_v2: '1550441212186722434',
  item_dontcry_v3: '1550441218662600704',
  item_dontcry_v4: '1550441227663708200',
  item_dontcry_v5: '1550441283682701342',
  item_dontcry_v6: '',
  item_dontcry_v7: '',
  item_dontcry_v8: '',
  item_dontcry_v9: '',
  item_dontcry_v10: '',
  item_internet_niran: '1550441467749736498', 
  item_setting_idontknow: '1550441389769232454',
};

async function grantProductRoles(member, productKey) {
  const rolesToAdd = [];
  const productRoleId = PRODUCT_ROLES[productKey];

  if (productRoleId && !member.roles.cache.has(productRoleId)) {
    rolesToAdd.push(productRoleId);
  }
  if (CUSTOMER_ROLE_ID && !member.roles.cache.has(CUSTOMER_ROLE_ID)) {
    rolesToAdd.push(CUSTOMER_ROLE_ID);
  }

  if (rolesToAdd.length > 0) {
    await member.roles.add(rolesToAdd);
  }
}

async function handleButton(interaction) {
  const { customId, user, guild } = interaction;

  if (customId.startsWith('verify_')) {
    return handleAdminVerificationButton(interaction);
  }

  // 1. ปุ่มยืนยันตัวตน
  if (customId === 'btn_verify_member') {
    return handleVerifyMember(interaction);
  }

  // 2. ปุ่มเช็คเงิน
  if (customId === 'shop_btn_balance') {
    return handleCheckBalance(interaction);
  }

  // 3. ปุ่มเติมเงิน
  if (customId === 'shop_btn_topup') {
    return handleOpenTopupMenu(interaction);
  }

  // 4. ปุ่ม Affiliate
  if (customId === 'btn_open_my_affiliate') {
    const userProfile = getUserAffiliate(user.id);
    const targetCount = 5;
    const isUnlocked = userProfile.referralCount >= targetCount;

    const embed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: '✦  IDONTKNOW ・ ข้อมูลแนะนำเพื่อนของคุณ  ✦', 
        iconURL: user.displayAvatarURL() 
      })
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        '╭─── ✦ **รหัสแนะนำของคุณ**\n' +
        `\`\`\`\n${userProfile.code}\n\`\`\`\n` +
        `│ ✦ โค้ดส่วนลด : \`${userProfile.code}\`\n` +
        `│ ✦ เครดิตเงินคืนสะสม : **${userProfile.cashbackBalance} บาท**\n` +
        `│ ✦ เพื่อนที่ใช้โค้ดซื้อสำเร็จ : **${userProfile.referralCount} / ${targetCount} คน**\n` +
        `│ ✦ สิทธิ์ส่วนลด 15 บาท : **${isUnlocked ? '🟢 ปลดล็อกแล้ว (ได้รับส่วนลด 15 บาททันทีเมื่อกดซื้อ)' : `🔴 ยังไม่ปลดล็อก (ขาดอีก ${targetCount - userProfile.referralCount} คน)`}**\n` +
        '╰───────────────────────────────\n\n' +
        '› **วิธีใช้งาน** : ดับเบิลคลิกคัดลอกรหัสด้านบน ส่งให้เพื่อนนำไปกรอกตอนกดซื้อสินค้าเพื่อรับส่วนลด 5 บาททันที\n\n' +
        '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
      )
      .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' });

    return interaction.reply({
      content: `📌 โค้ดของคุณคือ: **${userProfile.code}** *(ดับเบิลคลิกตรงนี้เพื่อคัดลอกได้ทันที)*`,
      embeds: [embed],
      flags: [MessageFlags.Ephemeral],
    });
  }

  // 4.1 ปุ่มให้ลูกค้ากดเขียนรีวิวหลังงานเสร็จ
  if (customId === 'btn_customer_review') {
    const modal = new ModalBuilder()
      .setCustomId('modal_ticket_review')
      .setTitle('รีวิวบริการ IDONTKNOW');

    const ratingInput = new TextInputBuilder()
      .setCustomId('review_rating_input')
      .setLabel('ให้คะแนนความพึงพอใจ (พิมพ์ตัวเลข 1 - 5)')
      .setPlaceholder('เช่น 5')
      .setMinLength(1)
      .setMaxLength(1)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const commentInput = new TextInputBuilder()
      .setCustomId('review_comment_input')
      .setLabel('ข้อความรีวิวความประทับใจ')
      .setPlaceholder('เช่น บริการไวมาก แอดมินตอบเร็ว ภาพสวยจัด...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ratingInput),
      new ActionRowBuilder().addComponents(commentInput)
    );

    return await interaction.showModal(modal);
  }

  // 5. สั่งซื้อสินค้า Dontcry V1
  if (
    customId === 'buy_btn_dontcry_v1' || 
    customId === 'buy_item_dontcry_v1' || 
    customId === 'buy_item_item_dontcry_v1'
  ) {
    const member = await guild.members.fetch(user.id);
    const v1RoleId = PRODUCT_ROLES.item_dontcry_v1;

    if (v1RoleId && member.roles.cache.has(v1RoleId)) {
      return interaction.reply({
        content: `⚠️ คุณมีสินค้าชิ้นนี้และมียศ <@&${v1RoleId}> อยู่แล้ว สามารถเข้าไปดูไฟล์ในห้องดาวน์โหลดได้ทันทีครับ`,
        flags: [MessageFlags.Ephemeral]
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_checkout_dontcry_v1')
      .setTitle('สั่งซื้อ Dontcry V1 (29 บาท)');

    const codeInput = new TextInputBuilder()
      .setCustomId('referral_code_input')
      .setLabel('โค้ดแนะนำเพื่อน / โค้ดโปรโมชั่น (ถ้ามี)')
      .setPlaceholder('ใส่โค้ด IDONTOPEN ลด 10฿ (ไม่มีเว้นว่างไว้)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    return await interaction.showModal(modal);
  }

  // 5.1 สั่งซื้อสินค้า Internet Niran (229 บาท)
  if (
    customId === 'buy_btn_internet_niran' || 
    customId === 'buy_item_internet_niran' || 
    customId === 'buy_item_item_internet_niran'
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const ITEM_PRICE = 229;
    const currentBalance = getBalance(user.id) || 0;

    if (currentBalance < ITEM_PRICE) {
      return interaction.editReply({
        content: `❌ เครดิตของคุณไม่เพียงพอ!\n› เครดิตคงเหลือ: **${currentBalance} บาท**\n› ราคาสินค้า: **${ITEM_PRICE} บาท**\nกรุณากดเติมเงินก่อนทำรายการสั่งซื้อ`,
      });
    }

    try {
      if (typeof deductBalance === 'function') {
        deductBalance(user.id, ITEM_PRICE);
      }

      const member = await guild.members.fetch(user.id);
      await grantProductRoles(member, 'item_internet_niran');
      const ticketChannel = await deliverInternetNiran(guild, member);

      // ส่งแจ้งเตือนออเดอร์ใหม่เข้าห้อง Order Feed สาธารณะ
      await sendOrderFeed(guild, user, 'Internet Niran', ITEM_PRICE);

      return interaction.editReply({
        content: `✅ ชำระเงินสำเร็จ หักเครดิต **${ITEM_PRICE} บาท** เรียบร้อยแล้ว!\n› ปลดล็อกยศลูกค้าเรียบร้อยแล้ว\n› คีย์และไฟล์ติดตั้งพร้อมใช้งานอยู่ที่ห้อง: <#${ticketChannel.id}>`,
      });
    } catch (err) {
      console.error('Internet Delivery Purchase Error:', err);
      return interaction.editReply({
        content: '❌ เกิดข้อผิดพลาดในการเปิดห้องหรือตัดคีย์ กรุณาติดต่อทีมงาน',
      });
    }
  }

  // 5.2 สั่งซื้อ Setting IDONTKNOW (299 บาท)
  if (
    customId === 'buy_btn_setting_idontknow' || 
    customId === 'buy_item_setting_idontknow' || 
    customId === 'buy_item_item_setting_idontknow'
  ) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const ITEM_PRICE = 299;
    const currentBalance = getBalance(user.id) || 0;

    if (currentBalance < ITEM_PRICE) {
      return interaction.editReply({
        content: `❌ เครดิตของคุณไม่เพียงพอ!\n› เครดิตคงเหลือ: **${currentBalance} บาท**\n› ราคาสินค้า: **${ITEM_PRICE} บาท**\nกรุณากดเติมเงินก่อนทำรายการสั่งซื้อ`,
      });
    }

    try {
      if (typeof deductBalance === 'function') {
        deductBalance(user.id, ITEM_PRICE);
      }

      const member = await guild.members.fetch(user.id);
      await grantProductRoles(member, 'item_setting_idontknow');

      // ส่งแจ้งเตือนออเดอร์ใหม่เข้าห้อง Order Feed สาธารณะ
      await sendOrderFeed(guild, user, 'Setting IDONTKNOW', ITEM_PRICE);

      return interaction.editReply({
        content: `✅ ชำระเงินสำเร็จ หักเครดิต **${ITEM_PRICE} บาท** เรียบร้อยแล้ว!\n› ปลดล็อกยศเรียบร้อย ทีมงานจะติดต่อเริ่มดำเนินงานเซ็ตติ้งให้ทันที`,
      });
    } catch (err) {
      console.error('Setting Purchase Error:', err);
      return interaction.editReply({
        content: '❌ เกิดข้อผิดพลาด กรุณาติดต่อทีมงาน',
      });
    }
  }

  // 6. ปุ่มเปิด Ticket
  if (customId === 'btn_open_ticket') {
    return handleOpenTicket(interaction);
  }

  // 7. ปุ่มงานเสร็จแล้ว
  if (customId === 'btn_complete_ticket') {
    return handleCompleteTicket(interaction);
  }

  // 8. ปุ่มปิด/ลบ Ticket
  if (customId === 'btn_close_ticket') {
    return handleCloseTicket(interaction);
  }
}

async function handleCheckBalance(interaction) {
  const balance = getBalance(interaction.user.id) || 0;
  const embed = baseEmbed()
    .setTitle('💎 ยอดเงินคงเหลือ')
    .setDescription(`คุณมีเครดิตคงเหลือ **${balance.toLocaleString()} บาท**`);
  await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
}

async function handleOpenTopupMenu(interaction) {
  const embed = baseEmbed()
    .setTitle('💰 เติมเงินเข้าบัญชี')
    .setDescription('กรุณาเลือกช่องทางที่ต้องการเติมเงินจากเมนูด้านล่าง');
  await interaction.reply({
    embeds: [embed],
    components: [buildTopupMethodSelectRow()],
    flags: [MessageFlags.Ephemeral],
  });
}

async function handleVerifyMember(interaction) {
  const { member } = interaction;
  const roleId = process.env.VERIFY_ROLE_ID;

  if (!roleId) {
    return interaction.reply({
      content: '❌ ยังไม่ได้ตั้งค่า VERIFY_ROLE_ID ใน .env',
      flags: [MessageFlags.Ephemeral],
    });
  }

  if (member.roles.cache.has(roleId)) {
    return interaction.reply({
      content: `⚠️ คุณได้ยืนยันตัวตนและมียศ <@&${roleId}> อยู่แล้วครับ`,
      flags: [MessageFlags.Ephemeral],
    });
  }

  try {
    await member.roles.add(roleId);
    return interaction.reply({
      content: `✅ ยืนยันตัวตนสำเร็จ! ได้รับยศ <@&${roleId}> เรียบร้อยแล้ว ยินดีต้อนรับสู่ IDONTKNOW ครับ`,
      flags: [MessageFlags.Ephemeral],
    });
  } catch (error) {
    console.error('Error adding verify role:', error);
    return interaction.reply({
      content: '❌ เกิดข้อผิดพลาดในการให้ยศ (โปรดตรวจสอบว่าบทบาทของบอทอยู่สูงกว่ายศที่จะแจกใน Server Settings > Roles)',
      flags: [MessageFlags.Ephemeral],
    });
  }
}

async function handleOpenTicket(interaction) {
  const { guild, user } = interaction;

  const existingChannel = guild.channels.cache.find(
    (c) => c.topic === user.id && c.name.startsWith('ticket-')
  );

  if (existingChannel) {
    return interaction.reply({
      content: `❌ คุณมีห้องที่เปิดไว้อยู่แล้ว: ${existingChannel}`,
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  const categoryId = process.env.TICKET_CATEGORY_ID;
  const staffRoleIds = process.env.STAFF_ROLE_ID 
    ? process.env.STAFF_ROLE_ID.trim().split(/\s+/) 
    : [];

  const balance = getBalance(user.id) || 0;

  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
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

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      parent: categoryId || null,
      topic: user.id,
      permissionOverwrites,
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setTitle('IDONTKNOW — SUPPORT DESK')
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `สวัสดีคุณ ${user}\n` +
        'แอดมินได้รับคำขอของคุณแล้ว กรุณาพิมพ์รายละเอียดปัญหา หรือสอบถามเรื่องที่ต้องการทิ้งไว้ได้เลยครับ\n\n' +
        '╭─── ✦ **ข้อมูลผู้เปิดตั๋ว**\n' +
        `│ ✦ ลูกค้า : ${user.tag} (\`${user.id}\`)\n` +
        `│ ✦ เครดิตในระบบ : **${balance} บาท**\n` +
        '╰───────────────────────────────\n\n' +
        '› เมื่อแอดมินส่งมอบงานเรียบร้อยแล้ว ห้องนี้จะถูกย้ายเข้าหมวดงานเสร็จสิ้น\n\n' +
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
      )
      .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_complete_ticket')
        .setLabel('งานเสร็จแล้ว')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_close_ticket')
        .setLabel('ลบห้อง')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );

    const staffPings = staffRoleIds.map((id) => `<@&${id}>`).join(' ');
    const pingMessage = staffPings ? `${user} | ${staffPings}` : `${user}`;

    await ticketChannel.send({ content: pingMessage, embeds: [ticketEmbed], components: [row] });

    return interaction.editReply({
      content: `✅ เปิดห้องติดต่อสำเร็จแล้ว: ${ticketChannel}`,
    });
  } catch (error) {
    console.error('Error creating ticket channel:', error);
    return interaction.editReply({
      content: '❌ เกิดข้อผิดพลาดในการสร้างห้อง Ticket กรุณาติดต่อแอดมินโดยตรง',
    });
  }
}

/** ฟังก์ชันงานเสร็จแล้ว -> ย้ายเข้าหมวด Complete พร้อมปุ่มเขียนรีวิว */
async function handleCompleteTicket(interaction) {
  const { member, channel, user } = interaction;

  const staffRoleIds = process.env.STAFF_ROLE_ID 
    ? process.env.STAFF_ROLE_ID.trim().split(/\s+/) 
    : [];

  const isStaff = staffRoleIds.some((roleId) => member.roles.cache.has(roleId)) 
    || member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isStaff) {
    return interaction.reply({
      content: '❌ เฉพาะแอดมินหรือทีมงานเท่านั้น',
      flags: [MessageFlags.Ephemeral],
    });
  }

  const completeCategoryId = process.env.TICKET_COMPLETE_CATEGORY_ID;
  if (!completeCategoryId) {
    return interaction.reply({
      content: '❌ ไม่พบ TICKET_COMPLETE_CATEGORY_ID ในไฟล์ .env',
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.deferReply();

  try {
    const ownerId = channel.topic;
    await channel.setParent(completeCategoryId, { lockPermissions: false });

    const cleanName = channel.name
      .replace('ticket-', '')
      .replace(/^done-/, '')
      .replace(/^[✅🟢]・?/, '');

    await channel.setName(`✅・done-${cleanName}`);

    if (ownerId) {
      await channel.permissionOverwrites.edit(ownerId, {
        SendMessages: false,
        AttachFiles: false,
      });
    }

    const completeEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        '**COMPLETED ORDER**\n' +
        `› ส่งมอบบริการเรียบร้อยแล้ว โดย ${user}\n` +
        '› สถานะ: **ปิดการตอบกลับ**\n\n' +
        '💬 **ขอความกรุณาลูกค้าช่วยเขียนรีวิวความพึงพอใจ เพื่อเป็นกำลังใจให้ร้านค้าด้วยนะครับ** 🖤\n\n' +
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
      )
      .setFooter({ text: 'IDONTKNOW OFFICIAL • Est. 2026' });

    // เพิ่มปุ่ม ⭐ เขียนรีวิวบริการ พร้อมปุ่มลบตั๋ว
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_customer_review')
        .setLabel('เขียนรีวิวบริการ')
        .setEmoji('⭐')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_close_ticket')
        .setLabel('CLOSE TICKET')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.editReply({ embeds: [completeEmbed], components: [actionRow] });
  } catch (error) {
    console.error('Error completing ticket:', error);
    return interaction.editReply({
      content: '❌ เกิดข้อผิดพลาดในการย้ายหมวดหมู่',
    });
  }
}

async function handleCloseTicket(interaction) {
  const { member, channel } = interaction;

  const staffRoleIds = process.env.STAFF_ROLE_ID 
    ? process.env.STAFF_ROLE_ID.trim().split(/\s+/) 
    : [];

  const isStaff = staffRoleIds.some((roleId) => member.roles.cache.has(roleId)) 
    || member.permissions.has(PermissionFlagsBits.Administrator);

  if (!isStaff) {
    return interaction.reply({
      content: '❌ คุณไม่มีสิทธิ์ลบห้องนี้ (เฉพาะแอดมินหรือทีมงานเท่านั้น)',
      flags: [MessageFlags.Ephemeral],
    });
  }

  await interaction.reply('🔒 แอดมินยืนยันการลบ ระบบกำลังลบห้องนี้ใน 5 วินาที...');

  setTimeout(async () => {
    try {
      await channel.delete();
    } catch (err) {
      console.error('Error deleting ticket channel:', err);
    }
  }, 5000);
}

module.exports = { handleButton, grantProductRoles, PRODUCT_ROLES, CUSTOMER_ROLE_ID };