import { EmbedBuilder } from 'discord.js';

export async function handleHelpCommand(interaction) {
    try {
        // Create main help embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Bot Commands Help')
            .setDescription('Here are all the available commands organized by category:')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🛡️ Moderation Commands',
                    value: [
                        '`/ban` - Ban a user from the server',
                        '`/unban` - Unban a user using their ID',
                        '`/kick` - Kick a user from the server',
                        '`/timeout` - Timeout a user for specified duration',
                        '`/warn` - Issue a warning to a user',
                        '`/clear` - Delete multiple messages at once',
                        '`/slowmode` - Set channel slowmode',
                        '`/lock` - Lock a channel (disable messaging)',
                        '`/unlock` - Unlock a channel (enable messaging)'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Information Commands',
                    value: [
                        '`/userinfo` - Get detailed user information',
                        '`/serverinfo` - Get detailed server information',
                        '`/avatar` - Display user\'s avatar',
                        '`/infractions` - View user\'s warnings',
                        '`/clear-infractions` - Clear a user\'s warnings'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ Configuration',
                    value: [
                        'Use the **web dashboard** to configure:',
                        '• Enable/disable commands per server',
                        '• Set moderation log channels',
                        '• Configure welcome messages',
                        '• Manage auto-moderation settings',
                        '• Send messages to channels via web interface'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔗 Useful Links',
                    value: [
                        '[Web Dashboard](https://your-replit-url.com)',
                        '[Support Server](https://discord.gg/support)',
                        '[Documentation](https://docs.example.com)'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ 
                text: `Requested by ${interaction.user.tag} • Bot by Your Name`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while displaying the help menu.',
            ephemeral: true,
        });
    }
}