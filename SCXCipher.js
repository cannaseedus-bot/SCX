/**
 * SCX (Symbolic Cipher eXchange) System
 * Compression cipher using symbolic glyphs for K'uhul operations
 *
 * SCX Format: ⟁Op⟁param⟁Op⟁param⟁...
 *
 * Glyph Mappings:
 * - ⟁Pop⟁ -> [Pop function_name]
 * - ⟁Wo⟁ -> [Wo value]
 * - ⟁Ch'en⟁ -> [Ch'en variable]
 * - ⟁Yax⟁ -> [Yax variable]
 * - ⟁Sek⟁ -> [Sek operation]
 * - ⟁Xul⟁ -> [Xul]
 */

class SCXCipher {
  constructor() {
    this.delimiter = '⟁';

    // Operation mappings
    this.operations = {
      Pop: 'Pop',
      Wo: 'Wo',
      "Ch'en": "Ch'en",
      Chen: "Ch'en",
      Yax: 'Yax',
      Sek: 'Sek',
      Xul: 'Xul',
    };
  }

  /**
   * Encode K'uhul code to SCX cipher
   * @param {string} kuhulCode - K'uhul code to encode
   * @returns {string} - SCX cipher string
   */
  encode(kuhulCode) {
    // Remove comments
    kuhulCode = kuhulCode.replace(/;[^\n]*/g, '');

    // Extract tokens
    const tokenRegex = /\[([^\]]+)\]/g;
    const tokens = [];
    let match;

    while ((match = tokenRegex.exec(kuhulCode)) !== null) {
      const content = match[1].trim();
      const parts = content.split(/\s+/);
      tokens.push(parts);
    }

    // Build SCX string
    let scx = this.delimiter;

    for (const token of tokens) {
      scx += token.join(this.delimiter) + this.delimiter;
    }

    return scx;
  }

  /**
   * Decode SCX cipher to K'uhul code
   * @param {string} scxCipher - SCX cipher string
   * @returns {string} - K'uhul code
   */
  decode(scxCipher) {
    // Split by delimiter and filter empty strings
    const parts = scxCipher
      .split(this.delimiter)
      .filter((part) => part.trim() !== '');

    if (parts.length === 0) {
      return '';
    }

    let kuhul = '';
    let i = 0;

    while (i < parts.length) {
      const op = parts[i];

      if (op === 'Pop') {
        kuhul += `[Pop ${parts[i + 1]}]\n`;
        i += 2;
      } else if (op === 'Wo') {
        kuhul += `  [Wo ${parts[i + 1]}]→`;
        i += 2;
      } else if (op === "Ch'en" || op === 'Chen') {
        kuhul += `[Ch'en ${parts[i + 1]}]\n`;
        i += 2;
      } else if (op === 'Yax') {
        kuhul += `[Yax ${parts[i + 1]}]→`;
        i += 2;
      } else if (op === 'Sek') {
        kuhul += `[Sek ${parts[i + 1]}]→`;
        i += 2;
      } else if (op === 'Xul') {
        kuhul += '[Xul]\n';
        i += 1;
      } else {
        i += 1;
      }
    }

    // Clean up trailing arrows
    kuhul = kuhul.replace(/→\n/g, '\n');
    kuhul = kuhul.replace(/→$/g, '');

    return kuhul.trim();
  }

  /**
   * Compress K'uhul code using SCX
   * Returns compression ratio
   */
  compress(kuhulCode) {
    const scx = this.encode(kuhulCode);
    const originalSize = kuhulCode.length;
    const compressedSize = scx.length;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

    return {
      original: kuhulCode,
      compressed: scx,
      originalSize,
      compressedSize,
      ratio: `${ratio}%`,
    };
  }

  /**
   * Validate SCX cipher
   */
  validate(scxCipher) {
    try {
      const parts = scxCipher
        .split(this.delimiter)
        .filter((part) => part.trim() !== '');
      let i = 0;

      while (i < parts.length) {
        const op = parts[i];

        if (!['Pop', 'Wo', "Ch'en", 'Chen', 'Yax', 'Sek', 'Xul'].includes(op)) {
          return { valid: false, error: `Unknown operation: ${op}` };
        }

        // Check if operation requires a parameter
        if (['Pop', 'Wo', "Ch'en", 'Chen', 'Yax', 'Sek'].includes(op)) {
          if (i + 1 >= parts.length) {
            return { valid: false, error: `Missing parameter for ${op}` };
          }
          i += 2;
        } else {
          i += 1;
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Create SCX dictionary entry
   */
  createDictionaryEntry(scxCipher, description) {
    return {
      scx: scxCipher,
      kuhul: this.decode(scxCipher),
      description,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCXCipher;
}
