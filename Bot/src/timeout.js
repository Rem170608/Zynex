import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

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

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if timeout command is enabled
    if (!guildConfig.moderation.timeoutEnabled) {
        return await interaction.reply({
            content: 'Timeout command is disabled in this server.',
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

        // Log the timeout in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `⏰ **User Timed Out:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Duration:** ${duration} minutes\n**Timed out by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
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
