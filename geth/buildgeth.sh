cp build/bin/geth /usr/local/bin
cp build/bin/bootnode /usr/local/bin
mkdir keystore
cat << EOF > ./keystore/UTC--2020-07-13T09-59-54.417042300Z--3680aa2a54e7abd62bf65077b8630e4f4e16aafd
{"address":"3680aa2a54e7abd62bf65077b8630e4f4e16aafd","crypto":{"cipher":"aes-128-ctr","ciphertext":"22e587e8664e114a075a009c81a900cb65dde71131da266ef6713c974f5b6b74","cipherparams":{"iv":"15e1033f10440a8fc93aab2a1bda3794"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"f3442fdadd17267d7dfac407819befec25da0c2d16330076f73964b8e6844a19"},"mac":"b4bad8e6fb59b7138a706133b5e0052ce2b2e8494e683fc82c7748435c95d436"},"id":"2bafca22-2c5d-46c0-a68b-feedf8d17ff7","version":3}
EOF
geth --datadir . init genesis.json
