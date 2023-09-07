
let g_iMemberLevel = 0;
let g_oAllDetectionFeatures = null;
let g_oDetectionAreas = [];

function initSearchForm(_type) {
    let s = $('#framebox .searcharea');
    let bt = $.cookie('before_type');

    switch(_type) {
        case 'M':
            s.find('.searchtype').html('');
            s.find('.searchtype').append('<option value="">'+ g_oLang.common.title.all[g_sLangCode] +'</option>');
            s.find('.searchtype').append('<option value="name">'+ g_oLang.common.title.username[g_sLangCode] +'</option>');
            s.find('.searchtype').append('<option value="id">'+ g_oLang.common.title.userid[g_sLangCode] +'</option>');
            s.find('.searchtype').append('<option value="imagery">'+ g_oLang.common.title.imagery_type[g_sLangCode] +'</option>');
            s.find('.searchtype').append('<option value="detection">'+ g_oLang.common.title.detection[g_sLangCode] +'</option>');
            s.find('.searchtype').append('<option value="area">'+ g_oLang.common.title.detection_area[g_sLangCode] +'</option>');
            break;
    }

    s.find('.searchtype').val(bt).selectric();
    s.find('.inputbox input').on('keydown', function(e) {
        let v = $(this).val();

        if(e.keyCode == 13) {
            if(!v) {
                $(this).focus();
                return false;
            }

            s.find('.btn_cancelinput').show();
            loadMemberList({
                search_type: s.find('.searchtype').val(),
                search_word: v
            });
        }
    });

    s.find('.btn_search').on('click', function() {
        let e = $.Event( "keydown", { keyCode: 13 } );
        s.find('.inputbox input').trigger(e);
    });

    s.find('.btn_cancelinput').on('click', function() {
        s.find('.inputbox input').val('');
        $(this).hide();
        loadMemberList();
    });
}

function loadMemberList(_options) {
    let t = $('#framebox .bodyarea .listarea');
    let p = $('#framebox .bodyarea .pagearea');
    let defaults = {
        page: 1,
        page_list: 20,
        search_type: '',
        search_word: ''
    };

    let opts = $.extend(defaults, _options);

    let markup = [
        '<table style="width: 100%; border: 0;" cellspacing="0" cellpadding="0">',
        '   <thead>',
        '       <tr>',
        '           <td width="80">'+ g_oLang.common.title.no[g_sLangCode] +'</td>',
        '           <td width="110">'+ g_oLang.common.title.member_grade[g_sLangCode] +'</td>',
        '           <td width="120">'+ g_oLang.common.title.userid[g_sLangCode] +'</td>',
        '           <td width="120">'+ g_oLang.common.title.username[g_sLangCode] +'</td>',
        '           <td width="80">'+ g_oLang.common.title.member_status[g_sLangCode] +'</td>',
        '           <td>'+ g_oLang.common.title.imagery_type[g_sLangCode] +'</td>',
        '           <td>'+ g_oLang.common.title.detection[g_sLangCode] +'</td>',
        '           <td width="80">'+ g_oLang.common.title.area_count[g_sLangCode] +'</td>',
        '           <td width="150">'+ g_oLang.common.title.view_area[g_sLangCode] +'</td>',
        '       </tr>',
        '   </thead>',
        '   <tbody>'
    ].join('');

    showLoading();
    $.ajax({
        type: 'post',
        url: '/admin/member/list',
        data: opts,
        success: function(res) {
            hideLoading();

            if(res != null && res.result) {
                let data = res.data;
                let total = res.total;
                let no = total - (opts.page - 1) * opts.page_list;

                for(let i = 0, l = data.length; i < l; i++) {
                    let imagery_type = data[i].set_imagery_types;
                    imagery_type = imagery_type.replace(/,/g, ' / ');

                    let detection_type = data[i].set_detection_types;
                    detection_type = detection_type.replace(/,/g, ' &nbsp; ');
                    detection_type = detection_type.replace('OBJECT', '<span class="rectbox O"></span> OBJECT');
                    detection_type = detection_type.replace('SEGMENTATION', '<span class="rectbox B"></span> SEGMENTATION');
                    detection_type = detection_type.replace('CHANGE', '<span class="rectbox C"></span> CHANGE');

                    markup += [
                        '       <tr>',
                        '           <td>'+ no +'</td>',
                        '           <td>'+ g_oLang.common.title['grade_'+ data[i].level][g_sLangCode] +'</td>',
                        '           <td class="info" data-idx="'+ data[i].idx +'">'+ data[i].id +'</td>',
                        '           <td class="info" data-idx="'+ data[i].idx +'">'+ data[i].name +'</td>',
                        '           <td>'+ g_oLang.common.title['status_'+ data[i].status][g_sLangCode] +'</td>',
                        '           <td class="left">'+ imagery_type +'</td>',
                        '           <td class="left">'+ detection_type +'</td>',
                        '           <td>'+ data[i].area_count +'</td>',
                        '           <td>'+ (data[i].use_unlimit_area == '1' ? g_oLang.common.title.unlimit_area[g_sLangCode] : '<button class="btn_common_t2 btn_viewarea" data-idx="'+ data[i].idx +'">'+ g_oLang.common.title.view_area[g_sLangCode] +'</button>') +'</td>',
                        '       </tr>',
                    ].join('');

                    no--;
                }

                if(!total) {
                    markup += '<tr><td class="notfound" colspan="9">'+ g_oLang.common.message.not_found_result[g_sLangCode] +'</td></tr>';
                }

                markup += [
                    '   </tbody>',
                    '</table>'
                ].join('');

                t.html(markup);
                t.find('td.info').on('click', function() {
                    let idx = $(this).attr('data-idx');
                    $.cookie('before_page', opts.page);
                    $.cookie('before_type', opts.search_type);
                    $.cookie('before_word', opts.search_word);
                    location.href = '/admin/mdetail/'+ idx;
                });

                $.cookie('viewarea', 0);
                t.find('.btn_viewarea').on('click',function() {
                    let idx = $(this).attr('data-idx');
                    $.cookie('before_page', opts.page);
                    $.cookie('before_type', opts.search_type);
                    $.cookie('before_word', opts.search_word);
                    location.href = '/admin/mdetail/'+ idx +'#viewarea';
                });

                p.html(res.pagination);
                p.find('.page-item').on('click', function() {
                    let page = $(this).attr('data-page');
                    opts.page = page;
                    loadMemberList(opts);
                });
            }
        }
    });
}

