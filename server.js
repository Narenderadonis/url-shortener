require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose")

//Database Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//Create Schema
let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})

//Create model
let Url = mongoose.model('Url', urlSchema)

//Getting URL parameter
let bodyParser = require('body-parser')
let responseObject = {}
app.post('/api/shorturl/new/', bodyParser.urlencoded({extended: false}), (request, response) => {
  let inputUrl = request.body['url']

  //var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
  //var expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
  var expression = /^(https?):\/\/[^\s$.?#].[^\s]*$/gm
  var regex = new RegExp(expression);
  let UrlRegex = new RegExp(expression)

  if(!inputUrl.match(UrlRegex)){
    response.json({error: 'Invalid URL'})
    return
  }
  responseObject['original_url'] = inputUrl

  let inputShort = 1

  Url.findOne({})
      .sort({short: 'desc'})
      .exec( (error, result) => {
        if (!error && result!= undefined){
          inputShort = result.short + 1
        }
        if (!error){
          Url.findOneAndUpdate(
            {original: inputUrl},
            {original: inputUrl, short: inputShort},
            {new: true, upsert: true},
            (error, savedUrl) => {
              if(!error){
                responseObject['short_url'] = savedUrl.short
                response.json(responseObject)
              }
            }
          )
        }

      }) 
})

app.get('/api/shorturl/:input', (request, response) => {
  let input = request.params.input

  Url.findOne({short: input}, (error, result) => {
    if(!error && result!=undefined){
      response.redirect(result.original)
    }else{
      response.json('URL not found')
    }
  })
})

