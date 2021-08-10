const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 6000;

const TEXT_URL = "http://norvig.com/big.txt";
const API_KEY = "dict.1.1.20210216T114936Z.e4989dccd61b9626.373cddfbfb8a3b2ff30a03392b4e0b076f14cff9";
const DETAILS_URL = `https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${API_KEY}&lang=en-ru&text=`;

const getAllWords = (text) => text.toLowerCase().replace(/[\.]+/g, " ").split(" ").filter(Boolean);

const setWordsWithOccurences = (words) =>
    words.reduce((acc, curr) => {
        acc[curr] = acc[curr] ? ++acc[curr] : 1;
        return acc;
    }, {});

const sortWordsWithCount = (wordsWithCount) => Object.entries(wordsWithCount).sort(({ 1: a }, { 1: b }) => b - a);

const setWordDetails = (detail, word) => {
    let wordDetail = {
        word: word[0],
        output: {
            count: word[1],
            synonyms: [],
            pos: [],
        },
    };

    if (detail.def.length) {
        for (let def of detail.def) {
            if (def.tr) {
                for (let tr of def.tr) {
                    wordDetail.output.synonyms.push(tr.text);
                    wordDetail.output.pos.push(tr.pos);
                }
            }
        }
    }

    return wordDetail;
};

app.listen(PORT, async () => {
    console.log(`server started @${PORT}`);

    /** 1. Fetched document from given url */
    const text = await fetch(TEXT_URL).then((res) => res.text());

    /** 2. a) Find occurences count of words */
    let words = getAllWords(text);
    let wordsWithCount = setWordsWithOccurences(words);

    /** 2. b) taken top 10 words */
    let topWordsObj = sortWordsWithCount(wordsWithCount);
    topWordsObj.length = 10;

    
    let wordsList = { words: [] };

    /** 2. b) i) & ii) fetch details of each each word */
    for (let word of topWordsObj) {
        let detail = await fetch(`${DETAILS_URL}${word[0]}`).then((res) => res.json());        
        wordsList.words.push(setWordDetails(detail, word));
    }

    /** 3. show words in json format */
    console.log('-----------------');
    console.log(JSON.stringify(wordsList));
    console.log('-----------------');
});
