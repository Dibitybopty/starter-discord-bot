require('dotenv').config();
const Discord = require('discord.js');
const discordTTS = require("discord-tts");
const googleTTS = require("google-tts-api");
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const client = new Discord.Client();
const fs = require('fs');


const dbURI = "mongodb+srv://" + process.env.mongoUser + ":" + process.env.mongoPass + "@intros.zog4l.mongodb.net/" + process.env.mongoDB + "?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then((result) => console.log('connected to mongo!')).catch(e => console.log(e));

const Schema = mongoose.Schema;

const introSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    intro: {
        type: String,
        required: true
    },
    outro: {
        type: String,
        required: true
    }
});

const NewIntro = mongoose.model('ids', introSchema);


var lastToLeave = '';

client.commands = new Discord.Collection();

const gavJoins = ['eeyou! it\'s a ginger!', 'Quick run! Gavin is here!', 'If you\'re ginger and you know it. KYS', 'Just pretend you didn\'t see him.', 'It\'s a bird! It\'s a plane! No! It\'s just a ginger bread man!', 'What\'s that smell? Oh, gavin has joined.'];
const steveJoins = ['Why I pet, here I am like.', 'I love me some Ant and Deck, pet!', 'ha way man! Av only gan and connected like!', 'Av got a dick like a wee bern pet!', 'Am knee doon toon am right ear man!'];

client.once('ready', () => {
    console.log('Ready!');
});

//Note: For the bot to join a voice channel you have to be in there already.

client.login(process.env.token);

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    let newUserChannel = newMember.channelID;
    let clientName = newMember.member.user.username;
    let oldUserChannel = oldMember.channelID;

    var voiceChannel = newMember.member.voice.channel;

    //console.log(newUserChannel + ' is new user', oldUserChannel + ' is old user');

    if ((oldUserChannel === null && newUserChannel !== null) || (oldUserChannel === undefined && newUserChannel !== null) && clientName !== 'VoiceBot') {
        //Someone joined

        var intro = "";

        var getID = newMember.id;
        var streamVoice;


        //add temp permissions to voice text channel (acts like comment URL on vent)
        const changePerms = newMember.guild.channels.cache.get('752917590330048536');

        if (voiceChannel) {
            //console.log(voiceChannel.guild.presences)
            await voiceChannel.join().then(async connection => {
                await NewIntro.findOne({ user_id: getID }).then(async (result) => {
                    if (result !== null) {
                        let newIntroName = JSON.stringify(result.intro);
                        console.log(newIntroName.toString());
                        intro = newIntroName.toString();
                        try {
                            streamVoice = discordTTS.getVoiceStream(intro, "en");
                            connection.play(streamVoice);

                        } catch (err) {
                            console.log(err, ' try error?')

                        }
                    } else {
                        clientName === 'SuperTurts' ? intro = 'Super turds. plop plop, has joined the channel' :
                            intro = clientName + ' has joined the channel.';

                        try {
                            streamVoice = discordTTS.getVoiceStream(intro, "en");
                            connection.play(streamVoice);
                        } catch (err) {
                            console.log(err, ' try error?')

                        }


                    }
                }).catch(e => console.log(e));


                if (changePerms) {
                    changePerms.updateOverwrite(newMember.id, {
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: true
                    });
                }


            }).catch(e => {
                console.log(e);
            });
        }
    } else if ((newUserChannel === null || newUserChannel === undefined) && clientName !== 'VoiceBot') {
        //Someone left
        lastToLeave = oldMember;
        var outro = '';
        var getID = oldMember.id;
        var streamVoice;

        //attempt to say who quit - qwfwqfqf
        await lastToLeave.channel.join().then(async connection => {
            // console.log(lastToLeave.channel.members.size);
            if (lastToLeave.channel.members.size < 2) {
                lastToLeave.channel.leave();
                return;
            }
            try {
                await NewIntro.findOne({ user_id: getID }).then((result) => {
                    if (result !== null) {
                        if (result.outro !== null || result.outro !== '') {
                            outro = JSON.stringify(result.outro);
                            try {
                                streamVoice = discordTTS.getVoiceStream(outro, "en");
                                connection.play(streamVoice);
                                console.log(outro, ' is custom outro')
                            } catch (err) {
                                console.log(err)
                            }
                        } else {
                            clientName === 'SuperTurts' ? outro = 'Super turds. plop plop. has left the channel' :
                                outro = clientName + ' has left the channel. no outro?';
                            try {
                                streamVoice = discordTTS.getVoiceStream(outro, "en");
                                connection.play(streamVoice);
                            } catch (err) {
                                console.log(err)
                            }
                        }


                    } else {
                        console.log('speaking? ', clientName + ' has left the channel. else');

                        clientName === 'SuperTurts' ? outro = 'Super turds. plop plop. has left the channel' :
                            outro = clientName + ' has left the channel.';
                        try {
                            streamVoice = discordTTS.getVoiceStream(outro, "en");
                            connection.play(streamVoice);
                        } catch (err) {
                            console.log(err)
                        }
                    }
                }).catch(e => console.log(e));
            } catch (err) {
                console.log(err)
            }
            //connection.play(clientName + ' has left the channel.');
        }).catch(e => console.log(e));

        //remove permissions to voice text channel
        var changePerms = newMember.guild.channels.cache.get('752917590330048536');
        if (newMember === null || newMember === undefined) {
            try {
                if (changePerms) {
                    await changePerms.updateOverwrite(oldMember.id, {
                        VIEW_CHANNEL: false,
                        SEND_MESSAGES: false
                    });
                }
            } catch (err) {
                console.log(err, ' IS AN ERROR!!');
            }
        } else {

            try {
                if (changePerms) {
                    await changePerms.updateOverwrite(newMember.id, {
                        VIEW_CHANNEL: false,
                        SEND_MESSAGES: false
                    });
                }
            } catch (err) {
                console.log(err, ' IS AN ERROR!!');
            }
        }


    }

});

