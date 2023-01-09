const express = require('express')
const session = require('express-session')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const parseForm = bodyParser.urlencoded({ extended: false })
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

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

const MIN_COMMENT_LENGTH = 5
const MIN_POST_LENGTH = 10

const { response } = require('express')
const db = new sqlite3.Database('database.db', function (error) {
  if (error) {
    const model = {
      error: 'Database error'
    }
  } else {
    console.log('Connected to Database')
  }
})

//Database initialising
db.run(
  "CREATE TABLE IF NOT EXISTS  'Comments' ( 'Id'	INTEGER, 'PostId'	INTEGER, 'Comment'	TEXT NOT NULL, FOREIGN KEY('PostId') REFERENCES 'Posts'('Id'), PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      const model = {
        error: 'Database error'
      }
    }
  },
)
db.run(
  "CREATE TABLE IF NOT EXISTS 'MyMusic' ( 'ID'	INTEGER, 'Title'	TEXT, 'Link'	TEXT, 'ImageLink'	TEXT, PRIMARY KEY('ID' AUTOINCREMENT)  );",
  function (error) {
    if (error) {
      const model = {
        error: 'Database error'
      }
    }
  }
)
db.run(
  "CREATE TABLE IF NOT EXISTS 'Posts' ( 'Id'	INTEGER,  'Text'	TEXT NOT NULL, PRIMARY KEY('Id' AUTOINCREMENT) ) ",
  function (error) {
    if (error) {
      const model = {
        error: 'Database error'
      }
    }
  },
)
db.run(
  "INSERT INTO MyMusic (Title, Link, ImageLink) VALUES ('Daydream','https://www.youtube.com/watch?v=E5oaa0nJYc8','https://i.scdn.co/image/ab67616d00001e02fff96e613c3b8de376f25ad5')",
  function (error) {
    if (error) {
      const model = {
        error: 'Database error'
      }
    }
  },
)

app.engine(
  'hbs',
  expressHandlebars.engine({
    defaultLayout: 'main.hbs',
  }),
)


