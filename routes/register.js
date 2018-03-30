var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('register');
});

router.post('/confirm', (req, res, next) => {
  var username = req.body.username;
  var password = req.body.password;
  const cipher = crypto.createCipher('aes192', "a passworld");

  let encrypted = cipher.update(password, 'utf8', 'hex');

  encrypted += cipher.final('hex');
  // console.log('server-username' + username + 'password' + encrypted);

  mongodbConfirm(username, encrypted, res)
})
function mongodbConfirm(username, encrypted, res) {
  //数据库的插入逻辑

  //1、重复逻辑；1；
  //2、数据库逻辑错误=>res.send('0') 返回错误代码0
  var url = 'mongodb://localhost:27017'
  MongoClient.connect(url, (err, client) => {
    console.log()
    if (err) {
      res.send('0');
      client.close();
    }
    var account = client.db('account');
    var user = account.collection('user');
    user.find({ username: username }).toArray((err, result) => {
      if (err) {
        res.send('0');
        client.close();
      }
      if (result.length !== 0) {
        res.send('1');
        client.close();
      } else {
        var userdata = {
          username: username,
          password: encrypted
        };
        user.insert(userdata, (err, result) => {
          if (err) {
            res.send('0');
            client.close();
          }
          res.send(JSON.stringify(userdata));
        })
      }
    })
  })
}

module.exports = router;
