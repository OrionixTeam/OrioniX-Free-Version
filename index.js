const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction]
});

const TOKEN = 'MTI4NTcwMDQ2MTg5ODM3MTE2NA.GUJPXw.G3aLRz3haAoCln0ojJHe899AAHoIHTCKoeO5AQ';
const CLIENT_ID = '1285700461898371164';
const GUILD_ID = '1228092459460989040';

const rest = new REST({ version: '9' }).setToken(TOKEN);

let config = {
    ticketChannel: null,
    reviewChannel: null,
    welcomeChannel: null,
    updateChannel: null,
    updateMessageId: null,
    updateRole: '1287802485406433344'
};

const ticketCategories = [
    { label: 'General Support', value: 'general', emoji: '🔧' },
    { label: 'Technical Issue', value: 'technical', emoji: '💻' },
    { label: 'Billing', value: 'billing', emoji: '💰' },
    { label: 'Feature Request', value: 'feature', emoji: '💡' }
];

const priorityLevels = [
    { label: 'Low', value: 'low', emoji: '🟢' },
    { label: 'Medium', value: 'medium', emoji: '🟡' },
    { label: 'High', value: 'high', emoji: '🔴' }
];

const welcomeMessages = [
    "Welcome {user} to our server! We hope you enjoy your stay.",
    "Hello {user}! Thanks for joining us. Have fun!",
    "A new adventurer has arrived! Welcome, {user}.",
    "{user} has joined the party! Let the fun begin!",
    "Welcome {user}! Make yourself at home."
];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log("ORIONIX BOT FREE VERSION IS ONLINE");
    loadConfig();
});

function loadConfig() {
    try {
        if (!fs.existsSync('config.json')) {
            const defaultConfig = {
                ticketChannel: null,
                reviewChannel: null,
                welcomeChannel: null,
                updateChannel: null,
                updateMessageId: null,
                updateRole: '1287802485406433344'
            };
            fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, 2));
            console.log('Created new config.json file with default settings');
        }
        const data = fs.readFileSync('config.json', 'utf8');
        config = JSON.parse(data);
    } catch (err) {
        console.error('Error loading config:', err);
        config = {
            ticketChannel: null,
            reviewChannel: null,
            welcomeChannel: null,
            updateChannel: null,
            updateMessageId: null,
            updateRole: '1287802485406433344'
        };
    }
}

function saveConfig() {
    try {
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        console.log('Config saved successfully');
    } catch (err) {
        console.error('Error saving config:', err);
    }
}

