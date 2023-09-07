
function initSinginForm(_chk) {
    let id = $('input[name=uid]'),
        pw = $('input[name=upw]');

    $('#loginfield .form-box').on('click', function() {
        $(this).find('input').focus();
    });

    $('#loginfield .btn_login').on('click', function() {
        checkSinginForm();

        var e = $.Event( "keydown", { keyCode: 13 } );
        pw.trigger(e);
    });

    id.on('keydown', function(e) {
        if(e.keyCode == 13) {
            checkSinginForm();
        }
    });

    pw.on('keydown', function(e) {
        if(e.keyCode == 13) {
            if(checkSinginForm()) {
                $.ajax({
                    type: 'post',
                    url: '/signin',
                    data: { uid: id.val().trim(), upw: pw.val().trim() },
                    success: function(res) {
                        if(res == null || !res.result) {
                            if(res.code == 'CHECK_ID') {
                                id.closest('.form-box').find('.title').bDirectionPane({
                                    message: res.message,
                                    textColor: '#6899eb',
                                    boxDirection: 'up',
                                    boxCorner: 1,
                                    boxBorderSize: 1,
                                    boxColor: '#0e1013',
                                    boxBorderColor: '#47546a',
                                    boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
                                });
                                id.focus();
                            } else if(res.code == 'CHECK_PW') {
                                pw.closest('.form-box').find('.title').bDirectionPane({
                                    message: res.message,
                                    textColor: '#6899eb',
                                    boxDirection: 'up',
                                    boxCorner: 1,
                                    boxBorderSize: 1,
                                    boxColor: '#0e1013',
                                    boxBorderColor: '#47546a',
                                    boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
                                });
                                pw.focus();
                            } else if(res.code == 'BLOCK_MEMBER' || res.code == 'SECEDE_MEMBER' || res.code == 'PERIOD_EXPIRED') {
                                $('body').bAlert({ message: res.message });
                            }
                        } else {
                            if(typeof _chk != 'undefined') {
                                if(res.level > 2) {
                                    $('body').bAlert({
                                        title: 'EarthEye',
                                        message: g_oLang.common.message.not_admin_level[g_sLangCode]
                                    });
                                } else {
                                    location.href = '/admin';
                                }
                            } else {
                                location.href = '/eartheye';
                            }
                        }
                    }
                });
            }
        }
    });
}

function checkSinginForm() {
    var id = $('input[name=uid]'),
        pw = $('input[name=upw]');

    if(!id.val().trim()) {
        id.focus();
        return false;
    }

    if(!pw.val().trim()) {
        pw.focus();
        return false;
    }

    if(pw.val().trim().length < 6) {
        pw.closest('.form-box').find('div:first-child').bDirectionPane({
            message: 'Please check your Password.',
            textColor: '#6899eb',
            boxDirection: 'up',
            boxCorner: 1,
            boxBorderSize: 1,
            boxColor: '#0e1013',
            boxBorderColor: '#47546a',
            boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
        });
        pw.focus();
        return false;
    }

    return true;
}

