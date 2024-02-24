const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2');
const crypto = require('crypto');
const session = require('express-session');
const path = require('path');
const dot = require('dotenv').config();
const bodyparser = require('body-parser');
const compression = require('compression');

const app = express();

const userRooms = new Map();

app.use(cors({
    origin: function(origin, callback){
        callback(null, true);
    },
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(compression());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:5173',
    }
});

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'test',
    database: 'e2e'
});

const createRoom= (user1, user2) => {
    const sortedUsers = [user1, user2].sort();
    return `${sortedUsers[0]}_${sortedUsers[1]}`;
}

const encrypt = (string, publicKey) => {
    const buffer = Buffer.from(string, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
};

io.on('connection', socket => {
    console.log('New user connected: ', socket.id);

    socket.on("disconnect", (reason, details) => {
        console.log("User disconnected: ", socket.id);
        console.log('Disconnected due to: ', reason);
        console.log('Disconnection details: ', details);
      });

    // Handle private chat initiation
    socket.on('privateChat', (sender, receiver) => {
        const room = createRoom(sender, receiver);
        
        // Join the private room
        socket.join(room);
        console.log(`${sender} joined private room ${room}`);

        // Store the room association
        userRooms.set(sender, room);
        userRooms.set(receiver, room);

        // Inform the users that a private chat has started
        io.to(room).emit('privateChatStarted', `${sender} has started a private chat with ${receiver}`);

        socket.on('chat message', (msg) => {
            const message = msg.content;
            console.log('message: ', message);
            
            //let message;
    
            const room = userRooms.get(sender);
            if (room) {
                // Send the message to the room
                io.to(room).emit('chat message', { content: message, room: room, sender: sender });
            }
    
            // // Get a connection from the pool
            // pool.getConnection((err, connection) => {
            //     if (err) {
            //         console.error('MySQL connection error:', err);
            //         return;
            //     }
    
            //     connection.query('SELECT userkey FROM users WHERE username = ?', [msg.user], (err, result) => {
            //         if (err) {
            //             console.error('MySQL query error:', err);
            //             return;
            //         }
            //         const publicKey = result[0].userkey;
            //         const publicKeyBuffer = Buffer.from(publicKey, 'utf-8');
            //         const encryptedMsg = encrypt(msg.content, publicKeyBuffer);
            //         message = encryptedMsg;
            //         console.log("encrypted")
    
            //         // Save message to MySQL
            //         console.log("sending");
            //         connection.query('INSERT INTO messages (user, content) VALUES (?, ?)', [msg.user, encryptedMsg], (err, result) => {
            //             if (err) {
            //                 console.error('MySQL insertion error:', err);
            //                 return;
            //             }
            //             console.log('Message saved to MySQL');
    
            //             // Release the connection back to the pool
            //             connection.release();
            //         });
            //     })
            // });
        });
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Server is running');
})


app.get('/getMessages', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('MySQL connection error:', err);
            res.status(500).send('Error retrieving messages from MySQL');
            return;
        }

        // Retrieve messages from MySQL
        connection.query('SELECT * FROM messages', (err, results) => {
            if (err) {
                console.error('Error retrieving messages from MySQL:', err);
                res.status(500).send('Error retrieving messages from MySQL');
                return;
            }
            console.log("got messages")
            res.json(results);

            // Release the connection back to the pool
            connection.release();
        });
    });
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (username && password) {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL connection error:', err);
                res.status(500).send('Error connecting to MySQL');
                return;
            }
            connection.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
                if (err) {
                    console.error('MySQL query error:', err);
                    res.status(500).send('Error registering user');
                    return;
                }
                if (result.length > 0) {
                    res.status(400).send('Username already exists');
                    connection.release();
                    return;
                }
                connection.query('INSERT INTO users (username, userpwd, usermail) VALUES (?, ?, ?)', [username, hashedPassword, email], (err, result) => {
                    if (err) {
                        console.error('MySQL insertion error:', err);
                        res.status(500).send('Error registering user');
                        return;
                    }
                    console.log('User registered successfully');
                    res.status(200).send("Successfully registered");
                    // Don't release the connection here, let the connection pool manage it
                })
            })
        });
    }
})

app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL connection error:', err);
                res.status(500).send('Error connecting to MySQL');
                return;
            }
            connection.query('SELECT * FROM users WHERE username = ? AND userpwd = ?', [username, hashedPassword], (err, result) => {
                if (err) throw err;
                if (result.length > 0) {
                    res.send({token : crypto.randomBytes(128).toString('utf-8'), id : result[0].idusers});
                    console.log(`Login Successful\nUser: ${result[0].username}\nID: ${result[0].idusers}`);
                } else {
                    res.status(400).send('Incorrect Username and/or Password!');
                }
                connection.release();
            });
        })
    } else {
        res.send('Please enter Username and Password!');
    }
});

app.get('/getUsers', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('MySQL connection error:', err);
            res.status(500).send('Error retrieving users from MySQL');
            return;
        }
        connection.query('SELECT * FROM users', (err, results) => {
            if (err) {
                console.error('Error retrieving users from MySQL:', err);
                res.status(500).send('Error retrieving users from MySQL');
                return;
            }
            res.json(results);
            connection.release();
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('http://localhost:5173/');
})