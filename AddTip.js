/**************************Add Tip to my request id********************************************/

//                Tip my request id on Tellor                                  //

/******************************************************************************************/

require('dotenv').config()
//environment variables
const core = require('@actions/core')
const github = require('@actions/github')
const network = core.getInput('network')
const queryId = core.getInput('requestID')
const dataFreshness = core.getInput('dataFreshness')

//libraries
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')
var parse = require('parse-duration')

//current date and gas limit
var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

//addresses
var tellorMasterAddress = '0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0'

//print out current time, gas price, and network
console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')
console.log('network',network)

function sleep_s(secs) {
    //sleep for "secs" number of seconds
    secs = (+new Date) + secs * 1000;
    while ((+new Date) < secs);
}

async function fetchGasPrice() {
    //returns gas price as retrived from etherchain
    const URL = `https://www.etherchain.org/api/gasPriceOracle`;
    try {
        const fetchResult = fetch(URL);
        const response = await fetchResult;
        const jsonData = await response.json();
        const baseFee = await jsonData.recommendedBaseFee;
        const gasPriceNow = await jsonData.fast * 1 + baseFee;
        const gasPriceNow2 = await (gasPriceNow) * 1000000000;
        return (gasPriceNow2);
    } catch (e) {
        throw Error(e);
    }
}


let run = async function (net, queryId) {
    /* 
    Requests a tip data type for miners to mine
    Sends TRB tip amount to miner network
    */
    try {
        //connect to network
        if (net == "mainnet") {
            var tellorLensAddress = '0x577417CFaF319a1fAD90aA135E3848D2C00e68CF'
            var network = "mainnet"
            var etherscanUrl = "https://etherscan.io"
            var pubAddr = process.env.PUBLIC_KEY
            var privKey = process.env.PRIVATE_KEY
            var provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_NODE)
            
            
            
        } else if (net == "rinkeby") {
            var tellorLensAddress = '0xebEF7ceB7C43850898e258be0a1ea5ffcdBc3205'
            var network = "rinkeby"
            var etherscanUrl = "https://rinkeby.etherscan.io"
            var pubAddr = process.env.PUBLIC_KEY
            var privKey = process.env.PRIVATE_KEY
            var provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_NODE)
            
        } else if (net == "goerli") {
            var network = "goerli"
            // var tellorMasterAddress = "0x20374E579832859f180536A69093A126Db1c8aE9"
            var etherscanUrl = "https://goerli.etherscan.io"
            var pubAddr = process.env.PUBLIC_KEY
            var privKey = process.env.PRIVATE_KEY
            var provider = new ethers.providers.JsonRpcProvider(process.env.GOERLI_NODE)
        }
        else {
            console.log( "network not defined")
        }
        
        console.log("Tellor Address: ", tellorMasterAddress)
        console.log("network: ", network)
    } catch (error) {
        console.error(error)
        console.log("network error or environment not defined")
        process.exit(1)
    }
    
    //fetch gas price
    try {
        var gasP = await fetchGasPrice()
        console.log("gasP1", gasP)
    } catch (error) {
        console.error(error)
        console.log("no gas price fetched")
        process.exit(1)
    }
    
    //connect to wallet and tellor contract
    try {
        let wallet = new ethers.Wallet(privKey, provider);
        let abi = await loadJsonFile(path.join("abi", "tellor.json"))
        let lensAbi = await loadJsonFile(path.join("abi", "abiTellorLens.json"))
        var contract = new ethers.Contract(tellorMasterAddress, abi, provider);
        var lens = new ethers.Contract(tellorLensAddress, lensAbi, provider);
        var contractWithSigner = contract.connect(wallet);
        
    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }
    
    //print wallet's TRB balance
    try {
        var balNow = ethers.utils.formatEther(await provider.getBalance(pubAddr))
        console.log("Requests Address", pubAddr)
        console.log("Requester ETH Balance", balNow)
        var ttbalanceNow = ethers.utils.formatEther(await contractWithSigner.balanceOf(pubAddr))
        console.log('Tellor Tributes balance', ttbalanceNow)
        var txestimate = (gasP * gas_limit / 1e18);
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    
    try {
        //check if queryId has been recently tipped
        let lastTip = lens.getCurrentValue(queryId)
        let tippingTime = lastTip._timestampRetrieved
        //If less time has passed than the longest desired wait period, exit with friendly message
        if (new Date() - tippingTime < parse(dataFreshness)) {
            console.log("No need to tip! There is fresh data on queryId " + queryId)
            process.exit()
        }
        //if last tip is fresh enough, exit without tipping
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    //     try {
    //         //check it is not already on queue and if not then tip
    //         var reqIds = await contractWithSigner.getTopqueryIds()
    //         console.log("reqIds", reqIds)
    //         var x = reqIds.length
    //         var inQ = 0
    //         var i = 0
    //             if (x >0){            
    //                 while ( i<x){
    //                     console.log("queryId", queryId)
    //                     if (queryId == reqIds[i]*1) {
    //                         console.log("reqIds[i]", i, reqIds[i]*1 )
    //                         inQ++
    //                         console.log("inQ?", inQ*1)
    //                         } 
    //                     i++
    //                     console.log("i", i)
    //                     if(inQ > 0){
    //                         break
    //                     }
    //                 }
    //            }
    //     } catch (error) {
    //         console.error(error)
    //         process.exit(1)
    //     }
    
    //send tip if balance is sufficient
    if (gasP != 0 && txestimate < balNow && ttbalanceNow > 1 ) {
        console.log("Send request for queryId: ", queryId)
        try {
            var gasP = await fetchGasPrice()
            let tx = await contractWithSigner.addTip(queryId, 1, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
            var link = "".concat(etherscanUrl, '/tx/', tx.hash)
            var ownerlink = "".concat(etherscanUrl, '/address/', tellorMasterAddress)
            console.log('Yes, a request was sent for requId: ', queryId)
            console.log("Hash link: ", link)
            console.log("Contract link: ", ownerlink)
            console.log('Waiting for the transaction to be mined');
            await tx.wait() // If there's an out of gas error the second parameter is the receipt.
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
        console.log("queryId was tipped. queryId: ", queryId)
        process.exit()
    }
    console.error('Not enough balance');
    process.exit(1)
}

run(network, queryId)
