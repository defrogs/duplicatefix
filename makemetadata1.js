const mongoose = require("mongoose");
const db = 'mongodb://127.0.0.1:27017/local'
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

  const nftSchema = new mongoose.Schema({
    nftId: {
        type: Number,
    },
    owner: {
        type: String,
    }
})
const MetadataSchema = new mongoose.Schema({
    nftId: {
        type: Number
    },
    metadata: mongoose.Mixed
})

const MetadataModel = mongoose.model("Metadata", MetadataSchema);
const RealMetadataModel = mongoose.model("RealMetadata2", MetadataSchema);
const nftModel = mongoose.model("NFT", nftSchema);
const fs = require('fs')

async function writeMetadata(){
    const currentnfts = await nftModel.find();
    const currentnftsLength = currentnfts.length;
    const availblenftsAmount = 10000-currentnftsLength-2;
    let maxNftId = 0;
    let i = 0;
    for(const nft of currentnfts){
        if (nft.nftId > maxNftId) {
            maxNftId = nft.nftId;
        }
        const metadata = await MetadataModel.findOne({nftId: i});
        await RealMetadataModel.create({nftId: nft.nftId, metadata: metadata.metadata});
        i++;
        console.log("generate realmetadata round1", nft.nftId);
    }

    i = i-1;

    for(j=0; j<=availblenftsAmount; j++) {
        const nftId = maxNftId + j - 1;
        const metadata = await MetadataModel.findOne({nftId: i});
        await RealMetadataModel.create({nftId: nftId, metadata: metadata.metadata});
        i++;
        console.log("generate realmetadata round2", nftId);
    }
}

writeMetadata();