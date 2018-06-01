console.log('Starting');
const Discord = require('discord.js');
const fs = require('fs');
const child_process = require('child_process');
const colors = require('colors');
const download = require('download-file');
//const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl');
//const ffprobe = require('ffprobe');

const client = new Discord.Client();
client.login(fs.readFileSync('token.txt', 'utf8'));
client.on('ready', ()=>{
	console.log('Ready');
});


fs.readdir('./music/', function(err,files){music = files});
fs.readdir('./midi/', function(err,files){midis = files});

//var music_extensions = ["aac","aiff","aif","flac","m4a","mp3","ogg","wav","wma","webm","mkv","flv","avi","mov","qt","wmv","mp4","m4v"];
const music_extensions = ["3dostr","3g2","3gp","4xm","a64","aa","aac","ac3","acm","act","adf","adp","ads","adts","adx","aea","afc","aiff","aix","alaw","alias_pix","amr","anm","apc","ape","apng","aqtitle","asf","asf_o","asf_stream","ass","ast","au","avi","avm2","avr","avs","bethsoftvid","bfi","bfstm","bin","bink","bit","bmp_pipe","bmv","boa","brender_pix","brstm","c93","caf","cavsvideo","cdg","cdxl","cine","concat","crc","dash","data","daud","dcstr","dds_pipe","dfa","dirac","dnxhd","dpx_pipe","dsf","dsicin","dss","dts","dtshd","dv","dv1394","dvbsub","dvbtxt","dvd","dxa","ea","ea_cdata","eac3","epaf","exr_pipe","f32be","f32le","f4v","f64be","f64le","fbdev","ffm","ffmetadata","fifo","film_cpk","filmstrip","flac","flic","flv","framecrc","framehash","framemd5","frm","fsb","g722","g723_1","g729","genh","gif","gsm","gxf","h261","h263","h264","hash","hds","hevc","hls","hls","applehttp","hnm","ico","idcin","idf","iff","ilbc","image2","image2pipe","ingenient","ipmovie","ipod","ircam","ismv","iss","iv8","ivf","ivr","j2k_pipe","jacosub","jpeg_pipe","jpegls_pipe","jv","latm","lavfi","live_flv","lmlm4","loas","lrc","lvf","lxf","m4v","matroska","matroska","webm","md5","mgsts","microdvd","mjpeg","mkvtimestamp_v2","mlp","mlv","mm","mmf","mov","mov","mp4","m4a","3gp","3g2","mj2","mp2","mp3","mp4","mpc","mpc8","mpeg","mpeg1video","mpeg2video","mpegts","mpegtsraw","mpegvideo","mpjpeg","mpl2","mpsub","msf","msnwctcp","mtaf","mtv","mulaw","musx","mv","mvi","mxf","mxf_d10","mxf_opatom","mxg","nc","nistsphere","nsv","null","nut","nuv","oga","ogg","ogv","oma","opus","oss","paf","pam_pipe","pbm_pipe","pcx_pipe","pgm_pipe","pgmyuv_pipe","pictor_pipe","pjs","pmp","png_pipe","ppm_pipe","psp","psxstr","pva","pvf","qcp","qdraw_pipe","r3d","rawvideo","realtext","redspark","rl2","rm","roq","rpl","rsd","rso","rtp","rtp_mpegts","rtsp","s16be","s16le","s24be","s24le","s32be","s32le","s8","sami","sap","sbg","sdp","sdr2","segment","sgi_pipe","shn","siff","singlejpeg","sln","smjpeg","smk","smoothstreaming","smush","sol","sox","spdif","spx","srt","stl","stream_segment","ssegment","subviewer","subviewer1","sunrast_pipe","sup","svag","svcd","swf","tak","tedcaptions","tee","thp","tiertexseq","tiff_pipe","tmv","truehd","tta","tty","txd","u16be","u16le","u24be","u24le","u32be","u32le","u8","uncodedframecrc","v210","v210x","v4l2","vag","vc1","vc1test","vcd","video4linux2","v4l2","vivo","vmd","vob","vobsub","voc","vpk","vplayer","vqf","w64","wav","wc3movie","webm","webm_chunk","webm_dash_manife","webp","webp_pipe","webvtt","wsaud","wsd","wsvqa","wtv","wv","wve","x11grab","xa","xbin","xmv","xvag","xwma","yop","yuv4mpegpipe"];
const midi_extensions = ["mid","rmi","rcp","r36","g18","g36","mfi","kar","mod","wrd","xm","s3m","oct","med","ahx","it"];

