export async function handleUnbanCommand(interaction) {
    const userId = interaction.options.getString('user_id'); // Use user ID from the command
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    if (!interaction.member.permissions.has('BanMembers')) {
        return await interaction.reply({ content: 'You do not have permission to unban members.', ephemeral: true });
    }

    try {
        // Check if the user is banned
        const bans = await interaction.guild.bans.fetch();
        const bannedUser = bans.get(userId);

        if (!bannedUser) {
            return await interaction.reply({ content: `The user with ID ${userId} is not banned.`, ephemeral: true });
        }

        // Unban the user
        await interaction.guild.bans.remove(userId, reason);

        // Log unban
        const logChannel = interaction.guild.channels.cache.get('1305290679773040710'); // Replace with your log channel ID
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send(
                `✅ **User Unbanned:** ${bannedUser.user.tag} (${userId})\n**Reason:** ${reason}\n**Unbanned by:** ${interaction.user.tag}`
            );
        }

        // Notify command issuer
        await interaction.reply({ content: `Successfully unbanned ${bannedUser.user.tag}. Reason: ${reason}` });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to unban the user. Please check the user ID and permissions.',
            ephemeral: true,
        });
    }
}
