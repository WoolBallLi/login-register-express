var express = require('express');
var router = express.Router();
var qs = require('querystring');
var MongoClient = require('mongodb').MongoClient

/* GET home page. */
router.get('/', function(req, res, next) {
  var cookie = qs.parse(req.headers.cookie,'; ','=');
  // console.log(cookie)
  var vaildata = false;
  // console.log(cookie.LSAID)
  if(cookie.LSAID){
    var payload_hex = cookie.LSAID.split('.')[1];
    var payload = hexToObj(payload_hex);
    var url = 'mongodb://localhost:27017';
    console.log(payload_hex.name)

    MongoClient.connect(url,(err,client)=>{
      var account = client.db('account');
      account.collection('token').find({username:payload.name}).toArray((err,result)=>{
        if (err) throw err.message;
        if(result.length >= 0){
          vaildata = true;
        }
        var data = payload.name;
        client.close();
        render(vaildata,res,data);
      })
    })
  }else{
    res.render('index',{
      vaildata:false,
      data:null,
      title:'请登录或注册'
    })
  }
});

function render(vaildata,res,data) {
  if(vaildata){
    res.render('index',{
      vaildata:vaildata,
      data:data,
      title:'欢迎'
    })
  }else{
    res.render('index',{
      vaildata:vaildata,
      data:null,
      title:'请登录或注册'
    })
  }
}

function hexToObj(hex) {
  var buff = new Buffer(hex, "hex");
  var s = buff.toString("utf8");
  var obj = JSON.parse(s);
  return obj;
}

module.exports = router;
