import { SlashCommandBuilder } from 'discord.js';
import { configManager } from '../../shared/config.js';

export const data = new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a specific channel')
    .addChannelOption(option =>
        option
            .setName('channel')
            .setDescription('Channel to lock')
            .setRequired(true)
    );

export async function handleLockCommand(interaction) {
    const channel = interaction.options.getChannel('channel');

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if lock command is enabled
    if (!guildConfig.moderation.lockEnabled) {
        return await interaction.reply({ content: 'Lock command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage channels
    if (!interaction.member.permissions.has('ManageChannels')) {
        return await interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
    }

    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
    }

    try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false,
        });

        // Log the lock action in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `🔒 **Channel Locked:** ${channel} (${channel.id})\n**Locked by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        await interaction.reply(`🔒 Locked ${channel} successfully.`);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to lock the channel.',
            ephemeral: true,
        });
    }
}
