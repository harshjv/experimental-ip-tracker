var express = require('express')
var nodemailer = require('nodemailer')

var app = express()
var useragent = require('express-useragent')
var prettyjson = require('prettyjson')

app.use(useragent.express())

var fromName = process.env.FROM_NAME
var fromEmail = process.env.FROM_EMAIL
var password = process.env.PASSWORD
var toEmails = process.env.TO_EMAIL
var smtpServer = process.env.SMTP_SERVER || 'smtp.gmail.com'
var subject = process.env.SUBJECT || 'Hello'
var defaultResponse = process.env.DEFAULT_RESPONSE || '404 Content Not Found'
var geoipAPI = process.env.GEOIP_API || 'http://geoip.nekudo.com/api/'

var transporter = nodemailer.createTransport('smtps://' + fromEmail + ':' + password + '@' + smtpServer)
var request = require('request')

app.get('favicon.ico', function (req, res) {
  res.send('')
})

app.get('*', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  request(geoipAPI + ip, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body)
      var fullUrl = req.protocol + '://' + req.host + req.originalUrl

      var ipinfo = JSON.parse(body)
      var uainfo = req.useragent

      var iptext = prettyjson.render(ipinfo, {noColor: true})
      var iphtml = iptext.replace(/(?:\r\n|\r|\n)/g, '<br>')

      var uatext = prettyjson.render(uainfo, {noColor: true})
      var uahtml = uatext.replace(/(?:\r\n|\r|\n)/g, '<br>')

      var mailOptions = {
        from: '"' + fromName + '" <' + fromEmail + '>',
        to: toEmails,
        subject: subject,
        text: 'Hey,\nSomeone visited the website (' + fullUrl + ') with this IP: ' + ip + '\nLocation details are as follows;\n' + iptext + '\n\nBrowser details are as follows;\n' + uatext,
        html: 'Hey,<br><br>Someone visited the website (' + fullUrl + ') with this IP: <b>' + ip + '</b><br><br>Location details are as follows;<br><pre>' + iphtml + '</pre><br><br>Browser details are as follows;<br><pre>' + uahtml + '</pre>'
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return console.log(error)
        }

        console.log('Message sent: ' + info.response)
        res.send(defaultResponse)
      })
    }
  })
})

app.listen(process.env.PORT || 3000, function (err) {
  if (err) return
})
