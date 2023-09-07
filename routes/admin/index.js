var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var mysql = require('../../config/database')();
var Pagination = require('../pagination');
var conn = mysql.init();
mysql.open(conn);

/* GET Admin login page. */
router.get('/', function(req, res, next) {
    if(req.session.idx && req.session.level < 3) {
        res.redirect('/admin/member');
    } else {
        res.render('admin/index', {title: 'earthEye'});
    }
});

router.get('/member', function(req, res, next) {
    if(!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        res.render('admin/member', {
            title: 'earthEye',
            sid: req.session.idx,
            slv: req.session.level,
            sname: req.session.name
        });
    }
});

router.get('/mdetail/:idx', function(req, res, next) {
    let idx = req.params.idx;

    if(!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        if(typeof idx == 'undefined' || !idx) {
            idx = '';
        }

        let sql = 'select * from info_members where idx=?';
        conn.query(sql, [idx],  function(err, result) {
            if(err) {
                mysql.error(err, res);
            } else {
                let resultData = null;

                if(idx && result.length) {
                    delete result[0].pass;
                    resultData = result[0];
                    resultData.areas = [];

                    sql = 'select idx, country, city, lat, lng, bbox, coords from info_members_area where member_idx=? and is_save="1" order by idx desc';
                    conn.query(sql, [idx],  function(err, results) {
                        if(err) {
                            mysql.error(err, res);
                        } else {
                            resultData.areas = results;

                            res.render('admin/mdetail', {
                                title: 'earthEye',
                                sid: req.session.idx,
                                slv: req.session.level,
                                sname: req.session.name,
                                midx: idx,
                                data: (result.length) ? JSON.stringify(resultData) : idx
                            });
                        }
                    });
                } else {
                    res.render('admin/mdetail', {
                        title: 'earthEye',
                        sid: req.session.idx,
                        slv: req.session.level,
                        sname: req.session.name,
                        midx: idx,
                        data: (result.length) ? JSON.stringify(resultData) : idx
                    });
                }
            }
        });
    }
});

router.post('/member/list', function(req, res) {
    if(!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        let page = parseInt(req.body.page),
            pagelist = parseInt(req.body.page_list),
            stype = req.body.search_type,
            sword = req.body.search_word;

        let subsql = '';
        let current_page = page > 0 ? page : 1;

        if(stype) {
            switch(stype) {
                case 'name':
                    subsql = ' and name like "%'+ sword +'%"';
                    break;

                case 'id':
                    subsql = ' and id like "%'+ sword +'%"';
                    break;

                case 'imagery':
                    subsql = ' and set_imagery_types like "%'+ sword +'%"';
                    break;

                case 'detection':
                    subsql = ' and set_detection_types like "%'+ sword +'%"';
                    break;

                case 'area':
                    subsql = [
                        ' and (',
                        '   select count(idx) from info_members_area ',
                        '   where (country like "%'+ sword +'%" or city like "%'+ sword +'%")',
                        '   and member_idx=info_members.idx',
                        ')'
                    ].join('');
                    break;
            }
        } else {
            if(sword) {
                subsql = [
                    ' and (',
                    ' id like "%'+ sword +'%"',
                    ' or name like "%'+ sword +'%"',
                    ' or set_imagery_types like "%'+ sword +'%"',
                    ' or set_detection_types like "%'+ sword +'%"',
                    ' or (',
                    '       select count(idx) from info_members_area ',
                    '       where (country like "%'+ sword +'%" or city like "%'+ sword +'%")',
                    '       and member_idx=info_members.idx',
                    '   )',
                    ')'
                ].join('');
            }
        }

        let sql = 'select count(idx) as total from info_members where 1=1 '+ subsql;
        conn.query(sql, [], function(err, result) {
            if(err) {
                mysql.error(err, res);
            } else {
                let total = result[0].total;
                let paginate = new Pagination(total, current_page, pagelist);

                sql = [
                    'select *, (select count(idx) from info_members_area where member_idx=info_members.idx) as area_count ',
                    ' from info_members ',
                    ' where 1=1 '+ subsql,
                    ' order by idx desc',
                    ' limit '+ paginate.page_list +' offset '+ paginate.offset
                ].join('');

                conn.query(sql, [], function (err, results) {
                    if(err) {
                        mysql.error(err, res);
                    } else {
                        return res.json({ result: true, code: 'OK', message: 'Success', data: results, total: total, pagination: paginate.links() });
                    }
                });
            }
        });
    }
});

