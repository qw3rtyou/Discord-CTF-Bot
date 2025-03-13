const { Client, Events, GatewayIntentBits, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
]});

client.once(Events.ClientReady, readyClient => {
console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('messageCreate', (message) => {
    if(message.content == 'whoami'){
        message.reply('Slave of Foo1');
    }
})

const commands = [
    new SlashCommandBuilder()
        .setName('ctf')
        .setDescription('CTF Commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new CTF channel.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('CTF name')
                        .setRequired(true)))
];

client.once(Events.ClientReady, async () => {
    try {
        await client.application.commands.set(commands);
        console.log('Slash commands have been registered!');
    } catch (error) {
        console.error(error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ctf') {
        if (interaction.options.getSubcommand() === 'createctf') {
            const ctfName = interaction.options.getString('name');
            
            try {
                await interaction.deferReply();

                const category = await interaction.guild.channels.create({
                    name: `CTF-${ctfName}`,
                    type: 4,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ]
                });

                const channels = [
                    { name: '🎤general', type: 2 },
                    { name: '📌notice', type: 0 },
                    { name: '🔑credentials', type: 0 },
                    { name: '[pwn]', type: 0 },
                    { name: '[rev]', type: 0 },
                    { name: '[web]', type: 0 },
                    { name: '[crypto]', type: 0 },
                    { name: '[misc]', type: 0 }
                ];

                for (const channelData of channels) {
                    await interaction.guild.channels.create({
                        name: channelData.name,
                        type: channelData.type,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                }

                const message = await interaction.editReply({ 
                    content: `CTF ${ctfName} has been created! Click the emoji below to join.`,
                    fetchReply: true 
                });

                await message.react('✅');

                const filter = (reaction, user) => reaction.emoji.name === '✅' && !user.bot;
                const collector = message.createReactionCollector({ filter });

                collector.on('collect', async (reaction, user) => {
                    try {
                        await category.permissionOverwrites.create(user.id, {
                            ViewChannel: true
                        });
                        
                        const categoryChannels = interaction.guild.channels.cache.filter(
                            channel => channel.parentId === category.id
                        );
                        
                        for (const [, channel] of categoryChannels) {
                            await channel.permissionOverwrites.create(user.id, {
                                ViewChannel: true
                            });
                        }
                    } catch (error) {
                        console.error('Error occurred while setting permissions:', error);
                    }
                });
            } catch (error) {
                console.error('Error occurred while creating channels:', error);
                if (interaction.deferred) {
                    await interaction.editReply('An error occurred while creating channels.');
                } else {
                    await interaction.reply('An error occurred while creating channels.');
                }
            }
        }
    }
});

client.login(token);