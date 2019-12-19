console.log('Starting');
const Discord = require('discord.js');
const fs = require('fs');
const child_process = require('child_process');
const colors = require('colors');
const download = require('download-file');
//const ytdl = require('ytdl-core');
const youtubedl = require('youtube-dl');

const client = new Discord.Client();
/* token --> */																																																																																																						client.login(/* token redacted */);

////////////////////////////////////////////////////////////////////////////////




client.on('ready', ()=>{
	console.log('Ready');
});

client.on('message', m => {
//	var arg = m.content.split(' ');
//	var cmd = arg[0].slice(1).toLowerCase();
//	var txt = function(i) {return arg.slice(i).join(' ');}

	var a = m.content.split(' ');
	var t = function(i) {return a.slice(i).join(' ');}

	message = m; arg = a;
	cmd = a[0].slice(1).toLowerCase();

	if (m.content.startsWith('!')) {
		if (cmd === "join") joinc(m,a,t);
		if (cmd === "leave") leavec(m,a,t);
		if (cmd === "play" || cmd === 'p') playc(m,a,t);
		if (cmd === "playaudio" || cmd === 'pa') playaudioc(m,a,t);
		if (cmd === "playmidi" || cmd === 'pm') playmidic(m,a,t);
		if (cmd === "search" || cmd === 's') searchc(m,a,t);
		if (cmd === "upload" || cmd === 'u') uploadc(m,a,t);
		if (cmd === "ytplay" || cmd === "ytp" || cmd === "pyt" || cmd === "py") youtubedlplayc(m,a,t);
		if (cmd === "ytdl") youtubedlc(m,a,t);
		if (cmd === "soundfontcfg") soundfontcfgc(m,a,t);
		if (cmd === "soundfonts") soundfontsc(m,a,t);
		if (cmd === "setsoundfonts") setsoundfontc(m,a,t);
		if (typeof dispatcher !== 'undefined') {
			if (cmd === "song") songc(m,a,t);
			if (cmd === "pause") pausec(m,a,t);
			if (cmd === "resume") resumec(m,a,t);
			if (cmd === "volume") volumec(m,a,t);
			if (cmd === "time") timec(m,a,t);
			if (cmd === "stop") stopc(m,a,t);
		}
	}
});







////////////////////////////////////////////////////////////////////////////////

fs.readdir('./music/', function(err,files){music = files;});
fs.readdir('./midi/', function(err,files){midis = files;});

function search_music(query) {
	var search_results = [];
	music.forEach(function(filename){
		if (filename.toLowerCase().includes(query.toLowerCase())) {
			search_results.push(filename);
		}
	});
	return search_results;
}

function search_midis(query) {
	var search_results = [];
	midis.forEach(function(filename){
		if (filename.toLowerCase().includes(query.toLowerCase())) {
			search_results.push(filename);
		}
	});
	return search_results;
}


function play (filename, type, message) {
	var vc = message.member.voiceChannel || client.channels.get('279769632599048194');
	vc.join().then(c => {
		connection = c;
		if (type === "audio") {
			//try{dispatcher.end();}catch(e){}
			setTimeout(function(){
				let path = './music/'+filename.split('/').join(':');
				dispatcher = connection.playFile(path);
				dispatcher.songname = filename;
				message.channel.send('🎶 **Now playing:** `'+filename+'` 💿');
				client.user.setGame(filename);
				dispatcher.on('end', () => {
					client.user.setGame();
				});
			},100);
		}
		else if (type === "midi") {
			//try{dispatcher.end();}catch(e){}
			setTimeout(function(){
				const path = './midi/'+filename.split('/').join(':');
				const timidity = child_process.spawn('timidity', [path, '-c', './timidity.cfg', '-o', '-']);
				timidity.stderr.on('data', data => {
					console.log(("[TiMidity] "+data.toString()).yellow);
				});
				dispatcher = connection.player.playPCMStream(timidity.stdout);
				dispatcher.songname = filename;
				message.channel.send('🎶 **Now playing:** `'+filename+'` 🎹');
				client.user.setGame(filename);
				dispatcher.on('end', () => {
					timidity.kill();
					client.user.setGame();
				});
			},100);
		}
		else if (type === "yt") {
			if (!filename.startsWith('http')) filename = 'ytsearch:'+filename;
			const dl = youtubedl(filename, ['-f bestaudio'], {maxBuffer: Infinity});
			let video_filename;
			dl.on('info', function(info) {
				dispatcher = connection.playStream(dl);
				message.channel.send('🎶 **Now playing:** `'+info.title+'` 📺');
				fs.appendFile('./ytplay-history.txt', info._filename+'\n'); // ¯\_(ツ)_/¯
				client.user.setGame(info.title);
				dispatcher.on('end', ()=>{
					client.user.setGame();
				});
			});
		}
		else console.log('something is wrong; play function was called with invalid type'.red);
	});
}

