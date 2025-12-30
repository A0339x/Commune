// Fix isEarlyAdopter field in holder-profiles.json using verified Dune data
const fs = require('fs');
const path = require('path');

// Load holder profiles
const profilesPath = path.join(__dirname, '../holder-profiles.json');
const data = require(profilesPath);

// The verified first 100 holders from Dune
const duneFirst100 = new Set([
  '0x6233fcb52e6d9a401c1fb57a6e46805c6ebdbad7',
  '0xae377f72eee8d6332b0b2ec319dcaef942317050',
  '0x3e422aa13fa3058fd265eef026a8c692170556ed',
  '0x1fe414f05ee639f5c4c718544763bcece739b4c5',
  '0x937591bcfa43d9792c30a46897f4a257708aa0cd',
  '0x1495c287f9afe7d5a9f5c821976e8aca945824e6',
  '0xf809a4156b5abd7b74a94d8a99c93ccbdadb7d07',
  '0x72cb715abfddf7ef640784c28b317094939b312e',
  '0x21f5447dc0bd32258ed4dd9bc3d84ff2da576db5',
  '0xc9cd093c774284b3a0251b1cea799a01664af3fc',
  '0x340faae8c8fd6029ac812648a4e714a569ed69a9',
  '0x89a01896f6cb463d941ce63c605a80885d98fe72',
  '0x8e246ca6ab3edb234d8e2c7d6b07069e249c4d65',
  '0x70f1e0105c781626808ed99a5822eb0f8c23390a',
  '0x195560a1e9f24a38b4068620ab1936ab1bf96ce3',
  '0x3e0d70bc88f8e235ae030c90e43afcee85b18a3a',
  '0xb0d6cb1dbd2b2c8329aa7d9113dc3d768712c639',
  '0x9d55fae2393046f33b869c60f9ed39e0c1b4e5ce',
  '0xb7617dd7c02d23e5c7f8e23dea961878843fc6cb',
  '0xe893027aa8e5e6fd870cfbba107459ce793c943c',
  '0x0742db2e48a615de5ac2aec992a281e3e34f0bec',
  '0x3fd22993d8a7f25544505c7f153b151bf67bf536',
  '0xbd785269ce8e0282f7a7d9b7eecee747675c3b7d',
  '0x26a76c2d094b6125042f976f8714eae972a577af',
  '0x3dcbb93469d7a4e339a511897a40c9a637c45b2c',
  '0x29951a1af54a5c76742fb22da858a56b3748018b',
  '0x982d2fcbdad05ba720c44a40142819ace47a5a3f',
  '0xc1c867b03625dcbfb0ae9a163904f86903e37eb2',
  '0x3deca306934f66c822fa26360b5aa1e7b1e50934',
  '0xebf3e4c4570a21ac16351a6223743871d157eac6',
  '0xac5875d7b49b6df11b8e8488d26e20e4def0ef66',
  '0x87406a212c8efad0fe7ddc58400e528b29b72c14',
  '0x8ce712cb5b0c431cc658fc75a0013b10c0684dad',
  '0x33714e048b3d886b9a9187894a253355db8e4759',
  '0x2b9abccab5799ac57a4933fab043f0f2105caff8',
  '0x9d6df34778dd5a3092f2febee8b94b88bf893f52',
  '0xb352d26ed755e1deb5f30d01362f33d924c534ca',
  '0xaf4a44d1e92b3abf071d524c2134ab506848ffb6',
  '0xc380cb8a2a6853503bbdd6298b8cc3b1a0216555',
  '0x4024e8e702291a16611bdda27c05ede645cd0156',
  '0x4d92e373e2eca8cb09c35c1bbe11d0e65945ae86',
  '0xb059356ba4726830f9d756a9c2ddfcb2f4315fe0',
  '0x43a847c02550ba9d06a7972b5d17bf8053bbc868',
  '0xbeb1517c61f0398016cfa9dac774fe1e8090cdc2',
  '0x2a2eb7e3d9efe105fde876444c853c92810dfe4c',
  '0x51e36a60585d55cf07f524f9432735147c14ab93',
  '0xce5ef10460f3607b360de998ce4292c5adf24db6',
  '0x8425176e0b0e1d2cb0220a7eb7702f215440edf3',
  '0xc675d485bd6a2711c21a83f0e760c83f1a451e67',
  '0xc8f2c2c2fb301ea011cebc5a83d59420ebbe294a',
  '0x72dd84a005054fbbf3612806ec6ac35c6c891d4f',
  '0xd79eae43fef94e4024b428f55cfd58121da45d1f',
  '0xf2c2f14cf30fb1712bdac929d956fc40a6272392',
  '0xcb9edcc69313766cfff9ae72c6119ccdbba5f273',
  '0x918b36924095610e859cb1f4a9049da990f1bcd7',
  '0xa0961c840f686b08e9efe045ac5c839b90fc1b08',
  '0x1fe09767164fad52a4a088ca067419d7426ee1b2',
  '0x91e891e9beaf84a9a506536d37c04931145f822d',
  '0xc3813e392f9331b1ee605d50654de8021ce0565a',
  '0x6310c6ed06f3158bf8c34792d34ae9688b6cdc73',
  '0x88544417b06d4cce97054eeffe46eb5ff5f651ea',
  '0x9173e8fa3d3e983e9a0a0edf4edb7fd6ea09b25f',
  '0x3002432ba430ef32a40d065a6b27d5b2f9202c06',
  '0x6f7738f1104c8c69ef446cf0fbaa30912f073340',
  '0xc170f36c83f77a3cbd5a03329bb0820703b3869a',
  '0xb7876089e14c13d46e217cbae9f76156ab75a882',
  '0x1fc14f7075f26a66924469dbbd6d3da547277f1a',
  '0x07260a3979896600675249410d1c994de05d6b59',
  '0x74cd4f0ff01a91ce0fb44159744e23c048735a1f',
  '0x2d70df76a8547ef22781a74baa4ea36ab83be1b1',
  '0xfe7c5452da69f9997f0f52f9a0b696d38c6527f0',
  '0xf49977b911d14d40fa6c4a5f560c45a0f885fd93',
  '0x74e541bc2fbf0023365a3d979a53aae60278d768',
  '0xe147d405b2a48f7964c2414d51fcff0c6a2c4982',
  '0x280de2b9a545c917622cb46ffdc9051fdb2670d6',
  '0xb50e68d1507ad9a272f2cc2037934d08ae2e13fc',
  '0x6627721da1be20c95e52b9f72d2ae284024e3739',
  '0xa2bbfa329479589d3998d993b4de9d15413e8981',
  '0x93567b6c209e767f02123d215914db8e05a58d24',
  '0x000000003979edd62910ed0779224e785b4140f7',
  '0x75956ff6d8b3aad2769c1a9d69b2d1455ce2d0ca',
  '0x98b4793b19c59aa7387684bcdc013ae7f4033eda',
  '0xcc247b26e0dd704a2e939eec1a3a603df2152e2c',
  '0xc6e09bdad36a65ca469b539f600589fb338e32ba',
  '0xf761fede98e0683c4591a78ed8eeedab1c9eb772',
  '0x517bb3e736a36d302df494d3bde9e570b7315554',
  '0x20c830d78f61bd21728caac59a6946799d9e4b8d',
  '0xb9d66e93e608fc7bd014e28aadf9ead8fcef544a',
  '0xeae78562eed3271dacb22f309cf7db1385298e85',
  '0xec5f6247e8919283be249b89b30aae540a3035f3',
  '0xeb51e66c58c0524fa13f51e79266b1ad99ad04ca',
  '0xbc76ab5c44bce58d3a328c6523702b5d71a53be6',
  '0x337104a9a07be6299fd3dab7e261a556d5439382',
  '0xe72b14d2bdf5e9df331fb5f5fdeae8b69d3af123',
  '0x1497603fea33e12307ea0a1988cdff9efc4bdea4',
  '0x6db0630071685b9d0596fff6bf481daca94c2c33',
  '0x3d6b17b610ace56086310780d0e35b9d05080d13',
  '0x8063ca71dd56983b9e0fe0071ef332d0cf9d018f',
  '0x42eff3810486b91a2c079c0c7825b864ea745b1c',
  '0x556977c8bf3f419e6904e2abffb2e6dcd2bc66c9'
].map(a => a.toLowerCase()));