router.post('/member/save', function(req, res) {
    if (!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        let idx = parseInt(req.body.idx),
            id = req.body.id,
            name = req.body.name,
            email = req.body.email,
            status = req.body.status,
            level = req.body.level,
            use_period = req.body.use_period,
            period_start = req.body.period_start,
            period_end = req.body.period_end,
            limit_aoi = req.body.limit_aoi,
            set_imagery_types = req.body.set_imagery_types,
            set_detection_types = req.body.set_detection_types,
            set_imagery_provider = req.body.set_imagery_provider,
            set_detection_models = req.body.set_detection_models,
            use_unlimit_area = req.body.use_unlimit_area,
            areas = JSON.parse(req.body.areas);

        let tempPass = generateGuid(10);

        conn.beginTransaction(function(err) {
            if(err) {
                console.log('transaction error');
                mysql.error(err, res);
            }

            let sql = '', datas = [];

            if(idx) {
                sql = [
                    'update info_members set ',
                    ' name=?, email=?, status=?, level=?, use_period=?, period_start=?, period_end=? ',
                    ' , limit_aoi=?, set_imagery_types=?, set_detection_types=? ',
                    ' , set_imagery_provider=?, set_detection_models=?, update_date=CURRENT_TIMESTAMP(), use_unlimit_area=? ',
                    ''+ (status == '3' ? ', quit_date=CURRENT_TIMESTAMP() ' : ''),
                    ' where idx=?'
                ].join('');

                datas = [
                    name, email, status, level, use_period, period_start, period_end,
                    limit_aoi, set_imagery_types, set_detection_types,
                    set_imagery_provider, set_detection_models, use_unlimit_area, idx
                ];
                conn.query(sql, datas, function(err, result) {
                    if(err) {
                        conn.rollback(function() {
                            console.log('info_members update error');
                            mysql.error(err, res);
                        });
                    }

                    sql = 'delete from info_members_area where member_idx=?';
                    conn.query(sql, [idx], function(err, result) {
                        if(err) {
                            conn.rollback(function() {
                                console.log('info_members_area delete error');
                                mysql.error(err, res);
                            });
                        }

                        setAreaData(conn, res, idx, areas);
                    });
                });
            } else {
                sql = 'select idx from info_members where id=?';
                conn.query(sql, [id], function(err, result) {
                    if(err) {
                        conn.rollback(function() {
                            console.log('check userid error');
                            mysql.error(err, res);
                        });
                    }

                    let chk = result[0];
                    if(chk) {
                        return res.json({ result: false, code: 'ALREADY_REGISTERED_ID', message: 'Current ID is already registered.' });
                    } else {
                        sql = [
                            'insert into info_members ',
                            ' (id, name, email, pass, level, status, use_period, period_start, period_end ',
                            ' , limit_aoi, set_imagery_types, set_imagery_provider, set_detection_types, set_detection_models, use_unlimit_area)',
                            ' values (?, ?, ?, password(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                        ].join('');

                        datas = [
                            id, name, email, tempPass, level, status, use_period, period_start, period_end,
                            limit_aoi, set_imagery_types, set_imagery_provider, set_detection_types, set_detection_models, use_unlimit_area
                        ];
                        conn.query(sql, datas, function(err, result) {
                            if(err) {
                                conn.rollback(function() {
                                    console.log('info_members insert error');
                                    mysql.error(err, res);
                                });
                            }

                            sql = 'select idx from info_members where id=?';
                            conn.query(sql, [id], function(err, result) {
                                if(err) {
                                    conn.rollback(function() {
                                        console.log('get userid from inserted data error');
                                        mysql.error(err, res);
                                    });
                                }

                                idx = result[0].idx;

                                let markup = [
                                    '<div style="padding-bottom: 35px; font-size: 24px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\'; color: #fff;">',
                                    '아이디 등록 안내',
                                    '</div>',
                                    '<div style="font-size: 14px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\'; color: #72829d; line-height: 22px;">',
                                    name +'님 환영합니다!<br />EarthEye 회원가입이 완료되었습니다.<br /><br />',
                                    '아이디 : <span style="color: #d8dadc;">'+ id +'</span><br />',
                                    '비밀번호 : <span style="color: #d8dadc;">'+ tempPass +'</span><br /><br /><br />',
                                    '위의 비밀번호는 임시 비밀번호이니 로그인 후 비밀번호를 꼭 변경해 주세요.<br />',
                                    '아래 `Goto EarthEye`버튼을 클릭하여 로그인 해주시기 바랍니다.<br /><br />',
                                    '항상 최선을 다하는 EarthEye가 되겠습니다.<br />',
                                    '감사합니다.',
                                    '</div>',
                                    '<div style="padding-top: 80px;">',
                                    '<a href="http://eartheye.ai/" style="text-decoration: none; display: inline-block; padding: 12px 20px 10px 20px; text-align: center; width: 180px; border: 1px solid #6899eb; border-radius: 3px; background: #2f3646; color: #6899eb; font-size: 16px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\';">Goto EarthEye</a>',
                                    '</div>'
                                ].join('');

                                let mailinfo = {
                                    to: email,
                                    subject: '[EarthEye] 회원정보 안내 메일입니다.',
                                    html: markup
                                };

                                if(!mailing(mailinfo)) {
                                    conn.rollback(function() {
                                        console.log('failed send email');
                                    });
                                    return res.json({ result: false, code: 'MAIL_SEND_ERROR', message: 'Failed to send email to registration completion.' });
                                } else {
                                    setAreaData(conn, res, idx, areas);
                                }
                            });
                        });
                    }
                });
            }
        });
    }
});

router.post('/member/repass', function(req, res) {
    if (!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        let idx = req.body.idx,
            name = req.body.name,
            id = req.body.id,
            email = req.body.email;
        let tempPass = generateGuid(10);

        conn.beginTransaction(function(err) {
            if(err) {
                console.log('transaction error');
                mysql.error(err, res);
            }

            let sql = 'update info_members set email=?, pass=password(?) where idx=?';
            conn.query(sql, [email, tempPass, idx], function(err, result) {
                if(err) {
                    console.log('info_members update error');
                    mysql.error(err, res);
                }

                let markup = [
                    '<div style="padding-bottom: 35px; font-size: 24px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\'; color: #fff;">',
                    '비밀번호 초기화 안내',
                    '</div>',
                    '<div style="font-size: 14px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\'; color: #72829d; line-height: 22px;">',
                    name +'('+ id +')님 안녕하세요!<br /><br />',
                    name +'('+ id +')님의 비밀번호가 재발급 되었습니다.<br />임시 비밀번호는 <span style="color: #d8dadc;">'+ tempPass +'</span>입니다.<br /><br />',
                    '위의 비밀번호는 임시 비밀번호이니 로그인 후 비밀번호를 꼭 변경해 주세요.<br />',
                    '아래 `Goto EarthEye`버튼을 클릭하여 로그인 해주시기 바랍니다.<br /><br />',
                    '항상 최선을 다하는 EarthEye가 되겠습니다.<br />',
                    '감사합니다.',
                    '</div>',
                    '<div style="padding-top: 80px;">',
                    '<a href="http://eartheye.ai/" style="text-decoration: none; display: inline-block; padding: 12px 20px 10px 20px; text-align: center; width: 180px; border: 1px solid #6899eb; border-radius: 3px; background: #2f3646; color: #6899eb; font-size: 16px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\';">Goto EarthEye</a>',
                    '</div>'
                ].join('');

                let mailinfo = {
                    to: email,
                    subject: '[EarthEye] 회원정보 안내 메일입니다.',
                    html: markup
                };

                if(!mailing(mailinfo)) {
                    conn.rollback(function() {
                        console.log('failed send email');
                    });
                    return res.json({ result: false, code: 'MAIL_SEND_ERROR', message: 'Failed to send email to temporary password.' });
                } else {
                    conn.commit(function(err) {
                        if(err) {
                            conn.rollback(function() {
                                console.log('commit error');
                                mysql.error(err, res);
                            });
                        }

                        return res.json({ result: true, code: 'OK', message: 'Success' });
                    });
                }
            });
        });
    }
});

router.get('/object', function(req, res, next) {
    if(!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        res.render('admin/object', {
            title: 'earthEye',
            sid: req.session.idx,
            slv: req.session.level,
            sname: req.session.name
        });
    }
});

router.get('/status', function(req, res, next) {
    if(!req.session.idx || !req.session.level || req.session.level > 2) {
        res.redirect('/admin');
    } else {
        res.render('admin/status', {
            title: 'earthEye',
            sid: req.session.idx,
            slv: req.session.level,
            sname: req.session.name
        });
    }
});

router.get('/signout', function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('/admin');
    });
});

