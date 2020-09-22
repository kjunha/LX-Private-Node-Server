require('dotenv').config();
var Web3 = require('web3');
const Migrations = artifacts.require("Migrations");
web3 = new Web3(new Web3.providers.HttpProvider(`http://${process.env.BC_HOST}:${process.env.BC_PORT}`))

module.exports = function(deployer) {
  web3.eth.personal.unlockAccount(process.env.CONTRACT_TESTER, process.env.TESTER_PWD, 36000);
  deployer.deploy(Migrations);
};