client.on('message', async message => {
    var voiceChannel = message.member.voice.channel;
    if (!fs.existsSync(`./prefs/${message.guild.id}.json`)) fs.writeFileSync(`./prefs/${message.guild.id}.json`, JSON.stringify({}), err => {
        if (err) console.log(err);
    });
    if (message.content === '!join') {
        message.channel.send('testing!', {
            tts: false
        });
        var channelSend = message.guild.channels.cache.get('751142980966023238');
        if (channelSend) {
            try {
                channelSend.send('Joining voice channel...', {
                    tts: false
                });

            } catch (err) {
                console.log(err);
            }

        } else {
            console.log('Could not get channel');
            return;
        }

        if (!voiceChannel) message.channel.send('I\'m not in a voice channel...');
        var permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send(
                "I need the permissions to join and speak in your voice channel!"
            );
        } else {
            voiceChannel.join();
        }

    }

    //change tts intro for user
    if (message.content.includes('!intro')) {
        var result = message.content.slice(7);
        var channelSendHere = message.guild.channels.cache.get('751142980966023238');
        var getID = message.member.id;

        const newIntroSave = new NewIntro({
            user_id: getID,
            intro: result,
            outro: ' '
        });

        const filter = { user_id: getID };
        const update = { intro: result };


        NewIntro.findOneAndUpdate(filter, update, {
            returnOriginal: false
        }).then((result) => {
            console.log(result + ' is result')
            if (result === null) {
                newIntroSave.save().then(result => console.log('added new intro ' + result)).catch(e => console.log(e));
            } else {
                console.log(result.intro);
            }
        }).catch(e => console.log(e));




        fs.writeFileSync(`./prefs/${message.member.id}.json`, JSON.stringify(result), err => {
            console.log(err);
        });
        message.channel.send('Changed TTS intro for ' + message.member.user.username + '!');
    }

    //change outro
    if (message.content.includes('!outro')) {
        var result = message.content.slice(7);
        var channelSendHere = message.guild.channels.cache.get('751142980966023238');
        var getID = message.member.id;

        const newIntro = new NewIntro({
            user_id: getID,
            outro: result,
            intro: ' '
        });

        const filter = { user_id: getID };
        const update = { outro: result };

        NewIntro.findOneAndUpdate(filter, update, {
            returnOriginal: false
        }).then((outroResult) => {
            if (outroResult === null) {
                newIntro.save().then(outroResult => console.log('added new outro ' + outroResult)).catch(e => console.log(e));
            } else if ((outroResult.outro === undefined || outroResult.outro === ' ') && outroResult !== null) {
                NewIntro.update({
                    outro: result
                })
                console.log('updated?')
            }
        }).catch(e => console.log(e));

        message.channel.send('Changed TTS outro for ' + message.member.user.username + '!');
    }

    if (message.content.includes('!read')) {
        var intro = message.member.user.username + ' has joined the channel.';
        var jsonIntro = fs.readFileSync(`./prefs/${message.member.id}.json`, err => {
            if (err) console.log(err)
        });
        var intro = JSON.parse(jsonIntro);
    }

    if (message.content === '!leave') {
        voiceChannel.leave();
    }

    if (message.content === '!test') {

        // voiceChannel.members.forEach(function(guildMember, guildMemberId) {
        //     console.log(guildMemberId, guildMember.user, guildMember.user.presence);
        //  })




    }

    //Better way of using tts?
    if (message.content.includes('!speak')) {
        //console.log('time to speak...');



        if (message.member.voice.channel) {

            await voiceChannel.join().then(async connection => {
                if (voiceChannel) {
                    try {
                        var someWords = message.content.substring(7);
                        console.log(someWords);
                        let streamVoice = discordTTS.getVoiceStream(someWords, "en");
                        connection.play(streamVoice);

                    } catch (err) {
                        console.log(err, ' try error?')

                    }
                    // console.log(voiceStream);
                    // let voiceStream = discordTTS.getVoiceStream(someWords, "en");

                    // connection.play(voiceStream);
                }
            });


        }

    }
    if (message.content.includes(' bot')) {
        let person = message.member.user.username;
        if (channelSend) {
            if (person === 'radafy') {
                message.channel.send('Shut up ginger face!');
            }

        }
    }
    if (message.content.includes('!gif')) {
        let search = message.content.slice(4);
        let url = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.giphyKey}&q=${search}`;
        let response = await fetch(url);
        if (response.status === 200) {
            console.log('getting gif')
            let json = await response.json();
            const index = ~~(Math.random() * json.data.length);
            message.channel.send(json.data[index].url);

        } else {
            console.log('could not get gif')
        }
    }

});
