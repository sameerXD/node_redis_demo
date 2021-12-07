const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
app.use(express.json());
const Redis = require("ioredis");
const redis = new Redis(); // uses defaults unless given configuration object
const async = require('async');

// ioredis supports all Redis commands:
redis.set("foo", "bar"); // returns promise which resolves to string, "OK"

// the format is: redis[SOME_REDIS_COMMAND_IN_LOWERCASE](ARGUMENTS_ARE_JOINED_INTO_COMMAND_STRING)
// the js: ` redis.set("mykey", "Hello") ` is equivalent to the cli: ` redis> SET mykey "Hello" `

// ioredis supports the node.js callback style
redis.get("foo").then((res) => {
    console.log(res);
})

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: 'sameer.vashisth.egs@gmail.com',
        pass: 'letsNotWorkAtEvren@123',
    },
});

app.post('/', (req, res) => {
    let data = req.body;
    async.waterfall([
        function (callback) {
            redis.exists(data.email, function (err, reply) {
                if (err) {
                    return callback(true, "error in redis");
                }
                if (reply == 1) {
                    return callback(true, "email already requested");
                    callback(null);
                }
                callback(null);
            })
        },
        function (callback) {
            let rand = Math.floor((Math.random() * 100) + 54);
            let encodedMail = (data.email).toString('base64');
            let link = "http://" + req.get('host') + "/verify?mail=" + encodedMail + "&id=" + rand;

            let mailOptions = {
                from: 'sameer.vashisth.egs@gmail.com',
                to: data.email,
                subject: "Email Verification",
                html: `Please click on the link to verify email <a>${link}</a>`,
            };
            transporter.sendMail(mailOptions, async function (error, info) {
                if (error) {
                    return res.status(400).send("something went wrong with email");
                } else {
                    console.log("Email sent: " + info.response + rand);

                    redis.set(data.email, rand);
                    redis.expire(data.email, 600);
                    callback(null, "email sent successfully")
                    // console.log(chalk.grey(url));
                }
            });
        },
        function (err, data) {
            console.log(err, data);
            res.json({ error: err === null ? false : true, data: data });
        }
    ])

});

app.get('/verify', (req, res) => {
    async.waterfall([
        function (callback) {
            let email = req.query.mail;
            redis.get(email, (err, reply) => {

                if (err) {

                    return callback(true, "error in redis");
                }
                if (reply == null) {
                    console.log(reply, err);

                    return res.send("no such email registerd");
                }
                callback(null, email, reply);
            })
        },
        function (email, reply, callback) {
            if (reply == req.query.id) {
                redis.del(email, (err, reply) => {
                    if (err) {
                        return callback(true, "error in redis");
                    }
                    if (reply != 1) {
                        callback(true, "issue with redis");
                    }
                    callback(null, "email is verified")
                });
            } else {
                return callback(true, "invalid token ")
            }
        }, function (err, data) {
            console.log(err, data);
            return res.send('email is verified')
        }
    ])
})
app.listen(3000, () => {
    console.log('connected to port 3000')
})