const setupCommand = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup bot channels')
    .addSubcommand(subcommand =>
        subcommand
            .setName('channels')
            .setDescription('Setup ticket, review, and welcome channels')
            .addChannelOption(option => option.setName('ticket').setDescription('Channel for ticket creation').setRequired(true))
            .addChannelOption(option => option.setName('review').setDescription('Channel for reviews').setRequired(true))
            .addChannelOption(option => option.setName('welcome').setDescription('Channel for welcome messages').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('react')
            .setDescription('Setup channel for update reactions')
            .addChannelOption(option => option.setName('channel').setDescription('Channel for update reactions').setRequired(true)));

const ticketStatusCommand = new SlashCommandBuilder()
    .setName('ticketstatus')
    .setDescription('Check the status of all open tickets');

const jokeCommand = new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Get a random joke');

async function reloadCommands(maxRetries = 5, delay = 5000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { 
                    body: [setupCommand.toJSON(), ticketStatusCommand.toJSON(), jokeCommand.toJSON()],
                    timeout: 60000
                },
            );
            console.log('Successfully reloaded application (/) commands.');
            return;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed. Error:`, error);
            if (i < maxRetries - 1) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('Failed to reload commands after maximum retries.');
}

(async () => {
    await reloadCommands();
})();

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'setup') {
                if (interaction.options.getSubcommand() === 'channels') {
                    const ticketChannel = interaction.options.getChannel('ticket');
                    const reviewChannel = interaction.options.getChannel('review');
                    const welcomeChannel = interaction.options.getChannel('welcome');

                    config.ticketChannel = ticketChannel.id;
                    config.reviewChannel = reviewChannel.id;
                    config.welcomeChannel = welcomeChannel.id;
                    saveConfig();

                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Ticket System')
                        .setDescription('Select a category to open a new ticket');

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('ticket_category')
                                .setPlaceholder('Select ticket category')
                                .addOptions(ticketCategories)
                        );

                    await ticketChannel.send({ embeds: [embed], components: [row] });
                    await interaction.reply({ content: 'Bot channels setup completed successfully!', ephemeral: true });
                } else if (interaction.options.getSubcommand() === 'react') {
                    const updateChannel = interaction.options.getChannel('channel');
                    config.updateChannel = updateChannel.id;
                    saveConfig();

                    const updateEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Receive Bot Updates')
                        .setDescription('React to this message with 🔔 to receive bot updates and gain access to exclusive features!')
                        .addFields(
                            { name: 'What You\'ll Get', value: '• Early access to new features\n• Exclusive bot commands\n• Priority support' },
                            { name: 'How It Works', value: 'By reacting, you\'ll be assigned the Update Subscriber role. You can remove your reaction at any time to unsubscribe.' },
                            { name: 'Update Subscriber Role', value: `<@&${config.updateRole}>` }
                        )
                        .setFooter({ text: 'Orionix Studio - Keeping you informed!' })
                        .setTimestamp();

                    const message = await updateChannel.send({ embeds: [updateEmbed] });
                    await message.react('🔔');

                    config.updateMessageId = message.id;
                    saveConfig();

                    await interaction.reply({ content: 'Update channel configured successfully.', ephemeral: true });
                }
            } else if (interaction.commandName === 'ticketstatus') {
                const openTickets = interaction.guild.channels.cache.filter(channel => 
                    channel.name.startsWith('ticket-') && !channel.name.includes('closed')
                );

                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Open Tickets Status')
                    .setDescription(openTickets.size > 0 ? 'Here are the currently open tickets:' : 'There are no open tickets.');

                openTickets.forEach(channel => {
                    const categoryMatch = channel.name.match(/ticket-(\w+)-/);
                    const priorityMatch = channel.name.match(/-(\w+)$/);
                    const category = categoryMatch ? categoryMatch[1] : 'Unknown';
                    const priority = priorityMatch ? priorityMatch[1] : 'Unknown';

                    embed.addFields({ name: channel.name, value: `Category: ${category}, Priority: ${priority}` });
                });

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (interaction.commandName === 'joke') {
                try {
                    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
                    const joke = await response.json();

                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Here\'s a joke for you!')
                        .setDescription(`${joke.setup}\n\n||${joke.punchline}||`)
                        .setFooter({ text: 'Click on the black bar to reveal the punchline!' });

                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error fetching joke:', error);
                    await interaction.reply({ content: 'Sorry, I couldn\'t fetch a joke right now. Try again later!', ephemeral: true });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category') {
                const category = interaction.values[0];
                const modal = new ModalBuilder()
                    .setCustomId('ticket_modal')
                    .setTitle('Open a Ticket');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('ticket_reason')
                    .setLabel('What do you need help with?')
                    .setStyle(TextInputStyle.Paragraph);

                const priorityInput = new TextInputBuilder()
                    .setCustomId('ticket_priority')
                    .setLabel('Priority (low/medium/high)')
                    .setStyle(TextInputStyle.Short);

                const categoryInput = new TextInputBuilder()
                    .setCustomId('ticket_category')
                    .setLabel('Category')
                    .setValue(category)
                    .setStyle(TextInputStyle.Short);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(reasonInput),
                    new ActionRowBuilder().addComponents(priorityInput),
                    new ActionRowBuilder().addComponents(categoryInput)
                );

                await interaction.showModal(modal);
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal') {
                const reason = interaction.fields.getTextInputValue('ticket_reason');
                const priority = interaction.fields.getTextInputValue('ticket_priority').toLowerCase();
                const category = interaction.fields.getTextInputValue('ticket_category');

                if (!['low', 'medium', 'high'].includes(priority)) {
                    await interaction.reply({ content: 'Invalid priority level. Please use low, medium, or high.', ephemeral: true });
                    return;
                }

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${category}-${interaction.user.username}-${priority}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        },
                    ],
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Ticket Opened')
                    .setDescription(`Welcome ${interaction.user}! Your ticket has been opened.\nCategory: ${category}\nPriority: ${priority}\nReason: ${reason}`)
                    .setFooter({ text: 'Orionix Studio' });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Close Ticket')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('rate_ticket')
                            .setLabel('Rate Ticket')
                            .setEmoji('⭐')
                            .setStyle(ButtonStyle.Primary)
                    );

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });
                await interaction.reply({ content: `Ticket created in ${ticketChannel}`, ephemeral: true });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'close_ticket') {
                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_close')
                            .setLabel('Confirm Close')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cancel_close')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.reply({
                    content: 'Are you sure you want to close this ticket?',
                    components: [confirmRow],
                    ephemeral: true
                });
            } else if (interaction.customId === 'confirm_close') {
                await interaction.channel.delete();
            } else if (interaction.customId === 'cancel_close') {
                await interaction.update({
                    content: 'Ticket closure cancelled.',
                    components: [],
                });
            } else if (interaction.customId === 'rate_ticket') {
                const modal = new ModalBuilder()
                    .setCustomId('rating_modal')
                    .setTitle('Rate Ticket');

                const starsInput = new TextInputBuilder()
                    .setCustomId('stars')
                    .setLabel('How many stars? (1-5)')
                    .setStyle(TextInputStyle.Short);

                const feedbackInput = new TextInputBuilder()
                    .setCustomId('feedback')
                    .setLabel('How was the service?')
                    .setStyle(TextInputStyle.Paragraph);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(starsInput),
                    new ActionRowBuilder().addComponents(feedbackInput)
                );

                await interaction.showModal(modal);
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(console.error);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'rating_modal') return;

    try {
        const stars = interaction.fields.getTextInputValue('stars');
        const feedback = interaction.fields.getTextInputValue('feedback');

        const starEmoji = '⭐'.repeat(Math.min(Math.max(parseInt(stars), 1), 5));

        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const ratingEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Ticket Rating')
            .setDescription(`Stars: ${starEmoji}\n\nReviewed by: ${interaction.user.tag}\n\nFeedback: ${feedback}`)
            .setFooter({ text: `Orionix Studio • ${dateString} ${timeString}` });

        const ratingChannel = client.channels.cache.get(config.reviewChannel);
        if (ratingChannel) {
            await ratingChannel.send({ embeds: [ratingEmbed] });
        } else {
            console.error('Rating channel not found');
        }

        const thankYouEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Thank You!')
            .setDescription('Thank you for leaving a review. We appreciate your feedback!')
            .setFooter({ text: 'Orionix Studio' });

        await interaction.reply({ embeds: [thankYouEmbed] });
    } catch (error) {
        console.error('Error handling rating modal:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error while submitting your rating!', ephemeral: true }).catch(console.error);
        }
    }
});

client.on('guildMemberAdd', async member => {
    try {
        const welcomeChannel = client.channels.cache.get(config.welcomeChannel);
        if (!welcomeChannel) {
            console.error('Welcome channel not found');
            return;
        }

        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        const personalizedMessage = randomMessage.replace('{user}', member.toString());

        const welcomeEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('New Member!')
            .setDescription(personalizedMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await welcomeChannel.send({ embeds: [welcomeEmbed] });

        const dmEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription('Thanks for joining our server. If you have any questions, feel free to open a support ticket.')
            .setFooter({ text: 'Orionix Studio' });

        await member.send({ embeds: [dmEmbed] }).catch(() => console.log('Could not send DM to new member'));
    } catch (error) {
        console.error('Error welcoming new member:', error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.message.id === config.updateMessageId && reaction.emoji.name === '🔔') {
        try {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(config.updateRole);

            if (role) {
                await member.roles.add(role);
                await user.send('You have been subscribed to bot updates! You now have access to exclusive features.');
            } else {
                console.error('Update role not found');
            }
        } catch (error) {
            console.error('Error adding update role:', error);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.message.id === config.updateMessageId && reaction.emoji.name === '🔔') {
        try {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(config.updateRole);

            if (role) {
                await member.roles.remove(role);
                await user.send('You have been unsubscribed from bot updates. Your access to exclusive features has been removed.');
            } else {
                console.error('Update role not found');
            }
        } catch (error) {
            console.error('Error removing update role:', error);
        }
    }
});

client.login(TOKEN).catch(console.error);