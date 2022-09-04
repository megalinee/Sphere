const http = require('http')
const express = require('express')
const cors = require('cors');
const jquery = require('jquery');
const app = express()

app.use(cors());

app.use('/', express.static(__dirname));

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

http.createServer(app)
    .listen(3000, function () {
        console.log('listening to port 3000')
    })