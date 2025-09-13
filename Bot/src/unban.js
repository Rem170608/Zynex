import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleUnbanCommand(interaction) {
    const userId = interaction.options.getString('user_id'); // Use user ID from the command
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if ban command is enabled
    if (!guildConfig.moderation.banEnabled) {
        return await interaction.reply({ content: 'Unban command is disabled in this server.', ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
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

        // Log unban in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `✅ **User Unbanned:** ${bannedUser.user.tag} (${userId})\n**Reason:** ${reason}\n**Unbanned by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
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