function setAreaData(conn, res, idx, areas) {
    let sql = '';
    for(let i in areas) {
        let area = areas[i];
        sql += (sql ? ', ' : '') + '('+ idx +', "'+ area.country +'", "'+ area.city +'", "'+ area.lat +'", "'+ area.lng +'", "'+ area.bbox +'", \''+ area.coords +'\', "1")';
    }

    if(sql) {
        sql = 'insert into info_members_area (member_idx, country, city, lat, lng, bbox, coords, is_save) values '+ sql;

        conn.query(sql, [],function(err, result) {
            if(err) {
                conn.rollback(function() {
                    console.log('info_members_area insert error');
                    mysql.error(err, res);
                });
            }

            conn.commit(function(err) {
                if(err) {
                    conn.rollback(function() {
                        console.log('commit error');
                        mysql.error(err, res);
                    });
                }

                return res.json({ result: true, code: 'OK', message: 'Success' });
            });
        });
    } else {
        conn.commit(function(err) {
            if(err) {
                conn.rollback(function() {
                    console.log('commit error');
                    mysql.error(err, res);
                });
            }

            return res.json({ result: true, code: 'OK', message: 'Success' });
        });
    }
}

function mailing(_opts) {
    return new Promise((resolve, reject) => {
        let mail = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'dabeeo2012@gmail.com',
                pass: 'wrobcmpvuazqhdhl' //'qwerty0228!!!'
            }
        });

        let markup = [
            '<!doctype html>',
            '<html>',
            '<body style="padding: 0; margin: 0; background: #2a343e; width: 100%;">',
            '<div style="padding: 50px 80px; margin: 0 auto; width: 800px; background: #2a343e; border-bottom: 1px solid #414e62;">',
            '<div style="height: 75px; border-bottom: 1px solid #414e62;">',
            '<img src="http://eartheye.ai/images/gnb_logo.png" height="48" alt="EarthEye" />',
            '</div>',
            '<div style="padding: 55px 0; font-size: 14px; font-family: \'Noto Sans\', Dotum, \'Apple SD Gothic Neo\'; color: #72829d; line-height: 22px;">',
            '' + _opts.html,
            '</div>',
            '</div>',
            '</body>',
            '</html>'
        ].join('');

        let message = {
            from: 'dabeeo2012@gmail.com',
            to: _opts.to,
            subject: _opts.subject,
            html: markup
        };

        mail.sendMail(message, function (err, info) {
            //console.log(info);
            if (err) {
                console.log(err);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function generateGuid(_length) {
    let num = (typeof _length === 'number' && _length > 6) ? (_length / 2) + 2 : 6;
    return Math.random().toString(36).substring(2, num) + Math.random().toString(36).substring(2, num);
}


module.exports = router;
