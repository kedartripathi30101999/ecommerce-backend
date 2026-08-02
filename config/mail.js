const nodemailer = require("nodemailer");
const dns = require("dns");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  getSocket: (options, callback) => {
    dns.lookup(options.host, { family: 4 }, (err, address) => {
      if (err) return callback(err);

      options.host = address;
      callback(null, false);
    });
  },
});

module.exports = transporter;