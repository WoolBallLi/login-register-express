var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('login');
});
//处理请求的位置
router.post('/confirm', loginConfirm);
function loginConfirm(req, res, next) {
  // console.log('1')
  var username = req.body.username;
  var password = req.body.password;
  password = encrypt(password);
  var cookie = req.headers.cookie;
  var token = req.body.token;
  
  // console.log(username+'username'+password+'password')
  // console.log(token)
  mongoConfirm(res, username, password, token)
}

function mongoConfirm(res, username, hash, token) {
  // console.log(token)
  var url = 'mongodb://localhost:27017';
  MongoClient.connect(url, (err, client) => {
    if (err) {
      res.send('2');
    }
    var odb = client.db('account');
    var user = odb.collection('user');
    //验证用户师傅重名
    new Promise(function (resolve, rejected) {
      user.find({ username: username }).toArray((err, result) => {
        if (result.length == 1) {
          resolve(result[0]);
        };
        resolve('数据库错误');
      })
    })
      .then(function (userdata) {
        //返回数据
        if (userdata.password == hash) {
          if (token== 1 ) {
  console.log(typeof token)
            
            createToken(res, username);
          }
          res.send(userdata);
        } else {
          res.send('0');
        }
      }, function (e) {
        res.send('0');
        client.close();
      })
  })
}

function createToken(res, username) {
  //创建token头
  let token_header = {
    'typ': 'jwt',
    'alg': 'MD5'
  }
  let header_hex = objToHex(token_header);
  //创建patload部分
  let token_payload = {
    'iss': 'loachost',
    'exp': '10000',
    'name': username
  }
  let payload_hex = objToHex(token_payload);

  var pem = fs.readFileSync(__dirname + '/../server.pem');
  var key = pem.toString('ascii');
  const token_sinature = crypto.createHmac('sha1', 'key')
    .update(payload_hex + '' + header_hex)
    .digest('hex');
  var user_token = header_hex + '.' + payload_hex + '.' + token_sinature;
  res.cookie('LSAID', user_token)
  //查看该用户是否存在token，如果存在token就更新token，如果没有就创建token
  var url = 'mongodb://localhost:27017';
  MongoClient.connect(url, (err, client) => {
    var odb = client.db('account');
    var tokens = odb.collection('tokens');
    tokens.find({ username: username }).toArray((err, result) => {
      if (result.length != 0) {
        tokens.update({ username: username }, { $set: { token: user_token } });
      } else {
        tokens.insert({ username: username, token: user_token });
      }
    })
  })
}

function encrypt(password) {
  const cipher = crypto.createCipher('aes192', "a passworld");
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function objToHex(obj) {
  var str = JSON.stringify(obj);
  var buff = Buffer.from(str);
  var hex = buff.toString('hex');
  return hex;
}

function hexToObj(hex) {
  var buff = Buffer.from(hex, 'hex');
  var str = buff.toString('utf8');
  var obj = JSON.parse(str);
  return obj;
}

module.exports = router;
