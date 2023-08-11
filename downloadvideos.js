import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { dlAudio } from "youtube-exec";
import { google } from "googleapis";
import util from "util";
import axios from "axios";
import FormData from "form-data";
const execPromisify = util.promisify(exec);
const downloadFolder = path.resolve("./downloads");
const outputDir = path.resolve("./transcriptions");

// Lista de URLs dos vídeos do YouTube
const videoUrls = [];

async function listVideosFromChannel(channelId, apiKey) {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  
    try {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);

        const response = await youtube.search.list({
            part: 'snippet',
            channelId: channelId,
            maxResults: 50,
            type: 'video',
            videoDuration: 'medium',
            publishedAfter: date.toISOString()
        });
  
        const videos = response.data.items;
        videos.forEach(video => {
            videoUrls.push(`https://www.youtube.com/watch?v=${video.id.videoId}`)
            console.log('Título: ' + video.snippet.title);
        });
    } catch (error) {
      console.error('Erro ao listar vídeos:', error);
    }
}

// Função para realizar o download de um vídeo do YouTube
async function downloadVideo(url) {
    const videoId = url.split('v=')[1];

    if(!fs.existsSync(downloadFolder + "/" + videoId + ".mp3")){
        console.log(`Baixando ${url}...`);

        await dlAudio({
            url: url,
            folder: downloadFolder,
            filename: videoId,
            quality: "lowest"
        });

        console.log(`Convertendo para WAV ${url}...`);

        await execPromisify(`ffmpeg -i ${downloadFolder + "/" + videoId + ".mp3"} ${downloadFolder + "/" + videoId + ".wav"}`);
    }

    return downloadFolder + "/" + videoId + ".wav";
}

// Função para transcrever um vídeo usando o Whisper
async function transcribeVideo(videoFilePath) {
    return new Promise(async (resolve, reject) => {
        const transcritionFilename = videoFilePath.replace("downloads", "transcriptions").replace(".wav", ".txt");

        if(!fs.existsSync(transcritionFilename)){
            console.log(`Transcrevendo ${videoFilePath}...`);

            const formData = new FormData();
            
            formData.append("audio_file", fs.createReadStream(videoFilePath));

            const response = await axios.post("http://192.168.0.134:9000/asr?task=transcribe&language=pt&encode=true&output=txt", formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                },
                responseType: 'stream'
            });

            const stream = response.data;

            stream.on('data', data => {
                fs.appendFileSync(transcritionFilename, data);
            });

            stream.on('end', () => {
                resolve();
            });            
        }
        else{
            resolve();
        }
    });
}

// Função principal para executar o processo de download e transcrição de vídeos
async function downloadAndTranscribeVideos() {
    try {
        if (!fs.existsSync(outputDir)) 
            fs.mkdirSync(outputDir, { recursive: true });
        
        /*await listVideosFromChannel("UCDt4dFdsJyjjA8mQULkOLLw", "AIzaSyCNNEqf06IjVnULH_LvcY8tAqd2NxzCXeE");

        // Realizar o download e transcrição de cada vídeo
        for (const url of videoUrls) {
            console.log(`Processando vídeo: ${url}`);
            const videoFilePath = await downloadVideo(url);
            await transcribeVideo(videoFilePath);
        }*/

        const videoFilePath = await downloadVideo("https://www.youtube.com/watch?v=kSJxaDfupJ0");
            await transcribeVideo(videoFilePath);
    } catch (error) {
        console.error('Erro durante o processo:', error);
    }
}

downloadAndTranscribeVideos();
