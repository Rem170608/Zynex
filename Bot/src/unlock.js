import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a specific channel')
    .addChannelOption(option =>
        option
            .setName('channel')
            .setDescription('Channel to unlock')
            .setRequired(true)
    );

export async function handleUnlockCommand(interaction) {
    const channel = interaction.options.getChannel('channel');
    const everyoneRole = interaction.guild.roles.everyone;

    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
    }

    try {
        // Unlock the channel by enabling SendMessages for @everyone
        await channel.permissionOverwrites.edit(everyoneRole, {
            [PermissionFlagsBits.SendMessages]: true, // Allow Send Messages
        });

        console.log(`Channel unlocked: ${channel.name} (${channel.id})`);
        await interaction.reply(`🔓 Unlocked ${channel} successfully.`);
    } catch (error) {
        console.error(`Failed to unlock the channel: ${error}`);
        await interaction.reply({ content: 'Failed to unlock the channel.', ephemeral: true });
    }
}
