const axios = require("axios");
const ethers = require("ethers");
const fs = require("fs");

require("dotenv").config();

const {  PRIVATE_KEY , MUMBAI_API_URL} = process.env;

const provider = new ethers.providers.JsonRpcProvider(MUMBAI_API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY);
const account = wallet.connect(provider);


const StrikePool = require('../artifacts/contracts/IStrikePool.sol/IStrikePool.json') ;
const strikePoolContractAddress = "0xf393269f4Ed2DcB3484202aE39325B576fC56684" ;
const strikePoolContract = new ethers.Contract(strikePoolContractAddress, StrikePool.abi, provider) ;


// Strike prices array and update interval can be changed in bot_config.json file

let botConfig ;
let updateInterval ;
let strikePriceArray ;




async function getEpoch() {
    console.log('\nGetting Epoch...');
    try {
        const epoch = await strikePoolContract.getEpoch_2e() ;
        console.log(`Epoch: ${epoch}`);
        return epoch ;
    }
    catch (error) {
        console.error("Error:", error.message);
    }
}

async function getBotConfig() { 
    console.log('Getting bot config...');
    let _botConfig = JSON.parse(fs.readFileSync("./bot_config.json", "utf8"));

    return _botConfig ;
}

async function setStrikePrices(epoch_, strikePriceArray_) {
    console.log('\nSetting strike prices at epoch: ' + epoch_ + ' with strike prices: ' + strikePriceArray_);
    try {
        const tx = await strikePoolContract.connect(account).setStrikePriceAt(epoch_, strikePriceArray_) ;
        console.log(`Transaction hash: ${tx.hash}`);
        console.log(`\nWaiting for transaction to be mined...`);
        const receipt = await tx.wait();
        console.log(`Transaction mined! \n`);
        //console.log(`Transaction receipt: `);
        //console.log(receipt);

        return receipt ;
    }
    catch (error) {
        console.error("Error:", error.message);
    }
}


async function main() {
    let loopCount = 0;
    let _epoch = 0;


while (true) {

    loopCount += 1;

    console.log('loopCount: ' + loopCount +" \n") ;

    botConfig = await getBotConfig() ;
    strikePriceArray = botConfig.strikePriceArray;
    updateInterval = botConfig.updateInterval;
    updateInterval = updateInterval * 60 * 1000; // convert to milliseconds

    console.log('Strike prices: ' + strikePriceArray);

    _epoch = await getEpoch() ;

    let receipt = await setStrikePrices(_epoch, strikePriceArray) ;
    
    console.log('\nWaiting for '+ updateInterval/60000+' minutes... \n\n');
    
    await new Promise((resolve) => setTimeout(resolve, updateInterval));
 }







}

main();

