const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
app.use(express.json());
const Redis = require("ioredis");
const redis = new Redis(); // uses defaults unless given configuration object

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
    let mailOptions = {
        from: 'sameer.vashisth.egs@gmail.com',
        to: data.email,
        subject: "Email Verification",
        html: `Please click on the link to verify email <a></a>`,
    };
    transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
            return res.status(400).send("something went wrong with email");
        } else {
            console.log("Email sent: " + info.response);
            // console.log(chalk.grey(url));
        }
    });
})
app.listen(3000, () => {
    console.log('connected to port 3000')
})