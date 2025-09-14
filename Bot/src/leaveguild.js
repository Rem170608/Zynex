export async function handleLeaveGuildCommand(interaction) {
    const guildId = interaction.options.getString('guild_id');
    const guild = interaction.client.guilds.cache.get(guildId);

    if (!guild) {
        await interaction.reply({ content: `❌ Guild not found or bot is not a member.`, ephemeral: true });
        return;
    }

    try {
        await guild.leave();
        await interaction.reply({ content: `✅ Left guild: ${guild.name} (${guild.id})`, ephemeral: true });
    } catch (error) {
        await interaction.reply({ content: `❌ Failed to leave guild: ${error.message}`, ephemeral: true });
    }
}