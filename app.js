const dummyData = require('./dummy-data')
const express = require('express')
const expressHandlebars = require('express-handlebars')

const app = express()

app.engine(
  'hbs',
  expressHandlebars.engine({
    defaultLayout: 'main.hbs',
  }),
)
app.use(express.static("/images/"));

app.get('/', function (request, response) {
  const model = {
    humans: dummyData.humans,
    posts: dummyData.posts,
    comments: dummyData.postComments
  }
  response.render('home.hbs', model)
})
app.get('/views/home.hbs', function (request, response) {
  const model = {
    humans: dummyData.humans,
    posts: dummyData.posts,
    comments: dummyData.postComments
   }
  response.render('home.hbs', model)
})
app.get('/views/about.hbs', function (request, response) {
  const model = {
    humans: dummyData.humans,
  }
  response.render('about.hbs', model)
})
app.get('/views/contact.hbs', function (request, response) {
  const model = {
    humans: dummyData.humans,
  }
  response.render('contact.hbs', model)
})
app.get('/views/login.hbs', function (request, response) {
    const model = {
      humans: dummyData.humans,
    }
    response.render('login.hbs', model)
  })
app.listen(8080)
