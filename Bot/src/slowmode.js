import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleSlowmodeCommand(interaction) {
    const duration = interaction.options.getInteger('duration');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if slowmode command is enabled
    if (!guildConfig.moderation.slowmodeEnabled) {
        return await interaction.reply({ content: 'Slowmode command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage channels
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
    }

    // Validate duration
    if (duration < 0 || duration > 21600) { // Discord max is 6 hours (21600 seconds)
        return await interaction.reply({ content: 'Slowmode duration must be between 0 and 21600 seconds (6 hours).', ephemeral: true });
    }

    // Ensure target channel is a text channel
    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'Slowmode can only be applied to text channels.', ephemeral: true });
    }

    try {
        await channel.setRateLimitPerUser(duration);

        let message;
        if (duration === 0) {
            message = `🚫 Slowmode disabled in ${channel}.`;
        } else {
            const formatDuration = (seconds) => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                
                let result = [];
                if (hours > 0) result.push(`${hours}h`);
                if (minutes > 0) result.push(`${minutes}m`);
                if (secs > 0 || result.length === 0) result.push(`${secs}s`);
                
                return result.join(' ');
            };

            message = `⏰ Slowmode set to ${formatDuration(duration)} in ${channel}.`;
        }

        // Log the slowmode action in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `⏰ **Slowmode ${duration === 0 ? 'Disabled' : 'Enabled'}:** ${channel}\n**Duration:** ${duration === 0 ? 'Disabled' : `${duration} seconds`}\n**Set by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        await interaction.reply({ content: message });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to set slowmode.',
            ephemeral: true,
        });
    }
}