function openMemberInfoBox(sid) {
    let id = 'memberinfobox';

    if($('#'+ id).length) {
        closebDialog(id);
    }

    showLoading();
    $.ajax({
        type: 'post',
        url: '/member/info',
        data: { sid: sid },
        success: function(res) {
            hideLoading();

            if(res != null && res.result) {
                var data = res.data;

                var markup = [
                    '<div class="mb-inbox">',
                    '   <input type="hidden" name="idx" value="'+ data.idx +'" />',
                    '   <div class="formbox">',
                    '       <div class="subtitle">'+ g_oLang.common.title.username[g_sLangCode] +'</div>',
                    '       <div class="content"><input type="text" name="name" value="'+ data.name +'" readonly /></div>',
                    '   </div>',
                    '   <div class="formbox">',
                    '       <div class="subtitle">'+ g_oLang.common.title.userid[g_sLangCode] +'</div>',
                    '       <div class="content"><input type="text" name="id" value="'+ data.id +'" readonly /></div>',
                    '   </div>',
                    '   <div class="formbox on">',
                    '       <div class="subtitle">'+ g_oLang.common.title.email[g_sLangCode] +'</div>',
                    '       <div class="content"><input type="text" name="email" value="'+ data.email +'" autocomplete="false" placeholder="'+ g_oLang.common.message.input_email[g_sLangCode] +'" /></div>',
                    '   </div>',
                    '   <div class="updownbar">',
                    '       <div class="subtitle">'+ g_oLang.common.title.change_pass[g_sLangCode] +'</div>',
                    '       <div class="arrow"></div>',
                    '   </div>',
                    '   <div class="updownbox">',
                    '       <div class="formbox on">',
                    '           <div class="subtitle">'+ g_oLang.common.title.current_pass[g_sLangCode] +'</div>',
                    '           <div class="content"><input type="password" name="current_pass" placeholder="'+ g_oLang.common.message.input_current_pass[g_sLangCode] +'" /></div>',
                    '       </div>',
                    '       <div class="formbox on">',
                    '           <div class="subtitle">'+ g_oLang.common.title.new_pass[g_sLangCode] +'</div>',
                    '           <div class="content"><input type="password" name="new_pass" placeholder="'+ g_oLang.common.message.input_new_pass[g_sLangCode] +'" /></div>',
                    '       </div>',
                    '       <div class="formbox on">',
                    '           <div class="subtitle">'+ g_oLang.common.title.confirm_pass[g_sLangCode] +'</div>',
                    '           <div class="content"><input type="password" name="confirm_pass" placeholder="'+ g_oLang.common.message.input_renew_pass[g_sLangCode] +'" /></div>',
                    '       </div>',
                    '   </div>',
                    '   <div class="btnbar">',
                    '       <button class="btn_common_t2 btn_msave">'+ g_oLang.common.button.save[g_sLangCode] +'</button>',
                    '       <button class="btn_common_t1 btn_mcancel">'+ g_oLang.common.button.cancel[g_sLangCode] +'</button>',
                    '   </div>',
                    '</div>'
                ].join('');

                $('body').bDialog({
                    boxID: id,
                    boxTitle: g_oLang.common.title.memberinfo_setting[g_sLangCode],
                    boxWidth: '480px',
                    boxHeight: 'auto',
                    boxColor: '#2f3646',
                    boxTitleColor: '#2f3646',
                    boxTitleTextColor: '#fff',
                    boxBorder: '0',
                    boxCorner: 1,
                    useBoxModal: true,
                    useBoxClose: false,
                    useBoxShadow: false,
                    boxContents: markup
                });

                let o = $('#'+ id);

                o.parent().find('.ui-dialog-title')
                    .prepend('<span class="ee-icon ee-icon-setting"></span> &nbsp;');

                o.siblings('.ui-dialog-titlebar').css({
                    'text-align': 'initial',
                    'font-size': '18px',
                    'font-weight': 500,
                    'color': '#fff',
                    'padding': '11px 15px',
                    'border-bottom': '1px solid rgba(0, 0, 0, 0.14)'
                });

                o.find('.formbox.on').on('click', function() {
                    $(this).find('input').focus();
                });

                o.find('.updownbar').on('click', function() {
                    var me = $(this);

                    if(me.hasClass('open')) {
                        o.find('.updownbox').animate({ height: '0' }, 200, function() {
                            me.removeClass('open');
                            me.find('.arrow').removeClass('on');
                            $(this).hide();
                        });
                    } else {
                        var th = o.find('.updownbox .formbox').eq(0).height() * o.find('.updownbox .formbox').length;
                        o.find('.updownbox').show().animate({ height: th +'px' }, 200, function() {
                            me.addClass('open');
                            me.find('.arrow').addClass('on');
                        });
                    }
                });

                o.find('.btn_msave').on('click', function() {
                    var idx = o.find('input[name=idx]'),
                        email = o.find('input[name=email]'),
                        current_pass = o.find('input[name=current_pass]'),
                        new_pass = o.find('input[name=new_pass]'),
                        confirm_pass = o.find('input[name=confirm_pass]');

                    if(!email.val().trim()) {
                        email.attr('placeholder', g_oLang.common.message.input_email[g_sLangCode]).focus();
                        return;
                    } else {
                        if(!checkMail(email.val().trim())) {
                            email.attr('placeholder', g_oLang.common.message.valid_email[g_sLangCode]).val('').focus();
                            return;
                        }
                    }

                    if(current_pass.val().trim()) {
                        if(!o.find('.updownbar').hasClass('open')) {
                            o.find('.updownbar').trigger('click');
                        }

                        if(!new_pass.val().trim()) {
                            new_pass.focus();
                            return;
                        } else {
                            if(!checkPassword(new_pass.val().trim())) {
                                new_pass.val('').focus();
                                return;
                            }
                        }

                        if(!confirm_pass.val().trim()) {
                            confirm_pass.focus();
                            return;
                        }

                        if(new_pass.val().trim() != confirm_pass.val().trim()) {
                            confirm_pass.focus();
                            return;
                        }
                    }

                    showLoading();
                    $.ajax({
                        type: 'post',
                        url: '/member/update',
                        data: {
                            idx: idx.val(),
                            email: email.val().trim(),
                            current_pass: current_pass.val().trim(),
                            new_pass: new_pass.val().trim()
                        },
                        success: function(res) {
                            hideLoading();

                            if(res != null && res.result) {
                                closebDialog(id);
                                $('body').bToast({ message: g_oLang.common.message.update_succeed[g_sLangCode] });
                            }
                        }
                    });
                });

                o.find('.btn_mcancel').on('click', function() {
                    closebDialog(id);
                });
            }
        }
    });
}

