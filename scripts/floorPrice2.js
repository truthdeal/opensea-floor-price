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

// NFT and update interval settings
let botConfig ;
let nftCollectionName ;
let updateInterval ;


async function getBotConfig() { 
  console.log('Getting bot config...');
  let _botConfig = JSON.parse(fs.readFileSync("./bot_config.json", "utf8"));

  return _botConfig ;
}

async function getFloorPrice(nftCollectionName) {
  const url = `https://api.opensea.io/api/v1/collection/${nftCollectionName}/stats`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    if (data) {
      const floorPrice = data.stats.floor_price;
      return floorPrice;
    } else {
      throw new Error("Collection not found.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function setFloorPrice (floorPrice_ ) {
  try {
    console.log(`\nSetting floor price to: ${floorPrice_} `);
    const tx = await mockOrackleContract.connect(account).setFloorPrice(floorPrice_);
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`Waiting for transaction to be mined...`);
    const receipt = await tx.wait();
    console.log(`Transaction mined!`);
    // console.log(`Transaction receipt: `);
    // console.log(receipt);

    return receipt ;
  }
  catch (error) {
    console.error("Error:", error.message);
  }
}

async function main() {
  let loopCount = 0;
  let _floorPrice = 0;
while (true) {
  loopCount += 1;

  console.log('loopCount: ' + loopCount +" \n") ;

  botConfig = await getBotConfig() ;
  nftCollectionName = botConfig.nftCollectionName;
  updateInterval = botConfig.updateInterval;
  updateInterval = updateInterval * 60 * 1000; // convert to milliseconds

  _floorPrice = await getFloorPrice(nftCollectionName);
  _floorPrice = ethers.utils.parseEther(_floorPrice.toString());

  let receipt = await setFloorPrice(_floorPrice);


  console.log('\nWaiting for '+ updateInterval/60000+' minutes... \n\n');

  await new Promise((resolve) => setTimeout(resolve, updateInterval));
 }

}

main();

