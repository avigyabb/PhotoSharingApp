/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
const fs = require("fs");

var async = require('async');

var express = require('express');
var app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
//var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


// app.get('/', function (request, response) {
//     response.send('Simple web server of files from ' + __dirname);
// });

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    console.log(request.session.user_id);
    if (request.session.user_id) {
        User.find({},'first_name last_name', async function(err, users) {
            //console.log("users" + users);
            if(err) {
                response.status(400).send(JSON.stringify(err));
            } else {
                users = JSON.parse(JSON.stringify(users));
                //console.log(users);
                async.each(users, function (user, userCallback) {
                    let userComments = [];
                    //console.log(user);
                    Photo.find({user_id:user._id},'file_name date_time user_id comments', (err2, photos) => {
                        if (err2) {
                            response.status(400).send(JSON.stringify(err2));
                            userCallback(err2);
                        } else {
                            user.numPhotos = photos.length;
                            userCallback();
                        }
                    });
                    Photo.find({},'file_name date_time user_id comments', async function(err3, photos) {
                        if(err3) {
                            response.status(400).send(JSON.stringify(err));
                        } else {
                            photos = JSON.parse(JSON.stringify(photos));
                            for (let photo of photos) {
                                let commentArray = photo.comments;
                                for (let comment of commentArray) {
                                    if (comment.user_id === user._id) {
                                        userComments.push(comment);
                                    }
                                    user.userComments = userComments;
                                    user.numComments = userComments.length;
                                }
                            }
                        }
                    });
                }, function (err3) {
                    if(err3) {
                        response.status(400).send(JSON.stringify(err3));
                    } else {
                        response.end(JSON.stringify(users));
                    }
                });
            }
        });
    } else {
        response.status(401).send("Not Logged In");
    }
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (request.session.user_id) {
    var id = request.params.id;
    console.log(id);
    User.findOne({_id:id},'_id first_name last_name location description occupation', function(err, users) {
        if(err) {
            response.status(400).send(JSON.stringify(err));
        } else {
            console.log(users);
            response.end(JSON.stringify(users));
        }
    });
    } else {
        response.status(401).send("NOT LOGGED IN");
    }
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if (request.session.user_id) {
        var id = request.params.id;
        Photo.find({user_id:id},'file_name date_time user_id comments likes', async function(err, photos) {
            if(err) {
                response.status(400).send(JSON.stringify(err));
            } else {
                photos = JSON.parse(JSON.stringify(photos));
                async.each(photos, function (photo, photoCallback) {
                    let commentArray = photo.comments;
                    async.each(commentArray, function (comment, commentCallback) {
                        User.findOne({_id:comment.user_id},'first_name last_name _id', (err2, user) => {
                            if (err2) {
                                response.status(400).send(JSON.stringify(err2));
                                commentCallback(err2);
                            } else {
                                //console.log(comment.user_id);
                                comment.user = user;
                                commentCallback();
                            }
                        });
                        delete comment.user_id;
                    }, function (err3) {
                        photoCallback(err3);
                    });
                }, function (err4) {
                    if(err4) {
                        response.status(400).send(JSON.stringify(err4));
                    } else {
                        response.end(JSON.stringify(photos));
                    }
                });
            }
        });
    } else {
        response.status(401).send("NOT LOGGED IN");
    }
});

app.get('/userComments/:id', function (request, response) {
    var id = request.params.id;
    User.find({_id:id},'_id first_name last_name', async function(err, users) {
        if(err) {
            response.status(400).send(JSON.stringify(err));
        } else {
            users = JSON.parse(JSON.stringify(users));
            //console.log(users);
            async.each(users, function (user, userCallback) {
                let userComments = [];
                //console.log(user);
                Photo.find({},'file_name date_time user_id comments', async function(err3, photos) {
                    if(err3) {
                        response.status(400).send(JSON.stringify(err3));
                        userCallback(err3);
                    } else {
                        photos = JSON.parse(JSON.stringify(photos));
                        for (let photo of photos) {
                            let commentArray = photo.comments;
                            for (let comment of commentArray) {
                                let obj = {comment: comment, photo: photo};
                                if (comment.user_id === user._id) {
                                    userComments.push(obj);
                                }
                                user.userComments = userComments;
                                user.numComments = userComments.length;
                            }
                        }
                        userCallback();
                    }
                });
            }, function (err4) {
                if(err4) {
                    response.status(400).send(JSON.stringify(err4));
                } else {
                    response.end(JSON.stringify(users));
                }
            }
            );
        }
    });    
});

