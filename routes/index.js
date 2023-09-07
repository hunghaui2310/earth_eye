var express = require('express');
var router = express.Router();
var mysql = require('../config/database')();
var conn = mysql.init();
mysql.open(conn);

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.idx) {
    res.redirect('/eartheye');
  } else {
    res.render('index', {title: 'earthEye'});
  }
});

router.get('/signout', function(req, res) {
  req.session.destroy(function(err) {
    res.redirect('/');
  });
});

router.post('/signin', function(req, res) {
  var id = req.body.uid,
      pw = req.body.upw;

  var sql = 'select idx from info_members where id=?';
  conn.query(sql, [id], function(err, results) {
    if(err) {
      mysql.error(err, res);
    } else {
      var idx = results[0];

      if(!idx) {
        return res.json({ result: false, code: 'CHECK_ID', message: 'Please check your ID.' });
      }

      sql = 'select * from info_members where id=? and pass=password(?)';
      conn.query(sql, [id, pw], function(err, results) {
        if(err) {
          mysql.error(err, res);
        } else {
          idx = results[0];

          let today = new Date();
          let dd = String(today.getDate()).padStart(2, '0');
          let mm = String(today.getMonth() + 1).padStart(2, '0');
          let yyyy = today.getFullYear();
          today = yyyy +'.'+ mm +'.'+ dd;

          if(!idx) {
            return res.json({ result: false, code: 'CHECK_PW', message: 'Please check your Password.' });
          } else {
            if(idx['status'] == '2') {
              return res.json({ result: false, code: 'BLOCK_MEMBER', message: 'Membership has been suspended.' });
            } else if(idx['status'] == '3') {
              return res.json({result: false, code: 'SECEDE_MEMBER', message: 'Membership has been secede.'});
            } else if(idx['use_period'] == '1' && (today < idx['period_start'] || today > idx['period_end'])) {
              return res.json({result: false, code: 'PERIOD_EXPIRED', message: 'It is not the period of use.'});
            } else {
              req.session.idx = idx['idx'];
              req.session.email = idx['email'];
              req.session.name = idx['name'];
              req.session.level = idx['level'];
              req.session.save(function () {
                return res.json({result: true, code: 'OK', level: idx['level']});
              });
            }
          }
        }
      });
    }
  });
});

router.post('/member/info/', function(req, res) {
  if(!req.session.idx) {
    res.redirect('/');
  } else {
    var sid = req.body.sid;

    var sql = 'select idx, id, email, name from info_members where idx=?';
    conn.query(sql, [sid], function(err, results) {
      if (err) {
        mysql.error(err, res);
      } else {
        return res.json({result: true, code: 'OK', data: results[0]});
      }
    });
  }
});

router.post('/member/update/', function(req, res) {
  if(!req.session.idx) {
    res.redirect('/');
  } else {
    var idx = req.body.idx,
        email = req.body.email,
        curpass = req.body.current_pass,
        newpass = req.body.new_pass;

    var sql = '';

    if(curpass) {
      sql = 'select idx from info_members where idx=? and pass=password(?)';
      conn.query(sql, [idx, curpass], function (err, results) {
        if(err) {
          mysql.error(err, res);
        } else {
          var chk = results[0];
          if(!chk) {
            return res.json({ result: false, code: 'INVAILD_PASSWORD', message: 'Current password is incorrect.' });
          } else {
            sql = 'update info_members set email=?, pass=password(?) where idx=?';
            conn.query(sql, [email, newpass, idx], function(err, results) {
              if(err) {
                mysql.error(err, res);
              } else {
                return res.json({ result: true, code: 'OK' });
              }
            });
          }
        }
      });
    } else {
      sql = 'update info_members set email=? where idx=?';
      conn.query(sql, [email, idx], function(err, results) {
        if(err) {
          mysql.error(err, res);
        } else {
          return res.json({ result: true, code: 'OK' });
        }
      });
    }
  }
});

module.exports = router;