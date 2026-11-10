const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clone-server')
    .setDescription('โคลนโครงสร้าง ยศ และห้องจากดิสอื่นมาใส่ดิสนี้')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('source_id')
        .setDescription('ใส่ ID เซิร์ฟเวอร์ต้นทางที่ต้องการก็อบ (บอทต้องอยู่ในนั้นด้วย)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const { client, guild } = interaction;
    const sourceGuildId = interaction.options.getString('source_id');

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    // 1. ดึงเซิร์ฟเวอร์ต้นทางอัตโนมัติ
    const sourceGuild = client.guilds.cache.get(sourceGuildId);
    if (!sourceGuild) {
      return interaction.editReply('❌ ไม่พบเซิร์ฟเวอร์ต้นทาง (เชิญบอทเข้าดิสนั้นหรือยัง?)');
    }

    await interaction.editReply(`⏳ กำลังดูดโครงสร้างจาก **${sourceGuild.name}**...`);

    // 2. ดึงข้อมูล Roles
    const roles = sourceGuild.roles.cache
      .filter((r) => !r.managed && r.id !== sourceGuild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        mentionable: r.mentionable,
      }));

    // 3. ดึง Categories & Channels
    const structure = [];
    const categories = sourceGuild.channels.cache
      .filter((c) => c.type === 4)
      .sort((a, b) => a.position - b.position);

    for (const [, cat] of categories) {
      const children = sourceGuild.channels.cache
        .filter((c) => c.parentId === cat.id)
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          name: c.name,
          type: c.type,
          topic: c.topic || null,
          nsfw: c.nsfw || false,
        }));

      structure.push({
        name: cat.name,
        type: cat.type,
        children,
      });
    }

    await interaction.editReply(`⚙️ กำลังสร้างยศ (${roles.length} ยศ) และหมวดหมู่ลงดิสนี้อัตโนมัติ...`);

    // 4. สร้างยศลงดิสปัจจุบัน
    for (const roleData of roles) {
      try {
        await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          mentionable: roleData.mentionable,
        });
        await sleep(1000);
      } catch (err) {
        // ข้ามยศที่สร้างไม่สำเร็จ
      }
    }

    // 5. สร้างหมวดหมู่และห้องลงดิสปัจจุบัน
    for (const catData of structure) {
      try {
        const createdCat = await guild.channels.create({
          name: catData.name,
          type: catData.type,
        });
        await sleep(1000);

        for (const child of catData.children) {
          await guild.channels.create({
            name: child.name,
            type: child.type,
            parent: createdCat.id,
            topic: child.topic,
            nsfw: child.nsfw,
          });
          await sleep(1000);
        }
      } catch (err) {
        // ข้ามช่องที่สร้างไม่สำเร็จ
      }
    }

    return interaction.editReply('🎉 โคลนโครงสร้างทั้งหมดจากดิสต้นทางมาใส่ดิสนี้เรียบร้อยแล้วครับ!');
  },
};