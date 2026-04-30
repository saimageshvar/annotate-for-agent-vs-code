"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snippetHash = snippetHash;
const node_crypto_1 = require("node:crypto");
function snippetHash(snippet) {
    const normalized = snippet.replace(/\r\n/g, '\n').trim();
    return (0, node_crypto_1.createHash)('sha1').update(normalized).digest('hex');
}
//# sourceMappingURL=hash.js.map