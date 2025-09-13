import { EmbedBuilder } from 'discord.js';

export async function handleAvatarCommand(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    try {
        // Get different avatar formats
        const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });
        const defaultAvatar = user.defaultAvatarURL;

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${user.tag}'s Avatar`)
            .setImage(avatarURL)
            .addFields(
                { name: 'User', value: user.toString(), inline: true },
                { name: 'Avatar URL', value: `[Click here](${avatarURL})`, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        // Add server avatar if different from global avatar (and in a guild)
        if (interaction.guild) {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            if (member && member.avatarURL()) {
                const serverAvatarURL = member.avatarURL({ dynamic: true, size: 1024 });
                if (serverAvatarURL !== avatarURL) {
                    embed.addFields({ 
                        name: 'Server Avatar', 
                        value: `[Click here](${serverAvatarURL})`, 
                        inline: true 
                    });
                }
            }
        }

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching the avatar.',
            ephemeral: true,
        });
    }
}