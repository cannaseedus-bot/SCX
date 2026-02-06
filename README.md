# SCX

Symbolic Cipher eXchange (SCX) for encoding and decoding K'uhul operations into a
compact glyph-based format.

## Usage

```js
const SCXCipher = require('./SCXCipher');

const cipher = new SCXCipher();
const kuhul = `[Pop start]
  [Wo 10]→[Yax foo]→[Xul]
`;

const encoded = cipher.encode(kuhul);
const decoded = cipher.decode(encoded);

console.log(encoded);
console.log(decoded);
```
