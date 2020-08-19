const crypto = require('crypto');
const fs = require('fs');
const logger = require('./logger')

class File {

    static CLASSNAME = 'File';

    static createMd5Hash(folder, file) {
        const md5_filename = `${file.name}.md5`
        const md5_content = `${file.md5} *${file.name}`;
        fs.writeFile(`${folder}/${md5_filename}`, md5_content, function (err) {
            if (err) return console.log(err);
            logger.info(File.CLASSNAME, `Hash MD5 created for ${file.name}`);
        });
    }

    static createSha1Hash(folder, file) {
        const sha_filename = `${file.name}.sha`
        const shasum = crypto.createHash('sha1');
        fs.readFile(`${folder}/${file.name}`, (err, buffer) => {
            if (!err) {
                shasum.update(buffer);
                const sha_content = `${shasum.digest('hex')} *${file.name}`;
                fs.writeFile(`${folder}/${sha_filename}`, sha_content, function (err) {
                    if (!err) {
                        logger.info(File.CLASSNAME, `Hash SHA1 created for ${file.name}`);
                    } else {
                        logger.error(File.CLASSNAME, err);
                    }
                });
            } else {
                logger.error(File.CLASSNAME, err);
            }
        });
    }

    static addToHistory(c, v, f) {
        //fs.renameSync()
    }

}

module.exports = File