import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleSetNickCommand(interaction) {
    const user = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname');

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if setnick command is enabled
    if (!guildConfig.moderation.setNickEnabled) {
        return await interaction.reply({ content: 'Set nickname command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage nicknames
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
        return await interaction.reply({ content: 'You do not have permission to manage nicknames.', ephemeral: true });
    }

    try {
        // Fetch the guild member
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return await interaction.reply({ content: 'User is not in this server.', ephemeral: true });
        }

        // Check if the member can be managed by the bot
        if (!member.manageable) {
            return await interaction.reply({ 
                content: 'I cannot change this user\'s nickname. They might have higher permissions than me.', 
                ephemeral: true 
            });
        }

        // Check role hierarchy - user can't manage members with higher or equal roles
        if (interaction.member.roles.highest.position <= member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            return await interaction.reply({ 
                content: 'You cannot manage a user with roles higher than or equal to your highest role.', 
                ephemeral: true 
            });
        }

        // Validate nickname length
        if (nickname && nickname.length > 32) {
            return await interaction.reply({ 
                content: 'Nickname cannot be longer than 32 characters.', 
                ephemeral: true 
            });
        }

        const oldNickname = member.nickname || 'None';
        const newNickname = nickname || 'None';

        // Set the nickname (null to reset to username)
        await member.setNickname(nickname);

        // Log the nickname change in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `📝 **Nickname Changed:** ${user.tag} (${user.id})\n**Old Nickname:** ${oldNickname}\n**New Nickname:** ${newNickname}\n**Changed by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        // Confirm the nickname change
        if (nickname) {
            await interaction.reply({ content: `Successfully changed ${user.tag}'s nickname to "${nickname}".` });
        } else {
            await interaction.reply({ content: `Successfully reset ${user.tag}'s nickname.` });
        }

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to change the nickname.',
            ephemeral: true,
        });
    }
}