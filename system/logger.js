const configuration = require('./configuration');
const SEVERITY = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL'
}

class Logger {

    static debug(view, message) {
        if (configuration.getProperty('debug')) {
            console.debug(this.format(SEVERITY.DEBUG, view, message));
        }
    }

    static info(view, message) {
        console.log(this.format(SEVERITY.INFO, view, message));
    }

    static warning(view, message) {
        console.warn(this.format(SEVERITY.WARNING, view, message));
    }

    static error(view, message) {
        console.error(this.format(SEVERITY.ERROR, view, message));
    }

    static fatal(view, message) {
        console.error(this.format(SEVERITY.FATAL, view, message));
    }

    static format(severity, view, message) {
        return `${new Date().toISOString()} ${severity} [${view}] ${message}`;
    }

}

module.exports = Logger