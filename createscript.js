import axios from "axios";
import fs from "fs";
import readline from "readline";
import { glob } from "glob";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: "",
});

const openai = new OpenAIApi(configuration);

let chunks = [];
let chunk = [];

async function readFileToFineTune(filename) {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(filename),
            output: process.stdout,
            terminal: false
        });

        rl.on('line', (line) => { chunks.push(line); });
        rl.on('close', () => { resolve(); });
    });
}

async function listTranscritionsFiles(){
    const files = await glob("./transcriptions/kSJxaDfupJ0.txt");
    console.log(files);

    for(let file of files){
        console.log(`Treinando ${file}...`)
        await readFileToFineTune(file);
        break;
    }
    
    await createScript();
}

async function createScript(){
    //const limitedTokens = limitTokens([...new Set(chunks)], 16385);
    
    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo-16k',
        messages: [
            {
                'role': 'system',
                'content': "The user inserts an audio text transcription and you must create a script for a 30min YouTube video using the transcription as a structural basis, but do not use it as a reference because they are different themes, the text must be in Brazilian Portuguese. use a carioca accent with slang like 'meu parceiro', 'chati', 'mano', 'brother'"
            },
            {
                'role': 'system',
                'content': 'Create a script a 1995 American Chevrolet S10 SS themed youtube video, the video will have an average time of 30 minutes'
            },
            {
                'role': 'system',
                'content': 'focus on using slang and mannerisms to be more similar to the transcription form'
            },
            ...chunks.map((message) => {
                return {
                    'role': 'user',
                    'content': message
                }
            })                
        ],
    });

    if(fs.existsSync("summary.txt"))
        fs.rmSync("summary.txt");

    fs.appendFileSync("summary.txt", `${completion.data.choices[0].message.content}\r\n\r\n`);
}

function limitTokens(texts, maxTokens) {
    let tokenCount = 0;
    let limitedTexts = [];
    let currentText = '';
    let tokensCounts = 0;

    for (let text of texts) {
        if (tokensCounts + text.length < maxTokens) {
            limitedTexts.push(text.trim());
            tokensCounts += text.length;
        }
        else{
            break;
        }   
        
        //limitedTexts = [...new Set(limitedTexts)];
    }

    if (currentText.trim() !== '') 
        limitedTexts.push(currentText.trim());
    
    return limitedTexts;
}

listTranscritionsFiles();