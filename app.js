const express = require('express');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');

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


app.use('/repo', indexRouter);
app.use('/admin', adminRouter);

module.exports = app;