//Routing
app.get('/', function (request, response) {
  const selectAllPostsQuery = 'SELECT * FROM Posts'
  db.all(selectAllPostsQuery, function (error, posts) {
    if (error) {
      const model = {
        error: 'Database error'
      }
      response.render('error.hbs', model)
    } else {
      const getCommentsByPostId = new Promise((resolve, reject) => {
        const allPosts = []
        posts.forEach((post) => {
          const selectCommentForPost =
            'SELECT Comment FROM Comments WHERE PostID = ?'

          db.all(selectCommentForPost, post.Id, function (error, comments) {
            if (error) {
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
        response.render('home.hbs', model)
      })
    }
  })
})
app.post('/', parseForm, function (request, response) {

  const comment = request.body.commentInput
  if (comment.length < MIN_COMMENT_LENGTH) {
    const model = {
      error: 'Comment needs to be longer than ' + MIN_COMMENT_LENGTH + ' characters'
    }
    response.render('error.hbs', model)
  } else {
    const postID = request.body.postId
    const commentValues = [comment, postID]
    const insertCommentQuery =
      'INSERT INTO Comments (Comment, PostId) VALUES (?, ?)'
    db.run(insertCommentQuery, commentValues, function (error, callback) {
      if (error) {
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        response.redirect('/')
      }
    })
  }
})


app.get('/my-music', function (request, response) {
  const selectAllMyMusicQuery = 'SELECT * FROM MyMusic'
  db.all(selectAllMyMusicQuery, function (error, myMusic) {
    if (error) {
      const model = {
        error: 'Database error'
      }
      response.render('error.hbs', model)
    } else {
      const model = {
        myMusic
      }
      response.render('myMusic.hbs', model)
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
const adminHashedPassword = '$2b$10$wHdoX38LnOEj4eQePoPj7eNTui3VzUPyximWVcwE672Pb7YUPyWPK'

app.post('/authenticate-login', parseForm, function (request, response) {
  const email = request.body.emailInput
  const password = request.body.passwordInput
  const validatedPassword = bcrypt.compareSync(password, adminHashedPassword)

  if (email == adminEmail && validatedPassword) {
    request.session.isLoggedIn = true
    response.redirect('/admin')
  } else {
    const model = {
      error: 'Email or Password is incorrect, please try again'
    }
    response.render('login.hbs', model)
  }
})

app.get('/admin', function (request, response) {
  if (request.session.isLoggedIn) {
    var music
    const selectAllMyMusicQuery = 'SELECT * FROM MyMusic'
    db.all(selectAllMyMusicQuery, function (error, myMusic) {
      if (error) {
        const model = {
          error: 'Database error'
        }
        response.render('error.hbs', model)
      } else {
        music=myMusic
      }
    })

    const selectAllPostsQuery = 'SELECT * FROM Posts'
    db.all(selectAllPostsQuery, function (error, posts) {
      if (error) {
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
            music
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
    db.run(removePostQuery, postId, function (error, callback) {
      if (error) {
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
    if (postText.length < MIN_POST_LENGTH) {
      const model = {
        error: 'Post needs to be longer than ' + MIN_POST_LENGTH + ' characters'
      }
      response.render('error.hbs', model)
    } else {
      const updatedPostValues = [postText, postId]
      const updatePostQuery = 'Update Posts SET Text = ? WHERE Id = ?'
      db.run(updatePostQuery, updatedPostValues, function (error, callback) {
        if (error) {
          const model = {
            error: 'Database error'
          }
          response.render('error.hbs', model)
        } else {
          response.redirect('/admin')
        }
      })
    }
  } else {
    const model = {
      error: 'You dont have permission to access this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/remove-music', parseForm, function(request, response){
  if (request.session.isLoggedIn) {
    const musicID = request.body.musicID
    const removePostQuery = 'DELETE FROM MyMusic WHERE ID = ?'
    db.run(removePostQuery, musicID, function (error, callback) {
      if (error) {
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
} ) 
app.post('/update-music', parseForm, function(request, response){
  if (request.session.isLoggedIn) {
    const musicID = request.body.musicID
    const newMusicTitle = request.body.musicTitle
    if (newMusicTitle.length < 3) {
      const model = {
        error: 'Post needs to be longer than 3 characters'
      }
      response.render('error.hbs', model)
    } else {
      const updatedMusicValues = [newMusicTitle, musicID]
      const updateMusicQuery = 'Update MyMusic SET Title = ? WHERE ID = ?'
      db.run(updateMusicQuery, updatedMusicValues, function (error, callback) {
        if (error) {
          const model = {
            error: 'Database error'
          }
          response.render('error.hbs', model)
        } else {
          response.redirect('/admin')
        }
      })
    }
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
    if (postInput.length < MIN_POST_LENGTH) {
      const model = {
        error: 'Post needs to be longer than ' + MIN_POST_LENGTH + ' characters'
      }
      response.render('error.hbs', model)
    } else {
      const addPostQuery = 'INSERT INTO Posts (Text) VALUES (?)'
      db.run(addPostQuery, postInput, function (error, callback) {
        if (error) {
          const model = {
            error: 'Database error'
          }
          response.render('error.hbs', model)
        } else {
          response.redirect('/admin')
        }
      })
    }
  } else {
    const model = {
      error: 'You dont have permission to access this'
    }
    response.render('error.hbs', model)
  }
})
app.post('/add-music', parseForm, function(request,response){
  if (request.session.isLoggedIn) {
    const title = request.body.newMusicTitle
    const link = request.body.newMusicLink
    const imageLink = request.body.newMusicImageLink
    newMusicValues = [title, link, imageLink]
    if (title.length < 3) {
      const model = {
        error: 'Title needs to be longer than 3 characters'
      }
      response.render('error.hbs', model)
    } else if(link.length < 5 || imageLink.length < 5) {
      const model = {
        error: 'Please provide a valid link'
      }
      response.render('error.hbs', model)
    } else {
      const addMusicQuery = 'INSERT INTO MyMusic (Title, Link, ImageLink) VALUES (?,?,?)'
      db.run(addMusicQuery, newMusicValues, function (error, callback) {
        if (error) {
          const model = {
            error: 'Database error'
          }
          response.render('error.hbs', model)
        } else {
          response.redirect('/admin')
        }
      })
    }
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
    db.run(removeCommentQuery, commentId, function (error, callback) {
      if (error) {
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
app.get('/error', function (request, response) {
  response.render('error.hbs')
})

let port = process.env.PORT
if (port == null || port == "") {
  port = 8000
}
app.listen(port)
