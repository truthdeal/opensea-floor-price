const axios = require("axios");
const ethers = require("ethers");
const fs = require("fs");

require("dotenv").config();

const {  PRIVATE_KEY , MUMBAI_API_URL} = process.env;

const provider = new ethers.providers.JsonRpcProvider(MUMBAI_API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY);
const account = wallet.connect(provider);

const MockOrackle = require('../artifacts/contracts/MockOracle.sol/MockOracle.json');
const mockOracleContractAddress = "0xe4d10Bd0E0597710B946355D6DA68266144ca7b2";
const mockOrackleContract = new ethers.Contract(mockOracleContractAddress, MockOrackle.abi, provider);

const StrikePool = require('../artifacts/contracts/IStrikePool.sol/IStrikePool.json') ;
const strikePoolContractAddress = "0xf393269f4Ed2DcB3484202aE39325B576fC56684" ;
const strikePoolContract = new ethers.Contract(strikePoolContractAddress, StrikePool.abi, provider) ;

// NFT and update interval settings are coming from the bot_config.json file
// NFT collection name after the opensea.io/collection/ part for example: https://opensea.io/collection/milady
// updateInterval is in minutes

let botConfig ;
let nftCollectionName ;
let updateInterval ;



async function getFloorPrice(nftCollectionName) {
  console.log('\nGetting floor price...');
  const url = `https://api.opensea.io/api/v1/collection/${nftCollectionName}/stats`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    if (data) {
      const floorPrice = data.stats.floor_price;
      console.log(`Floor Price: ${floorPrice} ETH \n`);
      return floorPrice;
    } else {
      throw new Error("Collection not found.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}


async function getEpoch() {
    console.log('Getting Epoch...');
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


async function setFloorPriceWithEpoch (floorPrice, epoch) {

    try {
        console.log(`\nSetting floor price to ${floorPrice} for epoch ${epoch}`);
        const tx = await strikePoolContract.connect(account).setFloorPriceAt(epoch, floorPrice);
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
    let _floorPrice = 0;
    let _epoch = 0;


while (true) {

    loopCount += 1;

    console.log('loopCount: ' + loopCount +" \n") ;

    botConfig = await getBotConfig() ;
    nftCollectionName = botConfig.nftCollectionName;
    updateInterval = botConfig.updateInterval;
    updateInterval = updateInterval * 60 * 1000; // convert to milliseconds


    _floorPrice = await getFloorPrice(nftCollectionName);
    _floorPrice = ethers.utils.parseEther(_floorPrice.toString());

    _epoch = await getEpoch() ;

    let receipt = await setFloorPriceWithEpoch(_floorPrice, _epoch) ;
    
    console.log('\nWaiting for '+ updateInterval/60000+' minutes... \n\n');
    
    await new Promise((resolve) => setTimeout(resolve, updateInterval));
 }







}

main();

