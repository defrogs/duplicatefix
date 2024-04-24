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
const MetadataModel = mongoose.model("Metadata", MetadataSchema);
const RealMetadataModel = mongoose.model("RealMetadata1", MetadataSchema);

const nftModel = mongoose.model("NFT", nftSchema);
const duplicateModel = mongoose.model("Duplicated ID1", duplicateSchema);
const availableModel = mongoose.model("Availble ID1", availableSchema);
const fixedModel = mongoose.model("Fixed ID1", fixedSchema);


const fs = require('fs')


async function calculateId(){
    let availableNFT = [];
    let currentNFT = [];
    let duplicated = [];
    await availableModel.deleteMany();
    await duplicateModel.deleteMany();
    for(j=1;j<=10000;j++){
        availableNFT.push(j)
        const existingId = await availableModel.findOne({nftId:j});
        if(!existingId){
            await availableModel.create({nftId :j})
        }
    }
    console.log("start")
    const currentnfts = await nftModel.find();
    console.log(currentnfts.length)
    for(k in currentnfts){
        if(currentnfts[k].owner != ""){
            let id = currentnfts[k].nftId % 10000;
            if(id==0){
                id=10000;
            }
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
    await writeMetadata();
}
// getOwner();
calculateId();

async function writeMetadata(){
    const currentnfts = await nftModel.find();
    for(k in currentnfts){
        const id = currentnfts[k].nftId;
        let realId = id % 10000;
        if(realId == 0){
            realId = 10000;
        }
        const metadata = await MetadataModel.findOne({nftId: (realId - 1)})
        await RealMetadataModel.create({nftId: id, metadata: metadata.metadata});
        fs.writeFile(`./metadata/${id}.json`, JSON.stringify(metadata.metadata), err => console.log(id))
    }
    const duplicatednfts = await duplicateModel.find();
    let availablenfts = await availableModel.find();
    for(i in duplicatednfts){
        const d_id = duplicatednfts[i].nftId;
        const a_id = availablenfts[i].nftId;
        const newmetadata = await MetadataModel.findOne({nftId: (a_id - 1)});
        fs.writeFile(`./metadata/${d_id}.json`, JSON.stringify(newmetadata.metadata), err => console.log(d_id))
        await RealMetadataModel.findOneAndUpdate({nftId: d_id, metadata: newmetadata.metadata});
        await fixedModel.create({nftId: d_id, fixedId: a_id});
        await availableModel.deleteOne({nftId: a_id});
    }
    availablenfts = await availableModel.find();
    const a_length = availablenfts.length;
    for(u=0; u<a_length; u++){
        const n_id = 88331  + Number(u) + 1;
        let r_id = n_id % 10000;
        if(r_id == 0){
            r_id = 10000;
        }
        const available = await availableModel.findOne({nftId: r_id});
        if(available){
            const data = await MetadataModel.findOne({nftId: r_id});
            await RealMetadataModel.create({nftId: n_id, metadata: data.metadata});
            await availableModel.deleteOne({nftId: r_id});
            fs.writeFile(`./metadata/${n_id}.json`, JSON.stringify(data.metadata), err => console.log(n_id))
        }
        else{
            const data = await MetadataModel.findOne({nftId: availablenfts[0].nftId});
            await RealMetadataModel.create({nftId: n_id, metadata: data.metadata});
            await fixedModel.create({nftId: n_id, fixedID: availablenfts[0].nftId});
            await availableModel.deleteOne({nftId: availablenfts[0].nftId});
            fs.writeFile(`./metadata/${n_id}.json`, JSON.stringify(data.metadata), err => console.log(n_id))
        }
        availablenfts = await availableModel.find();
        console.log(n_id);
    }
    // for(n in availablenfts){
    //     const n_id = availablenfts[n].nftId;
    //     const n_metadata = await MetadataModel.findOne({nftId: (n_id - 1)});

    //     await fixedModel.create({nftId: (85112 + Number(n) + 1), fixedId: n_id});
    //     fs.writeFile(`./metadata/${(85112 + Number(n) + 1)}.json`, JSON.stringify(n_metadata.metadata), err => console.log(n_id))
    //     await availableModel.deleteOne({nftId: n_id});
    // }
    // console.log(availablenfts.length)
}
// 87183
// 2071
// writeMetadata();

