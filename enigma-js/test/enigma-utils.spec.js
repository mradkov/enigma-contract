import utils from '../src/enigma-utils';
import forge from 'node-forge';

forge.options.usePureJavaScript = true;


describe('enigma-utils', () => {
  it('test enigma-utils', () => {
    expect(utils.test()).toEqual('hello2');
  });

  it('should successfully encrypt and decrypt the same as in rust', () => {
    const key = '2987699a6d3a5ebd07f4caf422fad2809dcce942cd9db266ed8e2be02cf95ee9'; // SHA256('EnigmaMPC')
    const iv = forge.util.hexToBytes('000102030405060708090a0b');
    const msg = 'This is Enigma';
    const encrypted = utils.encryptMessage(key, msg, iv);

    expect(encrypted).toEqual(
      '02dc75395879faa78a598e11945c1ac926e3ba591ce91f387694983bc1d2000102030405060708090a0b',
    );

    expect(utils.decryptMessage(key, encrypted)).toEqual('5468697320697320456e69676d61');
    expect(utils.hexToAscii(utils.decryptMessage(key, encrypted))).toEqual(msg);

    // Corrupt a valid encrypted message by just tweaking the first byte
    const invalidEncryptedMsg = '12dc75395879faa78a598e11945c1ac926e3ba591ce91f387694983bc1d2000102030405060708090a0b'
    // Wrap the code that throws an Error in a function,
    // otherwise the error will not be caught and the assertion will fail
    function invalidDecryption() {
      utils.decryptMessage(key, invalidEncryptedMsg);
    }
    expect(invalidDecryption).toThrow();

  });

  it('should convert hex to ascii', () => {
    expect(utils.hexToAscii(31323334)).toEqual('1234');
    expect(utils.hexToAscii('68656c6c6f')).toEqual('hello');
    expect(utils.hexToAscii('0x68656c6c6f')).toEqual('hello');
    expect(utils.hexToAscii('0x68656c6c6f20776f726c64')).toEqual('hello world');
    expect(utils.hexToAscii('20 20 20 20 20 68 65 6c 6c 6f 20 20 20 20 20')).toEqual('     hello     ');
    expect(utils.hexToAscii(true)).toEqual('');
    expect(utils.hexToAscii([1, 2, 3, 4, 5])).toEqual('');
  })

  it('should generate a task input hash', () => {
    const encryptedFn = 'de9bc270f30e03de84aca5ea78f18321f50ca886ff522a49d525bc24f6d56cfb2dcb0b1d33b8756196de2' +
      '89626a442e3dffff97312';
    const encryptedAbiEncodedArgs = 'c53b8caeb99cbc78e322945d8fdcc25ed2b0a7c4319a09a63e43e63e860de572ce656b3f0' +
      '3d9ef7763b7b97ecb8e64a625ecbd307a5a41752c0ab2f769dd0054c9dec67373a76b9a26176760c9a819e6d827a4ec052a0ba1' +
      'd6afc4378c1f4111eb91d059fab824edaf198984277df767ec0db016593c73e40804fc2f92c70dda753ad1d55fbd6b4dfde0bce' +
      '44b9c8be4724a7cf16eb437462bb45482f175';
    const scAddrOrPreCodeHash = '0x300c3473734f4fe56d4acb834359a70d47ff2511c4839524c6f078cb28151ff4';
    const userPubKey = '2ea8e4cefb78efd0725ed12b23b05079a0a433cc8a656f212accf58672fee44a20cfcaa50466237273e762' +
      'e49ec912be61358d5e90bff56a53a0ed42abfe27e3';
    const taskInputsHash = utils.hash([encryptedFn, encryptedAbiEncodedArgs, scAddrOrPreCodeHash,
      userPubKey]);
    expect(taskInputsHash).toEqual('0x0af2a6c64065ee3eca9ed1838a12d858dc8ccb604295bf0fa23008347c22f4b5');
  });

  it('should derive the same key', () => {
    const enclavePublicKey = 'c73d872559d1468ef05204d66a75e616493e08c2e532a3dad7d7cedac6757c4e74021348e73bce08' +
      'ea178a1b8cc0e3670dd3335977b5d7b294b819b26d5db934';
    const clientPrivateKey = '1737611edbedec5546e1457769f900b8d7daef442d966e60949decd63f9dd86f';
    expect(utils.getDerivedKey(enclavePublicKey, clientPrivateKey)).toEqual('d98eb96fa53f96192fcab5194bfbace2f' +
      'aaff7e8ebfe00c4854f8c59407f6c24');
    expect(utils.getDerivedKey('04'+enclavePublicKey, clientPrivateKey)).toEqual('d98eb96fa53f96192fcab5194bfb' +
      'ace2faaff7e8ebfe00c4854f8c59407f6c24');
  });

  it('should remove 0x where present', () => {
    expect(utils.remove0x('0x12345')).toEqual('12345');
    expect(utils.remove0x('12345')).toEqual('12345');
  });

  it('should compress and decompress', async () => {
    const testString = 'hello world'
    let compressed = await utils.gzip(testString)
    const decompressed = await utils.gunzip(compressed);
    expect(decompressed.toString('ascii')).toEqual(testString);
  })
});
