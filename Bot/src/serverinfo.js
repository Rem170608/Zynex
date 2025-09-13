import { EmbedBuilder } from 'discord.js';

export async function handleServerInfoCommand(interaction) {
    // Ensure the interaction is in a guild
    if (!interaction.guild) {
        return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        const guild = interaction.guild;

        // Fetch additional guild information
        await guild.fetch();
        const owner = await guild.fetchOwner();

        // Count channels by type
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        // Count members by status
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const humanCount = totalMembers - botCount;

        // Get boost information
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`Server Information - ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Members', value: `👥 ${totalMembers}\n👤 ${humanCount}\n🤖 ${botCount}`, inline: true },
                { name: 'Channels', value: `💬 ${textChannels} Text\n🔊 ${voiceChannels} Voice\n📁 ${categories} Categories`, inline: true },
                { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'Boost Level', value: `Level ${boostLevel}`, inline: true },
                { name: 'Boost Count', value: boostCount.toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        // Add server banner if available
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        // Add verification level
        const verificationLevels = ['None', 'Low', 'Medium', 'High', 'Very High'];
        embed.addFields({ 
            name: 'Verification Level', 
            value: verificationLevels[guild.verificationLevel] || 'Unknown', 
            inline: true 
        });

        // Add features if any
        if (guild.features.length > 0) {
            const features = guild.features
                .map(feature => feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                .slice(0, 10); // Limit to prevent embed size issues
            
            embed.addFields({ 
                name: 'Server Features', 
                value: features.join(', '), 
                inline: false 
            });
        }

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while fetching server information.',
            ephemeral: true,
        });
    }
}