app.post('/admin/login', function (request, response) {
    /*if(!request.session.user_id) {
        request.status(400).end();
    }*/
    console.log(request.body);
    User.findOne({login_name: request.body.login_name}, function(err, user) {
        console.log("login" + user);
        if (user) {
            if(err) {
                response.status(400).end(JSON.stringify(err));
            } else if (user.password !== request.body.password) {
                response.status(400).end("Incorrect Password");
            } else {
                request.session.user_id = user._id;
                response.status(200).send(JSON.stringify({user: user}));
            }
        } else {
            response.status(400).end("EMPTY USER");
        }
    });
});

app.post('/admin/logout', function (request, response) {
    if(!request.session.user_id) {
        response.status(401).send();
    } else {
        request.session.destroy(function (err) {
            if(err) {
                response.status(401).send(JSON.stringify(err));
            } else {
                response.status(200).send();
            }
        });
    }
    /*request.session.destroy(function (err) {
        response.status(400).send(JSON.stringify(err));
    })*/

});

app.post('/commentsOfPhoto/:id', function (request, response) {
    Photo.findOne({_id: request.body.id}, function(err, photo) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else if (request.body.comment === "") {
            response.status(400).end(JSON.stringify(err));
        } else {
            console.log("photo" + photo);
            //console.log(request.session);
            photo.comments.push({
                comment: request.body.comment,
                user_id: request.body.user._id
            });
            photo.save();
            console.log("photo after" + photo);
            response.status(200).end(JSON.stringify(photo));
        }
    });
});

app.post('/photos/new', function (request, response) {
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).end(JSON.stringify(err));
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
    
        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        const timestamp = new Date().valueOf();
        const filename = 'U' +  String(timestamp) + request.file.originalname;
    
        fs.writeFile("./images/" + filename, request.file.buffer, function (err2) {
          // XXX - Once you have the file written into your images directory under the name
          // filename you can create the Photo object in the database
          if(err2) {
            response.status(400).end(JSON.stringify(err2));
            } 
          console.log(filename);
        let newPhoto = {
            file_name: filename, // 	Name of a file containing the actual photo (in the directory project6/images).
            date_time: Date.now(), // 	The date and time when the photo was added to the database
            user_id: request.session.user_id, // The ID of the user who created the photo.
            comments: [] 
        };
        console.log(newPhoto);
        Photo.create(newPhoto, function(err3, photo) {
            if(err3) {
                console.log(photo);
                response.status(400).end(JSON.stringify(err3));
            } else {
                console.log("photo output" + photo);
                response.status(200).send(JSON.stringify({photo: photo}));
            }
        });
        });
    });
});

app.post('/user', function (request, response) {
    let newUser = {
        login_name: request.body.login_name,
        password: request.body.password,
        first_name: request.body.first_name,
        last_name: request.body.last_name,
        location: request.body.location,
        description: request.body.description,
        occupation: request.body.occupation
    };
    User.find({login_name: newUser.login_name}, function(err, user) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else if (user.length === 0) {
            console.log(user);
            console.log("user doesn't exist");
            User.create(newUser, function(err2, user2) {
                if(err) {
                    response.status(400).end(JSON.stringify(err2));
                } else {
                    response.status(200).send(JSON.stringify({user: user2}));
                }
            });
        } else {
            console.log(user);
            console.log("user exists");
            response.status(400).end(JSON.stringify(err));
        }
    });
});

app.delete('/photos/delete/:id', function (request, response) {
    let photoId = request.params.id;
    Photo.deleteOne({_id: photoId}, function(err, photo) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            response.status(200).send(JSON.stringify(photo));
        }
    });
});

app.post('/comments/delete/:id', function (request, response) {
    console.log(request.body);
    console.log(request.params);
    let photoId = request.params.id;
    let commentId = request.body.commentId;
    Photo.findOne({_id: photoId}, function(err, photo) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            console.log(photo);
            for (let comment of photo.comments) {
                if (JSON.stringify(comment._id) === JSON.stringify(commentId)) {
                    console.log(comment);
                    const index = photo.comments.indexOf(comment);
                    photo.comments.splice(index, 1); 
                    photo.save();
                }
            }
            response.status(200).send(JSON.stringify(photo));
        }
    });
});

