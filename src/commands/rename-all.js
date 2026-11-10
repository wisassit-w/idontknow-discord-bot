const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mass-nickname')
        .setDescription('จัดการเปลี่ยนชื่อเล่นสมาชิกทุกคนในเซิร์ฟเวอร์')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('เปลี่ยนชื่อทุกคนตามรูปแบบที่กำหนด')
                .addStringOption(opt =>
                    opt.setName('format')
                        .setDescription('ชื่อที่ต้องการตั้ง (ใช้ {name} แทนชื่อเดิมของสมาชิก เช่น [IDK] {name})')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('ล้างชื่อเล่นทุกคนกลับเป็นชื่อดิสปกติ (Default)')
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const botMember = guild.members.me;

        // ดึงสมาชิกทุกคนในเซิร์ฟเวอร์
        const members = await guild.members.fetch();
        let success = 0;
        let failed = 0;

        for (const [id, member] of members) {
            // ข้ามบอท และข้ามคนที่เป็น Server Owner (เพราะ Discord ไม่อนุญาตให้บอทเปลี่ยนชื่อ Owner)
            if (member.user.bot || member.id === guild.ownerId) continue;

            // ตรวจสอบลำดับยศ: บอทต้องอยู่สูงกว่าคนที่จะเปลี่ยนชื่อ
            if (member.roles.highest.position >= botMember.roles.highest.position) {
                failed++;
                continue;
            }

            try {
                if (subcommand === 'set') {
                    const format = interaction.options.getString('format');
                    const originalName = member.user.globalName || member.user.username;
                    const newNickname = format.replace('{name}', originalName).slice(0, 32);

                    await member.setNickname(newNickname);
                } else if (subcommand === 'reset') {
                    // การใส่ null จะคืนค่าชื่อกลับเป็นชื่อดิสเดิม (Default)
                    await member.setNickname(null);
                }
                success++;

                // หน่วงเวลา 250ms เพื่อป้องกันโดน Discord Rate Limit บล็อก
                await new Promise(res => setTimeout(res, 250));
            } catch (err) {
                failed++;
            }
        }

        if (subcommand === 'set') {
            return interaction.editReply(`✅ เปลี่ยนชื่อสำเร็จ: **${success}** คน (ข้าม/เปลี่ยนไม่ได้: **${failed}** คน เช่น ยศสูงกว่าบอท หรือเจ้าของเซิร์ฟ)`);
        } else {
            return interaction.editReply(`🔄 ล้างชื่อกลับเป็น Default สำเร็จ: **${success}** คน (ข้าม/เปลี่ยนไม่ได้: **${failed}** คน)`);
        }
    }
};