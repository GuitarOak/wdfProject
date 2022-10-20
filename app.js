const express = require('express')
const session = require('express-session')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const parseForm = bodyParser.urlencoded({ extended: false })
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const saltRounds = 10

const app = express()
app.use(session({
  saveUninitialized: false,
  secret: 'aimaevyuibpap',
  resave: false
}))
app.use(express.static('public'))
app.use(function (request, response, next) {
  response.locals.isLoggedIn = request.session.isLoggedIn
  next()
})

const { response } = require('express')
const db = new sqlite3.Database('database.db', function (error) {
  if (error) {
    console.log("Error",error)
    const model = {
      error: 'Database error'
    }
    
    response.render('error.hbs', model)
  }else{
    console.log('Connected to Database')
  }

})
db.run(
  "CREATE TABLE IF NOT EXISTS  'Comments' ( 'Id'	INTEGER, 'PostId'	INTEGER, 'Comment'	TEXT NOT NULL, FOREIGN KEY('PostId') REFERENCES 'Posts'('Id'), PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      console.log("Error",error)
      const model = {
        error: 'Database error'
      }
      
      response.render('error.hbs', model)
    }
    console.log('Comments table created')
  },
)
db.run(
  "CREATE TABLE IF NOT EXISTS  'Posts' ( 'Id'	INTEGER,  'Text'	TEXT NOT NULL, PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      console.log("Error",error)
      const model = {
        error: 'Database error'
      }
      response.render('error.hbs', model)
    }
    console.log('Posts table created')
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
      console.log("Error",error)
      const model = {
        error: 'Database error'
      }
      response.render('error.hbs', model)
    } else {
      console.log('Posts: ', posts)
      const getCommentsByPostId = new Promise((resolve, reject) => {
        const allPosts = []
        posts.forEach((post) => {
          const selectCommentForPost =
            'SELECT Comment FROM Comments WHERE PostID = ?'

          db.all(selectCommentForPost, post.Id, function (error, comments) {
            if (error) {
              console.log("Error",error)
              const model = {
                error: 'Database error'
              }
              response.render('error.hbs', model)
            } else {
              console.log('Comments', comments)
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
        console.log('All posts: ', allPosts)
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
      console.log("Error",error)
      const model = {
        error: 'Database error'
      }
      response.render('error.hbs', model)
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

const adminEmail = 'admin@admin.com'
//Password = Admin123
const adminPassword = '$2b$10$wHdoX38LnOEj4eQePoPj7eNTui3VzUPyximWVcwE672Pb7YUPyWPK'

app.post('/authenticate-login', parseForm, function (request, response) {
  const email = request.body.emailInput
  const password = request.body.passwordInput
  const validatedPassword = bcrypt.compareSync(password, adminPassword)
  console.log('Validated Password: ', validatedPassword)
  if (email == adminEmail && validatedPassword) {
    request.session.isLoggedIn = true
    response.redirect('/admin')
    console.log('Logged in')
  } else {
    const model = {
      error: 'Email or Password is incorrect, please try again'
    }
    response.render('login.hbs', model)
  }
})

app.get('/admin', function (request, response) {
  if (request.session.isLoggedIn) {
    const selectAllPostsQuery = 'SELECT * FROM Posts'
    db.all(selectAllPostsQuery, function (error, posts) {
      if (error) {
        console.log("Error",error)
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        const getCommentsByPostId = new Promise((resolve, reject) => {
          const allPosts = []
          posts.forEach((post) => {
            const selectCommentForPost =
              'SELECT * FROM Comments WHERE PostID = ?'

            db.all(selectCommentForPost, post.Id, function (error, comments) {
              if (error) {
                console.log("Error",error)
                const model = {
                  error: 'Database error'
                }
                response.render('error.hbs', model)
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
          response.render('admin.hbs', model)
        })
      }
    })
  } else {
    const model = {
      error: 'You dont have permission to access this page!'
    }
    response.render('error.hbs', model)
  }
})
app.post('/remove-post', parseForm, function (request, response) {
  if (request.session.isLoggedIn) {
    const postId = request.body.postId
    const removePostQuery = 'DELETE FROM Posts WHERE Id = ?'
    db.all(removePostQuery, postId, function (error, cb) {
      if (error) {
        console.log("Error",error)
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        response.redirect('/admin')
      }
    })
  } else {
    const model = {
      error: 'You dont have permission to access to this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/update-post', parseForm, function (request, response) {
  if (request.session.isLoggedIn) {
    const postId = request.body.postId
    const postText = request.body.postText
    const updatedPostValues = [postText, postId]
    const updatePostQuery = 'Update Posts SET Text = ? WHERE Id = ?'
    db.all(updatePostQuery, updatedPostValues, function (error, cb) {
      if (error) {
        console.log("Error",error)
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        response.redirect('/admin')
      }
    })
  } else {
    const model = {
      error: 'You dont have permission to access this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/add-post', parseForm, function (request, response) {
  if (request.session.isLoggedIn) {
    const postInput = request.body.postInput
    const addPostQuery = 'INSERT INTO Posts (Text) VALUES (?)'
    db.all(addPostQuery, postInput, function (error, cb) {
      if (error) {
        console.log("Error",error)
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        console.log('Posted: ', postInput)
        response.redirect('/admin')
      }
    })
  } else {
    const model = {
      error: 'You dont have permission to access this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/remove-comment', parseForm, function (request, response) {
  if (request.session.isLoggedIn) {
    const commentId = request.body.commentId
    const removeCommentQuery = 'DELETE FROM Comments WHERE Id = ?'
    db.all(removeCommentQuery, commentId, function (error, cb) {
      if (error) {
        console.log("Error",error)
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        response.redirect('/admin')
      }
    })
  } else {
    const model = {
      error: 'You dont have permission to access this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/logout', function (request, response) {
  request.session.isLoggedIn = false
  response.redirect('/')
})
app.get('/error', function () {
  response.render('error.hbs')
})
let port = process.env.PORT
if (port == null || port == "") {
  port = 8000
}
app.listen(port)
