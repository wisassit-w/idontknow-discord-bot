const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  MessageFlags 
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('ส่งประกาศโปรโมชั่น/อัปเดต พร้อมปุ่มกดซื้อด่วน (เฉพาะแอดมิน)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('เลือกห้องที่ต้องการส่งประกาศ')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('หัวข้อประกาศโปรโมชั่น')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('details')
        .setDescription('รายละเอียดโปรโมชั่น / ข้อมูลส่วนลด')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('attach_buy_button')
        .setDescription('แนบปุ่มกดซื้อสินค้าด่วนในประกาศหรือไม่')
        .setRequired(false)
        .addChoices(
          { name: '🛒 Dontcry V1 (29 บาท - ใช้โค้ดลดได้)', value: 'buy_item_dontcry_v1' },
          { name: '⚡ Internet Niran (229 บาท)', value: 'buy_item_internet_niran' },
          { name: '🛠️ Setting IDONTKNOW (299 บาท)', value: 'buy_item_setting_idontknow' }
        )
    )
    .addStringOption(option =>
      option
        .setName('image_url')
        .setDescription('ลิงก์รูปภาพประกอบแบนเนอร์ (ถ้ามี)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('mention_everyone')
        .setDescription('แท็ก @everyone หรือไม่ (ค่าเริ่มต้น: ไม่แท็ก)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const targetChannel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const details = interaction.options.getString('details');
    const attachButton = interaction.options.getString('attach_buy_button');
    const imageUrl = interaction.options.getString('image_url');
    const mentionEveryone = interaction.options.getBoolean('mention_everyone') || false;

    // สร้างการ์ดประกาศแบบพรีเมียม
    const broadcastEmbed = new EmbedBuilder()
      .setColor(0x050505)
      .setAuthor({ 
        name: '✦  IDONTKNOW STORE ・ OFFICIAL ANNOUNCEMENT  ✦', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTitle(`📢 ${title}`)
      .setDescription(
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦\n\n' +
        `${details.replace(/\\n/g, '\n')}\n\n` +
        '✦ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✦'
      )
      .setFooter({ text: 'IDONTKNOW STORE • Limited Time Offer' })
      .setTimestamp();

    if (imageUrl) {
      broadcastEmbed.setImage(imageUrl);
    }

    const components = [];

    // แนบปุ่มซื้อด่วนตามที่แอดมินเลือก
    if (attachButton) {
      let label = 'สั่งซื้อสินค้าด่วน';
      let emoji = '🛒';

      if (attachButton.includes('dontcry_v1')) {
        label = 'สั่งซื้อ Dontcry V1 (29฿ - ใช้โค้ดลดได้)';
        emoji = '✨';
      } else if (attachButton.includes('internet_niran')) {
        label = 'สั่งซื้อ Internet Niran (229฿)';
        emoji = '🌐';
      } else if (attachButton.includes('setting_idontknow')) {
        label = 'สั่งซื้อ Setting IDONTKNOW (299฿)';
        emoji = '⚡';
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(attachButton)
          .setLabel(label)
          .setEmoji(emoji)
          .setStyle(ButtonStyle.Success)
      );

      components.push(row);
    }

    try {
      const messagePayload = {
        embeds: [broadcastEmbed],
        components: components
      };

      if (mentionEveryone) {
        messagePayload.content = '@everyone';
      }

      await targetChannel.send(messagePayload);

      return interaction.editReply({
        content: `✅ ส่งประกาศโปรโมชั่นไปยังห้อง ${targetChannel} เรียบร้อยแล้ว!`
      });

    } catch (error) {
      console.error('Broadcast Error:', error);
      return interaction.editReply({
        content: `❌ เกิดข้อผิดพลาดในการส่งข้อความ: ${error.message}`
      });
    }
  }
};