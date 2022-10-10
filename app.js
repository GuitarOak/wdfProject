const dummyData = require('./dummy-data')
const express = require('express')
const session = require('express-session')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const parseForm = bodyParser.urlencoded ({extended: false})

const app = express()
// app.use(session())
app.use(express.static('public'))

const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('database.db', function (error) {
  if (error) {
    console.error(error.message)
  } else {
    console.log('Connected to the database.')
  }
})
db.run(
  "CREATE TABLE IF NOT EXISTS  'Comments' ( 'Id'	INTEGER, 'PostId'	INTEGER, 'Comment'	TEXT NOT NULL, FOREIGN KEY('PostId') REFERENCES 'Posts'('Id'), PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      console.log(error)
    } else {
      console.log('Comments table succesfully created if not existed')
    }
  },
)
db.run(
  "CREATE TABLE IF NOT EXISTS  'Posts' ( 'Id'	INTEGER,  'Text'	TEXT NOT NULL, PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      console.log(error)
    } else {
      console.log('Posts table succesfully created if not existed')
    }
  },
)

app.engine(
  'hbs',
  expressHandlebars.engine({
    defaultLayout: 'main.hbs',
  }),
)

app.get('/', function (request, response) {
  const selectAllPostsQuery = 'SELECT * FROM Posts'

  db.all(selectAllPostsQuery, function (error, posts) {
    if (error) {
      console.log(error)
    } else {
      const getCommentsByPostId = new Promise((resolve, reject) => {
        const allPosts = []
        posts.forEach((post) => {
          const selectCommentForPost =
            'SELECT Comment FROM Comments WHERE PostID = ?'

          db.all(selectCommentForPost, post.Id, function (error, comments) {
            if (error) {
              console.log(error)
            } else {
              const text = post.Text
              const postId = post.Id
              allPosts.push({ text, comments, postId })
            }
          })
        })
        resolve(allPosts)
      })
      getCommentsByPostId.then((allPosts) => {
        const model = {
          posts: allPosts,
        }
        response.render('home.hbs', model)
      })
    }
  })
})

app.post('/', parseForm, function (request, response) {
  const comment = request.body.commentInput
  const postID = request.body.postId
  const commentValues = [comment, postID]
  const insertCommentQuery =
    'INSERT INTO Comments (Comment, PostId) VALUES (?, ?)'
  db.all(insertCommentQuery, commentValues, function (error, cb) {
    if (error) {
      console.log(error)
    } else {
      response.redirect('/')
    }
  })
})

app.get('/about', function (request, response) {
  response.render('about.hbs')
})
app.get('/contact', function (request, response) {
  response.render('contact.hbs')
})
app.get('/login', function (request, response) {
  response.render('login.hbs')
})
app.get('/admin', function (request, response) {
  const selectAllPostsQuery = 'SELECT * FROM Posts'

  db.all(selectAllPostsQuery, function (error, posts) {
    if (error) {
      console.log(error)
    } else {
      const getCommentsByPostId = new Promise((resolve, reject) => {
        const allPosts = []
        posts.forEach((post) => {
          const selectCommentForPost =
            'SELECT * FROM Comments WHERE PostID = ?'

          db.all(selectCommentForPost, post.Id, function (error, comments) {
            if (error) {
              console.log(error)
            } else {
              const text = post.Text
              const postId = post.Id
              console.log('Comments: ', comments)
              allPosts.push({ text, comments, postId })
            }
          })
        })
        resolve(allPosts)
      })
      getCommentsByPostId.then((allPosts) => {
        const model = {
          posts: allPosts,
        }
        response.render('admin.hbs', model)
      })
    }
  })
})
app.post('/remove-post', parseForm, function(request,response){
  console.log(request.body)
  const postId = request.body.postId
  const removePostQuery = 'DELETE FROM Posts WHERE Id = ?'
  db.all(removePostQuery, postId, function(error, cb){
    if(error){
      console.log(error)
      response.redirect('/admin')
    }else{
      response.redirect('/admin')
    }
  })
})
app.post('/update-post', parseForm, function(request, response){
  console.log(request.body)
  const postId = request.body.postId
  const postText = request.body.postText  
  const updatedPostValues = [postText, postId]
  const updatePostQuery = 'Update Posts SET Text = ? WHERE Id = ?'
  db.all(updatePostQuery, updatedPostValues, function(error, cb){
    if(error){
      console.log(error)
      response.redirect('/admin')
    }else{
      response.redirect('/admin')
    }
  })
})

app.post('/add-post', parseForm, function(request, response){
  console.log(request.body)
  const postInput = request.body.postInput
  const addPostQuery = 'INSERT INTO Posts (Text) VALUES (?)'
  db.all(addPostQuery, postInput, function(error, cb){
    if(error){
      console.log(error)
      response.redirect('/admin')
    }else{
      response.redirect('/admin')
    }
  })
}) 
app.post('/remove-comment', parseForm, function(request,response){
  console.log(request.body)
  const commentId = request.body.commentId
  const removeCommentQuery = 'DELETE FROM Comments WHERE Id = ?'
  db.all(removeCommentQuery, commentId, function(error, cb){
    if(error){
      console.log(error)
      response.redirect('/admin')
    }else{
      response.redirect('/admin')
    }
  })
})
app.listen(8080)
