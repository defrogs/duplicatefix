
# Duplicatefix

Backend, fix for duplicates and missing metadata on new mints

### Token Smart Contract

    https://etherscan.io/address/0xd555498a524612c67f286df0e0a9a64a73a7cdc7#code

### Backend Description

- First need to run node /backend/getowner.js

    This code analyze the nft transactions using quick node endpoint so get the existing NFTs and its owners.
    Based on the existing nfts, this makes the duplicated nfts and available nfts mongodb database.

- Second need to run node makemetadatas.js
    This code make the new metadata model to prevent the nft duplication.
    Change the duplicated nfts using availble ids, and make realmetadata.

- Third need to run node /backend/new.js
    Provide the metadata api.
    And in smart contract, the tokenURI is connected to this backend api

    quick node api is saved in .env file
***
    `KEY = quicknode api endpoint`