/*
function playYT(query, message) {
	if (!query.startsWith('http')) query = 'ytsearch:'+query;
	const dl = youtubedl(query, ['-f bestaudio'], {maxBuffer: Infinity});
	let video_filename;
	dl.on('info', function(info) {
		dispatcher = connection.playStream(dl);
		message.channel.send('🎶 **Now playing:** `'+info.title+'` 📺');
		fs.appendFile('./ytplay-history.txt', info._filename+'\n'); // ¯\_(ツ)_/¯
		client.user.setGame(info.title);
		dispatcher.on('end', ()=>{
			client.user.setGame();
		});
	});
}
*/

// Commands --------------------------------------------------------------------


function joinc(message, arg, txt) {
	if (message.member.voiceChannel) {
		message.member.voiceChannel.join().then(c => {connection = c;});
		message.react('🆗');
	} else {
		message.reply('⚠ **First connect to the voice channel that you want me to connect to.**');
	}
}
function leavec(message, arg, txt) {
	if (typeof connection !== 'undefined') {
		connection.disconnect();
		connection = undefined;
		message.react('🆗');
	} else {
		message.react('⚠');
	}
}
function playc(message, arg, txt) {
	var query = txt(1);
	if (query) {
		if (fs.existsSync('./music/'+query)) play(query, 'audio', message);
		else if (fs.existsSync('./midi/'+query)) play(query, 'midi', message);
		else {
			let music_search = search_music(query);
			let midi_search = search_midis(query);
			if (music_search.includes(query)) play(music_search.random(), 'audio', message);
			else if (midi_search.includes(query)) play(midi_search.random(), 'midi', message);
			else message.channel.send('Nothing was found ');
			/*
			let music_search = search_music(query);
			let midi_search = search_midis(query);
			let total_search = music_search.concat(midi_search);
			if (total_search != "") {
				play(total_search.random(), message);
			} else {
				//playYT(query, message);
				play(music.concat(midis).random(), message);
			}*/
		}
	} else {
		if ([true,false].random()) play(music.random(), 'audio', message);
		else play(midis.random(), 'midi', message);
	}
}

function playaudioc(message, arg, txt) {
	var query = txt(1);
	if (query != "") {
		if(fs.existsSync('./music/'+query)) {
			play(query, 'audio', message);
		} else {
			let search = search_music(query);
			if (search != "") {
				play(search.random(), 'audio', message);
			} else {
				play(music.random(), 'audio', message);
			}
		}
	} else {
		play(music.random(), 'audio', message);
	}
}

function playmidic(message, arg, txt) {
	var query = txt(1);
	if (query != "") {
		if(fs.existsSync('./midi/'+query)) {
			play(query, 'midi', message);
		} else {
			let search = search_midis(query);
			if (search != "") {
				play(search.random(), 'midi', message);
			} else {
				play(midis.random(), 'midi', message);
			}
		}
	} else {
		play(midis.random(), 'midi', message);
	}
}

