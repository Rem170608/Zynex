import { configManager } from '../../shared/config.js';

export async function handleWarnCommand(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if warn command is enabled
    if (!guildConfig.moderation.warnEnabled) {
        return await interaction.reply({ content: 'Warn command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to moderate members
    if (!interaction.member.permissions.has('ModerateMembers')) {
        return await interaction.reply({ content: 'You do not have permission to warn members.', ephemeral: true });
    }

    try {
        // Check if user is in the guild
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return await interaction.reply({ content: 'User is not in this server.', ephemeral: true });
        }

        // Store warning in configuration (create warnings array if it doesn't exist)
        if (!guildConfig.warnings) {
            guildConfig.warnings = {};
        }
        if (!guildConfig.warnings[user.id]) {
            guildConfig.warnings[user.id] = [];
        }

        const warning = {
            id: Date.now().toString(),
            reason: reason,
            moderator: interaction.user.id,
            timestamp: Date.now()
        };

        guildConfig.warnings[user.id].push(warning);
        await configManager.updateGuildConfig(interaction.guild.id, { warnings: guildConfig.warnings });

        const warnCount = guildConfig.warnings[user.id].length;

        // Try to DM the user about the warning
        try {
            await user.send(
                `⚠️ **You have been warned in ${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warnCount}\n**Moderator:** ${interaction.user.tag}`
            );
        } catch (error) {
            // User might have DMs disabled
        }

        // Log the warning in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `⚠️ **User Warned:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Total Warnings:** ${warnCount}\n**Warned by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        // Confirm the warning to the command issuer
        await interaction.reply({ 
            content: `Successfully warned ${user.tag}. Reason: ${reason}\nTotal warnings: ${warnCount}` 
        });

        // Auto-action based on warning count
        if (guildConfig.moderation.autoWarnActions && warnCount >= (guildConfig.moderation.maxWarnings || 3)) {
            try {
                if (guildConfig.moderation.warnAction === 'timeout') {
                    await member.timeout(24 * 60 * 60 * 1000, `Automatic timeout: ${guildConfig.moderation.maxWarnings} warnings reached`);
                    await interaction.followUp({ content: `${user.tag} has been automatically timed out for 24 hours (${guildConfig.moderation.maxWarnings} warnings reached).` });
                } else if (guildConfig.moderation.warnAction === 'kick') {
                    await member.kick(`Automatic kick: ${guildConfig.moderation.maxWarnings} warnings reached`);
                    await interaction.followUp({ content: `${user.tag} has been automatically kicked (${guildConfig.moderation.maxWarnings} warnings reached).` });
                }
            } catch (autoError) {
                console.error('Auto-action failed:', autoError);
            }
        }

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'I was unable to warn the user.',
            ephemeral: true,
        });
    }
}