const express = require('express');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const logger = require('./system/logger');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileupload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));


app.use('/', indexRouter);
app.use('/admin', adminRouter);

app.use((err, req, res, next) => {
    logger.error('Error Handler', err);
    res.send({status: 'failed', message: err.message});
});

module.exports = app;