const myVoiceChannelID = "279769632599048194";
const myGuildID = "279769632599048193";
const cmdChar = "!";

let myVoiceConnection;

function play(filename, type, channel) {
	client.channels.get(myVoiceChannelID).join().then(connection => {
		myVoiceConnection = connection;
		if (type === "audio") {
			
			const filtered_filename = filename.replace(/\//g, ':');
			const path = './music/'+filtered_filename;
			const metadata_path = './music_metadata/'+filtered_filename+'.json';

			connection.playFile(path);
			connection.dispatcher.songname = filename;

			let np_message;
			channel.send('🎶 **Now playing:** `'+filename+'` 💿').then(m => mp_message = m);

			fs.readFile(metadata_path, 'utf8', (err,data)=>{
				if (err) { // make metadata file
					console.log(`creating metadata file ${metadata_path}`);
					const metadata = {
						plays: 1,
						lastPlay: new Date().toJSON(),
					};
//					ffprobe(path, {path: '/usr/bin/ffprobe'}, (err, info) => {
//						metadata.ffprobe = info;
						connection.dispatcher.meta = metadata;
						fs.writeFile(metadata_path, JSON.stringify(metadata));
//					});
				} else { // load & update metadata file
					console.log(`using metadata file ${metadata_path}`);
					const metadata = JSON.parse(data);
					metadata.plays++;
					metadata.lastPlay = new Date().toJSON();
					connection.dispatcher.meta = metadata;
					fs.writeFile(metadata_path, JSON.stringify(metadata));
				}
			});
			
			client.user.setGame(filename);

			connection.dispatcher.on('end', () => {
				client.user.setGame();
			});
		
		}
		else if (type === "midi") {
			const path = './midi/'+filename.split('/').join(':');
			const timidity = child_process.spawn('timidity', [path, '-c', './timidity.cfg', '-o', '-']);
			timidity.stderr.on('data', data => {
				console.log(("[TiMidity] "+data.toString()).yellow);
			});
			connection.playConvertedStream(timidity.stdout);
			connection.dispatcher.songname = filename;
			if (channel) channel.send('🎶 **Now playing:** `'+filename+'` 🎹');
			client.user.setGame(filename);
			connection.dispatcher.on('end', () => {
				timidity.kill();
				client.user.setGame();
			});
		}
		else if (type === "yt") {
			if (!filename.startsWith('http')) filename = 'ytsearch:'+filename;
			const dl = youtubedl(filename, ['-f bestaudio'], {maxBuffer: Infinity});
			let video_filename;
			dl.on('info', function(info) {
				connection.playStream(dl);
				if (channel) channel.send('🎶 **Now playing:** `'+info.title+'` 📺');
				fs.appendFile('./ytplay-history.txt', info._filename+'\n'); // ¯\_(ツ)_/¯
				client.user.setGame(info.title);
				connection.dispatcher.on('end', ()=>{
					client.user.setGame();
				});
			});
		}
	});
}






const commands = {
	mhelp: {
		description: "Shows command list",
		execute: function (message, args, txt) {
			const embed = {
				color: client.guilds.get(myGuildID).me.colorRole.color,
				author: {name: "Music Bot Commands", icon_url: client.user.avatarURL},
				fields: []
			}
			for (const commandName in commands) {
				const command = commands[commandName];
				if (command.hidden) continue;
				embed.fields.push({name: cmdChar+commandName,value: command.description || "(no description)"});
			}
			
			let scl = [];
			Object.keys(songCommands).forEach(c => scl.push(cmdChar+c));
			embed.fields.push({name: scl.join(', '), value: "These commands control a playing song."});

			message.channel.send({embed});
		}
	},
	//join: {},
	leave: {
		description: "Disconnects the bot from the voice channel.",
		execute: function (message, args, txt) {
			if (myVoiceConnection) {
				myVoiceConnection.disconnect();
				message.react('🆗');
			} else {
				message.react('⚠');
			}
		}
	},
	play: {
		aliases: ["p"],
		description: "Plays something. If no arguments are given, a random audio or MIDI is played. If given the name of an existing audio or MIDI file, that will be played, else the query will be searched and a random result will be played.",
		execute: function (message, args, txt) {
			let query = txt(1);
			if (query) {
				if (music.includes(query)) play(query, 'audio', message.channel);
				else if (midis.includes(query)) play(query, 'midi', message.channel);
				else {
					let music_search = music.search(query);
					if (music_search) play(music_search.random(), 'audio', message.channel);
					else {
						let midi_search = midis.search(query);
						if (midi_search) play(midi_search.random(), 'midi', message.channel);
						else {
							message.channel.send('⚠ **Nothing was found.** Try narrowing your keyword or use a different command (use `!help` for command list)');
						}
					}
				}
			} else {
				if ([true,false].random()) play(music.random(), 'audio', message.channel);
				else play(midis.random(), 'midi', message.channel);
			}
		}
	},
	playaudio: {
		aliases: ["pa"],
		description: "Like play but restricted to audio.",
		execute: function (message, args, txt) {
			let query = txt(1);
			if (query) {
				if (fs.existsSync('./music/'+query)) play(query, 'audio', message.channel);
				else {
					let search = music.search(query);
					if (search) play(search.random(), 'audio', message.channel);
					else play(music.random(), 'audio', message.channel);
				}
			} else play(music.random(), 'audio', message.channel);
		}
	},
	playmidi: {
		aliases: ["pm"],
		description: "Like play but restricted to MIDIs.",
		execute: function (message, args, txt) {
			let query = txt(1);
			if (query) {
				if (fs.existsSync('./midi/'+query)) play(query, 'midi', message.channel);
				else {
					let search = midis.search(query);
					if (search != "") play(search.random(), 'midi', message.channel);
					else play(midis.random(), 'midi', message.channel);
				}
			} else play(midis.random(), 'midi', message.channel);
		}
	},
	search: {
		aliases: ["s"],
		description: "Searches the audio and midi collections. All results that **include** the given query are returned.",
		execute: function (message, args, txt) {
			if (txt(1)) {
				let music_search = music.search(txt(1));
				let midi_search = midis.search(txt(1));
				if (music_search != "" || midi_search != "") {
					if (music_search != "" && music_search.length < 100) {
						let sr = "💿 **Audio Search results:**\n";
						music_search.forEach((item, index, array) => {
							sr += '`'+item+'`\n';
							try {
								if (sr.length+array[index+1].length >= 1950) {
									message.channel.send(sr);
									sr = "";
								}
							} catch(e) {
								message.channel.send(sr);
							}
						});
					}
					if (midi_search != "" && midi_search.length < 100) {
						let sr = "🎹 **MIDI Search results:**\n";
						midi_search.forEach((item, index, array) => {
							sr += '`'+item+'`\n';
							try {
								if (sr.length+array[index+1].length >= 1950) {
									message.channel.send(sr);
									sr = "";
								}
							} catch(e) {
								message.channel.send(sr);
							}
						});
					}
				} else {
					message.channel.send('⚠ **No results.**');
				}
			} else {
				message.channel.send('**Usage:** `!search <query>`');
			}
		}
	},
	upload: {
		aliases: ["u"],
		description: "Adds the attached file to the audio, midi, or soundfont collection.",
		execute: function (message, args, txt) {
			if (typeof message.attachments.first() !== 'undefined') {
				let attachment_name = message.attachments.first().filename;
				let attachment_extension = attachment_name.split('.').pop().toLowerCase();
				if (music_extensions.includes(attachment_extension.toLowerCase())) {
					if (!fs.existsSync('./music/'+attachment_name)) {
						message.react('🆗');
						download(message.attachments.first().url, {directory: "./music/"}, function(err) {
							if (err) {message.channel.send('⚠ **An error occurred while downloading:** ```'+err+'```'); return;}
							music.push(attachment_name);
							message.channel.send('📁 **Added** `'+attachment_name+'` **to the music collection.** 💿');
						});
					} else {
						message.channel.send('⚠ **File** `'+attachment_name+'` **already exists.**');
					}
				} else if (midi_extensions.includes(attachment_extension.toLowerCase())) {
					if (!fs.existsSync('./midi/'+attachment_name)) {
						message.react('🆗');
						download(message.attachments.first().url, {directory: "./midi/"}, function(err) {
							if (err) {message.channel.send('⚠ **An error occurred while downloading:** ```'+err+'```'); return;}
							midis.push(attachment_name);
							message.channel.send('📁 **Added** `'+attachment_name+'` **to the MIDI collection.** 🎹');
						});
					} else {
						message.channel.send('⚠ **File** `'+attachment_name+'` **already exists.**');
					}
				} else if (["sfx","sf2", "cfg"].includes(attachment_extension.toLowerCase())) {
					if (!fs.existsSync('./soundfonts/'+attachment_name)) {
						message.react('🆗');
						download(message.attachments.first().url, {directory: "./soundfonts/"}, function(err) {
							if (err) {message.channel.send('⚠ **An error occurred while downloading:** ```'+err+'```'); return;}
							message.channel.send('📁 **Added** `'+attachment_name+'` **to the soundfont collection.** 🎺');
						});
					} else {
						message.channel.send('⚠ **File** `'+attachment_name+'` **already exists.**');
					}
				} else {
					message.channel.send('⚠ **Format extension `'+attachment_extension+'` is not supported or unknown.**');
					download(message.attachments.first().url, {directory: "./trash/"});
				}
			} else {
				message.channel.send('ℹ **To upload your music, type `!upload` and attach the file to your message.**');
			}
		}
	},
	ytplay: {
		description: "Plays something from YouTube!",
		hidden: true,
		execute: function (message, args, txt) {
			if (txt(1)) {
				message.react('🆗');
				play(txt(1), 'yt', message.channel);
			} else {
				message.reply('ℹ **Usage:** `!ytplay <youtube URL or search query>`');
			}
		}
	},
	ytdl: {
		description: "Adds a YouTube video to the audio collection.",
		hidden: true,
		execute: function (message, args, txt) {
			if (txt(1)) {
				message.react('🆗');
				let query = txt(1);
				if (!query.startsWith('http')) query = 'ytsearch:'+query;
				const dl = youtubedl(query, ['-f bestaudio'], {maxBuffer: Infinity});
				let video_filename;
				dl.on('info', function(info) {
		//			message.channel.send('Downloading `'+info.filename+ '`\n Size: `'+info.size+'`');
					dl.pipe(fs.createWriteStream('./music/'+info._filename));
					video_filename = info._filename;
				});
				dl.on('end', function() {
					music.push(video_filename);
		//			message.channel.send('Download finished.');
					message.channel.send('📁 **Added** `'+video_filename+'` **to the music collection.** 💿')
				});
			} else {
				message.reply('ℹ **Usage:** `!ytdl <youtube URL or search query>`');
			}
		}
	},
	soundfonts: {
		aliases: ["sf"],
		description: "modifies soundfont config",
		hidden: true,
		execute: function (message, args, txt) {
			if (args[1] === 'cfg') {
				fs.readFile('./soundfonts.cfg', 'utf8', (err, data)=> {
					message.channel.send('Contents of soundfont config:\n`'+data+'`');
				});
			} else if (args[1] === 'list') {
				fs.readdir('./soundfonts/', (err, files)=>{
					message.channel.send('Available soundfonts: \n`'+files.join('\n')+'`');
				});
			} else if (args[1] === 'set') {
				args.shift();
				let newcfg = "";
				args.forEach(filename => {
					if (fs.existsSync('./soundfonts/'+filename)) {
						if (filename.split('.').pop() === "cfg") {
							newcfg += 'source ./soundfonts/'+filename+'\n';
						} else {
							newcfg += 'soundfont ./soundfonts/'+filename+'\n';
						}
					} else {
						message.channel.send('err: soundfont `'+filename+'` doesn\'t exist');
					}
				});
				fs.writeFile('./soundfonts.cfg', newcfg, ()=>{
					message.channel.send('Saved new soundfont config with the following contents:\n`'+newcfg+'`');
				});
			} else {
				message.channel.send('`!sf cfg` shows soundfont config; `!sf list` shows available soundfonts; `!sf set` writes new soundfont config');
			}
		}
	},
}

const songCommands = {
	song: function (message, args, txt) {
		message.channel.send('🎶 **Currently playing:** `'+myVoiceConnection.dispatcher.songname+'`');
		/*const embed = {
			color: client.guilds.get(myGuildID).me.colorRole.color,
			author: {name: "🎶 **Currently playing**"},
			description: `**${myVoiceConnection.dispatcher.songname}**`,
			fields: []
		}
		const metadata = myVoiceConnection.dispatcher.meta;
		if (metadata) {
			embed.fields.push({name: "Duration", value: metadata.duration});
		}
		message.channel.send({embed});*/
	},
	pause: function (message, args, txt) {
		myVoiceConnection.dispatcher.pause();
		message.react('🆗');
	},
	resume: function (message, args, txt) {
		myVoiceConnection.dispatcher.resume();
		message.react('🆗');
	},
	volume: function (message, args, txt) {
		if (!isNaN(args[1])) myVoiceConnection.dispatcher.setVolume(args[1]*0.01);
		message.channel.send('🔊 **Volume:** `'+myVoiceConnection.dispatcher._volume*100+'%`');
	},
	time: function (message, args, txt) {
		message.channel.send('⏱ **Time Elapsed:** `'+getYoutubeLikeToDisplay(myVoiceConnection.dispatcher.time)+'`');
	},
	stop: function (message, args, txt) {
		myVoiceConnection.dispatcher.end('!stop command');
		message.react('🆗');
	}
}





client.on('message', message => {
	if (!message.content.startsWith(cmdChar)) return;
	try {
		const args = message.content.split(' ');
		const cmd = args[0].slice(1).toLowerCase();
		const txt = (i) => {return args.slice(i).join(' ')};

		for (const commandName in commands) {
			const command = commands[commandName];
			if ( commandName === cmd ||command.aliases && (command.aliases.includes(cmd)) )
				command.execute(message, args, txt);
		}

		for (const commandName in songCommands) {
			if (commandName === cmd) {
				if (myVoiceConnection && myVoiceConnection.dispatcher) {
					songCommands[commandName](message, args, txt);
				} else {
					message.channel.send('🚫 **Nothing is playing.**');
				}
			}
		}
	} catch (e) {
		message.reply('💥 **An error has been encountered while processing your command.** 💥');
		console.error(colors.red(`Command failure with message "${message.content}": `+e.stack));
	}
});


















// Utility Functions
////////////////////////////////////////////////////////////////////////////////
Array.prototype.random = function () {
	return this[Math.floor(Math.random()*this.length)];
}

/*Array.prototype.search = function (query) {
	let results = [];
	this.forEach(item => {
		if (item.toLowerCase().includes(query.toLowerCase())) results.push(item);
	});
	return results;
}*/

Array.prototype.search = function (query) {
	return this.filter( item => item.toLowerCase().includes(query.toLowerCase()) );
}


function getYoutubeLikeToDisplay(millisec) {
	var seconds = (millisec / 1000).toFixed(0);
	var minutes = Math.floor(seconds / 60);
	var hours = "";
	if (minutes > 59) {
		hours = Math.floor(minutes / 60);
		hours = (hours >= 10) ? hours : "0" + hours;
		minutes = minutes - (hours * 60);
		minutes = (minutes >= 10) ? minutes : "0" + minutes;
	}

	seconds = Math.floor(seconds % 60);
	seconds = (seconds >= 10) ? seconds : "0" + seconds;
	if (hours != "") {
		return hours + ":" + minutes + ":" + seconds;
	}
	return minutes + ":" + seconds;
}
////////////////////////////////////////////////////////////////////////////////
client.on('error', error => console.error(error));