function initMemberDetail(_detail) {
    let defaults = {
        idx: 0,
        id: "",
        email: "",
        name: "",
        level: "9",
        status: "1",
        insert_date: "",
        update_date: "",
        quit_date: "",
        use_period: "0",
        period_start: "",
        period_end: "",
        limit_aoi: 0,
        set_imagery_types: "",
        set_imagery_provider: '{"satellite":[],"aerial":[],"drone":[]}',
        set_detection_types: "",
        set_detection_models: '{"object":[],"segmentation":[],"change":[]}',
        use_unlimit_area: "0",
        areas: []
    };

    let data = $.extend(defaults, _detail);

    showLoading(g_oLang.common.message.required_info[g_sLangCode]);
    $.ajax({
        type: 'get',
        url: g_sTileServer + '/providers',
        timeout: 3000,
        success: function(res) {
            hideLoading();

            var result = (typeof res == 'string') ? JSON.parse(res) : res;
            if(result != null && !result.error) {
                g_oTileProviders = result.providers;

                let features = null;

                showLoading(g_oLang.common.message.required_info[g_sLangCode]);
                $.ajax({
                    type: 'post',
                    url: g_sCoreServer + '/detection_features',
                    data: JSON.stringify({ "API_KEY": g_sApiKey, "PID": '' }),
                    contentType: 'application/json',
                    success: function(res) {
                        hideLoading();

                        if(res != null && !res.error) {
                            let pids = res.detection_features;

                            for(let i in pids) {
                                let pid = pids[i][0];
                                features = $.extend(features, pid);
                            }

                            for(let i in pids) {
                                let pid = pids[i][0];

                                for(let j in pid) {
                                    features[j] = arrayUnique(features[j].concat(pid[j]));
                                }
                            }

                            g_oAllDetectionFeatures = features;
                            renderMemberDetail(data);

                            let url = window.location;
                            if(url.hash == '#viewarea') {
                                $('#framebox .bodyarea .btn_addarea').focus();
                            }
                        }
                    },
                    error: function(e) {
                        hideLoading();

                        $('body').bAlert({
                            message: g_oLang.common.message.request_failed[g_sLangCode] +'<div class="sub">'+ g_oLang.common.message.try_again[g_sLangCode] +'</div>'
                        });
                    }
                });
            }
        },
        error: function(e) {
            hideLoading();

            $('body').bAlert({
                message: g_oLang.common.message.request_failed[g_sLangCode] +'<div class="sub">'+ g_oLang.common.message.try_again[g_sLangCode] +'</div>'
            });
        }
    });
}

