# duplicatefix
Backend, fix for duplicates and missing metadata on new mints



- Token Smart Contract address

https://etherscan.io/address/0xd555498a524612c67f286df0e0a9a64a73a7cdc7#code

-  Backend Description

* First need to run node /backend/getowner.js

This code analyze the … nft transactions using quick node endpoint so get the existing NFTs and its owners.
Based on the existing nfts, this makes the duplicated nfts and available nfts mongodb database

The mongodb database will be nfts, availble id1, duplicated id1

* Second need to run node makemetadatas.js

This code make the new metadata model to prevent the nft duplication.
Change the duplicated nfts using availble ids, and make realmetadata.

* Third need to run node /backend/new.js

Provide the metadata api.
And in smart contract, the tokenURI is connected to this backend api

*** quick node api is saved in .env file
	So you need to input KEY to the .env file
	Current
 KEY = wss://proud-billowing-water.quiknode.pro/0a**************a08/
(ask for key if needed)

- If the problem occurred again, you can run those 3 steps again


