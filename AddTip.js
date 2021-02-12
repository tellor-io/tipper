/**************************Add Tip to my request id********************************************/

//                Tip my request id on Tellor                                  //

/******************************************************************************************/
// node TellorMonitor/01_tip_apl.js network myid

require('dotenv').config()
//environment variables
const core = require('@actions/core')
const github = require('@actions/github')
const network = core.getInput('network')
const dataId = core.getInput('myId')

const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')

var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')
console.log('network',network)

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
        const gasPriceNow = await jsonData.fast * 1;
        const gasPriceNow2 = await (gasPriceNow) * 1000000000;
        return (gasPriceNow2);
    } catch (e) {
        throw Error(e);
    }
}


let run = async function (net, myid) {
    try {
        if (net == "mainnet") {
            var network = "mainnet"
            var etherscanUrl = "https://etherscan.io"
            var tellorMasterAddress = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'
            var pubAddr = process.env.ETH_PUB
            var privKey = process.env.ETH_PK
            //var provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_NODE)
            const url = new URL(process.env.MAINNET_NODE);
            var urlInfo = {
                url: url.href,
                user: url.username,
                password: url.password,
                allowInsecureAuthentication: true
            };
            var provider = new ethers.providers.JsonRpcProvider(urlInfo)



        } else if (net == "rinkeby") {
            var network = "rinkeby"
            var etherscanUrl = "https://rinkeby.etherscan.io"
            var tellorMasterAddress = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'
            var pubAddr = process.env.RINKEBY_ETH_PUB
            var privKey = process.env.RINKEBY_ETH_PK
            var provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_NODE)
            
        } else {
           console.log( "network not defined")
        }

        console.log("Tellor Address: ", tellorMasterAddress)
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
        let wallet = new ethers.Wallet(privKey, provider);
        var cwd = console.log(process.cwd())

        var fs = require('fs');
        var files = fs.readdirSync(cwd);

        let abi = await loadJsonFile(path.join(".", "..", "abi", "tellor.json"))
        let contract = new ethers.Contract(tellorMasterAddress, abi, provider);
        var contractWithSigner = contract.connect(wallet);

    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }


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
        //check it is not already on queue and if not then tip
        var reqIds = await contractWithSigner.getTopRequestIDs()
        console.log("reqIds", reqIds)
        var x = reqIds.length
        var inQ = 0
        var i = 0
            if (x >0){            
                while ( i<x){
                    console.log("myid", myid)
                    if (myid == reqIds[i]*1) {
                        console.log("reqIds[i]", i, reqIds[i]*1 )
                        inQ++
                        console.log("inQ?", inQ*1)
                        } 
                    i++
                    console.log("i", i)
                    if(inQ > 0){
                        break
                    }
                }
           }
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    if (inQ ==0) {
        if (gasP != 0 && txestimate < balNow && ttbalanceNow > 1 ) {
        console.log("Send request for requestId: ", myid)
            try {
                var gasP = await fetchGasPrice()
                let tx = await contractWithSigner.addTip(myid, 1, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
                var link = "".concat(etherscanUrl, '/tx/', tx.hash)
                var ownerlink = "".concat(etherscanUrl, '/address/', tellorMasterAddress)
                console.log('Yes, a request was sent for requId: ', myid)
                console.log("Hash link: ", link)
                console.log("Contract link: ", ownerlink)
                console.log('Waiting for the transaction to be mined');
                await tx.wait() // If there's an out of gas error the second parameter is the receipt.
            } catch (error) {
                console.error(error)
                process.exit(1)
            }
        console.log("myId was tipped. reqId: ", myid)
        process.exit()
        }
        console.error('Not enough balance');
        process.exit(1)
    } else {
    console.log("Your req id is already on queue", myid)
    process.exit()
    }
}

// run(process.argv[2],process.argv[3])
run(network, dataId)