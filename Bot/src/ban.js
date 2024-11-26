// ban.js
export async function handleBanCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Ensure the user has permission to ban members
    if (!interaction.member.permissions.has('BanMembers')) {
        return await interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
    }

    try {
        // Fetch the guild member to ban
        const member = await interaction.guild.members.fetch(user.id);
        await member.ban({ reason });

        // Log the ban in the specified channel
        const logChannel = interaction.guild.channels.cache.get('1305290679773040710');
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send(
                `🚨 **User Banned:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Banned by:** ${interaction.user.tag}`
            );
        }

        // Confirm the ban to the command issuer
        await interaction.reply({ content: `Successfully banned ${user.tag}. Reason: ${reason}` });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'I was unable to ban the user. They might have higher permissions or I lack the proper permissions.',
            ephemeral: true,
        });
    }
}