function initShoothingStar() {
    (function () {
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
        window.requestAnimationFrame = requestAnimationFrame;
    })();

    // Terrain stuff.
    let background = document.getElementById("starcanvas"),
        bgCtx = background.getContext("2d"),
        width = window.innerWidth,
        height = document.body.offsetHeight;

    (height < 400) ? height = 400 : height;

    background.width = width;
    background.height = height;

    // Second canvas used for the stars
    bgCtx.fillStyle = '#090a0f';
    bgCtx.fillRect(0, 0, width, height);

    // stars
    function Star(options) {
        this.size = Math.random() * 2;
        this.speed = Math.random() * .15;
        this.x = options.x;
        this.y = options.y;
    }

    Star.prototype.reset = function () {
        this.size = Math.random() * 2;
        this.speed = Math.random() * .15;
        this.x = width;
        this.y = Math.random() * height;
    };

    Star.prototype.update = function () {
        this.x -= this.speed;
        this.y -= this.speed / 2;
        if (this.x < 0 || this.y < 0) {
            this.reset();
        } else {
            bgCtx.fillRect(this.x, this.y, this.size, this.size);
        }
    };

    function ShootingStar() {
        this.reset();
    }

    ShootingStar.prototype.reset = function () {
        this.x = Math.random() * width;
        this.y = 0;
        this.len = (Math.random() * 80) + 10;
        this.speed = (Math.random() * 10) + 6;
        this.size = (Math.random() * 1) + 0.1;
        // this is used so the shooting stars arent constant
        this.waitTime = new Date().getTime() + (Math.random() * 3000) + 500;
        this.active = false;
    };

    ShootingStar.prototype.update = function () {
        if (this.active) {
            this.x -= this.speed;
            this.y += this.speed;
            if (this.x < 0 || this.y >= height) {
                this.reset();
            } else {
                bgCtx.lineWidth = this.size;
                bgCtx.beginPath();
                bgCtx.moveTo(this.x, this.y);
                bgCtx.lineTo(this.x + this.len, this.y - this.len);
                bgCtx.stroke();
            }
        } else {
            if (this.waitTime < new Date().getTime()) {
                this.active = true;
            }
        }
    };

    let entities = [];

    // init the stars
    for (let i = 0; i < height; i++) {
        entities.push(new Star({
            x: Math.random() * width,
            y: Math.random() * height
        }));
    }

    // Add 2 shooting stars that just cycle.
    entities.push(new ShootingStar());
    entities.push(new ShootingStar());

    //animate background
    function animate() {
        bgCtx.fillStyle = '#090a0f';
        bgCtx.fillRect(0, 0, width, height);
        bgCtx.fillStyle = '#ffffff';
        bgCtx.strokeStyle = '#ffffff';

        let entLen = entities.length;

        while (entLen--) {
            entities[entLen].update();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

function initStarfield() {
    var ws = $(window).outerWidth(),
        hs = $(window).outerHeight();

    ws *= 2, hs *= 2;

    var s_bs = getMultipleBoxShadow(700, ws, hs) + ';',
        m_bs = getMultipleBoxShadow(200, ws, hs) + ';',
        b_bs = getMultipleBoxShadow(100, ws, hs) + ';';

    var css = [
        '#s_stars {width: 1px; height: 1px; background: transparent;',
        'box-shadow: '+ s_bs,
        'animation: animStar 1500s linear infinite;}',
        '#s_stars::after {conetnt: " "; position: absolute; top: '+ hs +'px;',
        'width: 1px; height: 1px; background: transparent;',
        'box-shadow: '+ s_bs +'}',
        '#m_stars {width: 2px; height: 2px; background: transparent;',
        'box-shadow: '+ m_bs,
        'animation: animStar 500s linear infinite;}',
        '#m_stars::after {conetnt: " "; position: absolute; top: '+ hs +'px;',
        'width: 2px; height: 2px; background: transparent;',
        'box-shadow: '+ m_bs +'}',
        '#b_stars {width: 3px; height: 3px; border-radius: 3px; background: transparent;',
        'box-shadow: '+ b_bs,
        'animation: animStar 150s linear infinite;}',
        '#b_stars::after {conetnt: " "; position: absolute; top: '+ hs +'px;',
        'width: 3px; height: 3px; background: transparent;',
        'box-shadow: '+ b_bs +'}',
        '@keyframes animStar {',
        '   from {transform: translate(0, 0);}',
        '   to {transform: translate(-'+ ws +'px, -'+ hs +'px);}',
        '}'
    ].join('');

    if($('#starfield_css').length) {
        $('#starfield_css').remove();
    }
    var style = $('<style />').attr('id','starfield_css');
    style.html(css);

    $(document).find('head').append(style);

    $(window).resize(function() {
        initStarfield();
    });
}

function getMultipleBoxShadow(_cnt, _ws, _hs) {
    var str = utilRandom(_ws) +'px '+ utilRandom(_hs) +'px #fff';

    for(var i = 2; i <= _cnt; i++) {
        str += ' , '+ utilRandom(_ws) +'px '+ utilRandom(_hs) +'px #fff';
    }

    return str;
}

function utilRandom(_num) {
    return Math.ceil(Math.random() * _num);
}

function checkPassword(str) {
    var check1 = /^[a-zA-Z0-9]\w{7,15}$/;

    if(str.length > 7 && str.length < 16 && check1.test(str)) {
        return true;
    } else {
        return false;
    }
}

function checkMail(strMail) {
    var check1 = /(@.*@)|(\.\.)|(@\.)|(\.@)|(^\.)/;
    var check2 = /^[a-zA-Z0-9\-\.\_]+\@[a-zA-Z0-9\-\.]+\.([a-zA-Z]{2,4})$/;

    if(!check1.test(strMail) && check2.test(strMail)) {
        return true;
    } else {
        return false;
    }
}

function nl2br(str) {
    return str.replace(/\n/g, "<br />");
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;

    while(L && this.length) {
        what = a[--L];

        while((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }

    return this;
};

function saveText(_str, _fn) {
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,'+ encodeURIComponent(_str));
    a.setAttribute('download', _fn);
    a.click();
}

Date.prototype.format = function (f) {
    if (!this.valueOf()) return " ";

    var weekKorName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var weekKorShortName = ["일", "월", "화", "수", "목", "금", "토"];
    var weekEngName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var weekEngShortName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|KS|KL|ES|EL|HH|hh|mm|ss|a\/p)/gi, function ($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear(); // 년 (4자리)
            case "yy": return (d.getFullYear() % 1000).zf(2); // 년 (2자리)
            case "MM": return (d.getMonth() + 1).zf(2); // 월 (2자리)
            case "dd": return d.getDate().zf(2); // 일 (2자리)
            case "KS": return weekKorShortName[d.getDay()]; // 요일 (짧은 한글)
            case "KL": return weekKorName[d.getDay()]; // 요일 (긴 한글)
            case "ES": return weekEngShortName[d.getDay()]; // 요일 (짧은 영어)
            case "EL": return weekEngName[d.getDay()]; // 요일 (긴 영어)
            case "HH": return d.getHours().zf(2); // 시간 (24시간 기준, 2자리)
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2); // 시간 (12시간 기준, 2자리)
            case "mm": return d.getMinutes().zf(2); // 분 (2자리)
            case "ss": return d.getSeconds().zf(2); // 초 (2자리)
            case "a/p": return d.getHours() < 12 ? "오전" : "오후"; // 오전/오후 구분
            default: return $1;
        }
    });
};

String.prototype.string = function (len) { var s = '', i = 0; while (i++ < len) { s += this; } return s; };
String.prototype.zf = function (len) { return "0".string(len - this.length) + this; };
Number.prototype.zf = function (len) { return this.toString().zf(len); };