app.delete('/users/delete/:id', function (request, response) {
    console.log("DELTEEEEEEE");
    Photo.find({}, function(err, photos) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            //photos = JSON.parse(JSON.stringify(photos));
            for (let photo of photos) {
                let commentArray = photo.comments;
                console.log("COMMENT ARRAY");
                for (let comment of commentArray) {
                    if (JSON.stringify(comment.user_id) === JSON.stringify(request.params.id)) {
                        console.log(comment);
                        const index = photo.comments.indexOf(comment);
                        photo.comments.splice(index, 1); 
                        photo.save();
                    }
                }
                if (JSON.stringify(photo.user_id) === JSON.stringify(request.params.id)) {
                    Photo.deleteOne({_id: photo._id}, function(err2) {
                        if (err2) {
                            response.status(400).end(JSON.stringify(err2));
                        } else {
                            //response.status(200).send(JSON.stringify(photos));
                            User.deleteOne({_id: request.params.id}, function(err3, user) {
                                if (err3) {
                                    response.status(400).end(JSON.stringify(err3));
                                } else {
                                    console.log(user);
                                }
                            });
                        }
                    });
                }
            }
            response.status(200).send("DELETED");
        }
    });
});

app.post('/photos/like/:id', function (request, response) {
    let photoId = request.params.id;
    let userId = request.body.userId;
    Photo.findOne({_id: photoId}, function(err, photo) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            photo.likes.push(userId);
            photo.save();
            response.status(200).send(JSON.stringify(photo));
        }
    });
});

app.post('/photos/unlike/:id', function (request, response) {
    let photoId = request.params.id;
    let userId = request.body.userId;
    Photo.findOne({_id: photoId}, function(err, photo) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            const index = photo.likes.indexOf(userId);
            photo.likes.splice(index, 1); 
            photo.save();
            response.status(200).send(JSON.stringify(photo));
        }
    });
});

app.post('/photos/favorite/:id', function (request, response) {
    let photoId = request.params.id;
    let userId = request.body.userId;
    console.log(photoId);
    console.log(userId);
    User.findOne({_id: userId}, function(err, user) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            user.favorites.push(photoId);
            user.save();
            response.status(200).send(JSON.stringify(user));
        }
    });
});

app.get('/favoritesOfUser/:id', function (request, response) {
    let userId = request.params.id;
    let output = [];
    console.log("HSDFJKHDFJK");
    User.findOne({_id: userId}, async function(err, user) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            async.each(user.favorites, function (favorite, callback) {
                Photo.findOne({_id: favorite}, function(err2, photo) {
                    if (err2) {
                        response.status(400).end(JSON.stringify(err2));
                        callback(err2);
                    } else {
                        output.push(photo);
                        callback();
                    }
                });
            }, function (err3) {
                if(err3) {
                    response.status(400).send(JSON.stringify(err3));
                } else {
                    response.end(JSON.stringify(output));
                }
            });
        }
    });
});

app.post('/photos/removeFavorite/:id', function (request, response) {
    let photoId = request.params.id;
    let userId = request.body.userId;
    let output = [];
    User.findOne({_id: userId}, function(err, user) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            const index = user.favorites.indexOf(photoId);
            user.favorites.splice(index, 1); 
            user.save();
            async.each(user.favorites, function (favorite, callback) {
                Photo.findOne({_id: favorite}, function(err2, photo) {
                    if (err2) {
                        response.status(400).end(JSON.stringify(err2));
                        callback(err2);
                    } else {
                        output.push(photo);
                        callback();
                    }
                });
            }, function (err3) {
                if(err3) {
                    response.status(400).send(JSON.stringify(err3));
                } else {
                    response.end(JSON.stringify(output));
                }
            });
        }
    });
});

app.get('/recentPhoto/:id', function (request, response) {
    let userId = request.params.id;
    Photo.find({user_id: userId}, function (err, photos) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            response.status(200).send(photos.pop());
        }
    });
});

app.get('/commentPhoto/:id', function (request, response) {
    let userId = request.params.id;
    Photo.find({user_id: userId}, function (err, photos) {
        if (err) {
            response.status(400).end(JSON.stringify(err));
        } else {
            let output = photos[0];
            for (let photo of photos) {
                if (photo.comments.length > output.comments.length) {
                    output = photo;
                }
            }
            response.status(200).send(output);
        }
    });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log(port);
    //console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


