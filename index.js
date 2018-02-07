'use strict';
var express = require('express');
var app = express();
var logger = require('morgan');
var path = require('path');
var quoter = require('./middleware/quoter');

//ENV
require('dotenv').config()


// Config
app.use(logger('dev'));

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));

// General
app.get('/', quoter ,(req, res) => res.json({
    replies: req.replies
}))

app.listen(3000, () => console.log('Example app listening on port 3000!'))