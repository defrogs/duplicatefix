require('dotenv').config();
var { ethers } = require("ethers");
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const log = require('./logger')();
const fs = require('fs');
const middlewares = require('./middlewares');

const app = express();

const mongoose = require("mongoose");
const db = 'mongodb://127.0.0.1:27017/local'
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

const nftSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    },
    owner: {
        type: String,
    }
})
const availableSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    }
})
const fixedSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    },
    fixedId: {
        type: Number, 
    }
})

const MetadataSchema = new mongoose.Schema({
    nftId: {
        type: Number
    },
    metadata: mongoose.Mixed
})
const RealMetadataModel = mongoose.model("RealMetadata2", MetadataSchema);

const nftModel = mongoose.model("NFT", nftSchema);
const availableModel = mongoose.model("Availble ID1", availableSchema);
const fixedModel = mongoose.model("Fixed ID1", fixedSchema);

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

DefrogsContract.on("Transfer", async (from, to, id, event) => {
    const nftid = new BigNumber(id._hex).toNumber()
    let realid = nftid % 10000;
    let a_ids;
    if(realid == 0){
        realid = 10000;
    }
    if(from == ethers.constants.AddressZero){
        owners[nftid] = to;
        // remainedId = remainedId.filter(item => item !== nftid);
        const newid = await nftModel.findOne({nftId: nftid});
        if(!newid){
            await nftModel.create({nftId: nftid, owner: to});
        }
        else{
            await nftModel.findOneAndUpdate({nftId: nftid, owner: to})
        }
        const available = await availableModel.findOne({nftId: realid});
        if(available){
            await availableModel.deleteOne({nftId: realid});
        }
        else{
            a_ids = await availableModel.find();
            if (a_ids.length > 0) { // Check if a_ids is not empty
                const a_id = a_ids[0].nftId;
                await fixedModel.create({nftId: nftid, fixedId: a_id});
                await availableModel.deleteOne({nftId: a_id});
            } else {
                console.log('No available IDs found in database');
            }
        }
    }
    if(to == ethers.constants.AddressZero){
        const newnft = await nftModel.findOne({nftId:nftid})
        if(newnft){
            await nftModel.deleteOne({nftId:nftid});
        }
        owners[nftid] = "";
        const f_id = await fixedModel.findOne({nftId: nftid});
        if(f_id){
            await availableModel.create({nftId: f_id.fixedId});
        }
        else{
            await availableModel.create({nftId: realid});
        }
        // const availableid = await availableModel.findOne({nftId: realid})
        // if(!availableid){
        //     await availableModel.create({nftId: realid});
        // }
    }
    console.log(id, from, to)
})

app.get('/', (req, res) => {
    res.json({
        message: '🌈🦄✨👋🌎🌍🌏👋✨🦄🌈'
    });
});

app.get('/metadatas/:filename', async(req, res) => {
    let filename = req.params.filename;
    filename = filename.replace('.json', '');

    if (!/^\d+$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename. Filename must be a number.' });
    }

    const metadata = await RealMetadataModel.findOne({nftId: filename});
    if (metadata) {
        res.json(metadata.metadata);
    } else {
        res.status(404).json({ error: 'Metadata not found' });
    }
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    /* eslint-disable no-console */
    log.info(`Listening: http://localhost:${PORT}`);
    /* eslint-enable no-console */
});