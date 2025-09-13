import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleKickCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if kick command is enabled
    if (!guildConfig.moderation.kickEnabled) {
        return await interaction.reply({ content: 'Kick command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to kick members
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return await interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
    }

    try {
        // Fetch the guild member to kick
        const member = await interaction.guild.members.fetch(user.id);

        // Check if we can kick this member (role hierarchy)
        if (!member.kickable) {
            return await interaction.reply({ 
                content: 'I cannot kick this user. They might have higher permissions than me.', 
                ephemeral: true 
            });
        }

        // Kick the member
        await member.kick(reason);

        // Log the kick in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `👢 **User Kicked:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Kicked by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        // Confirm the kick to the command issuer
        await interaction.reply({ content: `Successfully kicked ${user.tag}. Reason: ${reason}` });
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'I was unable to kick the user. They might have higher permissions or I lack the proper permissions.',
            ephemeral: true,
        });
    }
}