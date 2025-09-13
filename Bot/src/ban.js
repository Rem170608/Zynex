// ban.js
import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleBanCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if ban command is enabled
    if (!guildConfig.moderation.banEnabled) {
        return await interaction.reply({ content: 'Ban command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to ban members
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return await interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
    }

    try {
        // Fetch the guild member to ban
        const member = await interaction.guild.members.fetch(user.id);
        await member.ban({ reason });

        // Log the ban in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `🚨 **User Banned:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Banned by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
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
