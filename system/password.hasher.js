const bcrypt = require('bcrypt');
const configuration = require('./configuration');


class PasswordHasher {

    algorithm = configuration.getProperty('password_hash_algorithm', 'bcrypt');

    async verify(password, hash) {
        if (this.algorithm === 'bcrypt') {
            return bcrypt.compareSync(password, hash);
        } else {
            const h = this.getHashFromNativeAlgorithm(password);
            return (h === hash);
        }
    }

    async getHash(word) {
        return (this.algorithm === 'bcrypt') ? this.getHashFromBCryptAlgorithm(word)
            : this.getHashFromNativeAlgorithm(word);
    }

    getHashFromNativeAlgorithm(word) {
        const pSum = crypto.createHash(this.algorithm);
        pSum.update(word);
        return pSum.digest('hex');
    }

    getHashFromBCryptAlgorithm(word) {
        return bcrypt.hashSync(word, configuration.getProperty('bcrypt_salt', 10));
    }

}

module.exports = new PasswordHasher()