var { ethers } = require("ethers");
const mongoose = require("mongoose");
const db = 'mongodb://127.0.0.1:27017/local'
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        unique:true
    },
    ownednfts: {
        type: [Number],
    }
})
const nftSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    },
    owner: {
        type: String,
    }
})
const duplicateSchema = new mongoose.Schema({
    nftId: {
        type: Number,
        unique: true
    }
})
const availableSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    }
})

const nftModel = mongoose.model("NFT", nftSchema);
const duplicateModel = mongoose.model("Duplicated ID1", duplicateSchema);
const availableModel = mongoose.model("Availble ID1", availableSchema);

const fs = require('fs')
const { BigNumber } = require('bignumber.js');
// import { BigNumber } from "bignumber.js/bignumber.mjs";
const url = process.env.KEY;
var customWsProvider = new ethers.providers.WebSocketProvider(url);
require("dotenv").config();
const secretKey = process.env.KEY;
const wallet = new ethers.Wallet(secretKey);
const account = wallet.connect(customWsProvider)
const ABI = require("./defrogs.json");
const DefrogsContract = new ethers.Contract("0xd555498a524612c67f286dF0e0a9a64a73a7Cdc7", ABI, account);
let owners = {};
let remainedId  = []
let availableNFT = [];
let currentNFT = [];
let duplicated = [];


DefrogsContract.on("Transfer", async (from, to, id, event) => {
    const nftid = new BigNumber(id._hex).toNumber()
    let realid = nftid % 10000;
    if(from == ethers.constants.AddressZero){
        owners[nftid] = to;
        remainedId = remainedId.filter(item => item !== nftid);
        const newid = await nftModel.findOne({nftId: nftid});
        if(!newid){
            await nftModel.create({nftId: nftid, owner: to});
        }
        else{
            await nftModel.findOneAndUpdate({nftId: nftid, owner: to})
        }
        await availableModel.deleteOne({nftId: realid});
    }
    if(to == ethers.constants.AddressZero){
        // remainedId = remainedId.filter(item => item !== id);
        const newnft = await nftModel.findOne({nftId:nftid})
         
        if(newnft){
            await nftModel.deleteOne({nftId:nftid});
        }
        owners[nftid] = "";
        if(!remainedId.includes(nftid)){
            remainedId.push(nftid);
        }
        const availableid = await availableModel.findOne({nftId: realid})
        if(!availableid){
            await availableModel.create({nftId: realid});
        }
    }
    console.log(id, from, to)
    // fs.writeFile('./remained1.json', JSON.stringify(remainedId), err => console.log(err));
    // fs.writeFile('./owners1.json', JSON.stringify(owners), err => console.log(err));
})
async function getOwner(){
    for(j=1;j<=10000;j++){
        availableNFT.push(j)
        const existingId = await availableModel.findOne({nftId:j});
        if(!existingId){
            await availableModel.create({nftId :j})
        }
    }
    for(i=1; i < 88646; i++){
        let owner = ethers.constants.AddressZero;
        try{
            owner = await DefrogsContract.ownerOf(i);
        } catch(e){
            if(e != "Error: project ID request rate exceeded"){
                console.log(i)
            }
        }
        if(owner == ethers.constants.AddressZero){
            remainedId.push(i);
        }
        else{
            owners[i] = owner;
            const nftowner = await nftModel.findOne({nftId: i});
            if(nftowner){
                await nftModel.findOneAndUpdate({nftId: i, owner: owner})
            }
            else{
                await nftModel.create({nftId: i, owner: owner});
            }
        }
    }
    // fs.writeFile('./remained1.json', JSON.stringify(remainedId), err => console.log(err));
    // fs.writeFile('./owners1.json', JSON.stringify(owners), err => console.log(err));
    await calculateId();
}
async function calculateId(){
    const currentnfts = await nftModel.find();
    for(k in currentnfts){
        if(currentnfts[k].owner != ""){
            const id = currentnfts[k].nftId % 10000;
            if(currentNFT.includes(id)){
                duplicated.push(currentnfts[k].nftId);
                const currentduplicate = await duplicateModel.findOne({nftId: currentnfts[k].nftId})
                if(!currentduplicate){
                    await duplicateModel.create({nftId: currentnfts[k].nftId});
                }
            }
            currentNFT.push(id);
            if(availableNFT.includes(id)){
                await availableModel.deleteOne({nftId: id});
                availableNFT = availableNFT.filter(item => item !== id);
            }
        }
    }
    fs.writeFile('./nftids.json', JSON.stringify(currentNFT), err => console.log("nft", currentNFT.length));
    fs.writeFile('./availableids.json', JSON.stringify(availableNFT), err => console.log(availableNFT.length));
    fs.writeFile('./duplicated.json', JSON.stringify(duplicated), err => console.log(duplicated.length));
}
getOwner();