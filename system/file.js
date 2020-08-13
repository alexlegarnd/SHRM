const crypto = require('crypto')
const fs = require("fs");

class File {

    static createMd5Hash(folder, file) {
        const md5_filename = this.changeFileExtension(file.name, '.md5');
        const md5_content = `${file.md5} *${file.name}`;
        fs.writeFile(`${folder}/${md5_filename}`, md5_content, function (err) {
            if (err) return console.log(err);
            console.log(`Hash MD5 created for ${file.name}`);
        });
    }

    static createSha1Hash(folder, file) {
        const sha_filename = this.changeFileExtension(file.name, '.sha');
        const shasum = crypto.createHash('sha1');
        fs.readFile(`${folder}/${file.name}`, (err, buffer) => {
            if (!err) {
                shasum.update(buffer);
                const sha_content = `${shasum.digest('hex')} *${file.name}`;
                fs.writeFile(`${folder}/${sha_filename}`, sha_content, function (err) {
                    if (!err) {
                        console.log(`Hash SHA1 created for ${file.name}`);
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log(err)
            }
        });
    }

    static changeFileExtension(filename, ext) {
        return filename.substr(0, filename.lastIndexOf('.')) + ext;
    }

}

module.exports = File