function searchc(message, arg, txt) {
	if (txt(1)) {
		let music_search = search_music(txt(1));
		let midi_search = search_midis(txt(1));
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
//var music_extensions = ["aac","aiff","aif","flac","m4a","mp3","ogg","wav","wma","webm","mkv","flv","avi","mov","qt","wmv","mp4","m4v"];
var music_extensions = ["3dostr","3g2","3gp","4xm","a64","aa","aac","ac3","acm","act","adf","adp","ads","adts","adx","aea","afc","aiff","aix","alaw","alias_pix","amr","anm","apc","ape","apng","aqtitle","asf","asf_o","asf_stream","ass","ast","au","avi","avm2","avr","avs","bethsoftvid","bfi","bfstm","bin","bink","bit","bmp_pipe","bmv","boa","brender_pix","brstm","c93","caf","cavsvideo","cdg","cdxl","cine","concat","crc","dash","data","daud","dcstr","dds_pipe","dfa","dirac","dnxhd","dpx_pipe","dsf","dsicin","dss","dts","dtshd","dv","dv1394","dvbsub","dvbtxt","dvd","dxa","ea","ea_cdata","eac3","epaf","exr_pipe","f32be","f32le","f4v","f64be","f64le","fbdev","ffm","ffmetadata","fifo","film_cpk","filmstrip","flac","flic","flv","framecrc","framehash","framemd5","frm","fsb","g722","g723_1","g729","genh","gif","gsm","gxf","h261","h263","h264","hash","hds","hevc","hls","hls","applehttp","hnm","ico","idcin","idf","iff","ilbc","image2","image2pipe","ingenient","ipmovie","ipod","ircam","ismv","iss","iv8","ivf","ivr","j2k_pipe","jacosub","jpeg_pipe","jpegls_pipe","jv","latm","lavfi","live_flv","lmlm4","loas","lrc","lvf","lxf","m4v","matroska","matroska","webm","md5","mgsts","microdvd","mjpeg","mkvtimestamp_v2","mlp","mlv","mm","mmf","mov","mov","mp4","m4a","3gp","3g2","mj2","mp2","mp3","mp4","mpc","mpc8","mpeg","mpeg1video","mpeg2video","mpegts","mpegtsraw","mpegvideo","mpjpeg","mpl2","mpsub","msf","msnwctcp","mtaf","mtv","mulaw","musx","mv","mvi","mxf","mxf_d10","mxf_opatom","mxg","nc","nistsphere","nsv","null","nut","nuv","oga","ogg","ogv","oma","opus","oss","paf","pam_pipe","pbm_pipe","pcx_pipe","pgm_pipe","pgmyuv_pipe","pictor_pipe","pjs","pmp","png_pipe","ppm_pipe","psp","psxstr","pva","pvf","qcp","qdraw_pipe","r3d","rawvideo","realtext","redspark","rl2","rm","roq","rpl","rsd","rso","rtp","rtp_mpegts","rtsp","s16be","s16le","s24be","s24le","s32be","s32le","s8","sami","sap","sbg","sdp","sdr2","segment","sgi_pipe","shn","siff","singlejpeg","sln","smjpeg","smk","smoothstreaming","smush","sol","sox","spdif","spx","srt","stl","stream_segment","ssegment","subviewer","subviewer1","sunrast_pipe","sup","svag","svcd","swf","tak","tedcaptions","tee","thp","tiertexseq","tiff_pipe","tmv","truehd","tta","tty","txd","u16be","u16le","u24be","u24le","u32be","u32le","u8","uncodedframecrc","v210","v210x","v4l2","vag","vc1","vc1test","vcd","video4linux2","v4l2","vivo","vmd","vob","vobsub","voc","vpk","vplayer","vqf","w64","wav","wc3movie","webm","webm_chunk","webm_dash_manife","webp","webp_pipe","webvtt","wsaud","wsd","wsvqa","wtv","wv","wve","x11grab","xa","xbin","xmv","xvag","xwma","yop","yuv4mpegpipe"];
var midi_extensions = ["mid","rmi","rcp","r36","g18","g36","mfi","kar","mod","wrd","xm","s3m","oct","med","ahx","it"];
function uploadc(message, arg, txt) {
	if (typeof message.attachments.first() !== 'undefined') {
		let attachment_name = message.attachments.first().filename;
		let attachment_extension = attachment_name.split('.').pop().toLowerCase();
		if (music_extensions.includes(attachment_extension.toLowerCase())) {
			if (!fs.existsSync('./music/'+attachment_name)) {
				message.react('🆗');
				download(message.attachments.first().url, {directory: "./music/"}, function(err) {
					if (err) {message.channel.send('An error occurred while downloading: ```'+err+'```'); return;}
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
					if (err) {message.channel.send('An error occurred while downloading: ```'+err+'```'); return;}
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
					if (err) {message.channel.send('An error occurred while downloading: ```'+err+'```'); return;}
					message.channel.send('📁 Added file `'+attachment_name+'` to the soundfont collection. 🎺');
				});
			} else {
				message.channel.send('⚠ **File** `'+attachment_name+'` **already exists.**');
			}
		} else {
			message.channel.send('⚠ **Format extension `'+attachment_extension+'` is not supported or unknown.**');
			download(message.attachments.first().url, {directory: "./trash/"});
		}
	} else {
		message.channel.send('ℹ **To upload to the music database, type `!upload` and attach the file to your message.**');
	}
}
/*
function ytplayc(message,arg,txt){
	const query = txt(1);
	if (query !== "") {
		message.react('🆗');
		if (query.startsWith('http')) {
			dispatcher = connection.playStream(ytdl(query, {filter: "audioonly"}));
			message.channel.send('Now playing whatever video u gave me');
			dispatcher.on('end', ()=>{
				message.channel.send('wutevr u gave me is now over');
			});
		} else {

		}
	} else {
		message.reply('Usage: `!ytplay <youtube URL>`');
	}
}

function ytdlc(message,arg,txt){
	const query = txt(1);
	if (query !== "") {
		message.react('🆗');
		if (query.startsWith('http')) {
			ytdl.getInfo(query, (err,info)=>{
				message.channel.send('[testing] Downloading '+info.title);
				ytdl.downloadFromInfo(info, {filter: "audioonly"}).pipe(fs.createWriteStream('./music/'+info.title+'-'+info.video_id));
			});
		} else {

		}
	} else {
		message.reply('Usage: `!ytdl <youtube URL>`');
	}
}
*/
function youtubedlplayc(message,arg,txt){
	if (txt(1)) {
		message.react('🆗');
		play(txt(1), 'yt', message);
	} else {
		message.reply('ℹ **Usage:** `!ytplay <youtube URL or search query>`');
	}
}

function youtubedlc(message, arg, txt) {
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
		message.reply('ℹ **Usage:** `!youtube-dl <youtube URL or search query>`');
	}
}

function soundfontcfgc(message,arg,txt){
	fs.readFile('./soundfonts.cfg', 'utf8', (err, data)=> {
		message.channel.send('Contents of soundfont config:\n`'+data+'`');
	});
}
function soundfontsc(message,arg,txt){
	fs.readdir('./soundfonts/', (err, files)=>{
		message.channel.send('Available soundfonts: \n`'+files.join('\n')+'`');
	});
}
function setsoundfontc(message,arg,txt) {
	arg.shift();
	var newcfg = "";
	arg.forEach(filename => {
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
}

// Song control
function songc(message, arg, txt) {
	message.channel.send('🎶 **Currently playing:** `'+dispatcher.songname+'`');
}
function pausec(message, arg, txt) {
	dispatcher.pause();
	message.react('🆗');
}
function resumec(message, arg, txt) {
	dispatcher.resume();
	message.react('🆗');
}
function volumec(message, arg, txt) {
	if (arg[1]) {
		dispatcher.setVolume(arg[1]);
		message.react('🆗');
	} else {
		message.channel.send('🔊 **Volume:** `'+dispatcher._volume+'`')
	}
}
function timec(message, arg, txt) {
	message.channel.send(dispatcher.time);
}
function stopc(message, arg, txt) {
	dispatcher.end();
//	dispatcher = undefined;
	message.react('🆗');
}


function reloadmusicc(message, arg, txt) {
	message.react('🆗');
	fs.readdir('./music/', function(err,files){music = files;});
	fs.readdir('./midi/', function(err,files){midis = files;});
}
















// Utility Functions
////////////////////////////////////////////////////////////////////////////////
Array.prototype.random = function () {
	return this[Math.floor(Math.random()*this.length)];
}
