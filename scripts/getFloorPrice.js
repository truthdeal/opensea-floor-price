const axios = require("axios");
const ethers = require("ethers");
require("dotenv").config();

const {  PUBLIC_KEY , PRIVATE_KEY , MUMBAI_API_URL} = process.env;

const provider = new ethers.providers.JsonRpcProvider(MUMBAI_API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY);
const account = wallet.connect(provider);

const MockOrackle = require('../artifacts/contracts/MockOracle.sol/MockOracle.json');
const mockOracleContractAddress = "0xe4d10Bd0E0597710B946355D6DA68266144ca7b2";
const mockOrackleContract = new ethers.Contract(mockOracleContractAddress, MockOrackle.abi, provider);

// NFT and update interval settings
const nftCollectionName = "milady"; // NFT collection name after the opensea.io/collection/ part for example: https://opensea.io/collection/milady
let updateInterval = 20; // 20 minutes


updateInterval = updateInterval * 60 * 1000; // convert to milliseconds

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

async function main() {
    let epoch = 0;
    let _floorPrice = 0;
while (true) {
    epoch += 1;

  console.log('Epoch: ' + epoch) ;
  console.log('Getting floor price...');
  try {
    _floorPrice = await getFloorPrice(nftCollectionName);
    console.log(`Floor Price: ${_floorPrice} in loop ${epoch}`);
  }
  catch (error) {
    console.error("Error:", error.message);
  }

    _floorPrice = ethers.utils.parseEther(_floorPrice.toString());

    try {
        console.log(`Setting floor price to ${_floorPrice} for epoch ${epoch}`);
        const tx = await mockOrackleContract.connect(account).setFloorPrice(_floorPrice);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log(`Waiting for transaction to be mined...`);
        const receipt = await tx.wait();
        console.log(`Transaction mined!`);
       // console.log(`Transaction receipt: `);
       // console.log(receipt);
    }
    catch (error) {
        console.error("Error:", error.message);
    }
    console.log(``);
    console.log('Waiting for '+ updateInterval/60000+' minutes...');
    console.log(``);
    console.log(``);
    await new Promise((resolve) => setTimeout(resolve, updateInterval));
 }

}

main();

