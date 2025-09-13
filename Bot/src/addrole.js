import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleAddRoleCommand(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if role command is enabled
    if (!guildConfig.moderation.roleEnabled) {
        return await interaction.reply({ content: 'Role command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage roles
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
    }

    try {
        // Fetch the guild member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return await interaction.reply({ content: 'User is not in this server.', ephemeral: true });
        }

        // Check if the role can be managed by the bot
        if (!role.editable) {
            return await interaction.reply({ 
                content: 'I cannot assign this role. It might be higher than my highest role or it\'s managed by an integration.', 
                ephemeral: true 
            });
        }

        // Check role hierarchy - user can't assign roles higher than their own
        if (interaction.member.roles.highest.position <= role.position && interaction.guild.ownerId !== interaction.user.id) {
            return await interaction.reply({ 
                content: 'You cannot assign a role that is higher than or equal to your highest role.', 
                ephemeral: true 
            });
        }

        // Check if user already has the role
        if (member.roles.cache.has(role.id)) {
            return await interaction.reply({ 
                content: `${user.tag} already has the ${role.name} role.`, 
                ephemeral: true 
            });
        }

        // Add the role
        await member.roles.add(role);

        // Log the role addition in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `➕ **Role Added:** ${role} to ${user.tag} (${user.id})\n**Added by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        // Confirm the role addition
        await interaction.reply({ content: `Successfully added the ${role.name} role to ${user.tag}.` });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to add the role.',
            ephemeral: true,
        });
    }
}