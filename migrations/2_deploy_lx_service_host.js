const LXServiceHost = artifacts.require("LXServiceHost");

module.exports = function(deployer) {
  deployer.deploy(LXServiceHost);
};
