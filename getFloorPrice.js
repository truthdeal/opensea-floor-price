const axios = require("axios");
const ethers = require("ethers");

require("dotenv").config();


const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);


const contractAddress = "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7";
const abi = [];

const contract = new ethers.Contract(contractAddress, abi, provider);



const collectionSlug = "boredapeyachtclub";

async function getFloorPrice(collectionSlug) {
  const url = `https://api.opensea.io/api/v1/collection/${collectionSlug}/stats`;

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
    let i = 0;
while (true) {
    i += 1;
  getFloorPrice(collectionSlug)
    .then((floorPrice) => {
      console.log(`Floor Price: ${floorPrice} in loop ${i}`);
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });

    await new Promise((resolve) => setTimeout(resolve, 250));
}

}

main();

