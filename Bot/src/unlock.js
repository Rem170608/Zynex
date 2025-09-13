import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { configManager } from '../../shared/config.js';

export const data = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a specific channel')
    .addChannelOption(option =>
        option
            .setName('channel')
            .setDescription('Channel to unlock')
            .setRequired(true)
    );

export async function handleUnlockCommand(interaction) {
    const channel = interaction.options.getChannel('channel');
    const everyoneRole = interaction.guild.roles.everyone;

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if lock command is enabled
    if (!guildConfig.moderation.lockEnabled) {
        return await interaction.reply({ content: 'Unlock command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage channels
    if (!interaction.member.permissions.has('ManageChannels')) {
        return await interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
    }

    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
    }

    try {
        // Unlock the channel by enabling SendMessages for @everyone
        await channel.permissionOverwrites.edit(everyoneRole, {
            [PermissionFlagsBits.SendMessages]: true,
        });

        // Log the unlock action in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `🔓 **Channel Unlocked:** ${channel} (${channel.id})\n**Unlocked by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        console.log(`Channel unlocked: ${channel.name} (${channel.id})`);
        await interaction.reply(`🔓 Unlocked ${channel} successfully.`);
    } catch (error) {
        console.error(`Failed to unlock the channel: ${error}`);
        await interaction.reply({ content: 'Failed to unlock the channel.', ephemeral: true });
    }
}
