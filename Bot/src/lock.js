import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a specific channel')
    .addChannelOption(option =>
        option
            .setName('channel')
            .setDescription('Channel to lock')
            .setRequired(true)
    );

export async function handleLockCommand(interaction) {
    const channel = interaction.options.getChannel('channel');

    if (!channel.isTextBased()) {
        return await interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
    }

    try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false,
        });

        await interaction.reply(`🔒 Locked ${channel} successfully.`);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'An error occurred while trying to lock the channel.',
            ephemeral: true,
        });
    }
}
