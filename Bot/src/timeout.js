import { PermissionsBitField } from 'discord.js';

export async function handletimeoutCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const duration = interaction.options.getInteger('duration') || 10; // Default 10 minutes

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true,
        });
    }

    // Ensure the user has permission to timeout members
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return await interaction.reply({
            content: 'You do not have permission to timeout members.',
            ephemeral: true,
        });
    }

    try {
        // Fetch the guild member to timeout
        const member = await interaction.guild.members.fetch(user.id);

        // Ensure the bot has the necessary permissions
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return await interaction.reply({
                content: 'I do not have permission to timeout members.',
                ephemeral: true,
            });
        }

        // Timeout the user
        await member.timeout(duration * 60 * 1000, reason);

        // Log the timeout in the specified channel
        const logChannel = interaction.guild.channels.cache.get('1305290679773040710');
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send(
                `🚨 **User Timed Out:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Duration:** ${duration} minutes\n**Timed out by:** ${interaction.user.tag}`
            );
        }

        // Confirm the timeout to the command issuer
        await interaction.reply({
            content: `Successfully timed out ${user.tag} for ${duration} minutes. Reason: ${reason}`,
        });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'I was unable to timeout the user. They might have higher permissions or I lack the proper permissions.',
            ephemeral: true,
        });
    }
}