function arrayUnique(array) {
    let a = array.concat();
    for(let i = 0; i < a.length; ++i) {
        for(let j = i+1; j < a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

function renderMemberDetail(data) {
    let t = $('#framebox .bodyarea .center-wrapper');
    let markup = [
        '<div class="standard">',
        '   <table style="width: 100%; border: 0;" cellspacing="10" cellpadding="0">',
        '       <tr>',
        '           <td width="110">' + g_oLang.common.title.member_status[g_sLangCode] + '</td>',
        '           <td width="475"><div class="select-wrapper">',
        '               <select name="status" class="selectbox select-status">',
        '                   <option value="1">' + g_oLang.common.title.status_1[g_sLangCode] + '</option>',
        '                   <option value="2">' + g_oLang.common.title.status_2[g_sLangCode] + '</option>',
        '                   <option value="3">' + g_oLang.common.title.status_3[g_sLangCode] + '</option>',
        '               </select>',
        '           </div></td>',
        '           <td width="10">&nbsp;</td>',
        '           <td width="110">' + g_oLang.common.title.member_grade[g_sLangCode] + '</td>',
        '           <td><div class="select-wrapper">',
        '               <select name="level" class="selectbox select-level">',
        '                   <option value="1">' + g_oLang.common.title.grade_1[g_sLangCode] + '</option>',
        '                   <option value="2">' + g_oLang.common.title.grade_2[g_sLangCode] + '</option>',
        '                   <option value="9">' + g_oLang.common.title.grade_9[g_sLangCode] + '</option>',
        '               </select>',
        '           </div></td>',
        '       </tr>',
        '       <tr>',
        '           <td>' + g_oLang.common.title.username[g_sLangCode] + '</td>',
        '           <td><input type="text" name="username" class="input-fit" placeholder="' + g_oLang.common.message.input_username[g_sLangCode] + '" /></td>',
        '           <td>&nbsp;</td>',
        '           <td>' + g_oLang.common.title.email[g_sLangCode] + '</td>',
        '           <td><input type="text" name="email" class="input-fit" placeholder="' + g_oLang.common.message.input_email[g_sLangCode] + '" /></td>',
        '       </tr>',
        '       <tr>',
        '           <td>' + g_oLang.common.title.userid[g_sLangCode] + '</td>',
        '           <td><input type="text" name="userid" class="input-fit" placeholder="' + g_oLang.common.message.input_userid[g_sLangCode] + '" /></td>',
        '           <td>&nbsp;</td>',
        '           <td>' + g_oLang.common.title.password[g_sLangCode] + '</td>',
        '           <td>',
        '               <div class="commentbox">' + (data.idx ? g_oLang.common.message.create_newpass_sent[g_sLangCode] : g_oLang.common.message.auto_sent_your_pass[g_sLangCode]) + '</div>',
        '               <button class="btn_common_t3 btn_changepass">' + g_oLang.common.title.send_new_pass[g_sLangCode] + '</button>',
        '           </td>',
        '       </tr>',
        '       <tr class="tablep">',
        '           <td>' + g_oLang.common.title.period_of_use[g_sLangCode] + '</td>',
        '           <td>',
        '               <div>',
        '                   <input type="radio" name="use_period" id="period_1" value="0" />',
        '                   <label for="period_1">' + g_oLang.common.title.unlimited[g_sLangCode] + '</label>',
        '               </div>',
        '               <div>',
        '                   <div class="float-left">',
        '                       <input type="radio" name="use_period" id="period_2" value="1" />',
        '                       <label for="period_2">' + g_oLang.common.title.limit_period[g_sLangCode] + '</label>',
        '                   </div>',
        '                   <div class="float-right">',
        '                       <input type="text" name="period_start" class="calinput" readonly="readonly" />',
        '                      &nbsp; 〜 &nbsp; ',
        '                       <input type="text" name="period_end" class="calinput" readonly="readonly" />',
        '                   </div>',
        '               </div>',
        '           </td>',
        '           <td>&nbsp;</td>',
        '           <td>' + g_oLang.common.title.aoi_limit_count[g_sLangCode] + '</td>',
        '           <td>',
        '               <div>',
        '                   <input type="radio" name="limit_aoi" id="limitaoi_1" value="0" />',
        '                   <label for="limitaoi_1">' + g_oLang.common.title.unlimited[g_sLangCode] + '</label>',
        '               </div>',
        '               <div>',
        '                   <div class="float-left">',
        '                       <input type="radio" name="limit_aoi" id="limitaoi_2" value="1" />',
        '                       <label for="limitaoi_2">' + g_oLang.common.title.limit_count[g_sLangCode] + '</label>',
        '                   </div>',
        '                   <div class="float-right" style="width: 60%;">',
        '                       <input type="number" name="aoi_count" class="input-fit" placeholder="' + g_oLang.common.message.input_limit_number[g_sLangCode] + '" />',
        '                   </div>',
        '               </div>',
        '           </td>',
        '       </tr>',
        '   </table>',
        '</div>',
        '<div class="formbox imagery_types">',
        '   <div class="titlebar">' + g_oLang.common.title.set_imagery_type[g_sLangCode] + '</div>',
        '   <div class="box itype-satellite">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="itype_s" id="imagery_s" value="SATELLITE" ' + ((data.set_imagery_types.indexOf('SATELLITE') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="imagery_s">' + g_oLang.common.title.satellite_imagery[g_sLangCode] + '</label>',
        '       </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_itype_s" id="s_itype_s" />',
        '               <label for="s_itype_s">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '   <div class="box itype-aerial">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="itype_a" id="imagery_a" value="AERIAL" ' + ((data.set_imagery_types.indexOf('AERIAL') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="imagery_a">' + g_oLang.common.title.aerial_imagery[g_sLangCode] + '</label>',
        '           </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_itype_a" id="s_itype_a" />',
        '               <label for="s_itype_a">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '   <div class="box itype-drone">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="itype_d" id="imagery_d" value="DRONE" ' + ((data.set_imagery_types.indexOf('DRONE') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="imagery_d">' + g_oLang.common.title.drone_imagery[g_sLangCode] + '</label>',
        '           </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_itype_d" id="s_itype_d" />',
        '               <label for="s_itype_d">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '</div>',
        '<div class="formbox detection_types">',
        '   <a name="viewarea"></a>',
        '   <div class="titlebar">' + g_oLang.common.title.set_detection_type[g_sLangCode] + '</div>',
        '   <div class="box O">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="dtype_o" id="detection_o" value="OBJECT" ' + ((data.set_detection_types.indexOf('OBJECT') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="detection_o">' + g_oLang.common.title.object_detection[g_sLangCode] + '</label>',
        '       </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_dtype_o" id="s_dtype_o" />',
        '               <label for="s_dtype_o">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '   <div class="box B S">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="dtype_b" id="detection_b" value="SEGMENTATION" ' + ((data.set_detection_types.indexOf('SEGMENTATION') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="detection_b">' + g_oLang.common.title.segmentation_detection[g_sLangCode] + '</label>',
        '       </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_dtype_b" id="s_dtype_b" />',
        '               <label for="s_dtype_b">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '   <div class="box C">',
        '       <div class="box-title">',
        '           <input type="checkbox" name="dtype_c" id="detection_c" value="CHANGE" ' + ((data.set_detection_types.indexOf('CHANGE') != -1) ? 'checked="checked"' : '') + ' />',
        '           <label for="detection_c">' + g_oLang.common.title.change_detection[g_sLangCode] + '</label>',
        '       </div>',
        '       <div class="box-wrapper">',
        '           <div class="box-item select-all">',
        '               <input type="checkbox" name="select_dtype_c" id="s_dtype_c" />',
        '               <label for="s_dtype_c">' + g_oLang.common.title.select_all[g_sLangCode] + '</label>',
        '           </div>',
        '       </div>',
        '   </div>',
        '</div>',
        '<div class="formbox detection_areas">',
        '   <div class="titlebar">' + g_oLang.common.title.set_detection_area[g_sLangCode],
        '       <button class="btn_common_t2 btn_addarea" data-idx="' + data.idx + '">+ ' + g_oLang.common.title.new_area[g_sLangCode] + '</button>',
        '       <div class="option">',
        '           <input type="checkbox" name="use_unlimit_area" id="use_unlimit_area" value="1" />',
        '           <label for="use_unlimit_area">' + g_oLang.common.title.unlimit_area[g_sLangCode] + '</label>',
        '       </div>',
        '   </div>',
        '   <div class="arealist-box">',
        '       <table style="width: 100%; border: 0;" cellspacing="0" cellpadding="0">',
        '           <thead>',
        '               <tr>',
        '                   <td width="80">&nbsp;</td>',
        '                   <td>' + g_oLang.common.title.country_and_city[g_sLangCode] + '</td>',
        '                   <td>' + g_oLang.common.title.center_location[g_sLangCode] + '<br />(' + g_oLang.common.title.latitude[g_sLangCode] + ' / ' + g_oLang.common.title.longitude[g_sLangCode] + ')</td>',
        '                   <td width="160">&nbsp;</td>',
        '               </tr>',
        '           </thead>',
        '           <tbody>',
        '               <tr><td colspan="4" height="200" align="center">' + g_oLang.common.message.notfound_detection_area[g_sLangCode] + '</td>',
        '           </tbody>',
        '       </table>',
        '   </div>',
        '</div>',
        '<div class="btnbox">',
        '   <button class="btn_common_r1 btn_close">' + (g_oLang.common.button.close[g_sLangCode]).toUpperCase() + '</button>',
        '   <button class="btn_common_r3 btn_save">' + g_oLang.common.button.save[g_sLangCode] + '</button>',
        '</div>'
    ].join('');

    t.html(markup);

    t.find('.select-status').val(data.status);
    t.find('.select-level').val(data.level);
    if (g_iMemberLevel > parseInt(data.level)) {
        t.find('.select-level').prop('disabled', true);
    }
    t.find('.selectbox').selectric();

    t.find('input[name=username]').val(data.name);
    t.find('input[name=email]').val(data.email);
    if (data.id) {
        t.find('input[name=userid]').val(data.id).prop('disabled', true);
        t.find('.btn_changepass').on('click', function () {
            let email = t.find('input[name=email]');

            if (!email.val().trim()) {
                email.focus();
                return false;
            }

            if (!checkMail(email.val().trim())) {
                email.attr('placeholder', g_oLang.common.message.valid_email[g_sLangCode]).val('').focus();
                return false;
            }

            showLoading();
            $.ajax({
                type: 'post',
                url: '/admin/member/repass',
                data: {
                    idx: data.idx,
                    id: data.id,
                    name: data.name,
                    email: email.val().trim()
                },
                success: function (res) {
                    hideLoading();

                    if (res != null && res.result) {
                        $('body').bAlert({message: g_oLang.common.message.send_temporary_password[g_sLangCode]});
                    }

                    if (!res.result && res.code == 'MAIL_SEND_ERROR') {
                        $('body').bAlert({message: res.message});
                    }
                }
            });
        });
    } else {
        t.find('.btn_changepass').addClass('off').prop('disabled', true);
    }

    let dateFormat = 'yy.mm.dd',
        from = t.find('input[name=period_start]'),
        to = t.find('input[name=period_end]');

    t.find('input[name=use_period]').on('click', function () {
        let v = parseInt($(this).val());

        if (v) {
            from.val(from.attr('data-val')).prop('disabled', false);
            to.val(to.attr('data-val')).prop('disabled', false);
        } else {
            from.val('').prop('disabled', true);
            to.val('').prop('disabled', true);
        }
    });
    t.find('input[name=use_period][value=' + data.use_period + ']').trigger('click');

    from
        .attr('data-val', data.period_start)
        .val(data.period_start)
        .datepicker({
            dateFormat: dateFormat,
            defaultDate: '+1w',
            changeMonth: true
        })
        .on('change', function () {
            to.datepicker('option', 'minDate', getPickerDate(this));
        });

    to
        .attr('data-val', data.period_end)
        .val(data.period_end)
        .datepicker({
            dateFormat: dateFormat,
            defaultDate: '+1w',
            changeMonth: true
        })
        .on('change', function () {
            from.datepicker('option', 'maxDate', getPickerDate(this));
        });

    t.find('input[name=limit_aoi]').on('click', function () {
        let v = parseInt($(this).val());

        if (v) {
            t.find('input[name=aoi_count]').val('').prop('disabled', false);
        } else {
            t.find('input[name=aoi_count]').val('').prop('disabled', true);
        }
    });
    if (data.limit_aoi) {
        t.find('input[name=limit_aoi][value=1]').trigger('click');
        t.find('input[name=aoi_count]').val(data.limit_aoi);
    } else {
        t.find('input[name=limit_aoi][value=0]').trigger('click');
    }

    let mproviders = JSON.parse(data.set_imagery_provider);
    let mmodels = JSON.parse(data.set_detection_models);

    g_oTileProviders.forEach(function (item) {
        let imgtype = (typeof item.IMAGERY_TYPE != 'undefined') ? item.IMAGERY_TYPE : 'SATELLITE';
        let imgtypeName = imgtype.toLowerCase();
        let isMultiple = item.MULTIPLE_IMAGES;

        markup = [
            '<div class="box-item' + (mproviders[imgtypeName].includes(item.PID) ? ' on' : '') + '" data-pid="' + item.PID + '">',
            '   <input type="checkbox" name="itype_' + imgtypeName + '" id="' + imgtypeName + '_pid_' + item.PID + '" value="' + item.PID + '" ' + (mproviders[imgtypeName].includes(item.PID) ? 'checked="checked"' : '') + ' />',
            '   <label for="' + imgtypeName + '_pid_' + item.PID + '">' + item.NAME + ' (' + (isMultiple ? 'Multiple tiles' : 'Single tile') + ')</label>',
            '</div>'
        ].join('');

        t.find('.itype-' + imgtypeName + ' .box-wrapper').append(markup);
    });

    for (let i in g_oAllDetectionFeatures) {
        let item = g_oAllDetectionFeatures[i];
        let typename = i.toLowerCase().replace('_detection', '');
        let typeChar = i.charAt(0);

        for (let j = 0, l = item.length; j < l; j++) {
            markup = [
                '<div class="box-item' + (mmodels[typename].includes(item[j]) ? ' on' : '') + '" data-model="' + item[j] + '">',
                '   <input type="checkbox" name="dtype_' + typeChar + '" id="' + typeChar + '_model_' + item[j] + '" value="' + item[j] + '" ' + (mmodels[typename].includes(item[j]) ? 'checked="checked"' : '') + ' />',
                '   <label for="' + typeChar + '_model_' + item[j] + '">' + item[j] + '</label>',
                '</div>'
            ].join('');

            t.find('.box.' + typeChar + ' .box-wrapper').append(markup);
        }
    }

    t.find('.box').each(function () {
        let me = $(this);

        let acnt = me.find('.box-item').not('.box-item.select-all').find('input[type=checkbox]').length,
            ccnt = me.find('.box-item').not('.box-item.select-all').find('input[type=checkbox]:checked').length;

        if (!acnt || acnt != ccnt) {
            me.find('.box-item.select-all').removeClass('on').find('input[type=checkbox]').prop('checked', false);
        } else {
            me.find('.box-item.select-all').addClass('on').find('input[type=checkbox]').prop('checked', true);
        }
    });

    t.find('.box-item.select-all input[type=checkbox]').on('click', function () {
        let me = $(this);

        if (me.prop('checked')) {
            me.closest('.box-wrapper').find('.box-item').addClass('on');
            me.closest('.box-wrapper')
                .find('input[type=checkbox]')
                .not(me).prop('checked', true);
        } else {
            me.closest('.box-wrapper').find('.box-item').removeClass('on');
            me.closest('.box-wrapper')
                .find('input[type=checkbox]')
                .not(me).prop('checked', false);
        }
    });

    t.find('.box-item').not('.box-item.select-all').find('input[type=checkbox]').on('click', function () {
        let me = $(this);

        if (me.prop('checked')) {
            me.closest('.box-item').addClass('on');
        } else {
            me.closest('.box-item').removeClass('on');
        }

        let acnt = me.closest('.box').find('.box-item').not('.box-item.select-all').find('input[type=checkbox]').length,
            ccnt = me.closest('.box').find('.box-item').not('.box-item.select-all').find('input[type=checkbox]:checked').length;

        if (acnt != ccnt) {
            me.closest('.box').find('.box-item.select-all').removeClass('on').find('input[type=checkbox]').prop('checked', false);
        } else {
            me.closest('.box').find('.box-item.select-all').addClass('on').find('input[type=checkbox]').prop('checked', true);
        }
    });

    t.find('.box-item').on('click', function (e) {
        let me = $(this),
            tg = $(e.target);

        if (tg.hasClass('box-item')) {
            me.find('input[type=checkbox]').trigger('click');
        }
    });

    t.find('.btn_addarea').on('click', function () {
        let idx = $(this).attr('data-idx');
        openAddArea(idx, null);
    });

    t.find('input[name=use_unlimit_area]').on('click', function () {
        let me = $(this);

        if (me.prop('checked')) {
            g_oDetectionAreas = [];
            reloadDetectionAreas(data.idx);
        } else {
            g_oDetectionAreas = data.areas;
            reloadDetectionAreas(data.idx);
        }
    });

    if (data.use_unlimit_area == '1') {
        t.find('input[name=use_unlimit_area]').trigger('click');
    } else {
        g_oDetectionAreas = data.areas;
        reloadDetectionAreas(data.idx);
    }

    t.find('.btn_close').on('click', function() {
        location.href = '/admin/member';
    });

    t.find('.btn_save').on('click', function() {
        let status = t.find('select[name=status]'),
            level = t.find('select[name=level]'),
            name = t.find('input[name=username]'),
            email = t.find('input[name=email]'),
            userid = t.find('input[name=userid]'),
            speriod = t.find('input[name=period_start]'),
            eperiod = t.find('input[name=period_end]'),
            limit_aoi = 0,
            aoicnt = t.find('input[name=aoi_count]'),
            itype_s = t.find('input[name=itype_s]'),
            itype_a = t.find('input[name=itype_a]'),
            itype_d = t.find('input[name=itype_d]'),
            dtype_o = t.find('input[name=dtype_o]'),
            dtype_b = t.find('input[name=dtype_b]'),
            dtype_c = t.find('input[name=dtype_c]');

        if(!name.val().trim()) {
            name.focus();
            return false;
        }

        if(!email.val().trim()) {
            email.attr('placeholder', g_oLang.common.message.input_email[g_sLangCode]).focus();
            return false;
        }

        if(!checkMail(email.val().trim())) {
            email.attr('placeholder', g_oLang.common.message.valid_email[g_sLangCode]).val('').focus();
            return false;
        }

        if(!userid.val().trim()) {
            userid.focus();
            return false;
        }

        if(t.find('input[name=use_period]:checked').val() == '1') {
            if(!speriod.val()) {
                $('body').bToast({ message: g_oLang.common.message.choose_period_start[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
                $('#framebox').unbind('scroll');
                speriod.focus();

                setTimeout(function() {
                    $('#framebox').unbind('scroll').on('scroll', function () {
                        t.find('input[name=period_start], input[name=period_end]').datepicker('hide').blur();
                    });
                }, 150);

                return false;
            }

            if(!eperiod.val()) {
                $('body').bToast({ message: g_oLang.common.message.choose_period_end[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
                $('#framebox').unbind('scroll');
                eperiod.focus();

                setTimeout(function() {
                    $('#framebox').unbind('scroll').on('scroll', function () {
                        t.find('input[name=period_start], input[name=period_end]').datepicker('hide').blur();
                    });
                }, 150);

                return false;
            }
        }

        if(t.find('input[name=limit_aoi]:checked').val() == '1') {
            if(!parseInt(aoicnt.val())) {
                aoicnt.focus();
                return false;
            }

            limit_aoi = parseInt(aoicnt.val());
        }

        if(!itype_s.prop('checked') && !itype_a.prop('checked') && !itype_d.prop('checked')) {
            $('body').bToast({ message: g_oLang.common.message.choose_imagery_type[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            itype_s.focus();
            return false;
        }

        let itype_s_provider = t.find('input[name=itype_satellite]:checked').map(function() { return $(this).val(); }).get(),
            itype_a_provider = t.find('input[name=itype_aerial]:checked').map(function() { return $(this).val(); }).get(),
            itype_d_provider = t.find('input[name=itype_drone]:checked').map(function() { return $(this).val(); }).get();

        if(itype_s.prop('checked') && !itype_s_provider.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_satellite_imagery_provider[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            itype_s.focus();
            return false;
        }

        if(itype_a.prop('checked') && !itype_a_provider.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_aerial_imagery_provider[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            itype_s.focus();
            return false;
        }

        if(itype_d.prop('checked') && !itype_d_provider.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_drone_imagery_provider[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            itype_s.focus();
            return false;
        }

        let imageryTypes = (itype_s.prop('checked')) ? itype_s.val() : '';
        imageryTypes += (itype_a.prop('checked')) ? (imageryTypes ? ',' : '') + itype_a.val() : '';
        imageryTypes += (itype_d.prop('checked')) ? (imageryTypes ? ',' : '') + itype_d.val() : '';

        let imageryProviders = {
            satellite: itype_s_provider,
            aerial: itype_a_provider,
            drone: itype_d_provider
        };

        if(!dtype_o.prop('checked') && !dtype_b.prop('checked') && !dtype_c.prop('checked')) {
            $('body').bToast({ message: g_oLang.common.message.choose_detection_type[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            dtype_o.focus();
            return false;
        }

        let dtype_o_model = t.find('input[name=dtype_O]:checked').map(function() { return $(this).val(); }).get(),
            dtype_b_model = t.find('input[name=dtype_S]:checked').map(function() { return $(this).val(); }).get(),
            dtype_c_model = t.find('input[name=dtype_C]:checked').map(function() { return $(this).val(); }).get();

        if(dtype_o.prop('checked') && !dtype_o_model.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_object_detection_model[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            dtype_o.focus();
            return false;
        }

        if(dtype_b.prop('checked') && !dtype_b_model.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_segmentation_model[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            dtype_o.focus();
            return false;
        }

        if(dtype_c.prop('checked') && !dtype_c_model.length) {
            $('body').bToast({ message: g_oLang.common.message.choose_change_detection_model[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            dtype_o.focus();
            return false;
        }

        let detectionTypes = (dtype_o.prop('checked')) ? dtype_o.val() : '';
        detectionTypes += (dtype_b.prop('checked')) ? (detectionTypes ? ',' : '') + dtype_b.val() : '';
        detectionTypes += (dtype_c.prop('checked')) ? (detectionTypes ? ',' : '') + dtype_c.val() : '';

        let detectionModels = {
            object: dtype_o_model,
            segmentation: dtype_b_model,
            change: dtype_c_model
        };

        let unlimit_area = t.find('input[name=use_unlimit_area]').prop('checked') ? '1' : '0';

        if(unlimit_area == '0' && !g_oDetectionAreas.length) {
            $('body').bToast({ message: g_oLang.common.message.add_detection_area[g_sLangCode], boxOpacity: 1, boxColor: '#0d0f13' });
            t.find('.btn_addarea').focus();
            return false;
        } else if(unlimit_area == '1') {
            g_oDetectionAreas = [];
        }

        let reqdata = {
            idx: data.idx,
            id: userid.val().trim(),
            name: name.val().trim(),
            email: email.val().trim(),
            status: status.val(),
            level: level.val(),
            use_period: t.find('input[name=use_period]:checked').val(),
            period_start: speriod.val(),
            period_end: eperiod.val(),
            limit_aoi: limit_aoi,
            set_imagery_types: imageryTypes,
            set_detection_types: detectionTypes,
            set_imagery_provider: JSON.stringify(imageryProviders),
            set_detection_models: JSON.stringify(detectionModels),
            use_unlimit_area: unlimit_area,
            areas: JSON.stringify(g_oDetectionAreas)
        };

        showLoading();
        $.ajax({
            type: 'post',
            url: '/admin/member/save',
            data: reqdata,
            success: function(res) {
                hideLoading();

                if(res != null && res.result) {
                    location.href = '/admin/member';
                }

                if(!res.result && res.code == 'ALREADY_REGISTERED_ID') {
                    $('body').bAlert({ message: g_oLang.common.message.already_registered_id[g_sLangCode] });
                    userid.val('').focus();
                }

                if(!res.result && res.code == 'MAIL_SEND_ERROR') {
                    $('body').bAlert({ message: g_oLang.common.message.reg_mail_send_error[g_sLangCode] });
                    email.focus();
                }
            }
        });
    });
}

function reloadDetectionAreas(_midx) {
    let t = $('#framebox .bodyarea .center-wrapper');
    let markup = '';
    t.find('.arealist-box tbody').html('');
    let alen = g_oDetectionAreas.length;

    if(alen) {
        for(let i = alen - 1; i >= 0; i--) {
            let area = g_oDetectionAreas[i];

            markup = [
                '<tr>',
                '   <td>'+ (alen - i) +'</td>',
                '   <td>'+ area.country +' / '+ area.city +'</td>',
                '   <td>'+ area.lat +' / '+ area.lng +'</td>',
                '   <td><button class="btn_common_t2 btn_viewarea" data-idx="'+ area.idx +'">'+ g_oLang.common.title.view_area[g_sLangCode] +'</button></td>',
                '</tr>'
            ].join('');

            t.find('.arealist-box tbody')
                .append(markup)
                .find('.btn_viewarea[data-idx='+ area.idx +']').on('click', function() {
                    openAddArea(_midx, area);
                });
        }
    } else {
        let chk = t.find('input[name=use_unlimit_area]').prop('checked');

        markup = [
            '<tr>',
            '   <td colspan="4" height="200" align="center">' + (chk ? g_oLang.common.title.unlimit_area[g_sLangCode] : g_oLang.common.message.notfound_detection_area[g_sLangCode]) + '</td>',
            '</tr>'
        ].join('');

        t.find('.arealist-box tbody').append(markup);
    }
}

function openAddArea(_midx, _data) {
    let id = 'add-detection-areabox';

    if($('#'+ id).length) {
        closebDialog(id);
    }

    let defaults = {
        idx: 0,
        member_idx: _midx,
        country: '',
        city: '',
        lat: '0',
        lng: '0',
        bbox: '',
        coords: '',
        is_save: '0'
    };

    let data = $.extend(defaults, _data);

    let markup = [
        '<table style="width: 100%; border: 0;" cellspacing="10" cellpadding="0">',
        '   <tr>',
        '       <td width="140">'+ g_oLang.common.title.detection_area[g_sLangCode] +' ('+ g_oLang.common.title.city[g_sLangCode] +')</td>',
        '       <td>',
        '           <div class="searchbox">',
        '               <input type="hidden" name="country" value="'+ data.country +'" />',
        '               <input type="hidden" name="city" value="'+ data.city +'" />',
        '               <input type="hidden" name="coords" value="'+ data.coords +'" />',
        '               <input type="text" id="search_city" name="search_city" placeholder="'+ g_oLang.common.message.select_city_search[g_sLangCode] +'" />',
        '               <div class="btn">',
        '                   <button class="btn_cancelinput"></button>',
        '                   <button class="btn_search"></button>',
        '               </div>',
        '           </div>',
        '       </td>',
        '   </tr>',
        '   <tr><td colspan="2">',
        '           <div id="area-mapview"></div>',
        '           <div class="desc">'+ g_oLang.common.message.set_area_description[g_sLangCode] +'<br />('+ g_oLang.common.message.after_click_reset_area[g_sLangCode] +')</div>',
        '   </td></tr>',
        '   <tr>',
        '       <td class="hlight">'+ g_oLang.common.title.center_location[g_sLangCode] +'</td>',
        '       <td>',
        '           <table style="width: 100%; border: 0;" cellspacing="0" cellpadding="0"><tr>',
        '               <td width="100" style="padding-left: 30px;">'+ g_oLang.common.title.latitude[g_sLangCode] +'</td>',
        '               <td width="210"><input type="text" name="lat" class="input-fit" value="'+ data.lat +'" readonly="readonly" /></td>',
        '               <td width="90" style="padding-left: 40px;">'+ g_oLang.common.title.longitude[g_sLangCode] +'</td>',
        '               <td><input type="text" name="lng" class="input-fit" value="'+ data.lng +'" readonly="readonly" /></td>',
        '           </tr></table>',
        '       </td>',
        '   </tr>',
        '   <tr>',
        '       <td class="hlight">'+ g_oLang.common.title.boundary_coordinates[g_sLangCode] +'</td>',
        '       <td>',
        '           <table style="width: 100%; border: 0;" cellspacing="0" cellpadding="0">',
        '               <tr>',
        '                   <td width="100" style="padding-left: 30px;">BBOX</td>',
        '                   <td><input type="text" name="bbox" class="input-fit" value="'+ data.bbox +'" readonly="readonly" /></td>',
        '               </tr>',
        '               <tr>',
        '                   <td style="padding-left: 30px;">BBOX (Poly)</td>',
        '                   <td><input type="text" name="bbox_poly" class="input-fit" readonly="readonly" /></td>',
        '               </tr>',
        '           </table>',
        '       </td>',
        '   </tr>',
        '</table>',
        '<div class="btnbox">',
        '   <button class="btn_common_t1 btn_close">'+ (g_oLang.common.button.close[g_sLangCode]).toUpperCase() +'</button>',
        '   <button class="btn_common_t2 btn_save">'+ g_oLang.common.button.save[g_sLangCode] +'</button>',
        '</div>'
    ].join('');

    $('body').bDialog({
        boxID: id,
        boxTitle: g_oLang.common.title.set_detection_area[g_sLangCode],
        boxWidth: '900px',
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
    o.siblings('.ui-dialog-titlebar').css({
        'text-align': 'initial',
        'font-size': '20px',
        'font-weight': 500,
        'color': '#fff',
        'padding': '16px 20px',
        'border-bottom': '1px solid rgba(0, 0, 0, 0.14)'
    });

    if(data.bbox) {
        let poly = data.bbox.split(',');
        o.find('input[name=bbox_poly]').val(poly[1]+','+poly[0]+','+poly[3]+','+poly[2]);
    }

    let myCenter = new google.maps.LatLng(37.549869, 126.9374396);

    g_oMap = new google.maps.Map(document.getElementById('area-mapview'), {
        minZoom: g_iMinZoom,
        maxZoom: g_iMaxZoom,
        zoom: 12,
        center: myCenter,
        mapTypeId: 'roadmap', // hybrid (label + satellite)
        disableDefaultUI: true,
        backgroundColor: 'transparent',
        restriction: {
            latLngBounds: { north: 85, south: -85, west: -180, east: 180 }
        }
    });

    renderCustomZoomControl(g_oMap);

    let searchOptions = {
        types: ['(cities)']
    };
    let searchInput = o.find('input[name=search_city]')[0];
    let autocomplete = new google.maps.places.Autocomplete(searchInput, searchOptions);

    autocomplete.bindTo('bounds', g_oMap);
    autocomplete.addListener('place_changed', function() {
        let place = autocomplete.getPlace();

        if(!place.geometry) {
            $('body').bAlert({
                message: g_oLang.common.message.no_details_search[g_sLangCode]
            });
            return;
        }

        if(place.geometry.viewport) {
            g_oMap.fitBounds(place.geometry.viewport);
        } else {
            g_oMap.setCenter(place.geometry.location);
            if(g_oMap.getZoom() < 12) {
                g_oMap.setZoom(12);
            }
        }

        let addcomp = place.address_components;
        let country = addcomp[addcomp.length - 1].long_name,
            city = addcomp[0].long_name;

        if(addcomp[addcomp.length - 1].types[0] == 'postal_code') {
            country = addcomp[addcomp.length - 2].long_name;
        }

        o.find('input[name=country]').val(country);
        o.find('input[name=city]').val(city);
    });

    if(data.country && data.city) {
        o.find('input[name=search_city]').val(data.country +' '+ data.city);
        o.find('.btn_cancelinput').show();
    }

    let geocoder = new google.maps.Geocoder;
    google.maps.event.addListener(g_oMap, 'center_changed', function() {
        let center = g_oMap.getCenter();

        if(g_oDrawObject != null) {
            return;
        }

        geocoder.geocode({'location': center}, function(results, status) {
            if(status === 'OK') {
                if(results[1]) {
                    let country = null, countryCode = null, city = null, cityAlt = null;
                    let c, lc, component;

                    for(let r = 0, rl = results.length; r < rl; r += 1) {
                        let result = results[r];

                        if(!city && result.types[0] === 'locality') {
                            for(c = 0, lc = result.address_components.length; c < lc; c += 1) {
                                component = result.address_components[c];

                                if(component.types[0] === 'locality') {
                                    city = component.long_name;
                                    break;
                                }
                            }
                        } else if(!city && !cityAlt && result.types[0] === 'administrative_area_level_1') {
                            for(c = 0, lc = result.address_components.length; c < lc; c += 1) {
                                component = result.address_components[c];

                                if(component.types[0] === 'administrative_area_level_1') {
                                    cityAlt = component.long_name;
                                    break;
                                }
                            }
                        } else if(!country && result.types[0] === 'country') {
                            country = result.address_components[0].long_name;
                            countryCode = result.address_components[0].short_name;
                        }

                        if(city && country) {
                            break;
                        }
                    }

                    if(country && city && (o.find('input[name=country]').val() != country || o.find('input[name=city]').val() != city)) {
                        o.find('input[name=country]').val(country);
                        o.find('input[name=city]').val(city);
                        o.find('input[name=search_city]').val(country +' '+ city);
                        o.find('.btn_cancelinput').show();
                    }

                    if(!country || !city) {
                        o.find('input[name=country]').val('');
                        o.find('input[name=city]').val('');
                        o.find('input[name=search_city]').val('');
                        o.find('.btn_cancelinput').hide();
                    }
                }
            }
        });
    });

    google.maps.event.trigger(g_oMap, 'center_changed');

    drawingRect(g_oMap, function(rect) {
        let bounds = rect.getBounds();
        let center = bounds.getCenter();
        let coord = bounds.toJSON();
        let sw = bounds.getSouthWest();
        let ne = bounds.getNorthEast();
        let bbox = sw.lng() +','+ sw.lat() +','+ ne.lng() +','+ ne.lat();
        let poly = sw.lat() +','+ sw.lng() +','+ ne.lat() +','+ ne.lng();

        o.find('input[name=lat]').val(center.lat());
        o.find('input[name=lng]').val(center.lng());
        o.find('input[name=coords]').val(JSON.stringify(coord));
        o.find('input[name=bbox]').val(bbox);
        o.find('input[name=bbox_poly]').val(poly);
    }, function() {
        o.find('input[name=lat]').val('0');
        o.find('input[name=lng]').val('0');
        o.find('input[name=coords]').val('');
        o.find('input[name=bbox]').val('');
        o.find('input[name=bbox_poly]').val('');
    });

    if(data.coords) {
        let coord = JSON.parse(data.coords);
        let options = {
            fillColor: '#4eb8ff',
            fillOpacity: 0.2,
            strokeWeight: 3,
            strokeColor: '#00cbff',
            clickable: false,
            editable: false,
            bounds: coord,
            map: g_oMap
        };

        g_oDrawObject = new google.maps.Rectangle(options);
        g_oMap.fitBounds(coord);
        if(g_oDrawingManager != null) {
            g_oDrawingManager.setDrawingMode(null);
        }
    }

    o.find('input[name=search_city]').on('keydown', function() {
        let v = $(this).val();

        if(v.length) {
            o.find('.btn_cancelinput').show();
        } else {
            o.find('.btn_cancelinput').hide();
        }
    });

    o.find('.btn_search').on('click', function() {
        let e = $.Event( "keydown", { keyCode: 13 } );
        o.find('input[name=search_city]').trigger(e);
    });

    o.find('.btn_cancelinput').on('click', function() {
        o.find('input[name=search_city]').val('').focus();
        $(this).hide();
    });

    o.find('.btn_close').on('click', function() {
        closebDialog(id);
    });

    o.find('.btn_save').on('click', function() {
        let chk = o.find('input[name=coords]').val();

        if(!chk) {
            $('#area-mapview').bAlert({
                message: g_oLang.common.message.set_area_on_map[g_sLangCode]
            });

            return false;
        }

        if(!o.find('input[name=country]').val()) {
            $('#area-mapview').bAlert({
                message: g_oLang.common.message.notfound_area_info[g_sLangCode] +'<br />'+ g_oLang.common.message.reset_area_on_map[g_sLangCode]
            });

            return false;
        }

        let max = 1;
        if(g_oDetectionAreas.length) {
            for(let i in g_oDetectionAreas) {
                if(_data != null && g_oDetectionAreas[i].idx == _data.idx) {
                    g_oDetectionAreas.splice(i, 1);
                    break;
                }
            }

            max = (g_oDetectionAreas.length) ? g_oDetectionAreas[g_oDetectionAreas.length - 1].idx + 1 : 1;
        }

        let data = {
            idx: max,
            member_idx: _midx,
            country: o.find('input[name=country]').val(),
            city: o.find('input[name=city]').val(),
            lat: o.find('input[name=lat]').val(),
            lng: o.find('input[name=lng]').val(),
            bbox: o.find('input[name=bbox]').val(),
            coords: o.find('input[name=coords]').val(),
            is_save: '0'
        };

        $('input[name=use_unlimit_area]').prop('checked', false);
        g_oDetectionAreas.push(data);

        $('body').bToast({ message: 'Saved', boxOpacity: 1, boxColor: '#0d0f13' });
        closebDialog(id);
        reloadDetectionAreas(_midx);
    });
}

function openPasswordBox(_idx) {
    let id = 'passwordbox';

    if($('#'+ id).length) {
        closebDialog(id);
    }

    let markup = [
        '<div class="mb-inbox">',
        //'   <div class="formbox on">',
        //'       <div class="subtitle">'+ g_oLang.common.title.current_pass[g_sLangCode] +'</div>',
        //'       <div class="content"><input type="password" name="current_pass" placeholder="'+ g_oLang.common.message.input_current_pass[g_sLangCode] +'" /></div>',
        //'   </div>',
        '   <div class="formbox on">',
        '       <div class="subtitle">'+ g_oLang.common.title.new_pass[g_sLangCode] +'</div>',
        '       <div class="content"><input type="password" name="new_pass" placeholder="'+ g_oLang.common.message.input_new_pass[g_sLangCode] +'" /></div>',
        '   </div>',
        '   <div class="formbox on">',
        '       <div class="subtitle">'+ g_oLang.common.title.confirm_pass[g_sLangCode] +'</div>',
        '       <div class="content"><input type="password" name="confirm_pass" placeholder="'+ g_oLang.common.message.input_renew_pass[g_sLangCode] +'" /></div>',
        '   </div>',
        '   <div class="btnbar">',
        '       <button class="btn_common_t2 btn_msave">'+ g_oLang.common.button.save[g_sLangCode] +'</button>',
        '       <button class="btn_common_t1 btn_mcancel">'+ g_oLang.common.button.cancel[g_sLangCode] +'</button>',
        '   </div>',
        '</div>'
    ].join('');

    $('body').bDialog({
        boxID: id,
        boxTitle: g_oLang.common.title.change_pass[g_sLangCode],
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

    o.find('.btn_msave').on('click', function() {
        let //current_pass = o.find('input[name=current_pass]'),
            new_pass = o.find('input[name=new_pass]'),
            confirm_pass = o.find('input[name=confirm_pass]');

        /*if(!current_pass.val().trim()) {
            current_pass.focus();
            return;
        }*/

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

        showLoading();
        $.ajax({
            type: 'post',
            url: '/admin/member/changepass',
            data: {
                idx: _idx,
                //current_pass: current_pass.val().trim(),
                new_pass: new_pass.val().trim()
            },
            success: function(res) {
                hideLoading();

                if(res != null && res.result) {
                    closebDialog(id);
                    $('body').bToast({ message: g_oLang.common.message.update_password_succeed[g_sLangCode] });
                }

                /*if(!res.result) {
                    current_pass.bDirectionPane({
                        message: res.message,
                        textColor: '#6899eb',
                        boxDirection: 'down',
                        boxCorner: 1,
                        boxBorderSize: 1,
                        boxColor: '#0e1013',
                        boxBorderColor: '#47546a',
                        boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
                    });
                    current_pass.focus();
                }*/
            }
        });
    });

    o.find('.btn_mcancel').on('click', function() {
        closebDialog(id);
    });
}

function getPickerDate(_el) {
    let date, dateFormat = 'yy.mm.dd';

    try {
        date = $.datepicker.parseDate(dateFormat, _el.value);
    } catch(e) {
        date = null;
    }

    return date;
}

function getAllDetectionFeatures() {
    let features = null;

    showLoading();
    $.ajax({
        type: 'post',
        url: g_sCoreServer + '/detection_features',
        data: JSON.stringify({ "API_KEY": g_sApiKey, "PID": '' }),
        contentType: 'application/json',
        success: function(res) {
            hideLoading();

            if(res != null && !res.error) {
                let pids = res.detection_features;

                for(let i in pids) {
                    let pid = pids[i][0];
                    features = $.extend(features, pid);
                }

                g_oAllDetectionFeatures = features;
            }
        }
    });
}