// Track changes
let changedToTrue = 0;
let changedToFalse = 0;
const changedFalseAddresses = [];

// Update all profiles
data.profiles.forEach(profile => {
  const isInDuneList = duneFirst100.has(profile.address.toLowerCase());
  const wasEarlyAdopter = profile.isEarlyAdopter;

  if (isInDuneList && !wasEarlyAdopter) {
    profile.isEarlyAdopter = true;
    changedToTrue++;
  } else if (!isInDuneList && wasEarlyAdopter) {
    profile.isEarlyAdopter = false;
    changedToFalse++;
    changedFalseAddresses.push(profile.address);
  }
});

// Verify final count
const finalCount = data.profiles.filter(p => p.isEarlyAdopter).length;
const earlyAdopters = data.profiles.filter(p => p.isEarlyAdopter);

console.log('=== Early Adopter Fix Results ===');
console.log('Changed to TRUE:', changedToTrue);
console.log('Changed to FALSE:', changedToFalse);
console.log('Final isEarlyAdopter count:', finalCount);
console.log('\n=== Verified Early Adopters (still holding) ===');
earlyAdopters.forEach(p => {
  console.log(`  ${p.address} - ${Math.round(p.balance).toLocaleString()} GUARD, first: ${p.firstBuyDate}`);
});

// Save the fixed file
fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
console.log('\n✅ Saved updated holder-profiles.json');
