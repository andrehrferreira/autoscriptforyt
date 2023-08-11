import natural from "natural";
import fs from "fs";
import { glob } from "glob";
import _ from "lodash";
const tfidf = new natural.TfIdf();

let transcriptions = [];

async function listTranscritionsFiles(){
    const files = await glob("./transcriptions/*.txt");

    for(let file of files){
        console.log(`Carregando arquivo ${file}...`)
        const transcription = fs.readFileSync(file, "utf-8");
        tfidf.addDocument(transcription);
        transcriptions = [...transcriptions, ...transcription.split("\n")];
    }

    await createScores();
}

async function createScores(){
    let tokenScores = {};
    for (let i = 0; i < tfidf.documents.length; i++) {
        let items = Object.keys(tfidf.documents[i]);
        items.forEach((item) => {
            let score = tfidf.tfidf(item, i);

            if (!tokenScores[item] && !thisStringIsNumber(item)) 
                tokenScores[item] = score;
        });
    }

    // Contar a frequência dos tokens
    let tokenFrequencies = _.countBy(transcriptions.join(' ').split(' '));

    // Ordenar os tokens pela frequência e pelo score TF-IDF
    let sortedTokens = Object.keys(tokenScores).sort((a, b) => {
        let frequencyDifference = tokenFrequencies[b] - tokenFrequencies[a];

        if (frequencyDifference === 0) 
            return tokenScores[b] - tokenScores[a];
        else
            return frequencyDifference;
    });

    // Selecionar os tokens até que o limite seja atingido
    let selectedTokens = [];
    let tokenCount = 0;
    for (let token of sortedTokens) {
        if(token !== "__key"){
            if (tokenCount + token.split(' ').length > 16385) {
                break;
            }
            selectedTokens.push(token);
            tokenCount += token.split(' ').length;
        }
    }

    console.log(selectedTokens);
}

function thisStringIsNumber(str) {
    let num = parseInt(str);
    return (!isNaN(num) && num > 0);
}

listTranscritionsFiles();