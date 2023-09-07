var express = require('express');
var router = express.Router();
var mysql = require('../config/database')();
var conn = mysql.init();
mysql.open(conn);

/* GET eartheye main page. */
router.get('/', function(req, res, next) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let idx = req.session.idx;
        let sql = 'select * from info_members where idx=?';
        conn.query(sql, [idx],  function(err, result) {
            if(err) {
                mysql.error(err, res);
            } else {
                let resultData = null;

                if(idx && result.length) {
                    delete result[0].pass;
                    delete result[0].level;
                    delete result[0].status;
                    delete result[0].insert_date;
                    delete result[0].update_date;
                    delete result[0].quit_date;
                    delete result[0].use_period;
                    delete result[0].period_start;
                    delete result[0].period_end;

                    resultData = result[0];
                    resultData.areas = [];

                    sql = 'select idx, country, city, lat, lng, bbox, coords from info_members_area where member_idx=? and is_save="1" order by idx desc';
                    conn.query(sql, [idx],  function(err, results) {
                        if(err) {
                            mysql.error(err, res);
                        } else {
                            resultData.areas = results;

                            res.render('eartheye', {
                                title: 'earthEye',
                                sid: req.session.idx,
                                slv: req.session.level,
                                sname: req.session.name,
                                data: (result.length) ? JSON.stringify(resultData) : idx
                            });
                        }
                    });
                } else {
                    res.render('eartheye', {
                        title: 'earthEye',
                        sid: req.session.idx,
                        slv: req.session.level,
                        sname: req.session.name,
                        data: (result.length) ? JSON.stringify(resultData) : idx
                    });
                }
            }
        });
    }
});

router.post('/aoisave', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let sid = req.session.idx,
            idx = parseInt(req.body.idx),
            type = req.body.type,
            title = req.body.title,
            desc = req.body.desc,
            lat = req.body.lat,
            lng = req.body.lng,
            area = req.body.area,
            coord = req.body.coord,
            sw = req.body.sw,
            ne = req.body.ne;

        let sql = '';

        if(idx) {
            sql = 'update info_aoi set title=?, description=?, update_date=CURRENT_TIMESTAMP() where idx=?';
            conn.query(sql, [title, desc, idx], function(err, results) {
                if(err) {
                    mysql.error(err, res);
                } else {
                    return res.json({ result: true, code: 'OK', message: 'Success' });
                }
            });
        } else {
            sql = [
                'insert into info_aoi (draw_type, title, description, lat, lng, area, member_idx, coordinates, sw_latlng, ne_latlng) ',
                ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ].join('');
            conn.query(sql, [type, title, desc, lat, lng, area, sid, coord, sw, ne], function (err, results) {
                if(err) {
                    mysql.error(err, res);
                } else {
                    return res.json({ result: true, code: 'OK', message: 'Success' });
                }
            });
        }
    }
});

router.post('/aoidelete', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let idx = parseInt(req.body.idx);
        let sql = '';

        if(!idx) {
            return res.json({ result: false, code: 'IDX_EMPTY', message: 'There is no required value.' });
        } else {
            sql = 'update info_aoi set is_delete=? where idx=?';
            conn.query(sql, ['1', idx], function (err, results) {
                if(err) {
                    mysql.error(err, res);
                } else {
                    return res.json({ result: true, code: 'OK', message: 'Success' });
                }
            });
        }
    }
});

router.post('/aoideleteall', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let sql = 'update info_aoi set is_delete=? where member_idx=?';
        conn.query(sql, ['1', req.session.idx], function (err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({ result: true, code: 'OK', message: 'Success' });
            }
        });
    }
});

router.get('/aoilist', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let sql = 'select * from info_aoi where is_delete="0" and member_idx=? order by update_date desc';
        conn.query(sql, [req.session.idx], function (err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({ result: true, code: 'OK', message: 'Success', data: results });
            }
        });
    }
});

