const dummyData = require('./dummy-data')
const express = require('express')
const expressHandlebars = require('express-handlebars')

const app = express()

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('database.db', function(error){
  if (error) {
    console.error(error.message)
  }else{
   console.log('Connected to the database.')
  }
})

db.run("CREATE TABLE IF NOT EXISTS  'Comments' ( 'Id'	INTEGER, 'PostId'	INTEGER, 'Comment'	TEXT NOT NULL, FOREIGN KEY('PostId') REFERENCES 'Posts'('Id'), PRIMARY KEY('Id' AUTOINCREMENT) ) ", function(error){
  if(error){
    console.log(error)
  }else{
    console.log("Comments table succesfully created if not existed")
  }
})
db.run("CREATE TABLE IF NOT EXISTS  'Posts' ( 'Id'	INTEGER,'Text'	TEXT NOT NULL, PRIMARY KEY('Id' AUTOINCREMENT) ) ", function(error){
  if(error){
    console.log(error)
  }else{
    console.log("Posts table succesfully created if not existed")
  }
})

/*
Recieving all Posts from DB
*/
let allPosts;
const selectAllPostsQuery = "SELECT Text FROM Posts"
db.all(selectAllPostsQuery, function(error, posts){
  if(error){
    console.log(error)
  }else{
    console.log("Selected Text from posts")
    allPosts = posts;
  }
})

/*
Recieving all Comments from DB
*/
let allComments;
const selectAllCommentsQuery = "SELECT * FROM Comments"
db.all(selectAllCommentsQuery, function(error, comments){
  if (error) {
    console.log(error)
  }else{
    console.log("Selected * from comments")
    allComments = comments
  }
})

app.use(express.static('public'))

app.engine(
  'hbs',
  expressHandlebars.engine({
    defaultLayout: 'main.hbs',
  }),
)

app.get('/', function (request, response) {
  const model = {
    humans: dummyData.humans,
    posts: allPosts,
    comments: dummyData.postComments,
  }
  response.render('home.hbs', model)
})
app.get('/views/home.hbs', function (request, response) {
  const model = {
    humans: dummyData.humans,
    posts: allPosts,
    comments: dummyData.postComments,
  }
  response.render('home.hbs', model)
})
app.get('/views/about.hbs', function (request, response) {
 
  response.render('about.hbs')
})
app.get('/views/contact.hbs', function (request, response) {

  response.render('contact.hbs')
})
app.get('/views/login.hbs', function (request, response) {

  response.render('login.hbs')
})
app.get('/views/admin.hbs', function (request, response) {
  const model = {
    humans: dummyData.humans,
    posts: dummyData.posts,
    comments: dummyData.postComments,
  }
  response.render('admin.hbs', model)
})
app.listen(8080)
