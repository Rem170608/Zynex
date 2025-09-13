import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleInfractionsCommand(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        // Get guild configuration
        const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

        // Get user warnings
        const warnings = guildConfig.warnings && guildConfig.warnings[user.id] 
            ? guildConfig.warnings[user.id] 
            : [];

        if (warnings.length === 0) {
            return await interaction.reply({ 
                content: `${user.tag} has no warnings on record.`,
                ephemeral: true 
            });
        }

        // Sort warnings by timestamp (newest first)
        warnings.sort((a, b) => b.timestamp - a.timestamp);

        // Calculate time periods
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const week = 7 * day;

        const last24h = warnings.filter(w => now - w.timestamp < day).length;
        const lastWeek = warnings.filter(w => now - w.timestamp < week).length;
        const total = warnings.length;

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle(`Infractions - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Past 24 Hours', value: last24h.toString(), inline: true },
                { name: 'Past Week', value: lastWeek.toString(), inline: true },
                { name: 'Total', value: total.toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        // Add recent warnings (up to 10)
        const recentWarnings = warnings.slice(0, 10);
        if (recentWarnings.length > 0) {
            const warningsList = recentWarnings.map((warning, index) => {
                const date = new Date(warning.timestamp);
                const moderator = interaction.guild.members.cache.get(warning.moderator);
                return `**${index + 1}.** ${warning.reason}\n*${date.toLocaleDateString()} by ${moderator ? moderator.user.tag : 'Unknown Moderator'}*`;
            }).join('\n\n');

            embed.addFields({ 
                name: `Recent Warnings (${Math.min(recentWarnings.length, 10)})`, 
                value: warningsList.length > 1024 ? warningsList.substring(0, 1021) + '...' : warningsList,
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching infractions.',
            ephemeral: true,
        });
    }
}

export async function handleClearInfractionsCommand(interaction) {
    const user = interaction.options.getUser('user');

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Ensure the user has permission to moderate members
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return await interaction.reply({ 
            content: 'You do not have permission to clear infractions.', 
            ephemeral: true 
        });
    }

    try {
        // Get guild configuration
        const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

        // Check if user has any warnings
        const currentWarnings = guildConfig.warnings && guildConfig.warnings[user.id] 
            ? guildConfig.warnings[user.id].length 
            : 0;

        if (currentWarnings === 0) {
            return await interaction.reply({ 
                content: `${user.tag} has no warnings to clear.`,
                ephemeral: true 
            });
        }

        // Clear warnings
        if (!guildConfig.warnings) {
            guildConfig.warnings = {};
        }
        delete guildConfig.warnings[user.id];

        await configManager.updateGuildConfig(interaction.guild.id, { warnings: guildConfig.warnings });

        // Log the action
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `🧹 **Infractions Cleared:** ${user.tag} (${user.id})\n**Previous Warnings:** ${currentWarnings}\n**Cleared by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        await interaction.reply({ 
            content: `Successfully cleared ${currentWarnings} warning${currentWarnings !== 1 ? 's' : ''} for ${user.tag}.` 
        });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while clearing infractions.',
            ephemeral: true,
        });
    }
}