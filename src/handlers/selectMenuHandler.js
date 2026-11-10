const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require('discord.js');
const productsData = require('../../data/products.json');

const QR_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1548295045583609917/1550192814883606528/Instagram_Post.png?ex=6aad7110&is=6aac1f90&hm=847d620480cecc434a3050443a4b37c897a73cec3286b45e7fc4875d8cdbcd5d&';

async function handleSelectMenu(interaction) {
  const { customId, values, guild } = interaction;

  // 1. ดักจับเมื่อผู้ใช้เลือกช่องทางเติมเงิน
  if (customId === 'topup_method' || customId === 'select_topup_method' || customId === 'select_payment_method' || customId.includes('topup')) {
    const selectedMethod = values[0];
    const slipChannelId = process.env.SLIP_CHANNEL_ID || '1550076805845753926';

    if (selectedMethod.includes('bank') || selectedMethod.includes('promptpay') || selectedMethod.includes('slip')) {
      const bankEmbed = new EmbedBuilder()
        .setColor(0x050505)
        .setAuthor({ 
          name: '✦  ช่องทางการชำระเงิน ・ ธนาคาร / PROMPTPAY  ✦', 
          iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setDescription(
          '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
          '╭─── ✦ **รายละเอียดบัญชีธนาคาร**\n' +
          `│ ✦ เลขที่บัญชี : \`${process.env.BANK_ACCOUNT_NUMBER || '1581674232'}\` *(คลิกเพื่อคัดลอก)*\n` +
          `│ ✦ ชื่อบัญชี : **${process.env.BANK_ACCOUNT_NAME || 'วิเศษสิทธิ์ วินสน'}**\n` +
          '╰───────────────────────────────\n\n' +
          '› `ขั้นตอนการเติมเงิน` :\n' +
          '1. โอนเงินเข้าบัญชีตามยอดที่ต้องการ\n' +
          `2. นำภาพสลิปโอนเงินไปส่งที่ห้อง <#${slipChannelId}>\n` +
          '3. ระบบ SlipOK จะตรวจสอบและเพิ่มเครดิตให้อัตโนมัติทันที 24 ชม.\n\n' +
          '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
        )
        .setImage(QR_IMAGE_URL)
        .setFooter({ text: 'IDONTKNOW OFFICIAL • House of Darkness' })
        .setTimestamp();

      const slipButtonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('ไปยังห้องส่งสลิป')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${slipChannelId}`)
          .setEmoji('🧾')
      );

      await interaction.reply({ embeds: [bankEmbed], components: [slipButtonRow], flags: [MessageFlags.Ephemeral] });
      try { await interaction.message.edit({ components: interaction.message.components }); } catch (err) {}
      return;
    }

    if (selectedMethod.includes('truemoney') || selectedMethod.includes('wallet') || selectedMethod.includes('voucher')) {
      const modal = new ModalBuilder()
        .setCustomId('topup_truemoney_modal')
        .setTitle('เติมเงินผ่านซอง TrueMoney');

      const voucherInput = new TextInputBuilder()
        .setCustomId('voucher_link')
        .setLabel('ลิงก์ซองของขวัญ (TrueMoney)')
        .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxx')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(voucherInput));
      await interaction.showModal(modal);
      try { await interaction.message.edit({ components: interaction.message.components }); } catch (err) {}
      return;
    }
  }

  // 2. ดักจับเมื่อเลือกหมวดหมู่ (ดึงสินค้าในหมวดนั้นๆ จาก JSON อัตโนมัติ)
  if (customId === 'select_category' || customId === 'shop_select_category') {
    const categoryId = values[0];
    const category = productsData.find(c => c.id === categoryId);

    if (!category) {
      return interaction.reply({ content: '❌ ไม่พบหมวดหมู่นี้ในระบบ', flags: [MessageFlags.Ephemeral] });
    }

    const options = category.products.map(p => ({
      label: p.name,
      description: `ราคา ${p.price} บาท | ${p.description ? p.description.slice(0, 45) : ''}`,
      value: p.id,
      emoji: p.emoji || '📦'
    }));

    const categoryEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: `✦  IDONTKNOW STORE ・ ${category.name.toUpperCase()}  ✦`, 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `╭─── ✦ **เลือกสินค้าในหมวด ${category.name}**\n` +
        '│ ✦ เลือกสินค้าที่ต้องการสั่งซื้อจากเมนูด้านล่าง\n' +
        '│ ✦ ระบบจะตัดเงินและส่งมอบสินค้าให้อัตโนมัติทันที\n' +
        '╰───────────────────────────────\n\n' +
        '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧'
      );

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('shop_select_product_dynamic')
        .setPlaceholder(`⌕  [ เลือกสินค้าในหมวด ${category.name} ]`)
        .addOptions(options)
    );

    await interaction.reply({ embeds: [categoryEmbed], components: [selectMenu], flags: [MessageFlags.Ephemeral] });
    try { await interaction.message.edit({ components: interaction.message.components }); } catch (err) {}
    return;
  }

  // 3. ดักจับเมื่อเลือกตัวสินค้า (สร้างหน้ารายละเอียดและปุ่มซื้ออัตโนมัติ)
  if (customId === 'shop_select_product_dynamic' || customId === 'select_setting_item' || customId === 'select_reshade_item') {
    const productId = values[0];
    
    // ค้นหาสินค้าจากทุกลิสต์ใน JSON
    let product = null;
    for (const cat of productsData) {
      const found = cat.products.find(p => p.id === productId);
      if (found) { product = found; break; }
    }

    if (!product) {
      return interaction.reply({ content: '❌ ไม่พบข้อมูลสินค้านี้', flags: [MessageFlags.Ephemeral] });
    }

    const roleTag = product.roleId ? `<@&${product.roleId}>` : 'ยศประจำสินค้า';
    let desc = 
      '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
      `╰┈➤ **สินค้า : ${product.name}**\n` +
      `› \`ราคา\` : **${product.price} บาท**\n` +
      `› \`รายละเอียด\` : ${product.description || '-'}\n` +
      `› \`สิทธิ์\` : ปลดล็อกยศ ${roleTag} พร้อมห้องดาวน์โหลดทันที\n\n`;

    if (product.clipUrl) {
      desc += `🎬 **คลิปตัวอย่าง** : [คลิกดูคลิปตัวอย่าง](${product.clipUrl})\n\n`;
    }

    desc += '✧ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✧';

    const itemEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: `✦  CONFIRM ORDER ・ ${product.name.toUpperCase()}  ✦`,
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setDescription(desc)
      .setFooter({ text: 'IDONTKNOW STORE • Automated Delivery' });

    const buyButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_item_${product.id}`) // ปุ่มจะส่งไอดีสินค้าไปด้วย เช่น buy_item_item_dontcry_v2
        .setLabel(`ยืนยันการซื้อ (${product.price} บาท)`)
        .setStyle(ButtonStyle.Success)
        .setEmoji('🛒')
    );

    return interaction.reply({ embeds: [itemEmbed], components: [buyButton], flags: [MessageFlags.Ephemeral] });
  }
}

module.exports = { handleSelectMenu };