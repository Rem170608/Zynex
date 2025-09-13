import { PermissionsBitField } from 'discord.js';
import { configManager } from '../../shared/config.js';

export async function handleClearCommand(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    // Get guild configuration
    const guildConfig = await configManager.getGuildConfig(interaction.guild.id);

    // Check if clear command is enabled
    if (!guildConfig.moderation.clearEnabled) {
        return await interaction.reply({ content: 'Clear command is disabled in this server.', ephemeral: true });
    }

    // Ensure the user has permission to manage messages
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return await interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
    }

    // Validate amount
    if (amount < 1 || amount > 100) {
        return await interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
    }

    // Ensure target channel is a text channel
    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
    }

    try {
        await interaction.deferReply({ ephemeral: true });

        let deletedCount = 0;

        if (user) {
            // Delete messages from specific user
            const messages = await channel.messages.fetch({ limit: Math.min(amount * 2, 100) });
            const userMessages = messages.filter(msg => msg.author.id === user.id).first(amount);
            
            for (const message of userMessages.values()) {
                try {
                    await message.delete();
                    deletedCount++;
                } catch (error) {
                    // Message might be too old to delete (14+ days)
                }
            }
        } else {
            // Bulk delete messages
            const messages = await channel.messages.fetch({ limit: amount });
            const deletableMessages = messages.filter(msg => 
                Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
            );

            if (deletableMessages.size > 0) {
                await channel.bulkDelete(deletableMessages);
                deletedCount = deletableMessages.size;
            }
        }

        // Log the clear action in the configured log channel (if enabled and set)
        if (guildConfig.moderation.logActions && guildConfig.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
            if (logChannel && logChannel.isTextBased()) {
                await logChannel.send(
                    `🧹 **Messages Cleared:** ${deletedCount} messages in ${channel}\n**Target:** ${user ? `${user.tag}` : 'All users'}\n**Cleared by:** ${interaction.user.tag}\n**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                );
            }
        }

        // Confirm the clear action
        await interaction.editReply({ 
            content: `Successfully deleted ${deletedCount} message${deletedCount !== 1 ? 's' : ''}${user ? ` from ${user.tag}` : ''} in ${channel}.` 
        });

    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'An error occurred while trying to clear messages. Messages older than 14 days cannot be bulk deleted.',
        });
    }
}