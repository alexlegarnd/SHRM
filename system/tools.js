

class Tools {

    static addTrailingSeparatorPath(path) {
        if (!path.endsWith('/')) {
            return `${path}/`;
        }
        return path;
    }

}

module.exports = Tools;