router.post('/aoisearch', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let word = req.body.keyword;

        let sql = 'select * from info_aoi where is_delete="0" and member_idx=? and title like ? order by title';
        conn.query(sql, [req.session.idx, '%'+ word +'%'], function (err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({ result: true, code: 'OK', message: 'Success', data: results });
            }
        });
    }
});

router.get('/aoidetail/:idx', function(req, res) {
    var idx = req.params.idx;

    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let sql = 'select * from info_aoi where idx=?';
        conn.query(sql, [idx], function (err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({result: true, code: 'OK', message: 'Success', data: results});
            }
        });
    }
});

router.post('/saveresult', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let idx = parseInt(req.body.idx),
            type = req.body.type,
            pid = req.body.pid,
            pid_name = req.body.pid_name,
            fid = req.body.fid,
            dates = req.body.dates,
            models = req.body.models,
            result = req.body.result;

        let sql = 'select idx from info_aoi_history where aoi_idx=? and detection_type=? and models=? and pid=? and fid=? and fid_dates=?';
        conn.query(sql, [idx, type, models, pid, fid, dates], function(err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                let ah_idx = results[0];

                if(ah_idx) {
                    sql = 'update info_aoi_history set result_data=?, insert_date=CURRENT_TIMESTAMP() where idx=?';
                    conn.query(sql, [result, ah_idx.idx], function(err, results) {
                        if(err) {
                            mysql.error(err, res);
                        } else {
                            return res.json({ result: true, code: 'OK', message: 'Success' });
                        }
                    });
                } else {
                    sql = [
                        'insert into info_aoi_history (aoi_idx, detection_type, models, pid, pid_name, fid, fid_dates, result_data) ',
                        ' values (?, ?, ?, ?, ?, ?, ?, ?)'
                    ].join('');
                    conn.query(sql, [idx, type, models, pid, pid_name, fid, dates, result], function (err, results) {
                        if(err) {
                            mysql.error(err, res);
                        } else {
                            return res.json({ result: true, code: 'OK', message: 'Success' });
                        }
                    });
                }
            }
        });
    }
});

router.post('/history/check', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let aidx = req.body.idx,
            type = req.body.type,
            pid = req.body.pid,
            fid = (req.body.fid) ? req.body.fid : '';

        let sql = 'select idx from info_aoi_history where aoi_idx=? and detection_type=? and pid=? and fid=? order by idx desc limit 1';
        conn.query(sql, [aidx, type, pid, fid], function (err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({result: true, code: 'OK', message: 'Success', check: results[0] });
            }
        });
    }
});

router.post('/history/list', function(req, res) {
    if(!req.session.idx) {
        res.redirect('/');
    } else {
        let aidx = req.body.idx,
            type = req.body.type,
            pid = req.body.pid,
            fid = req.body.fid;

        let sql = 'select H.*, A.title, A.area from ';
        sql += ' info_aoi_history H ';
        sql += ' left join info_aoi A on A.idx = H.aoi_idx ';
        sql += ' where H.aoi_idx=?';
        if(type) sql += ' and H.detection_type="'+ type +'"';
        if(pid)  sql += ' and H.pid="'+ pid +'"';
        if(fid)  sql += ' and H.fid="'+ fid +'"';
        sql += ' order by H.insert_date desc';
        conn.query(sql, [aidx], function(err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({result: true, code: 'OK', message: 'Success', data: results});
            }
        });
    }
});

router.get('/history/detail/:idx', function(req, res) {
    let idx = req.params.idx;

    if (!req.session.idx) {
        res.redirect('/');
    } else {
        let sql = 'select * from info_aoi_history where idx=?';
        conn.query(sql, [idx], function(err, results) {
            if(err) {
                mysql.error(err, res);
            } else {
                return res.json({result: true, code: 'OK', message: 'Success', data: results});
            }
        });
    }
});

module.exports = router;
