/**************************Send Tellor's AMPL price to AMPL********************************************/

//                Send Tellor's AMPL price to AMPL                                 //

/******************************************************************************************/
//node AMPL/02_pushTellor.js network

require('dotenv').config()
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')



var _UTCtime  = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit= 400000

console.log(_UTCtime)
console.log('<https://www.etherchain.org/api/gasPriceOracle>')
console.log('network',process.argv[2])


function sleep_s(secs) {
  secs = (+new Date) + secs * 1000;
  while ((+new Date) < secs);
}

//https://ethgasstation.info/json/ethgasAPI.json
//https://www.etherchain.org/api/gasPriceOracle
async function fetchGasPrice() {
  const URL = `https://www.etherchain.org/api/gasPriceOracle`;
  try {
    const fetchResult = fetch(URL);
    const response = await fetchResult;
    const jsonData = await response.json();
    const gasPriceNow = await jsonData.fast*1;
    const gasPriceNow2 = await (gasPriceNow)*1000000000;
    console.log(jsonData);
    return(gasPriceNow2);
  } catch(e){
    throw Error(e);
  }
}



let run = async function (net) {
    try {
        if (net == "mainnet") {
            var network = "mainnet"
            var etherscanUrl = "https://etherscan.io"
            var tellorMasterAddress = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'
            var AMPLInterAddress = "???"
            var pubAddr = process.env.ETH_PUB
            var privKey = process.env.ETH_PK
        } else if (net == "rinkeby") {
            var network = "rinkeby"
            var etherscanUrl = "https://rinkeby.etherscan.io"
            var tellorMasterAddress = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'
            var AMPLInterAddress = "0x1960f02aAC4fFd27A4439a0Fd8B9b6fc4dC01489"
            var pubAddr = process.env.RINKEBY_ETH_PUB
            var privKey = process.env.RINKEBY_ETH_PK
            
        } else {
            console.log("network not defined")
        }
        var infuraKey = process.env.INFURA_TOKEN
        console.log("infuraKey", infuraKey)
        console.log("Tellor Address: ", tellorMasterAddress)
        console.log("Tellor Address: ", AMPLInterAddress)
        console.log("nework", network)
    } catch (error) {
        console.error(error)
        console.log("network error or environment not defined")
        process.exit(1)
    }




    try {
        var gasP = await fetchGasPrice()
        console.log("gasP1", gasP)
    } catch (error) {
        console.error(error)
        console.log("no gas price fetched")
        process.exit(1)
    }


    try {
        var provider = ethers.getDefaultProvider(network, infuraKey);
        var wallet = new ethers.Wallet(privKey, provider);
        let abi = await loadJsonFile(path.join("abi", "tellor.json"))
        let contract = new ethers.Contract(tellorMasterAddress, abi, provider);
        var contractWithSigner = contract.connect(wallet);

    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }


    try{
        var balNow = ethers.utils.formatEther(await provider.getBalance(pubAddr))
        console.log("Requester Address", pubAddr)   
        console.log("Requester ETH Balance",  balNow)

        var ttbalanceNow = ethers.utils.formatEther(await contractWithSigner.balanceOf(pubAddr))
        console.log('Tellor Tributes balance', ttbalanceNow)
        var txestimate = (gasP * gas_limit / 1e18);
        console.log("txestimate", txestimate)
    } catch(error) {
        console.error(error);
        process.exit(1)
    }
    
    if (gasP != 0 && txestimate < balNow ) {
        try{
            
            let abiAmpl = await loadJsonFile(path.join("abi", "abiAmplIntermediate.json"))
            let amplInter = new ethers.Contract(AMPLInterAddress, abiAmpl, provider);
            var amplIntertWithSigner = amplInter.connect(wallet);
            console.log("await instating AMPL intermediate contract")
        } catch(error) {
            console.error(error)
            console.log("AMPL intermediate contract not instantiated")
            process.exit(1)
        }


    /*****Get AMPL last mine time*******/
    // let offset = -240 //Timezone offset for EST in minutes.
    // let amplCount = await tellorMaster.getNewValueCountbyRequestId(10)
    // let amplTime = await tellorMaster.getTimestampbyRequestIDandIndex(10, amplCount - 1) //will this work with a zero index? (or insta hit?)

    // let amplTimefromLastTimestamp = (Date.now())/1000 - web3.utils.hexToNumberString(amplTime)
    // var amplHowlong = (amplTimefromLastTimestamp)/60
    // console.log("It has been ", amplHowlong.toFixed(2), " minutes since AMPL was last mined");
  


    /*****END Get AMPL last request*******/

    //    if (amplHowlong < 15) {
            console.log("Push AMPL")
            try{
                let tx = await amplIntertWithSigner.pushTellor({ from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
                var link = "".concat(etherscanUrl, '/tx/', tx.hash)
                var ownerlink = "".concat(etherscanUrl, '/address/', pubAddr)
                    console.log('Yes, a request was sent for the APML price')
                    console.log("Hash link: ", link)
                    console.log("Sender address: ", ownerlink)
            } catch(error) {
                console.error(error)
                process.exit(1)
            }
            console.log("AMPL was pushed to medianizer")
        // } else {
        //     console.log("AMPL has not been mined yet")
        // }
    }
    process.exit()

}

run(process.argv[2])


