const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { getCategories, getShopStats } = require('../services/productService');

/**
 * สร้าง Embed หลักของแผงร้านค้า (Dark Minimal)
 * แสดงสถิติ: จำนวนหมวดหมู่ / สินค้า / สต็อกทั้งหมด
 */
function buildShopEmbed() {
  const stats = getShopStats();

  return baseEmbed()
    .setTitle('🛒 IDONTKNOW SHOP')
    .setDescription(
      [
        'ร้านค้าอัตโนมัติ เปิดขาย 24 ชั่วโมง',
        'เลือกหมวดหมู่จากเมนูด้านล่างเพื่อดูสินค้า',
      ].join('\n')
    )
    .addFields(
      { name: '📂 หมวดหมู่', value: `\`${stats.totalCategories}\``, inline: true },
      { name: '📦 สินค้าทั้งหมด', value: `\`${stats.totalProducts}\``, inline: true },
      { name: '📊 สต็อกคงเหลือ', value: `\`${stats.totalStock}\``, inline: true }
    );
}

/** สร้าง Dropdown เลือกหมวดหมู่สินค้า จากไฟล์ products.json */
function buildCategorySelectRow() {
  const categories = getCategories();

  const options = categories.map((category) => ({
    label: category.name,
    description: `สินค้าในหมวดนี้ ${category.products.length} รายการ`,
    value: category.id,
    emoji: category.emoji,
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('shop_select_category')
    .setPlaceholder('📂 เลือกหมวดหมู่สินค้า')
    .addOptions(options.length > 0 ? options : [{ label: 'ยังไม่มีหมวดหมู่', value: 'none' }]);

  return new ActionRowBuilder().addComponents(selectMenu);
}

/** สร้างแถวปุ่ม: เติมเงินเข้าบัญชี / เช็คเงิน */
function buildActionButtonsRow() {
  const topupButton = new ButtonBuilder()
    .setCustomId('shop_btn_topup')
    .setLabel('เติมเงินเข้าบัญชี')
    .setEmoji('💰')
    .setStyle(ButtonStyle.Success);

  const balanceButton = new ButtonBuilder()
    .setCustomId('shop_btn_balance')
    .setLabel('เช็คเงิน')
    .setEmoji('💎')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(topupButton, balanceButton);
}

/**
 * รวมทุกอย่างเป็น payload พร้อมส่ง (ใช้ตอน /setup-shop และตอน refresh หลังซื้อของ)
 */
function buildShopPanelPayload() {
  return {
    embeds: [buildShopEmbed()],
    components: [buildCategorySelectRow(), buildActionButtonsRow()],
  };
}

/** Dropdown เลือกช่องทางเติมเงิน (แสดงหลังกดปุ่ม 💰 เติมเงินเข้าบัญชี) */
function buildTopupMethodSelectRow() {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('topup_select_method')
    .setPlaceholder('เลือกช่องทางเติมเงิน')
    .addOptions([
      {
        label: 'TrueMoney Wallet (ซองอั่งเปา)',
        description: 'วางลิงก์ซองของขวัญ/อั่งเปา',
        value: 'truemoney',
        emoji: '🧧',
      },
      {
        label: 'โอนผ่านบัญชีธนาคาร',
        description: 'แนบสลิปโอนเงินเพื่อตรวจสอบอัตโนมัติ',
        value: 'bank_transfer',
        emoji: '🏦',
      },
    ]);

  return new ActionRowBuilder().addComponents(selectMenu);
}

/** Dropdown แสดงรายการสินค้าในหมวดหมู่ที่เลือก */
function buildProductSelectRow(category) {
  const options = category.products.map((product) => ({
    label: `${product.name} - ${product.price} บาท`,
    description: `คงเหลือ ${product.stock.length} ชิ้น`,
    value: product.id,
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('shop_select_product')
    .setPlaceholder('📦 เลือกสินค้าที่ต้องการซื้อ')
    .addOptions(options.length > 0 ? options : [{ label: 'สินค้าหมดสต็อกทั้งหมวด', value: 'none' }]);

  return new ActionRowBuilder().addComponents(selectMenu);
}

module.exports = {
  buildShopEmbed,
  buildCategorySelectRow,
  buildActionButtonsRow,
  buildShopPanelPayload,
  buildTopupMethodSelectRow,
  buildProductSelectRow,
};
