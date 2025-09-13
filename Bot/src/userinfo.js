import { EmbedBuilder } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleUserInfoCommand(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        // Get guild configuration
        const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

        // Fetch member information
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return await interaction.reply({ content: 'User is not in this server.', ephemeral: true });
        }

        // Get user warnings
        const warnings = guildConfig.warnings && guildConfig.warnings[user.id] 
            ? guildConfig.warnings[user.id].length 
            : 0;

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`User Information - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'User', value: `${user} (${user.tag})`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: 'Warnings', value: warnings.toString(), inline: true },
                { name: 'Highest Role', value: member.roles.highest.toString(), inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Status', value: member.presence?.status || 'offline', inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        // Add roles if there are any (excluding @everyone)
        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => role.toString())
            .slice(0, 20); // Limit to prevent embed size issues

        if (roles.length > 0) {
            embed.addFields({ 
                name: `Roles (${roles.length})`, 
                value: roles.join(', ') || 'None', 
                inline: false 
            });
        }

        // Add permissions
        const keyPermissions = member.permissions.toArray()
            .filter(perm => ['Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'BanMembers', 'KickMembers', 'ModerateMembers'].includes(perm));
        
        if (keyPermissions.length > 0) {
            embed.addFields({ 
                name: 'Key Permissions', 
                value: keyPermissions.join(', '), 
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching user information.',
            ephemeral: true,
        });
    }
}