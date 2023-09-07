
let g_oMap = null, g_oMapSub = null;
let g_sTileServer = 'http://tile.eartheye.ai';
let g_sCoreServer = 'http://core.eartheye.ai';
let g_sBaseTileUrl = '/{pid}{fid}/{z}/{x}/{y}.png';
let g_sApiKey = 'D1E18BAB42891F6462F4EE8CFDF8B';
let g_sTileLayerID = 'eartheye-custom-layer',
    g_sTileLayerIDSub = 'eartheye-custom-sub-layer';
let g_oTileLayer = null, g_oTileLayerSub = null;
let g_oTileProviders = [];

let g_oResultObjects = [],
    g_oResultObjectsSub = [];
let g_oResultObjectTooltip = null;
let g_oSelectedAoiData = null;

let g_oTimeLapseImages = [];
let g_oTimeLapseInterval = null;
let g_iTimeLapseIntervalTime = 2000;

let g_sLangCode = 'en';

let g_iMinScaleWidth = 50,
    g_iMaxScaleWidth = 80;

let g_iMinZoom = 3,
    g_iMaxZoom = 21;

let g_sAoiMode = 'SAVE';
let g_bFastMode = false;

let g_oMyInfo = null;
let g_oMyAoiData = [],
    g_oMyAoiMarkers = [],
    g_oMyAoiObjects = [];

let g_oTypeColors = {
    O: '#ff00f5',
    B: '#00ffff',
    C: '#1ee85c',
    T: '#ff9d00'
};

let g_oJobType = {
    O: 'OBJECT_DETECTION',
    B: 'SEGMENTATION',
    C: 'CHANGE_DETECTION'
};

let g_oWorldBoundary = { north: 85, south: -85, west: -180, east: 180 };

let g_oScaleValues = [
    {
        val: 2,
        dspVal: '2 m'
    },
    {
        val: 5,
        dspVal: '5 m'
    },
    {
        val: 10,
        dspVal: '10 m'
    },
    {
        val: 20,
        dspVal: '20 m'
    },
    {
        val: 50,
        dspVal: '50 m'
    },
    {
        val: 100,
        dspVal: '100 m'
    },
    {
        val: 200,
        dspVal: '200 m'
    },
    {
        val: 500,
        dspVal: '500 m'
    },
    {
        val: 1000,
        dspVal: '1 km'
    },
    {
        val: 2000,
        dspVal: '2 km'
    },
    {
        val: 5000,
        dspVal: '5 km'
    },
    {
        val: 10000,
        dspVal: '10 km'
    },
    {
        val: 20000,
        dspVal: '20 km'
    },
    {
        val: 50000,
        dspVal: '50 km'
    },
    {
        val: 100000,
        dspVal: '100 km'
    },
    {
        val: 200000,
        dspVal: '200 km'
    },
    {
        val: 500000,
        dspVal: '500 km'
    },
    {
        val: 1000000,
        dspVal: '1000 km'
    },
    {
        val: 2000000,
        dspVal: '2000 km'
    },
    {
        val: 5000000,
        dspVal: '5000 km'
    }
];

let HTMLMarker = null;

$(function() {
    g_sLangCode = ($.cookie('langcode')) ? $.cookie('langcode') : 'en';
    $('select[name=uilang]').val(g_sLangCode).selectric('refresh');
});

function initMap() {
    let myCenter = new google.maps.LatLng(37.549869, 126.9374396);

    g_oMap = new google.maps.Map(document.getElementById('mapview-main'), {
        minZoom: g_iMinZoom,
        maxZoom: g_iMaxZoom,
        zoom: 12,
        center: myCenter,
        mapTypeId: 'satellite', // hybrid (label + satellite)
        disableDefaultUI: true,
        backgroundColor: 'transparent',
        restriction: {
            latLngBounds: g_oWorldBoundary
        }
    });

    renderMapTypeBar(g_oMap);
    renderMapInfoBar(g_oMap);
    renderCustomOpacityControl(g_oMap, 'O');
    renderCustomZoomControl(g_oMap);

    google.maps.event.addListener(g_oMap, 'zoom_changed', function() {
        var z = g_oMap.getZoom();

        makeScale(g_oMap);

        if($('.zoomcontrolbar').length) {
            $('.zoomcontrolbar .zoom_slider').slider('value', z);
            if (z == g_iMinZoom) {
                $('.zoomcontrolbar').find('.btn_zoom_minus').addClass('off');
            } else if (z == g_iMaxZoom) {
                $('.zoomcontrolbar').find('.btn_zoom_plus').addClass('off');
            } else {
                $('.zoomcontrolbar').find('.btn_zoom_minus').removeClass('off');
                $('.zoomcontrolbar').find('.btn_zoom_plus').removeClass('off');
            }
        }

        if(g_oMyAoiMarkers.length) {
            if(z < 14) {
                $('.my-aoi-marker').removeClass('object over');

                if(g_oMyAoiObjects.length) {
                    g_oMyAoiObjects.forEach(function(item) {
                        item.setVisible(false);
                    });
                }
            } else {
                $('.my-aoi-marker').addClass('object');

                if(g_oMyAoiObjects.length) {
                    g_oMyAoiObjects.forEach(function(item) {
                        item.setVisible(true);
                    });
                }
            }
        }
    });

    google.maps.event.addListener(g_oMap, 'mousemove', function(e) {
        var lat = e.latLng.lat().toFixed(3),
            lng = e.latLng.lng().toFixed(3);

        $('#mapview .mapinfobar .latlng').html(lat + ', '+ lng);
    });

    setTimeout(function() {
        makeScale(g_oMap);
        loadAoiList(true);
        refreshAoiDataOnMap();
    }, 800);

    HTMLMarker = function(lat, lng, html) {
        this.lat = lat;
        this.lng = lng;
        this.html = html;
        this.pos = new google.maps.LatLng(lat, lng);
    };

    HTMLMarker.prototype = new google.maps.OverlayView();
    HTMLMarker.prototype.onRemove= function() {
        try {
            this.div.remove();
        } catch(e) {
            console.log(e);
        }
    };
    HTMLMarker.prototype.remove = function() {
        if(this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
        }
    };

    HTMLMarker.prototype.onAdd= function() {
        this.div = document.createElement('DIV');
        this.div.className = 'html-marker';
        this.div.style.position = 'absolute';
        this.div.innerHTML = this.html;
        var panes = this.getPanes();
        var pane = $(panes.overlayImage);
        pane.css({ width: 'auto' });
        panes.overlayImage.appendChild(this.div);
    };

    HTMLMarker.prototype.draw = function() {
        var overlayProjection = this.getProjection();
        var position = overlayProjection.fromLatLngToDivPixel(this.pos);
        var panes = this.getPanes();

        //panes.overlayImage.style.left = position.x + 'px';
        //panes.overlayImage.style.top = position.y + 'px';
        this.div.style.left = position.x + 'px';
        this.div.style.top = position.y + 'px';
    };

    HTMLMarker.prototype.getPosition = function() {
        return this.pos;
    };

    HTMLMarker.prototype.getDraggable = function() {
        return false;
    };
}

function initSearch() {
    let s = $('#gnb_search');
    let r = s.find('.resultarea');
    let g_oAutoCompleteService = new google.maps.places.AutocompleteService();

    s.find('input')
        .attr('placeholder', g_oLang.common.message.area_search[g_sLangCode])
        .on('keyup', function(e) {
            let v = $(this).val();
            let kcode = e.keyCode;

            if(kcode == 38 || kcode == 40) {
                if (r.find('li').length) {
                    if(!$(this).attr('data-word')) {
                        $(this).attr('data-word', v);
                    }

                    let current = r.find('li.on');
                    let obj = null;
                    r.find('li').removeClass('on');

                    if (kcode == 38) {
                        if (current.length && r.find('li').length > 1) {
                            obj = current.prev();
                        } else {
                            obj = r.find('li:last');
                        }
                    } else {
                        if (current.length && r.find('li').length > 1) {
                            obj = current.next();
                        } else {
                            obj = r.find('li:first');
                        }
                    }

                    $(this).attr('data-index', (obj.text() ? obj.index() : '')).val((obj.text() ? obj.text() : $(this).attr('data-word')));
                    obj.addClass('on');
                }
            } else if(kcode == 13 && $(this).attr('data-index')) {
                r.find('li').eq($(this).attr('data-index')).trigger('click');
            } else {
                $(this).attr({ 'data-index': '', 'data-word': '' });

                if (v.length > 1) {
                    g_oAutoCompleteService.getQueryPredictions({input: v}, displaySuggestions);
                } else {
                    r.html('');
                }

                if (v.length > 0) {
                    s.find('.btn_cancelinput').show();
                } else {
                    s.find('.btn_cancelinput').hide();
                }
            }
        });

    s.find('.btn_cancelinput').on('click', function() {
        $(this).hide();
        s.find('input').val('');
        r.html('');
    });

    s.find('.btn_search').on('click', function() {
        s.find('input').focus();
    });

    s.on('mouseleave', function() {
        r.hide();
    });

    s.find('input').on('mouseenter', function() {
        r.show();
    });

    let displaySuggestions = function(predictions, status) {
        let markup = [
            '<div class="notfound">',
            '   <div class="desc">'+ g_oLang.common.message.area_notfound[g_sLangCode] +'</div>',
            '   <div class="btn">',
            '       <button class="btn_common_t2 btn_add">'+ g_oLang.aoi.button.addarea[g_sLangCode] +'</button>',
            '   </div>',
            '</div>'
        ].join('');

        if(status == google.maps.places.PlacesServiceStatus.OK) {
            let container = $('<ul />');
            let len = predictions.length;
            let find = s.find('input').val();

            $.ajax({
                type: 'post',
                url: '/eartheye/aoisearch',
                data: { keyword: find },
                success: function(res) {
                    if(res != null && res.result) {
                        let data = res.data;

                        for(let i = 0, l = data.length; i < l; i++) {
                            let title = data[i].title.replace(new RegExp(find, 'g'), '<span class="find">'+ find +'</span>');
                            markup = [
                                '<div class="icon"><span class="s-icon s-icon-'+ data[i].draw_type +'"></span></div>',
                                '<div class="desc">'+ title +'</div>'
                            ].join('');

                            let li = $('<li />')
                                .attr({ idx: data[i].idx })
                                .html(markup)
                                .on('click', function() {
                                    let idx = $(this).attr('idx');
                                    searchFoundAction(idx);
                                    s.find('input').val($(this).text());
                                    r.html('');
                                });

                            container.append(li);
                        }
                    }

                    if(len) {
                        let googlePlacesService = new google.maps.places.PlacesService(document.createElement('span'));

                        for(let i = 0; i < len; i++) {
                            googlePlacesService.getDetails({
                                reference: predictions[i].reference
                            }, function(details, status){
                                if(status == google.maps.places.PlacesServiceStatus.OK) {
                                    let desc = predictions[i].description.replace(new RegExp(find, 'g'), '<span class="find">'+ find +'</span>');
                                    markup = [
                                        '<div class="icon"><span class="s-icon s-icon-N"></span></div>',
                                        '<div class="desc">'+ desc +'</div>'
                                    ].join('');

                                    let li = $('<li />')
                                        .attr({
                                            lat: details.geometry.location.lat(),
                                            lng: details.geometry.location.lng()
                                        })
                                        .html(markup)
                                        .on('click', function() {
                                            let location = new google.maps.LatLng($(this).attr('lat'), $(this).attr('lng'));
                                            s.find('input').val($(this).text());
                                            g_oMap.setCenter(location);
                                            r.html('');
                                        });

                                    container.append(li);
                                }
                            });
                        }

                        r.html(container).show();
                    } else {
                        r.html(markup).show();
                        searchNotFoundAction();
                    }
                }
            });
        } else {
            r.html(markup).show();
            searchNotFoundAction();
        }
    };
}

function searchFoundAction(_idx) {
    let a = $('#framebox .aoiformbox');
    let o = $('#framebox .aoibox');

    if($('#framebox .btn_aoi').hasClass('on')) {
        if(g_sAoiMode == 'MODIFY') {
            g_sAoiMode = 'DETAIL';
            a.find('.btn_back').trigger('click');
        } else if(g_sAoiMode == 'DETAIL') {
            a.find('.btn_back').trigger('click');
        }

        if(g_sAoiMode != 'SAVE') {
            setTimeout(function() {
                o.find('.aoilistbox[data-idx='+ _idx +'] .aoiname').trigger('click');
            }, 320);
        } else {
            if(!parseInt($('#framebox .aoiwrapper').css('left')) && parseInt(a.css('left')) > 0) {
                if(o.find('.btn_trash:first').hasClass('list')) {
                    o.find('.btn_trash:first').trigger('click');
                }
                o.find('.aoilistbox[data-idx='+ _idx +'] .aoiname').trigger('click');
            }
        }
    } else {
        $('#framebox .btn_aoi').trigger('click');
        setTimeout(function() {
            o.find('.aoilistbox[data-idx='+ _idx +'] .aoiname').trigger('click');
        }, 320);
    }
}

function searchNotFoundAction() {
    let a = $('#framebox .aoiformbox');
    let s = $('#gnb_search');
    let r = s.find('.resultarea');
    let o = $('#framebox .aoibox');

    let resetAdd = function() {
        o.find('.btn_addarea').trigger('click');
        s.find('input').val('');
        r.html('');
        s.find('.btn_cancelinput').hide();
    };

    r.find('.btn_add').unbind('click').on('click', function() {
        if($('#framebox .btn_aoi').hasClass('on')) {
            if(g_sAoiMode == 'MODIFY') {
                g_sAoiMode = 'DETAIL';
                a.find('.btn_back').trigger('click');
            } else if(g_sAoiMode == 'DETAIL') {
                a.find('.btn_back').trigger('click');
            }

            if(g_sAoiMode != 'SAVE') {
                setTimeout(function() {
                    resetAdd();
                }, 280);
            } else {
                if(!parseInt($('#framebox .aoiwrapper').css('left')) && parseInt(a.css('left')) > 0) {
                    resetAdd();
                }
            }
        } else {
            $('#framebox .btn_aoi').trigger('click');
            setTimeout(function() {
                resetAdd();
            }, 280);
        }
    });
}

function initAoiNotice() {
    let chk = $.cookie('aoi_notice');

    if(!chk) {
        let o = $('#framebox .aoi-notice');
        o.find('input[name=aoinotice]').prop('checked', false);
        o.find('.title').html(g_oLang.aoi.notice.title[g_sLangCode]);
        o.find('.content label').html(g_oLang.aoi.notice.content[g_sLangCode]);

        o.css({ display: 'inline'}).animate({
            opacity: 1
        }, 300, function() {
            noticeAnimate();
        });

        o.find('input[name=aoinotice]').unbind('click').on('click', function() {
            $.cookie('aoi_notice', 1);

            o.fadeOut(250).hide();
            $('#framebox .slide-overlay').css({
                width: '48px',
                right: 'initial'
            });

            return false;
        });

        o.find('.btn_close').unbind('click').on('click', function() {
            o.fadeOut(250).hide();

            return false;
        });
    } else {
        $('#framebox .slide-overlay').css({
            width: '48px',
            right: 'initial'
        });
    }
}

function getTileProviders() {
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

function initAoiBox() {
    let d = $('#framebox .detailbar');

    $('#framebox .btn_aoi, #framebox .actionbar button').bTooltip({
        textColor: '#eee',
        textSize: '12px',
        boxColor: '#283041',
        boxCorner: 1,
        boxPadding: '5px 12px'
    });

    $('#framebox .btn_aoi').on('click', function() {
        var me = $(this);

        if(!g_oTileProviders.length) {
            getTileProviders();
            return false;
        }

        $('#framebox .aoi-notice').fadeOut(250).hide();
        $('#framebox .slide-overlay').fadeOut(250).hide();

        checkSaveDetectionResult(me, function() {
            if (!me.hasClass('on')) {
                me.addClass('on');

                if(d.closest('.detailbar-wrapper').find('.aoilist-previewbox').length) {
                    d.closest('.detailbar-wrapper').find('.aoilist-previewbox').animate({
                        opacity: 0,
                        left: '40px'
                    }, 100, function () {
                        $(this).remove();
                    });
                }

                openAoiBox();
                closeActionDetail();
                g_oMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            }
        });
    });

    getTileProviders();

    $(window).on('resize', function() {
        resizeAoiListBox();
    });

    let f = $('#framebox .aoiformbox');

    f.find('.btn_back').on('click', function() {
        if(g_sAoiMode == 'MODIFY') {
            g_sAoiMode = 'DETAIL';
            resetAoiForm(f.find('input[name=aoi_idx]').val());
            return false;
        }

        loadAoiList();
        refreshAoiDataOnMap();

        g_oMap.setRestriction({
            latLngBounds: g_oWorldBoundary
        });

        f.animate({ left: '321px' }, 200, function() {
            resetAoiForm(0);
            resetAoiData();
        });

        if($('.maptypebar .btn_maptype').attr('data-type') == 'R') {
            $('.maptypebar .btn_maptype').trigger('click');
        }
        $('.maptypebar').hide();

        return false;
    });

    f.find('.btn_draw').not('.off').on('click', function() {
        f.find('.btn_draw').removeClass('on');
        $(this).addClass('on');

        var type = $(this).attr('data-type');
        drawObject(g_oMap, type);
    });

    f.find('textarea[name=aoi_desc]').autosized({
        minHeight: '120px'
    });

    f.find('.btn_aoihistory').on('click', function() {
        var idx = f.find('input[name=aoi_idx]').val();

        if(!idx) {
            return false;
        }

        openAoiHistoryBox({ idx: idx });
    });

    f.find('.btn_delete').on('click', function() {
        var idx = f.find('input[name=aoi_idx]').val();

        if(!idx) {
            return false;
        }

        $('body').bConfirm({
            title: 'EarthEye',
            message: g_oLang.common.message.delete[g_sLangCode],
            buttons: {
                'custom1': {
                    'class': 'btn_common_t2',
                    'buttonName': g_oLang.common.button.confirm[g_sLangCode],
                    'action': function () {
                        $.ajax({
                            type: 'post',
                            url: '/eartheye/aoidelete',
                            data: { idx: idx },
                            success: function(res) {
                                if(!res || !res.result) {
                                    $('body').bAlert({
                                        message: g_oLang.common.message.no_request_value[g_sLangCode],
                                        onClose: function() {
                                            loadAoiList();
                                            resetAoiData();
                                            f.find('.btn_back').trigger('click');
                                        }
                                    });
                                } else if(res.result) {
                                    $('body').bToast({ message: 'Success' });

                                    loadAoiList();
                                    resetAoiData();
                                    f.find('.btn_back').trigger('click');
                                }

                                refreshAoiDataOnMap();
                                resizeAoiListBox();

                                g_oMap.setRestriction({
                                    latLngBounds: g_oWorldBoundary
                                });
                            }
                        })
                    }
                },
                'custom2': {
                    'class': 'btn_common_t1',
                    'buttonName': g_oLang.common.button.cancel[g_sLangCode],
                    'action': function () {}
                }
            }
        });
    });

    f.find('.btn_save').on('click', function() {
        var aidx   = f.find('input[name=aoi_idx]'),
            atitle = f.find('input[name=aoi_title]'),
            adesc  = f.find('textarea[name=aoi_desc]'),
            acoord = f.find('input[name=aoi_coord]');

        if(g_sAoiMode == 'DETAIL') {
            showLoading();
            atitle.prop('readonly', false).closest('.formrow2').removeClass('formrow2').addClass('formrow');
            adesc.prop('readonly', false).closest('.formrow2').removeClass('formrow2').addClass('formrow');
            f.find('.btn_aoihistory').addClass('off').prop('disabled', true);
            f.find('.formbar').css({ bottom: '52px' });
            f.find('.btmbox').css({ height: '52px' });
            f.find('.btmbox .btn_delete').hide();
            f.find('.btmbox .btn_save').html(g_oLang.common.button.save[g_sLangCode]);
            g_sAoiMode = 'MODIFY';
            $(this).delay(200).queue(function() {
                hideLoading();
                atitle.focus().val(atitle.val());
                $(this).dequeue();
            });
            return false;
        }

        if(!acoord.val()) {
            f.find('.btn_draw').closest('table').bDirectionPane({
                message: 'Set the detection area.',
                textColor: '#6899eb',
                boxDirection: 'down',
                boxCorner: 1,
                boxBorderSize: 1,
                boxColor: '#0e1013',
                boxBorderColor: '#47546a',
                boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
            });
            return false;
        }

        if(!atitle.val().trim()) {
            atitle.closest('.formrow').find('.title').bDirectionPane({
                message: 'Please enter name.',
                textColor: '#6899eb',
                boxDirection: 'up',
                boxCorner: 1,
                boxBorderSize: 1,
                boxColor: '#0e1013',
                boxBorderColor: '#47546a',
                boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
            });
            atitle.focus();
            //atitle.closest('.formrow').addClass('form-btm-line-error');
            return false;
        }

        if(!adesc.val().trim()) {
            adesc.closest('.formrow').find('.title').bDirectionPane({
                message: 'Please enter description.',
                textColor: '#6899eb',
                boxDirection: 'up',
                boxCorner: 1,
                boxBorderSize: 1,
                boxColor: '#0e1013',
                boxBorderColor: '#47546a',
                boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.25)'
            });
            adesc.focus();
            return false;
        }

        showLoading();

        $.ajax({
            type: 'post',
            url: '/eartheye/aoisave',
            data: {
                idx: aidx.val(),
                type: f.find('.btn_draw.on').attr('data-type'),
                title: atitle.val().trim(),
                desc: adesc.val().trim(),
                lat: f.find('.aoi_lat').text(),
                lng: f.find('.aoi_lng').text(),
                area: f.find('.aoi_area').text(),
                coord: acoord.val(),
                sw: f.find('input[name=aoi_sw_latlng]').val(),
                ne: f.find('input[name=aoi_ne_latlng]').val()
            },
            success: function(res) {
                hideLoading();

                if(res != null && res.result) {
                    $('body').bToast({ message: 'Success' });

                    if(aidx.val() && g_sAoiMode == 'MODIFY') {
                        g_sAoiMode = 'SAVE';
                        resetAoiForm(aidx.val());
                    } else {
                        resetAoiData();
                        f.find('.btn_back').trigger('click');
                    }
                }
            }
        });

        return false;
    });
}

function openAoiHistoryBox(_opts) {
    let id = 'aoihistorybox';

    let defaults = {
        idx: 0,
        type: '',
        pid: '',
        fid: ''
    };

    let opts = $.extend(defaults, _opts);

    if($('#'+ id).length) {
        closebDialog(id);
    }

    showLoading();
    $.ajax({
        type: 'post',
        url: '/eartheye/history/list',
        data: opts,
        success: function(res) {
            hideLoading();

            var markup = [
                '<div class="ah-inbox">',
                '   <div class="nohistory">',
                '       <div class="info">',
                '           <img src="/images/icon_no_detection_history.svg" height="180" />',
                '           <br /><br /><span class="text">No detection history.</span>',
                '       </div>',
                '   </div>',
                '</div>'
            ].join('');

            if(res != null && res.result) {
                let lists = res.data;
                let date, result;

                markup = '<div class="ah-inbox">';

                lists.forEach(function(item) {
                    date = new Date(item.insert_date);
                    result = JSON.parse(item.result_data);

                    markup += [
                        '   <div class="historybox">',
                        '       <div class="date"><strong>'+ date.format('yyyy-MM-dd') +'</strong> &nbsp; '+ date.format('HH:mm') +'</div>',
                        '       <div class="btn"><button class="btn_history btn_history_'+ item.detection_type +'" data-type="'+ item.detection_type +'" data-idx="'+ item.idx +'">'+ g_oLang.aoi['action_'+ item.detection_type].title[g_sLangCode] +'</button></div>'
                    ].join('');

                    if(item.detection_type == 'C') {
                        markup += [
                            '       <div class="asis-date">',
                            '           <div class="title">'+ g_oLang.aoi.title.asis_imagery_date[g_sLangCode] +'</div>',
                            '           <div class="content">'+ result.date +'<br />('+ result.pid +')</div>',
                            '       </div>',
                            '       <div class="tobe-date">',
                            '           <div class="title">'+ g_oLang.aoi.title.tobe_imagery_date[g_sLangCode] +'</div>',
                            '           <div class="content">'+ result.date2 +'<br />('+ result.pid2 +')</div>',
                            '       </div>'
                        ].join('');
                    } else {
                        markup += [
                            '       <div class="asis-date">',
                            '           <div class="title">'+ g_oLang.aoi.title.imagery_date[g_sLangCode] +'</div>',
                            '           <div class="content">'+ result.date +'<br />('+ result.pid +')</div>',
                            '       </div>',
                            '       <div class="tobe-date"></div>'
                        ].join('');
                    }

                    markup += [
                        '       <div class="models">',
                        '           <div class="title">'+ g_oLang.aoi.title.prediction_model[g_sLangCode] +'</div>',
                        '           <div class="content">'+ item.models.replace(/,/g, ', ') +'</div>',
                        '       </div>',
                        '   </div>'
                    ].join('');
                });

                if(!lists.length) {
                    markup += [
                        '   <div class="nohistory">',
                        '       <div class="info">',
                        '           <img src="/images/icon_no_detection_history.svg" height="180" />',
                        '           <br /><br /><span class="text">No detection history.</span>',
                        '       </div>',
                        '   </div>'
                    ].join('');
                }

                markup += '</div>';
            }

            $('body').bDialog({
                boxID: id,
                boxTitle: g_oLang.aoi.button.history[g_sLangCode],
                boxWidth: '1000px',
                boxHeight: 'auto',
                boxColor: '#2f3646',
                boxTitleColor: '#2f3646',
                boxTitleTextColor: '#fff',
                boxBorder: '0',
                boxCorner: 1,
                useBoxModal: true,
                useBoxShadow: false,
                boxContents: markup
            });

            $('#'+ id).siblings('.ui-dialog-titlebar').css({
                'text-align': 'initial',
                'font-size': '18px',
                'font-weight': 500,
                'color': '#fff',
                'padding': '16px 20px',
                'border-bottom': '1px solid rgba(0, 0, 0, 0.14)'
            });

            $('#'+ id).find('.btn_history').unbind('click').on('click', function() {
                let idx = $(this).attr('data-idx');
                let type = $(this).attr('data-type');

                if(!checkActionPermission(type)) {
                    return false;
                }

                g_oMap.setRestriction({
                    latLngBounds: g_oWorldBoundary
                });

                openDetectionResult(idx, id);
                return false;
            });
        }
    });
}

function loadAoiList(_onlydata) {
    let a = $('#framebox .actionbar');
    let o = $('#framebox .aoibox');
    let f = $('#framebox .aoiformbox');
    let onlydata = (typeof _onlydata != 'undefined' && _onlydata) ? true : false;

    $.ajax({
        type: 'get',
        url: '/eartheye/aoilist',
        async: false,
        success: function(res) {
            if(res != null && res.result) {
                let data = res.data;
                let len = data.length;
                g_oMyAoiData = data;

                if(onlydata) {
                    return;
                }

                refreshAoiDataOnMap();

                o.find('.listbox .msg, .listbox .aoilistbox').remove();
                o.find('.infobar .item-count').html(len);

                for(var i = 0; i < len; i++) {
                    var markup = [
                        '<div class="aoilistbox" data-idx="'+ data[i].idx +'" data-type="'+ data[i].draw_type +'" data-coord=\''+ data[i].coordinates + '\'>',
                        '   <div class="aoiname">',
                        '       <input type="radio" name="aoititle" id="aoititle_'+ data[i].idx +'" />',
                        '       <label for="aoititle_'+ data[i].idx +'">'+ data[i].title +'</label>',
                        '   </div>',
                        '   <div class="btn">',
                        '       <button class="btn_more" data-idx="'+ data[i].idx +'" data-btitle="AOI Detail" />',
                        '   </div>',
                        '   <div class="aoiname2">'+ data[i].title +'</div>',
                        '   <div class="btn2">',
                        '       <button class="btn_trash sub" data-idx="'+ data[i].idx +'" />',
                        '   </div>',
                        '</div>'
                    ].join('');

                    o.find('.listbox').append(markup);
                    resizeAoiListBox();
                }

                o.find('.listbox .aoiname').unbind('click').on('click', function() {
                    o.find('.listbox .aoilistbox').removeClass('on');
                    $(this).closest('.aoilistbox').addClass('on');
                    $(this).find('input[type=radio]').prop('checked', true);
                    removeAoiDataOnMap();
                    drawFitBounds(g_oMap, $(this).closest('.aoilistbox').attr('data-coord'), $(this).find('label').text());

                    var idx = $(this).closest('.aoilistbox').attr('data-idx');
                    a.find('.btn_actions').removeClass('on').attr('data-idx', idx);
                    openActionBar();
                });

                o.find('.listbox .btn button').on('click', function() {
                    var idx = $(this).attr('data-idx');
                    g_sAoiMode = 'DETAIL';
                    removeAoiDataOnMap();
                    resetAoiForm(idx);
                    f.animate({ left: 0 }, 200);
                    closeActionBar(1);
                }).bTooltip({
                    textColor: '#eee',
                    textSize: '12px',
                    boxColor: '#283041',
                    boxCorner: 1,
                    boxPadding: '5px 12px'
                });

                o.find('.btmbox').show();
                o.find('.btmbox2').hide();

                o.find('.btn_trash:first')
                    .removeClass('list on')
                    .unbind('click').on('click', function() {
                        let me = $(this);
                        let mode = me.attr('data-mode');

                        if(mode == 'list') {
                            o.find('.listbox .aoiname, .listbox .btn').hide();
                            o.find('.listbox .aoiname2, .listbox .btn2').show();
                            o.find('.btmbox').hide();
                            o.find('.btmbox2').show();
                            me.addClass('list').attr('data-mode', 'delete');
                        } else {
                            o.find('.listbox .aoiname, .listbox .btn').show();
                            o.find('.listbox .aoiname2, .listbox .btn2').hide();
                            o.find('.btmbox').show();
                            o.find('.btmbox2').hide();
                            me.removeClass('list').attr('data-mode', 'list');
                        }
                    });

                o.find('.btn_trash.sub').on('click', function() {
                    let me = $(this);
                    let idx = me.attr('data-idx');

                    $.ajax({
                        type: 'post',
                        url: '/eartheye/aoidelete',
                        data: { idx: idx },
                        success: function(res) {
                            if(res != null && res.result) {
                                me.closest('.aoilistbox')
                                    .animate({ left: '-270px' }, 150, function() {
                                        $(this).remove();
                                        o.find('.infobar .item-count').html(o.find('.listbox .aoilistbox').length);
                                    });
                            }
                        }
                    });
                });

                o.find('.btmbox2 .btn_delete').unbind('click').on('click', function() {
                    $('body').bConfirm({
                        title: 'EarthEye',
                        message: g_oLang.common.message.all_delete[g_sLangCode],
                        buttons: {
                            'custom1': {
                                'class': 'btn_common_t2',
                                'buttonName': g_oLang.common.button.confirm[g_sLangCode],
                                'action': function () {
                                    $.ajax({
                                        type: 'post',
                                        url: '/eartheye/aoideleteall',
                                        success: function(res) {
                                            if(res != null && res.result) {
                                                $('body').bToast({ message: 'Success' });
                                                loadAoiList();
                                                resetAoiData();
                                            }

                                            resizeAoiListBox();
                                        }
                                    });
                                }
                            },
                            'custom2': {
                                'class': 'btn_common_t1',
                                'buttonName': g_oLang.common.button.cancel[g_sLangCode],
                                'action': function () {}
                            }
                        }
                    });
                });
            }
        }
    });
}

function removeAoiDataOnMap() {
    if(g_oMyAoiMarkers.length) {
        g_oMyAoiMarkers.forEach(function(item) {
            item.setMap(null);
        });

        g_oMyAoiMarkers = [];
    }

    if(g_oMyAoiObjects.length) {
        g_oMyAoiObjects.forEach(function(item) {
            item.setMap(null);
        });

        g_oMyAoiObjects = [];
    }
}

function refreshAoiDataOnMap() {
    let len = g_oMyAoiData.length;
    let z = g_oMap.getZoom();

    if(!len) {
        return;
    }

    removeAoiDataOnMap();

    for(let i = 0; i < len; i++) {
        let data = g_oMyAoiData[i];
        let idx = data.idx;
        let url = 'https://maps.googleapis.com/maps/api/staticmap?center='+ data.lat +','+ data.lng +'&zoom=16&size=205x170&maptype=satellite&key=AIzaSyDzHkDwe5kpfG7pC0F47p7PC4aeGP7TlEY';
        let markup = [
            '<div class="my-aoi-marker'+ (z < 14 ? '' : ' object') +'" data-idx="'+ idx +'"><div class="wrapper">',
            '   <div class="marker-icon"></div>',
            '   <div class="marker-title-area" data-idx="'+ idx +'">',
            '       <div class="title"><span class="ee-icon ee-icon-aoi"></span> '+ data.title +'</div>',
            '       <div class="preview-map" style="background-image: url('+ url +');"></div>',
            '   </div>',
            '</div></div>'
        ].join('');

        let marker = new HTMLMarker(data.lat, data.lng, markup);
        marker.setMap(g_oMap);
        g_oMyAoiMarkers.push(marker);

        let coord = JSON.parse(data.coordinates);
        let options = {
            fillColor: '#4eb8ff',
            fillOpacity: 0.2,
            strokeWeight: 3,
            strokeColor: '#00cbff',
            clickable: true,
            editable: false,
            map: g_oMap
        };

        let object = null;

        switch(coord.type) {
            case 'C':
                options.center = new google.maps.LatLng(coord.center.lat, coord.center.lng);
                options.radius = coord.radius;
                object = new google.maps.Circle(options);
                break;

            case 'R':
                let sw = new google.maps.LatLng(coord.coordinates[0].south, coord.coordinates[0].west);
                let ne = new google.maps.LatLng(coord.coordinates[0].north, coord.coordinates[0].east);
                options.bounds = new google.maps.LatLngBounds(sw, ne);
                object = new google.maps.Rectangle(options);
                break;

            case 'P':
                options.paths = coord.coordinates[0];
                object = new google.maps.Polygon(options);
                break;
        }

        object.idx = idx;

        google.maps.event.addListener(object, 'mouseover', function() {
            object.set('fillColor', '#fff');
            object.set('strokeColor', '#fff');
            $('.my-aoi-marker[data-idx='+ idx +']').addClass('over');
            return false;
        });

        google.maps.event.addListener(object, 'mouseout', function() {
            object.set('fillColor', '#4eb8ff');
            object.set('strokeColor', '#00cbff');
            $('.my-aoi-marker[data-idx='+ idx +']').removeClass('over');
            return false;
        });

        google.maps.event.addListener(object, 'click', function() {
            $('.my-aoi-marker .marker-title-area[data-idx='+ idx +']').trigger('click');
        });

        object.setVisible(z < 14 ? false : true);
        g_oMyAoiObjects.push(object);
    }

    /*let markerCluster = new MarkerClusterer(g_oMap, g_oMyAoiMarkers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });*/

    setTimeout(function() {
        $('.my-aoi-marker .marker-title-area').on('mouseenter', function () {
            let me = $(this);
            let idx = parseInt(me.attr('data-idx'));

            me.closest('.html-marker').css('z-index', len);

            if(!me.closest('.my-aoi-marker').hasClass('object')) {
                me.find('.preview-map').show();
            }

            g_oMyAoiObjects.forEach(function(item) {
                if(item.idx == idx) {
                    item.set('zIndex', len);
                } else {
                    item.set('zIndex', 0);
                }
            });
        }).on('mouseleave', function () {
            let me = $(this);
            me.closest('.html-marker').css('z-index', 0);
            me.find('.preview-map').hide();
        }).on('click', function() {
            let idx = $(this).attr('data-idx');
            $('#framebox .btn_aoi').trigger('click');
            setTimeout(function() {
                $('#framebox .aoilistbox[data-idx='+ idx +'] .aoiname').trigger('click');
            }, 250);
            return false;
        });
    }, 500);
}

function resizeAoiListBox() {
    let o = $('#framebox .aoibox');
    let l = o.find('.listbox');
    let b = o.find('.btmbox');

    var oh = o.height(), lh = l.height() + parseInt(l.css('top')), bh = b.height();
    var ab = l.find('.aoilistbox:first-child').height() * l.find('.aoilistbox').length;

    if((lh + bh) >= oh) {
        if((ab + parseInt(l.css('top')) + bh) >= oh) {
            l.css({position: 'absolute'});
            b.css({position: 'absolute'});
        } else {
            l.css({position: 'initial'});
            b.css({position: 'relative'});
        }
    } else {
        l.css({ position: 'initial' });
        b.css({ position: 'relative' });
    }
}

function openActionBar() {
    let a = $('#framebox .actionbar');
    let o = $('#framebox .aoibox');
    let m = $('#mapview');

    var mleft = parseInt(m.css('left')) + a.width();

    if(!a.hasClass('open')) {
        a.find('.btn_actions').removeClass('on');
        a.animate({left: o.width() + 'px'}, (g_bFastMode ? 1 : 150)).addClass('open');
        m.animate({left: mleft + 'px'}, (g_bFastMode ? 1 : 200));
    }

    a.find('.btn_actions').unbind('click').on('click', function() {
        let me = $(this);
        let action = me.attr('data-action');
        let idx = me.attr('data-idx');

        if(o.find('.btn_trash:first').hasClass('list')) {
            o.find('.btn_trash:first').trigger('click');
        }

        if(!checkActionPermission(action)) {
            return false;
        }

        checkSaveDetectionResult(me, function() {
            a.find('.btn_actions').removeClass('on');
            me.addClass('on');
            openActionDetail(idx, action);
        });
    });
}

function checkActionPermission(action) {
    let chk = 0;

    switch(action) {
        case 'O':
            chk = (g_oMyInfo.set_detection_types.indexOf('OBJECT') != -1) ? 1 : 0;
            break;

        case 'B':
            chk = (g_oMyInfo.set_detection_types.indexOf('SEGMENTATION') != -1) ? 1 : 0;
            break;

        case 'C':
            chk = (g_oMyInfo.set_detection_types.indexOf('CHANGE') != -1) ? 1 : 0;
            break;

        case 'T':
            chk = 1;
            break;
    }

    if(!chk) {
        $('body').bAlert({
            message: g_oLang.common.message.donot_have_permission[g_sLangCode] + '<div class="sub">'+ g_oLang.common.message.contact_admin[g_sLangCode] +'</div>'
        });

        return false;
    } else {
        return true;
    }
}

function closeActionBar(_status) {
    let a = $('#framebox .actionbar');
    let f = $('#framebox .aoiformbox');
    let m = $('#mapview');

    var mleft = parseInt(m.css('left')) - a.width();

    if(a.hasClass('open')) {
        a.stop(true, true).animate({left: '0'}, (g_bFastMode ? 25 : 150), function () {
            if(typeof _status == 'undefined' || _status == 1) {
                $(this).removeClass('open');
                a.find('.btn_actions').removeClass('on').attr('data-idx', '0');
            }
        });

        if (parseInt(f.css('left')) > 0) {
            var left = (typeof _status != 'undefined' && _status == 1) ? mleft : 96;
            m.dequeue().animate({left: left + 'px'}, (g_bFastMode ? 50 : 200));
        } else {
            m.dequeue().animate({left: mleft + 'px'}, (g_bFastMode ? 25 : 150));
        }

        setTimeout(function() {
            if(g_bFastMode) {
                m.css('left', '416px');
            }
        }, 150);
    }
}

function openActionDetail(_idx, _type) {
    let a = $('#framebox .actionbar');
    let d = $('#framebox .detailbar');
    let m = $('#mapview');

    if(!g_bFastMode) {
        if (d.closest('.detailbar-wrapper').find('.aoilist-previewbox').length) {
            d.closest('.detailbar-wrapper').find('.aoilist-previewbox').animate({
                opacity: 0,
                left: '40px'
            }, 100, function () {
                $(this).remove();
            });
        }

        if (d.find('.stepbar .complete').length) {
            d.find('.stepbar .complete').remove();
        }

        resetResultObjects();
        g_oSelectedAoiData = null;
        if (g_oPreviewMarker != null) {
            m.find('.aoi-title-marker').show();
            g_oPreviewObject.set('fillOpacity', 0.2);

            if(g_oPreviewObjectSub != null) {
                g_oPreviewObjectSub.set('fillOpacity', 0.2);
            }
        }
    }

    var markup = [
        '<div class="titlebar">',
        '   <div class="title">'+ g_oLang.aoi['action_'+ _type].title[g_sLangCode] +'</div>',
        '   <div class="btn"><button class="btn_back"></button></div>',
        '</div>',
        '<div class="stepbar">',
        '   <div class="step1 '+ _type +'-on">STEP 1</div>',
        '   <div class="step2"><div class="arrow"></div>STEP 2</div>',
        '</div>',
        '<div class="dinbox">',
        '   <div class="progressbar">Please wait a moment.</div>',
        '   <div class="listarea"></div>',
        '   <div class="listarea-s2"></div>',
        '   <div class="completearea"></div>',
        '   <div class="btnarea">',
        '       <button class="btn_flexible btn_common_r3 next off" data-step="1" data-id="" data-model="" disabled>'+ g_oLang.common.button.next[g_sLangCode] +'</button>',
        '   </div>',
        '</div>'
    ].join('');

    d.html(markup);

    if(_type == 'T') {
        d.find('.stepbar').hide();
        d.find('.dinbox').css('top', '60px');
        d.find('.btn_flexible').html('View Time Lapse').removeClass('next');

        renderTimeLapse(_idx);
        return false;
    }

    d.find('.titlebar .btn_back').on('click', function() {
        var id = d.find('.btn_flexible').attr('data-id');
        var step = parseInt(d.find('.btn_flexible').attr('data-step'));

        if(step == 2) {
            d.find('.listarea').animate({ left: '0' }, 200);
            d.find('.listarea-s2').animate({ left: '320px' }, 200, function() {
                d.find('.stepbar .step1').addClass(_type +'-on').css('cursor', 'default').unbind('click');
                d.find('.stepbar .step2').removeClass(_type +'-on').css('cursor', 'pointer').unbind('click').on('click', function() {
                    d.find('.btn_flexible').trigger('click');
                });
                d.find('.titlebar .btn').hide();
                setActionProgressMessage(g_oLang.common.message.click_next[g_sLangCode]);
            });

            d.closest('.detailbar-wrapper').find('.aoilist-previewbox').animate({
                opacity: 0,
                left: '40px'
            }, 200, function() {
                $(this).remove();
            });

            d.find('.btn_flexible')
                .html(g_oLang.common.button.next[g_sLangCode])
                .attr({'data-step': '1', 'data-model': ''})
                .addClass('next');

            if(id) {
                d.find('.btn_flexible')
                    .removeClass('off')
                    .prop('disabled', false);
            }
        }

        if(step != 3) {
            d.find('.stepbar .complete').remove();
        } else {
            checkSaveDetectionResult(a.find('.btn_actions.on'));
        }
    });

    d.find('.btn_flexible').unbind('click').on('click', function() {
        var me = $(this);
        var pid = me.attr('data-pid');
        var pid2 = me.attr('data-pid2');
        var id = me.attr('data-id');
        var id2 = me.attr('data-id2');
        var step = parseInt(me.attr('data-step'));
        var model = me.attr('data-model');
        var coords = me.attr('data-coords');

        if(step == 1 && !parseInt(d.find('.listarea').css('left'))) {
            showLoading();
            resetResultObjects();
            $.ajax({
                type: 'post',
                url: g_sCoreServer + '/detection_features',
                data: JSON.stringify({ "API_KEY": g_sApiKey, "PID": pid }),
                async: false,
                contentType: 'application/json',
                success: function(res) {
                    hideLoading();
                    d.find('.listarea-s2').html('');
                    d.find('.stepbar .step2').css('cursor', 'default').unbind('click');
                    d.find('.stepbar .step1').css('cursor', 'pointer').unbind('click').on('click', function() {
                        d.find('.btn_back').trigger('click');
                    });

                    if(res != null && !res.error) {
                        let features = res.detection_features[0];
                        let items = null;
                        let mymodels = [];

                        switch(_type) {
                            case 'O':
                                items = features.OBJECT_DETECTION;
                                mymodels = g_oMyInfo.set_detection_models.object;
                                break;

                            case 'B':
                                items = features.SEGMENTATION;
                                mymodels = g_oMyInfo.set_detection_models.segmentation;
                                break;

                            case 'C':
                                items = features.CHANGE_DETECTION;
                                mymodels = g_oMyInfo.set_detection_models.change;
                                break;
                        }

                        if(items != null) {
                            for(var i = 0; i < items.length; i++) {
                                if(!mymodels.includes(items[i])) {
                                    continue;
                                }

                                var markup = [
                                    '<div class="modelbox '+ _type +'" data-model="'+ items[i] +'">',
                                    '   <input type="checkbox" name="model_features[]" id="model_feature_'+ i +'" value="'+ items[i] +'" />',
                                    '   <label for="model_feature_'+ i +'">'+ items[i] +'</label>',
                                    '</div>'
                                ].join('');

                                d.find('.listarea-s2').append(markup);
                            }

                            d.find('.listarea-s2 .modelbox').on('click', function() {
                                if($(this).find('input').prop('checked')) {
                                    $(this).find('input').prop('checked', false);
                                    $(this).removeClass('on');
                                } else {
                                    $(this).find('input').prop('checked', true);
                                    $(this).addClass('on');
                                }

                                var model = '';
                                d.find('.listarea-s2 input[type=checkbox]:checked').each(function() {
                                    model += (model?',':'') + $(this).val();
                                });

                                if(model) {
                                    me.removeClass('off').prop('disabled', false);
                                    me.attr('data-model', model);
                                    d.find('.stepbar .step2').css('cursor', 'pointer').unbind('click').on('click', function() {
                                        me.trigger('click');
                                    });
                                } else {
                                    me.addClass('off').prop('disabled', true);
                                    me.attr('data-model', '');
                                    d.find('.stepbar .step2').css('cursor', 'default').unbind('click');
                                }
                            });
                        }
                    }
                }
            });

            d.find('.listarea').animate({ left: '-320px' }, 200);
            d.find('.listarea-s2').animate({ left: '0' }, 200, function() {
                d.find('.stepbar .step1').removeClass(_type +'-on');
                d.find('.stepbar .step2').addClass(_type +'-on');
                d.find('.titlebar .btn').show();
                setActionProgressMessage(g_oLang.common.message.select_model[g_sLangCode]);
            });

            let preview = (!id) ? d.find('.listarea .itembox[data-pid=' + pid + ']').html() : d.find('.listarea .wrapper[data-pid='+ pid +'] .itembox[data-id=' + id + ']').html();
            let previewBox = $('<div />')
                .addClass('aoilist-previewbox ' + _type)
                .attr({
                    pid: pid,
                    id: id
                });
            previewBox.append(preview);
            d.closest('.detailbar-wrapper').append(previewBox);
            previewBox.animate({
                opacity: 1,
                left: '330px'
            }, 200);

            if(_type == 'C') {
                let preview2 = d.find('.listarea .wrapper[data-pid='+ pid2 +'] .itembox[data-id=' + id2 + ']').html();
                let previewBox2 = $('<div />')
                    .addClass('aoilist-previewbox ' + _type)
                    .attr({
                        pid: pid2,
                        id: id2
                    });
                previewBox2.append(preview2);
                d.closest('.detailbar-wrapper').append(previewBox2);
                previewBox2.animate({
                    opacity: 1,
                    left: '620px'
                }, 200);
            }

            me.html(g_oLang.aoi['action_'+ _type].title[g_sLangCode])
                .attr('data-step', '2')
                .removeClass('next');

            if(!model) {
                me.addClass('off').prop('disabled', true);
            }
        } else if(step == 2 && model) {
            showLoading(g_oLang.common.message['wait_for_'+ _type +'_ing'][g_sLangCode]);

            var coord = JSON.parse(coords);
            var bbox = '';

            g_oSelectedAoiData.model = [];

            var geometry, geotype = '';
            switch(coord.type) {
                case 'C':
                    geometry = [{
                        "lat": coord.center.lat,
                        "lng": coord.center.lng,
                        "radius": coord.radius
                    }];
                    geotype = 'CIRCLE';
                    break;

                case 'R':
                    var sw = new google.maps.LatLng(coord.coordinates[0].south, coord.coordinates[0].west);
                    var ne = new google.maps.LatLng(coord.coordinates[0].north, coord.coordinates[0].east);
                    bbox = new google.maps.LatLngBounds(sw, ne);
                    var sw = bbox.getSouthWest();
                    var ne = bbox.getNorthEast();
                    geometry = sw.lng() +','+ sw.lat() +','+ ne.lng() +','+ ne.lat();
                    geotype = 'BBOX';
                    break;

                case 'P':
                    geometry = coord.coordinates[0];
                    geotype = 'POLYGON';
                    break;
            }

            $.ajax({
                type: 'post',
                url: g_sCoreServer + '/job',
                data: JSON.stringify({
                    "API_KEY": g_sApiKey,
                    "JOB_TYPE": g_oJobType[_type],
                    "GEOMETRY": (geotype == 'BBOX') ? geometry : [geometry],
                    "GEOMETRY_TYPE": geotype,
                    "DETECTION_CLASS": model,
                    "PID": pid,
                    "FID": (_type == 'C') ? id +','+ id2 : id,
                    "DETECTION_MODE": "AUTO"
                }),
                contentType: 'application/json',
                success: function (res) {
                    hideLoading();

                    let features = (res != null && !res.error) ? res.features : [];
                    let len = features.length;

                    if(len) {
                        g_oSelectedAoiData.features = features;
                        renderResultObject(features, _type, model);
                        g_oSelectedAoiData.models = model;

                        d.find('.stepbar')
                            .append('<div class="complete '+ _type +'">'+ g_oLang.common.message.process_completed[g_sLangCode] +'</div>');

                        if(_type != 'C') {
                            d.closest('.detailbar-wrapper').find('.aoilist-previewbox').animate({
                                opacity: 0,
                                left: '40px'
                            }, 100, function () {
                                $(this).remove();
                            });
                        } else {
                            renderMapSliderUI();
                            g_oMapSub.getDiv().style.opacity = 1;
                        }

                        renderDetectionResult(_type);

                        d.find('.completearea').animate({
                            left: '0'
                        }, 200, function() {
                            d.find('.btn_flexible')
                                .removeClass('off').prop('disabled', false)
                                .attr('data-step', 3)
                                .html(g_oLang.common.button.save[g_sLangCode]);
                        });

                        setActionProgressMessage(g_oLang.common.message.processing_result[g_sLangCode]);
                    } else {
                        $('body').bAlert({
                            message: g_oLang.common.message.not_found_result[g_sLangCode]
                        });
                    }
                }
            });
        } else if(step == 3) {
            saveDetectionResult(true);
        }
    });

    if(!g_bFastMode) {
        showLoading();
    }

    $.ajax({
        type: 'get',
        url: '/eartheye/aoidetail/'+ _idx,
        success: function(res) {
            if(!g_bFastMode) {
                hideLoading();
            }

            if(res != null && res.result) {
                let data = res.data[0];
                if(!g_bFastMode) {
                    g_oSelectedAoiData = { data: data };
                }

                var sw = data.sw_latlng.split(',');
                var ne = data.ne_latlng.split(',');
                var bbox = sw[1] +','+ sw[0] +','+ ne[1] +','+ ne[0];

                closeAoiBox(1);
                closeActionBar(2);
                if(!d.hasClass('open') && parseInt(d.css('left')) < 0) {
                    d.animate({ left: 0 }, (g_bFastMode ? 25 : 150), function() {
                        d.addClass('open');
                    });
                }
                m.dequeue().stop();

                if(!g_bFastMode) {
                    setActionProgressMessage(g_oLang.common.message.requesting_image[g_sLangCode]);
                    showLoading();

                    g_oTileProviders.forEach(function (item) {
                        let imgtype = (typeof item.IMAGERY_TYPE != 'undefined') ? item.IMAGERY_TYPE : 'SATELLITE';

                        if (!item.MULTIPLE_IMAGES && (_type == 'C' || _type == 'T')) {
                            return true;
                        }

                        let myprovider = [];
                        switch(imgtype) {
                            case 'AERIAL':
                                myprovider = g_oMyInfo.set_imagery_provider.aerial;
                                break;

                            case 'DRONE':
                                myprovider = g_oMyInfo.set_imagery_provider.drone;
                                break;

                            default:
                                myprovider = g_oMyInfo.set_imagery_provider.satellite;
                                break;
                        }

                        if(g_oMyInfo.set_imagery_types.indexOf(imgtype) == -1) {
                            return true;
                        }

                        if(!myprovider.includes(item.PID)) {
                            return true;
                        }

                        if (item.MULTIPLE_IMAGES) {
                            $.ajax({
                                type: 'get',
                                url: g_sTileServer + '/search',
                                async: false,
                                data: {
                                    BBOX: bbox,
                                    PID: item.PID
                                },
                                success: function (res2) {
                                    let tilesinfo = (typeof res2 === 'string') ? JSON.parse(res2) : res2;

                                    if (res2 != null && !tilesinfo.error) {
                                        let tiles = tilesinfo.features;
                                        let tcnt = tiles.length;

                                        for (var i = 0; i < tcnt; i++) {
                                            if (!i) {
                                                d.find('.listarea')
                                                    .append('<div class="folder" data-pid="' + item.PID + '">' + item.NAME + '</div>')
                                                    .append('<div class="wrapper" data-pid="' + item.PID + '"></div>');
                                            }

                                            var date = new Date(tiles[i].properties.acquisitionDate);
                                            var dateString = date.format('yyyy-MM-dd');
                                            var thumbUrl = g_sTileServer + '/screenshot?PID=' + item.PID + '&FID=' + tiles[i].id + '&THUM=true&BBOX=' + bbox;

                                            markup = [
                                                '       <div class="itembox type-' + _type + '" data-pid="' + item.PID + '" data-min="'+ item.MIN_ZOOM +'" data-max="'+ item.MAX_ZOOM +'" data-id="' + tiles[i].id + '" data-coords=\'' + data.coordinates + '\'>',
                                                '           <div class="thumbnail cnt_'+ item.PID +'_' + i + '">LOADING ...</div>',
                                                '           <div class="info">',
                                                '               <div class="date">' + dateString + '</div>',
                                                '               <div class="provider">' + (tiles[i].properties.provider == 'None' ? item.PID : tiles[i].properties.provider) + '</div>',
                                                '               <div class="imagery"><span class="ee-icon ee-icon-satellite"></span> ' + imgtype + '</div>',
                                                '               <div class="subinfo">' + tiles[i].properties.constellation + '</div>',
                                                '               <div class="btn"><button class="btn_history btn_history_' + _type + '">' + g_oLang.aoi['action_' + _type].title[g_sLangCode] + '</button></div>',
                                                '           </div>',
                                                '       </div>'
                                            ].join('');

                                            d.find('.listarea .wrapper[data-pid=' + item.PID + ']').append(markup);
                                            $('<img />').attr({src: thumbUrl, pid: item.PID, cnt: i}).on('load', function () {
                                                let me = $(this);
                                                let meUrl = me.attr('src');

                                                d.find('.listarea .itembox .thumbnail.cnt_'+ me.attr('pid') +'_' + me.attr('cnt'))
                                                    .css('background-image', 'url(' + meUrl + ')').html('');

                                                me.remove();
                                            });

                                            d.find('.listarea .wrapper[data-pid=' + item.PID + '] .itembox[data-id=' + tiles[i].id + '] .btn').on('click', function () {
                                                openAoiHistoryBox({
                                                    idx: _idx,
                                                    type: _type,
                                                    pid: $(this).closest('.itembox').attr('data-pid'),
                                                    fid: $(this).closest('.itembox').attr('data-id')
                                                });

                                                return false;
                                            });

                                            $.ajax({
                                                type: 'post',
                                                url: '/eartheye/history/check',
                                                data: {
                                                    idx: _idx,
                                                    type: _type,
                                                    pid: item.PID,
                                                    fid: tiles[i].id
                                                },
                                                async: false,
                                                success: function (res) {
                                                    if (res != null && res.result) {
                                                        if (res.check) {
                                                            d.find('.listarea .wrapper[data-pid=' + item.PID + '] .itembox[data-id=' + tiles[i].id + '] .btn').show();
                                                        }
                                                    }
                                                }
                                            });
                                        }

                                        setActionProgressMessage(g_oLang.common.message.select_image[g_sLangCode]);

                                        let imageryCount = 0;

                                        d.find('.listarea .itembox').unbind('click').on('click', function () {
                                            showLoading(g_oLang.common.message.loading_tiles_selected[g_sLangCode]);

                                            let me = $(this);
                                            let tileid = me.attr('data-id');
                                            let pid = me.attr('data-pid');
                                            let coords = me.attr('data-coords');

                                            if (!imageryCount) {
                                                d.find('.listarea .itembox').removeClass('on');
                                            } else {
                                                if (g_oSelectedAoiData.pid != pid) {
                                                    hideLoading();

                                                    $('body').bAlert({
                                                        message: g_oLang.aoi.message.select_same_provider[g_sLangCode]
                                                    });

                                                    return false;
                                                }
                                            }

                                            me.addClass('on');

                                            if (!imageryCount) {
                                                g_oTileLayer = new google.maps.ImageMapType({
                                                    name: g_sTileLayerID,
                                                    getTileUrl: function (coord, zoom) {
                                                        let url = g_sTileServer + g_sBaseTileUrl
                                                            .replace('{pid}', pid + (tileid ? '/' : ''))
                                                            .replace('{fid}', tileid)
                                                            .replace('{x}', coord.x)
                                                            .replace('{y}', coord.y)
                                                            .replace('{z}', zoom);
                                                        return url;
                                                    },
                                                    tileSize: new google.maps.Size(256, 256),
                                                    minZoom: g_iMinZoom,
                                                    maxZoom: g_iMaxZoom
                                                });

                                                g_oMap.mapTypes.set(g_sTileLayerID, g_oTileLayer);
                                                g_oMap.setMapTypeId(g_sTileLayerID);

                                                google.maps.event.addListenerOnce(g_oMap, 'tilesloaded', function () {
                                                    hideLoading();

                                                    if (_type == 'C') {
                                                        setActionProgressMessage(g_oLang.aoi.message.select_other_imagery[g_sLangCode]);
                                                        d.find('.btn_flexible').addClass('off').prop('disabled', true)
                                                            .attr({
                                                                'data-pid': pid,
                                                                'data-id': tileid,
                                                                'data-coords': coords
                                                            });

                                                        g_oSelectedAoiData.pid = pid;
                                                        g_oSelectedAoiData.tileid = tileid;
                                                        g_oSelectedAoiData.date = me.find('.date').text();
                                                        g_oSelectedAoiData.type = _type;

                                                        d.find('.stepbar .step2').css('cursor', 'default').unbind('click');
                                                    } else {
                                                        setActionProgressMessage(g_oLang.common.message.click_next[g_sLangCode]);
                                                        d.find('.btn_flexible').removeClass('off').prop('disabled', false)
                                                            .attr({
                                                                'data-pid': pid,
                                                                'data-id': tileid,
                                                                'data-coords': coords
                                                            });

                                                        g_oSelectedAoiData.pid = pid;
                                                        g_oSelectedAoiData.tileid = tileid;
                                                        g_oSelectedAoiData.date = me.find('.date').text();
                                                        g_oSelectedAoiData.type = _type;

                                                        d.find('.stepbar .step2').css('cursor', 'pointer').unbind('click').on('click', function () {
                                                            d.find('.btn_flexible').trigger('click');
                                                        });
                                                    }
                                                });
                                            } else {
                                                if(d.find('.listarea .itembox.on').length < 2) {
                                                    hideLoading();
                                                    return;
                                                }

                                                let sm = $('#mapview-sub');
                                                sm.css({width: '100%', opacity: 0});

                                                g_oMapSub = new google.maps.Map(document.getElementById('mapview-sub'), {
                                                    minZoom: g_iMinZoom,
                                                    maxZoom: g_iMaxZoom,
                                                    zoom: g_oMap.getZoom(),
                                                    center: g_oMap.getCenter(),
                                                    mapTypeId: 'satellite', // hybrid (label + satellite)
                                                    disableDefaultUI: true,
                                                    backgroundColor: 'transparent',
                                                    restriction: {
                                                        latLngBounds: {north: 85, south: -85, west: -180, east: 180}
                                                    }
                                                });

                                                let defpid = g_oSelectedAoiData.pid,
                                                    deffid = g_oSelectedAoiData.tileid;

                                                g_oTileLayerSub = new google.maps.ImageMapType({
                                                    name: g_sTileLayerIDSub,
                                                    getTileUrl: function (coord, zoom) {
                                                        let url = g_sTileServer + g_sBaseTileUrl
                                                            .replace('{pid}', defpid + (deffid ? '/' : ''))
                                                            .replace('{fid}', deffid)
                                                            .replace('{x}', coord.x)
                                                            .replace('{y}', coord.y)
                                                            .replace('{z}', zoom);
                                                        return url;
                                                    },
                                                    tileSize: new google.maps.Size(256, 256),
                                                    minZoom: g_iMinZoom,
                                                    maxZoom: g_iMaxZoom
                                                });

                                                g_oTileLayer = new google.maps.ImageMapType({
                                                    name: g_sTileLayerID,
                                                    getTileUrl: function (coord, zoom) {
                                                        let url = g_sTileServer + g_sBaseTileUrl
                                                            .replace('{pid}', pid + (tileid ? '/' : ''))
                                                            .replace('{fid}', tileid)
                                                            .replace('{x}', coord.x)
                                                            .replace('{y}', coord.y)
                                                            .replace('{z}', zoom);
                                                        return url;
                                                    },
                                                    tileSize: new google.maps.Size(256, 256),
                                                    minZoom: g_iMinZoom,
                                                    maxZoom: g_iMaxZoom
                                                });

                                                g_oMap.mapTypes.set(g_sTileLayerID, g_oTileLayer);
                                                g_oMap.setMapTypeId(g_sTileLayerID);
                                                g_oMapSub.mapTypes.set(g_sTileLayerIDSub, g_oTileLayerSub);
                                                g_oMapSub.setMapTypeId(g_sTileLayerIDSub);

                                                renderMapInfoBar(g_oMapSub);
                                                renderCustomOpacityControl(g_oMapSub, _type);
                                                renderCustomZoomControl(g_oMapSub);

                                                google.maps.event.addListenerOnce(g_oMapSub, 'tilesloaded', function () {
                                                    hideLoading();

                                                    setTimeout(function () {
                                                        makeScale(g_oMapSub);
                                                    }, 500);

                                                    setActionProgressMessage(g_oLang.common.message.click_next[g_sLangCode]);
                                                    d.find('.btn_flexible').removeClass('off').prop('disabled', false)
                                                        .attr({'data-pid2': pid, 'data-id2': tileid});

                                                    g_oSelectedAoiData.pid2 = pid;
                                                    g_oSelectedAoiData.tileid2 = tileid;
                                                    g_oSelectedAoiData.date2 = me.find('.date').text();

                                                    d.find('.stepbar .step2').css('cursor', 'pointer').unbind('click').on('click', function () {
                                                        d.find('.btn_flexible').trigger('click');
                                                    });

                                                    sm.find('div:first').css({width: m.width() + 'px'});
                                                    sm.css({width: '50%'});

                                                    $($('#sizeframe')[0].contentWindow).unbind('resize').on('resize', function () {
                                                        sm.find('div:first').css({width: m.width() + 'px'});
                                                    });

                                                    drawFitBounds(g_oMapSub, coords, g_oSelectedAoiData.data.title, 1);

                                                    imageryCount = 0;
                                                });

                                                g_oMap.bindTo('center', g_oMapSub, 'center');
                                                g_oMap.bindTo('zoom', g_oMapSub, 'zoom');
                                            }

                                            if (_type == 'C') {
                                                imageryCount = d.find('.listarea .itembox.on').length;
                                            } else {
                                                imageryCount = 0;
                                            }
                                        });
                                    }
                                },
                                error: function (req, status, err) {
                                    hideLoading();
                                    $('body').bAlert({
                                        message: g_oLang.common.message.request_failed[g_sLangCode] + '<div class="sub">' + g_oLang.common.message.check_apiserver[g_sLangCode] + '</div>'
                                    });

                                    setActionProgressMessage(g_oLang.common.message.request_failed[g_sLangCode]);
                                    markup = '<div class="noresponse">' + g_oLang.common.message.notfound_image[g_sLangCode] + '</div>';
                                    d.find('.listarea').append(markup);
                                }
                            });
                        } else {
                            d.find('.listarea')
                                .append('<div class="folder" data-pid="' + item.PID + '">' + item.NAME + '</div>')
                                .append('<div class="wrapper" data-pid="' + item.PID + '"></div>');

                            var date = new Date((typeof item.IMAGERY_DATE != 'undefined') ? item.IMAGERY_DATE : '');
                            var dateString = date.format('yyyy-MM-dd');
                            var thumbUrl = g_sTileServer + '/screenshot?PID=' + item.PID + '&THUM=true&BBOX=' + bbox;

                            markup = [
                                '       <div class="itembox type-' + _type + '" data-pid="' + item.PID + '" data-id="" data-coords=\'' + data.coordinates + '\'>',
                                '           <div class="thumbnail">LOADING ...</div>',
                                '           <div class="info">',
                                '               <div class="date">' + dateString + '</div>',
                                '               <div class="provider">' + item.PID + '</div>',
                                '               <div class="imagery"><span class="ee-icon ee-icon-satellite"></span> ' + imgtype + '</div>',
                                '               <div class="subinfo">PLEIADES</div>',
                                '               <div class="btn"><button class="btn_history btn_history_' + _type + '">' + g_oLang.aoi['action_' + _type].title[g_sLangCode] + '</button></div>',
                                '           </div>',
                                '       </div>'
                            ].join('');

                            $('<img />').attr({src: thumbUrl, pid: item.PID}).on('load', function () {
                                let pid = $(this).attr('pid');
                                d.find('.listarea .itembox[data-pid=' + pid + '] .thumbnail')
                                    .css({'background-image': 'url(' + $(this).attr('src') + ')'}).html('');
                                $(this).remove;
                            });

                            d.find('.listarea .wrapper[data-pid=' + item.PID + ']').append(markup);
                            d.find('.listarea .wrapper[data-pid=' + item.PID + '] .itembox[data-pid=' + item.PID + '] .btn').on('click', function () {
                                openAoiHistoryBox({
                                    idx: _idx,
                                    type: _type,
                                    pid: $(this).closest('.itembox').attr('data-pid'),
                                    fid: $(this).closest('.itembox').attr('data-id')
                                });

                                return false;
                            });

                            $.ajax({
                                type: 'post',
                                url: '/eartheye/history/check',
                                data: {
                                    idx: _idx,
                                    type: _type,
                                    pid: item.PID
                                },
                                async: false,
                                success: function (res) {
                                    if (res != null && res.result) {
                                        if (res.check) {
                                            d.find('.listarea .wrapper[data-pid=' + item.PID + '] .itembox[data-pid=' + item.PID + '] .btn').show();
                                        }
                                    }
                                }
                            });

                            setActionProgressMessage(g_oLang.common.message.select_image[g_sLangCode]);

                            d.find('.listarea .itembox[data-pid=' + item.PID + ']').on('click', function () {
                                showLoading(g_oLang.common.message.loading_tiles_selected[g_sLangCode]);

                                let me = $(this);
                                let pid = me.attr('data-pid');
                                let coords = me.attr('data-coords');

                                d.find('.listarea .itembox').removeClass('on');
                                me.addClass('on');

                                g_oTileLayer = new google.maps.ImageMapType({
                                    name: g_sTileLayerID,
                                    getTileUrl: function (coord, zoom) {
                                        let url = g_sTileServer + g_sBaseTileUrl
                                            .replace('{pid}', pid)
                                            .replace('{fid}', '')
                                            .replace('{x}', coord.x)
                                            .replace('{y}', coord.y)
                                            .replace('{z}', zoom);
                                        return url;
                                    },
                                    tileSize: new google.maps.Size(256, 256),
                                    minZoom: g_iMinZoom,
                                    maxZoom: g_iMaxZoom
                                });

                                g_oMap.mapTypes.set(g_sTileLayerID, g_oTileLayer);
                                g_oMap.setMapTypeId(g_sTileLayerID);

                                google.maps.event.addListenerOnce(g_oMap, 'tilesloaded', function () {
                                    hideLoading();

                                    setActionProgressMessage(g_oLang.common.message.click_next[g_sLangCode]);
                                    d.find('.btn_flexible').removeClass('off').prop('disabled', false)
                                        .attr({
                                            'data-pid': pid,
                                            'data-id': '',
                                            'data-coords': coords
                                        });

                                    g_oSelectedAoiData.pid = pid;
                                    g_oSelectedAoiData.tileid = '';
                                    g_oSelectedAoiData.date = me.find('.date').text();
                                    g_oSelectedAoiData.type = _type;

                                    d.find('.stepbar .step2').css('cursor', 'pointer').unbind('click').on('click', function () {
                                        d.find('.btn_flexible').trigger('click');
                                    });
                                });
                            });
                        }
                    });

                    hideLoading();

                    d.find('.listarea .folder').on('click', function () {
                        var me = $(this);
                        var pid = me.attr('data-pid');

                        me.addClass('on');
                        var t = d.find('.listarea .wrapper[data-pid=' + pid + ']');
                        var sum = t.find('.itembox:first-child').height() * t.find('.itembox').length;
                        t.show().animate({height: sum + 'px'}, 200);

                        d.find('.listarea .folder').not(me).each(function () {
                            $(this).removeClass('on');
                            d.find('.listarea .wrapper[data-pid=' + $(this).attr('data-pid') + ']')
                                .animate({height: '0'}, 200, function () {
                                    $(this).hide();
                                });
                        });
                    });

                    d.find('.listarea .folder:first-child').trigger('click');

                    if(_type == 'C') {
                        d.find('.listarea .wrapper').each(function () {
                            let me = $(this);
                            let pid = me.attr('data-pid');

                            if (me.find('.itembox').length < 2) {
                                me.hide();
                                me.siblings('.folder[data-pid=' + pid + ']').hide();
                            }
                        });
                    }
                }
            } else {
                $('body').bAlert({
                    message: g_oLang.common.message.request_failed[g_sLangCode] +'<div class="sub">'+ g_oLang.common.message.try_again[g_sLangCode] +'</div>'
                });
            }
        }
    });
}

function openTimeLapse(_pid, _imgtypename) {
    let sw = g_oSelectedAoiData.data.sw_latlng.split(',');
    let ne = g_oSelectedAoiData.data.ne_latlng.split(',');
    let bbox = sw[1] +','+ sw[0] +','+ ne[1] +','+ ne[0];

    showLoading(g_oLang.common.message.preparing_image[g_sLangCode]);
    $.ajax({
        type: 'get',
        url: g_sTileServer + '/search',
        data: {
            BBOX: bbox,
            PID: _pid
        },
        success: function (res) {
            hideLoading();

            if(res != null && !res.error) {
                let id = 'timelapsebox';
                let features = res.features;
                let featurescnt = features.length, cnt = 0;
                g_oTimeLapseImages = [];

                showLoading('Time Lapse Processing...');
                features.forEach(function(item) {
                    let url = g_sTileServer + '/screenshot?PID=' + _pid + '&FID=' + item.id + '&THUM={thum}&WIDTH=800&BBOX=' + bbox;
                    let date = new Date(item.properties.acquisitionDate);

                    $('<img />').attr({src: url.replace('{thum}', 'false')}).on('load', function () {
                        let tileinfo = {
                            image: $(this),
                            url: url.replace('{thum}', 'true'),
                            fid: item.id,
                            date: date.format('yyyy-MM-dd'),
                            type: item.properties.constellation
                        };

                        g_oTimeLapseImages.push(tileinfo);
                        cnt++;

                        if(featurescnt == cnt) {
                            hideLoading();

                            g_oTimeLapseImages.sort(function(a, b) {
                                return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
                            });

                            let markup = [
                                '<div class="imagearea"></div>',
                                '<div class="controlbar">',
                                '   <div class="hbar-wrapper"><div class="hbar"></div></div>',
                                '   <div class="infobox-wrapper"></div>',
                                '</div>'
                            ].join('');

                            $('body').bDialog({
                                boxID: id,
                                boxTitle: g_oLang.common.title.timelapse[g_sLangCode] + ' - ' + _pid,
                                boxWidth: '840px',
                                boxHeight: 'auto',
                                boxColor: '#2f3646',
                                boxTitleColor: '#2f3646',
                                boxTitleTextColor: '#fff',
                                boxBorder: '0',
                                boxCorner: 1,
                                useBoxModal: true,
                                useBoxShadow: false,
                                boxContents: markup,
                                boxOverContentShow: true,
                                boxClose: function() {
                                    g_oTimeLapseImages = [];
                                    clearTimeout(g_oTimeLapseInterval);
                                }
                            });

                            let o = $('#'+ id);

                            o.siblings('.ui-dialog-titlebar').css({
                                'text-align': 'initial',
                                'font-size': '18px',
                                'font-weight': 500,
                                'color': '#fff',
                                'padding': '16px 20px',
                                'border-bottom': '1px solid rgba(0, 0, 0, 0.14)'
                            });

                            for(let i = 0, l = g_oTimeLapseImages.length; i < l; i++) {
                                markup = '<div class="wrapper" data-fid="'+ g_oTimeLapseImages[i].fid +'" style="background-image: url('+ g_oTimeLapseImages[i].image.attr('src') +'); z-index: '+ (l - i) +';"></div>';
                                o.find('.imagearea').append(markup);

                                let left = (i / (l - 1)) * 100;
                                markup = [
                                    '<div class="infobox" data-fid="'+ g_oTimeLapseImages[i].fid +'" style="left: '+ left +'%;">',
                                    '   <div class="dot"></div>',
                                    '   <div class="date">'+ g_oTimeLapseImages[i].date +'</div>',
                                    '   <div class="infoarea">',
                                    '       <div class="thumbnail">LOADING ...</div>',
                                    '       <div class="info">',
                                    '           <div class="date">'+ g_oTimeLapseImages[i].date +'</div>',
                                    '           <div class="provider">' + _pid + '</div>',
                                    '           <div class="imagery"><span class="ee-icon ee-icon-satellite"></span> '+ _imgtypename +'</div>',
                                    '           <div class="subinfo">'+ g_oTimeLapseImages[i].type +'</div>',
                                    '       </div>',
                                    '   </div>',
                                    '</div>'
                                ].join('');
                                o.find('.controlbar .infobox-wrapper').append(markup);

                                $('<img />').attr({ src: g_oTimeLapseImages[i].url, fid: g_oTimeLapseImages[i].fid }).on('load', function() {
                                    let fid = $(this).attr('fid');
                                    o.find('.controlbar .infobox[data-fid='+ fid +'] .thumbnail')
                                        .css({ 'background-image': 'url('+ $(this).attr('src') +')' }).html('');
                                    $(this).remove();
                                });
                            }

                            o.find('.controlbar .infobox:first').addClass('on');
                            o.find('.controlbar .infobox').on('mouseenter', function() {
                                $(this).find('.infoarea').show();
                            }).on('mouseleave', function() {
                                $(this).find('.infoarea').animate({ opacity: 0 }, 200).hide();
                            });

                            timeLapseAnimation();
                        }
                    });
                });
            } else {
                $('body').bAlert({
                    message: g_oLang.common.message.request_failed[g_sLangCode] +'<div class="sub">'+ g_oLang.common.message.try_again[g_sLangCode] +'</div>'
                });
            }
        }
    });
}

function timeLapseAnimation() {
    let o = $('#timelapsebox');
    let bf = o.find('.controlbar .infobox.on:last');
    let af = bf.next();
    let fid = bf.attr('data-fid');

    if(!af.hasClass('infobox')) {
        o.find('.imagearea .wrapper').clearQueue()
            .animate({opacity: 1}, g_iTimeLapseIntervalTime, 'easeInQuart', function() {
                o.find('.controlbar .infobox').removeClass('on');
                o.find('.controlbar .hbar').clearQueue().css({ width: 0 });
                o.find('.controlbar .infobox:first').addClass('on');
            });
    } else {
        o.find('.controlbar .hbar').clearQueue()
            .animate({width: af.css('left')}, g_iTimeLapseIntervalTime, function () {
                af.addClass('on');
            });

        o.find('.imagearea .wrapper[data-fid=' + fid + ']').clearQueue()
            .animate({opacity: 0}, g_iTimeLapseIntervalTime, 'easeInQuart');
    }

    g_oTimeLapseInterval = setTimeout(timeLapseAnimation, g_iTimeLapseIntervalTime + 100);
}

function renderTimeLapse(_idx) {
    let a = $('#framebox .actionbar');
    let d = $('#framebox .detailbar');
    let m = $('#mapview');
    let markup = '';

    showLoading();

    $.ajax({
        type: 'get',
        url: '/eartheye/aoidetail/'+ _idx,
        success: function(res) {
            hideLoading();

            if(res != null && res.result) {
                let data = res.data[0];
                g_oSelectedAoiData = { data: data };

                var sw = data.sw_latlng.split(',');
                var ne = data.ne_latlng.split(',');
                var bbox = sw[1] +','+ sw[0] +','+ ne[1] +','+ ne[0];

                closeAoiBox(1);
                closeActionBar(2);
                if(!d.hasClass('open') && parseInt(d.css('left')) < 0) {
                    d.animate({ left: 0 }, 150, function() {
                        d.addClass('open');
                    });
                }
                m.dequeue().stop();

                setActionProgressMessage(g_oLang.common.message.requesting_provider[g_sLangCode]);
                showLoading();

                g_oTileProviders.forEach(function (item) {
                    let imgtype = (typeof item.IMAGERY_TYPE != 'undefined') ? item.IMAGERY_TYPE : 'SATELLITE';
                    let imgtypeName = imgtype.toLowerCase();
                    imgtypeName = imgtypeName.charAt(0).toUpperCase() + imgtypeName.slice(1);

                    if(!item.MULTIPLE_IMAGES) {
                        return true;
                    }

                    let myprovider = [];
                    switch(imgtype) {
                        case 'AERIAL':
                            myprovider = g_oMyInfo.set_imagery_provider.aerial;
                            break;

                        case 'DRONE':
                            myprovider = g_oMyInfo.set_imagery_provider.drone;
                            break;

                        default:
                            myprovider = g_oMyInfo.set_imagery_provider.satellite;
                            break;
                    }

                    if(g_oMyInfo.set_imagery_types.indexOf(imgtype) == -1) {
                        return true;
                    }

                    if(!myprovider.includes(item.PID)) {
                        return true;
                    }

                    if(!d.find('.listarea .folder[data-type='+ imgtype +']').length) {
                        d.find('.listarea')
                            .append('<div class="folder" data-type="' + imgtype + '">' + imgtypeName + '</div>')
                            .append('<div class="wrapper" data-type="' + imgtype + '"></div>');
                    }

                    markup = [
                        '<div class="modelbox T" data-pid="'+ item.PID +'" data-imgname="'+ imgtypeName +'">',
                        '   <input type="radio" name="pidcheck" id="pid_'+ item.PID +'" />',
                        '   <label for="pid_'+ item.PID +'">'+ item.NAME +'</label>',
                        '</div>'
                    ].join('');

                    d.find('.listarea .wrapper[data-type='+ imgtype +']').append(markup);
                });

                hideLoading();
                setActionProgressMessage(g_oLang.common.message.select_provider[g_sLangCode]);

                d.find('.listarea .modelbox').on('click', function () {
                    let me = $(this);
                    let pid = me.attr('data-pid');
                    let iname = me.attr('data-imgname');

                    d.find('.listarea .modelbox').removeClass('on');
                    me.addClass('on').find('input[type=radio]').prop('checked', true);

                    d.find('.btn_flexible').attr({'data-pid': pid, 'data-imgname': iname}).removeClass('off').prop('disabled', false);
                });

                d.find('.listarea .folder').on('click', function () {
                    let me = $(this);
                    let itype = me.attr('data-type');

                    me.addClass('on');
                    let t = d.find('.listarea .wrapper[data-type=' + itype + ']');
                    let sum = t.find('.modelbox:first-child').height() * t.find('.modelbox').length;
                    t.show().animate({height: sum + 'px'}, 200);

                    d.find('.listarea .folder').not(me).each(function () {
                        $(this).removeClass('on');
                        d.find('.listarea .wrapper[data-type=' + $(this).attr('data-type') + ']')
                            .animate({height: '0'}, 200, function () {
                                $(this).hide();
                            });
                    });
                });

                d.find('.listarea .folder:first-child').trigger('click');

                d.find('.btn_flexible').unbind('click').on('click', function() {
                    let pid = $(this).attr('data-pid');
                    let iname = $(this).attr('data-imgname');
                    openTimeLapse(pid, iname);
                });
            } else {
                $('body').bAlert({
                    message: g_oLang.common.message.request_failed[g_sLangCode] +'<div class="sub">'+ g_oLang.common.message.try_again[g_sLangCode] +'</div>'
                });
            }
        }
    });
}

function renderMapSliderUI() {
    let mw = $('#mapview-wrapper');
    let dw = $('#framebox .detailbar-wrapper');
    let id = 'mapslider';
    let offset = $('#mapview').offset();

    if($('#'+ id).length) {
        $('#'+ id).remove();
    }

    let markup = [
        '<div id="'+ id +'"></div>',
        '<div id="'+ id +'-handle"></div>'
    ].join('');

    mw.prepend(markup);

    let x = $('#'+ id +'-handle').offset().left - parseInt(dw.css('left')) - 8;
    $('.aoilist-previewbox:last').css({ left: x + 'px' });

    $('#'+ id +'-handle').draggable({
        containment: '#mapview-wrapper',
        scroll: false,
        start: function() {
            $('#'+ id).addClass('on');
        },
        drag: function(e, ui) {
            let newx = ui.offset.left - offset.left + ($('#'+ id +'-handle').width() / 2);
            let newx2 = ui.offset.left - parseInt(dw.css('left')) - 8;

            $('#'+ id).css({ left: newx + 'px' });
            $('#mapview-sub').css({ width: newx + 'px' });
            $('.aoilist-previewbox:last').css({ left: newx2 + 'px' });
        },
        stop: function() {
            $('#'+ id).removeClass('on');
        }
    });
}

function removeMapSliderUI() {
    let id = 'mapslider';
    $('#'+ id).remove();
    $('#'+ id +'-handle').remove();
    $('#mapview-sub').css({ width: '0%', opacity: 0 });
}

function checkSaveDetectionResult(_returnObj, _fn) {
    let d = $('#framebox .detailbar');

    if(d.find('.btn_flexible').attr('data-step') == '3') {
        if(typeof d.find('.btn_flexible').attr('data-save') == 'undefined') {
            $('body').bConfirm({
                title: 'EarthEye',
                message: g_oLang.common.message.want_save_result[g_sLangCode] + '<div class="sub">' + g_oLang.common.message.not_save_lost_result[g_sLangCode] + '</div>',
                buttons: {
                    'custom1': {
                        'class': 'btn_common_t2',
                        'buttonName': g_oLang.common.button.save[g_sLangCode],
                        'action': function () {
                            saveDetectionResult(false, function() {
                                hideCustomOpacityControl();
                                removeMapSliderUI();
                                _returnObj.trigger('click');
                            });
                        }
                    },
                    'custom2': {
                        'class': 'btn_common_t1',
                        'buttonName': g_oLang.common.button.dont_save[g_sLangCode],
                        'action': function () {
                            d.find('.btn_flexible').attr('data-step', '1');
                            hideCustomOpacityControl();
                            removeMapSliderUI();
                            resetResultObjects();
                            g_oSelectedAoiData = null;
                            _returnObj.trigger('click');
                        }
                    }
                }
            });
        } else {
            d.find('.btn_flexible').attr('data-step', '1');
            hideCustomOpacityControl();
            removeMapSliderUI();
            resetResultObjects();
            g_oSelectedAoiData = null;
            _returnObj.trigger('click');
        }
    } else {
        if(typeof _fn == 'function') {
            _fn.call();
        }
    }
}

function openDetectionResult(_idx, _id) {
    let a = $('#framebox .actionbar');
    let d = $('#framebox .detailbar');
    let f = $('#framebox .aoiformbox');
    let o = $('#framebox .aoibox');
    let m = $('#mapview');
    let left = parseInt(d.css('left'));

    showLoading();
    $.ajax({
        type: 'get',
        url: '/eartheye/history/detail/'+ _idx,
        success: function(res) {
            if(res != null && res.result) {
                g_oSelectedAoiData = res.data[0];
                let resultData = JSON.parse(g_oSelectedAoiData.result_data);
                g_oSelectedAoiData = $.extend(g_oSelectedAoiData, resultData);

                if(left < 0) {
                    f.animate({ left: '321px' }, 50, function() {
                        resetAoiForm(0);
                        resetAoiData();

                        drawFitBounds(g_oMap, g_oSelectedAoiData.data.coordinates, g_oSelectedAoiData.data.title);

                        a.find('.btn_actions').removeClass('on').attr('data-idx', g_oSelectedAoiData.data.idx);
                        g_bFastMode = true;
                        openActionBar();
                        a.find('.btn_actions[data-action='+ g_oSelectedAoiData.detection_type +']').trigger('click');
                    });
                }
                closebDialog(_id);

                setTimeout(function() {
                    renderDetectionResult(g_oSelectedAoiData.detection_type);
                }, (left < 0) ? 250 : 0);

                if(g_oSelectedAoiData.detection_type != 'C') {
                    let pid = g_oSelectedAoiData.pid,
                        fid = g_oSelectedAoiData.fid;

                    g_oTileLayer = new google.maps.ImageMapType({
                        name: g_sTileLayerID,
                        getTileUrl: function (coord, zoom) {
                            var url = g_sTileServer + g_sBaseTileUrl
                                .replace('{pid}', pid + (fid ? '/' : ''))
                                .replace('{fid}', fid)
                                .replace('{x}', coord.x)
                                .replace('{y}', coord.y)
                                .replace('{z}', zoom);
                            return url;
                        },
                        tileSize: new google.maps.Size(256, 256),
                        minZoom: g_iMinZoom,
                        maxZoom: g_iMaxZoom
                    });

                    g_oMap.mapTypes.set(g_sTileLayerID, g_oTileLayer);
                    g_oMap.setMapTypeId(g_sTileLayerID);
                    renderResultObject(g_oSelectedAoiData.features, g_oSelectedAoiData.detection_type, g_oSelectedAoiData.models);

                    google.maps.event.addListenerOnce(g_oMap, 'tilesloaded', function () {
                        hideLoading();

                        d.find('.titlebar .btn').show();
                        d.find('.stepbar')
                            .append('<div class="complete ' + g_oSelectedAoiData.detection_type + '">' + g_oLang.common.message.process_completed[g_sLangCode] + '</div>');
                        d.find('.completearea').animate({
                            left: '0'
                        }, 150);
                        d.find('.btn_flexible').removeClass('off next').prop('disabled', false)
                            .attr({'data-step': 3, 'data-save': 1})
                            .html(g_oLang.common.button.close[g_sLangCode]);

                        setActionProgressMessage(g_oLang.common.message.processing_result[g_sLangCode]);

                        g_bFastMode = false;
                    });
                } else {
                    let sm = $('#mapview-sub');
                    sm.html('').css({ width: '100%', opacity: 0 });

                    g_oMapSub = new google.maps.Map(document.getElementById('mapview-sub'), {
                        minZoom: g_iMinZoom,
                        maxZoom: g_iMaxZoom,
                        zoom: g_oMap.getZoom(),
                        center: g_oMap.getCenter(),
                        mapTypeId: 'satellite', // hybrid (label + satellite)
                        disableDefaultUI: true,
                        backgroundColor: 'transparent',
                        restriction: {
                            latLngBounds: { north: 85, south: -85, west: -180, east: 180 }
                        }
                    });

                    let defpid = g_oSelectedAoiData.pid,
                        deffid = g_oSelectedAoiData.fid,
                        tileid = g_oSelectedAoiData.tileid2;

                    g_oTileLayerSub = new google.maps.ImageMapType({
                        name: g_sTileLayerIDSub,
                        getTileUrl: function (coord, zoom) {
                            let url = g_sTileServer + g_sBaseTileUrl
                                .replace('{pid}', defpid + (deffid ? '/' : ''))
                                .replace('{fid}', deffid)
                                .replace('{x}', coord.x)
                                .replace('{y}', coord.y)
                                .replace('{z}', zoom);
                            return url;
                        },
                        tileSize: new google.maps.Size(256, 256),
                        minZoom: g_iMinZoom,
                        maxZoom: g_iMaxZoom
                    });

                    g_oTileLayer = new google.maps.ImageMapType({
                        name: g_sTileLayerID,
                        getTileUrl: function (coord, zoom) {
                            let url = g_sTileServer + g_sBaseTileUrl
                                .replace('{pid}', defpid + (tileid ? '/' : ''))
                                .replace('{fid}', tileid)
                                .replace('{x}', coord.x)
                                .replace('{y}', coord.y)
                                .replace('{z}', zoom);
                            return url;
                        },
                        tileSize: new google.maps.Size(256, 256),
                        minZoom: g_iMinZoom,
                        maxZoom: g_iMaxZoom
                    });

                    g_oMap.mapTypes.set(g_sTileLayerID, g_oTileLayer);
                    g_oMap.setMapTypeId(g_sTileLayerID);
                    g_oMapSub.mapTypes.set(g_sTileLayerIDSub, g_oTileLayerSub);
                    g_oMapSub.setMapTypeId(g_sTileLayerIDSub);

                    drawFitBounds(g_oMapSub, g_oSelectedAoiData.data.coordinates, g_oSelectedAoiData.data.title, 1);
                    renderMapInfoBar(g_oMapSub);
                    renderResultObject(g_oSelectedAoiData.features, g_oSelectedAoiData.detection_type, g_oSelectedAoiData.models);
                    renderCustomZoomControl(g_oMapSub);

                    google.maps.event.addListenerOnce(g_oMapSub, 'tilesloaded', function () {
                        hideLoading();

                        setTimeout(function() {
                            makeScale(g_oMapSub);
                            $('.opacitycontrolbar').show();
                            $('.zoomcontrolbar').css({
                                bottom: '138px'
                            });
                            m.find('.aoi-title-marker').hide();
                        }, 500);

                        d.find('.titlebar .btn').show();
                        d.find('.stepbar')
                            .append('<div class="complete ' + g_oSelectedAoiData.detection_type + '">' + g_oLang.common.message.process_completed[g_sLangCode] + '</div>');
                        d.find('.completearea').animate({
                            left: '0'
                        }, 150);
                        d.find('.btn_flexible').removeClass('off next').prop('disabled', false)
                            .attr({'data-step': 3, 'data-save': 1})
                            .html(g_oLang.common.button.close[g_sLangCode]);

                        let bounds = (g_oSelectedAoiData.data.draw_type == 'P') ? getPolygonBounds(g_oPreviewObject) : g_oPreviewObject.getBounds();
                        let sw = bounds.getSouthWest();
                        let ne = bounds.getNorthEast();
                        let bbox = sw.lng() +','+ sw.lat() +','+ ne.lng() +','+ ne.lat();

                        let thumbUrl = g_sTileServer + '/screenshot?PID=' + defpid + '&FID=' + deffid + '&THUM=true&BBOX=' + bbox;
                        let preview = [
                            '           <div class="thumbnail cnt_1" style="background-image: url('+ thumbUrl +')"></div>',
                            '           <div class="info">',
                            '               <div class="date">' + g_oSelectedAoiData.date + '</div>',
                            '               <div class="provider">' + g_oSelectedAoiData.pid + '</div>',
                            '               <div class="imagery"><span class="ee-icon ee-icon-satellite"></span> Satellite</div>',
                            '               <div class="subinfo">PLEIADES</div>',
                            '           </div>'
                        ].join('');

                        let previewBox = $('<div />')
                            .addClass('aoilist-previewbox ' + g_oSelectedAoiData.detection_type);
                        previewBox.append(preview);
                        d.closest('.detailbar-wrapper').append(previewBox);
                        previewBox.css({
                            opacity: 1,
                            left: '330px'
                        });

                        thumbUrl = g_sTileServer + '/screenshot?PID=' + defpid + '&FID=' + tileid + '&THUM=true&BBOX=' + bbox;
                        let preview2 = [
                            '           <div class="thumbnail cnt_2" style="background-image: url('+ thumbUrl +')"></div>',
                            '           <div class="info">',
                            '               <div class="date">' + g_oSelectedAoiData.date2 + '</div>',
                            '               <div class="provider">' + g_oSelectedAoiData.pid + '</div>',
                            '               <div class="imagery"><span class="ee-icon ee-icon-satellite"></span> Satellite</div>',
                            '               <div class="subinfo">PLEIADES</div>',
                            '           </div>'
                        ].join('');
                        let previewBox2 = $('<div />')
                            .addClass('aoilist-previewbox ' + g_oSelectedAoiData.detection_type);
                        previewBox2.append(preview2);
                        d.closest('.detailbar-wrapper').append(previewBox2);
                        previewBox2.css({
                            opacity: 1,
                            left: '620px'
                        });

                        setActionProgressMessage(g_oLang.common.message.processing_result[g_sLangCode]);

                        sm.find('div:first').css({ width: m.width() + 'px' });
                        sm.css({ width: '50%', opacity: 1 });

                        $($('#sizeframe')[0].contentWindow).unbind('resize').on('resize', function() {
                            sm.find('div:first').css({ width: m.width() +'px' });
                        });

                        renderMapSliderUI();

                        g_bFastMode = false;
                    });

                    g_oMap.bindTo('center', g_oMapSub, 'center');
                    g_oMap.bindTo('zoom', g_oMapSub, 'zoom');
                }
            }
        },
        error: function (req, status, err) {
            hideLoading();
            $('body').bAlert({
                message: g_oLang.common.message.request_failed[g_sLangCode] + '<div class="sub">' + g_oLang.common.message.check_apiserver[g_sLangCode] + '</div>'
            });
        }
    });
}

function renderResultObject(_features, _type, _models) {
    let m = $('#mapview');
    let len = 0, coordlen = 0, multilen = 0;
    let models = _models.split(',');

    resetResultObjects();
    if(g_oPreviewMarker != null) {
        setTimeout(function() {
            m.find('.aoi-title-marker').hide();
        }, 200);
    }

    let options = {
        fillColor: g_oTypeColors[_type],
        fillOpacity: 0.1,
        strokeWeight: 1,
        strokeColor: g_oTypeColors[_type],
        clickable: true,   // true for mouse event
        editable: false
    };

    switch(_type) {
        case 'C':
        case 'O':
            options.fillOpacity = 0;
            options.strokeWeight = 2;
            break;

        case 'B':
            options.fillOpacity = 0.3;
            options.strokeColor = '#2a343e';
            break;
    }

    len = _features.length;
    for (let i = 0; i < len; i++) {
        if (_features[i].properties.class_label == 'ROAD') {
            continue;
        }

        let bounds = new google.maps.LatLngBounds();
        let paths = [];
        let object = null, object2 = null;
        let chk = 0;

        if(_features[i].geometry.type == 'Polygon') {
            chk = _features[i].geometry.coordinates.length;

            if(chk > 1) {
                for (let j = 0; j < chk; j++) {
                    let path = [];
                    multilen = _features[i].geometry.coordinates[j].length;

                    for (let z = 0; z < multilen; z++) {
                        let point = new google.maps.LatLng(parseFloat(_features[i].geometry.coordinates[j][z][1]), parseFloat(_features[i].geometry.coordinates[j][z][0]));
                        bounds.extend(point);
                        path.push(point);
                    }

                    paths.push(path);
                }
            } else {
                coordlen = _features[i].geometry.coordinates[0].length;

                for (let j = 0; j < coordlen; j++) {
                    let point = new google.maps.LatLng(parseFloat(_features[i].geometry.coordinates[0][j][1]), parseFloat(_features[i].geometry.coordinates[0][j][0]));
                    bounds.extend(point);
                    paths.push(point);
                }
            }

        } else if(_features[i].geometry.type == 'MultiPolygon') {
            coordlen = _features[i].geometry.coordinates[0].length;

            for(let j = 0; j < coordlen; j++) {
                bounds = new google.maps.LatLngBounds();
                let path = [];

                multilen = _features[i].geometry.coordinates[0][j].length;
                for(let z = 0; z < multilen; z++) {
                    let point = new google.maps.LatLng(parseFloat(_features[i].geometry.coordinates[0][j][z][1]), parseFloat(_features[i].geometry.coordinates[0][j][z][0]));
                    bounds.extend(point);
                    path.push(point);
                }

                paths.push(path);
            }
        }

        let tmpData = (_type == 'B') ? (paths.length == 1 ? paths[0] : bounds) : bounds;
        options.indexId = i;
        options.bounds = bounds;
        options.extArea = (_type == 'B') ? (_features[i].properties.class_label == 'ROAD' ? '' : google.maps.geometry.spherical.computeArea(tmpData) / (1000000)) : computeRectangleArea(tmpData);
        options.map = g_oMap;

        try {
            if (_type == 'B') {
                options.paths = paths;
                object = new google.maps.Polygon(options);
            } else {
                object = new google.maps.Rectangle(options);
                if(_type == 'C') {
                    options.map = g_oMapSub;
                    object2 = new google.maps.Rectangle(options);
                }
            }
        } catch(e) {
            console.log(e);
        }

        object.model = _features[i].properties.class_label;

        if(object.model != 'ROAD') {
            google.maps.event.addListener(object, 'mouseover', function (e) {
                openResultObjectTooltip(e, object.extArea);
            });

            google.maps.event.addListener(object, 'mousemove', function (e) {
                moveResultObjectTooltip(e);
            });

            google.maps.event.addListener(object, 'mouseout', function (e) {
                closeResultObjectTooltip(e);
            });
        }

        g_oResultObjects.push(object);
        g_oSelectedAoiData.model[object.model] = (typeof g_oSelectedAoiData.model[object.model] != 'undefined') ? g_oSelectedAoiData.model[object.model] + 1 : 1;

        if(_type == 'C') {
            object2.model = _features[i].properties.class_label;

            if(object2.model != 'ROAD') {
                google.maps.event.addListener(object2, 'mouseover', function (e) {
                    openResultObjectTooltip(e, object2.extArea);
                });

                google.maps.event.addListener(object2, 'mousemove', function (e) {
                    moveResultObjectTooltip(e);
                });

                google.maps.event.addListener(object2, 'mouseout', function (e) {
                    closeResultObjectTooltip(e);
                });
            }

            g_oResultObjectsSub.push(object2);
        }

        models.remove(object.model);

    }

    if(models.length) {
        models.forEach(function(item) {
            g_oSelectedAoiData.model[item] = 0;
        });
    }

    renderCustomOpacityControl(g_oMap, _type, _models);
    g_oPreviewObject.set('fillOpacity', 0);

    if(_type == 'C') {
        renderCustomOpacityControl(g_oMapSub, _type);
        g_oPreviewObjectSub.set('fillOpacity', 0);
    }

    if (_type == 'B' && _models.indexOf('ROAD') != -1) {
        const roadFeatures = _features.filter(f => f.properties.class_label == 'ROAD');
        const fc = {
            type: 'FeatureCollection',
            features: roadFeatures
        };

        //resetResultObjects();
        g_oMap.data.addGeoJson(fc);
        g_oMap.data.setStyle({
            fillColor: _models.indexOf('BUILDING') != -1 ? '#00ff00' : options.fillColor,
            fillOpacity: options.fillOpacity,
            strokeWeight: options.strokeWeight,
            strokeColor: options.strokeColor
        });

        setTimeout(() => {
            $('.modelbox.B[data-model=ROAD] .count').html(roadFeatures.length);
        }, 300);
    }
}

function openResultObjectTooltip(_e, _data) {
    if(!g_oResultObjectTooltip && _e) {
        let keys = Object.keys(_e);
        let x, y;

        for(let i in keys) {
            let name = keys[i];
            if(_e[name] instanceof MouseEvent) {
                x = _e[name].clientX;
                y = _e[name].clientY;
            }
        }

        x += window.scrollX + 15,
        y += window.scrollY + 15;

        g_oResultObjectTooltip = $('<div />')
            .attr('id', 'object-result-infobox')
            .css({
                top: y +'px',
                left: x +'px'
            })
            //.html(_data + '㎢');
            .html((_data * 1000000).toFixed(2) + '㎡');

        $('body').append(g_oResultObjectTooltip);
    }
}

function moveResultObjectTooltip(_e) {
    if(g_oResultObjectTooltip && _e) {
        let keys = Object.keys(_e);
        let x, y;

        for(let i in keys) {
            let name = keys[i];
            if(_e[name] instanceof MouseEvent) {
                x = _e[name].clientX;
                y = _e[name].clientY;
            }
        }

        x += window.scrollX + 15,
        y += window.scrollY + 15;

        g_oResultObjectTooltip
            .css({
                top: y +'px',
                left: x +'px'
            });
    }
}

function closeResultObjectTooltip(_e) {
    if(g_oResultObjectTooltip) {
        g_oResultObjectTooltip.remove();
        g_oResultObjectTooltip = null;
    }
}

function renderDetectionResult(_type) {
    let c = $('#framebox .completearea');
    let markup = [
        '<div class="namebar '+ _type +'">',
        '   <input type="radio" id="complete_name" checked />',
        '   <label for="complete_name">'+ g_oSelectedAoiData.data.title +'</label>',
        '</div>',
        '<div class="formbox">',
        '   <div class="subtitle">'+ g_oLang.aoi.title.description[g_sLangCode] +'</div>',
        '   <div class="content desc">'+ nl2br(g_oSelectedAoiData.data.description) +'</div>',
        '</div>',
        '<div class="formbox">',
        '   <div class="half">',
        '       <div class="subtitle">' + g_oLang.aoi.title.latitude[g_sLangCode] + '</div>',
        '       <div class="content">'+ g_oSelectedAoiData.data.lat +'</div>',
        '   </div>',
        '   <div class="half">',
        '       <div class="subtitle">' + g_oLang.aoi.title.longitude[g_sLangCode] + '</div>',
        '       <div class="content">'+ g_oSelectedAoiData.data.lng +'</div>',
        '   </div>',
        '</div>'
    ].join('');

    if(_type != 'C') {
        markup += [
            '<div class="formbox">',
            '   <div class="subtitle">' + g_oLang.aoi.title.imagery_date[g_sLangCode] + '</div>',
            '   <div class="content">'+ g_oSelectedAoiData.date +'</div>',
            '</div>'
        ].join('');
    } else {
        markup += [
            '<div class="formbox">',
            '   <div class="half">',
            '       <div class="subtitle">As-is ' + g_oLang.aoi.title.imagery_date[g_sLangCode] + '</div>',
            '       <div class="content">'+ g_oSelectedAoiData.date +'</div>',
            '   </div>',
            '   <div class="half">',
            '       <div class="subtitle">To-be ' + g_oLang.aoi.title.imagery_date[g_sLangCode] + '</div>',
            '       <div class="content">'+ g_oSelectedAoiData.date2 +'</div>',
            '   </div>',
            '</div>'
        ].join('');
    }

    markup += [
        '<div class="model-titlebar">'+ g_oLang.aoi.title.detection_model[g_sLangCode] +'</div>',
        '<div class="result-model-list"></div>',
        '<div class="model-btn">',
        '   <button class="btn_download btn_kml">KML</button>',
        '   <button class="btn_download btn_json">GeoJSON</button>',
        '</div>'
    ].join('');

    c.html(markup);

    for(var key in g_oSelectedAoiData.model) {
        if(key == 'remove') {
            continue;
        }

        markup = [
            '   <div class="modelbox on '+ _type +'" data-model="'+ key +'">',
            '       <input type="checkbox" name="model_'+ key +'" id="model_'+ key +'" checked />',
            '       <label for="model_'+ key +'">'+ key +'</label>',
            '       <div class="count">'+ g_oSelectedAoiData.model[key] +'</div>',
            '   </div>'
        ].join('');

        c.find('.result-model-list').append(markup);
    }

    c.find('.modelbox').on('click', function() {
        var me = $(this);
        var mo = me.attr('data-model');

        if(me.find('input').prop('checked')) {
            me.removeClass('on');
            me.find('input').prop('checked', false);
            toggleResultObject(mo, false);
        } else {
            me.addClass('on');
            me.find('input').prop('checked', true);
            toggleResultObject(mo, true);
        }
    });

    c.find('.btn_kml, .btn_json').on('click', function() {
        var chk = c.find('.modelbox.on').length;

        if(!chk) {
            $('body').bAlert({
                message: g_oLang.aoi.message.choose_model[g_sLangCode]
            });
        } else {
            let nowdate = new Date();
            let output = {
                type: 'FeatureCollection',
                features: [],
                date: nowdate.format('yyyy-MM-dd_HH:mm')
            };

            c.find('.modelbox.on').each(function() {
                var mo = $(this).attr('data-model');

                g_oSelectedAoiData.features.forEach(function(item) {
                    if(item.properties.class_label == mo) {
                        output.features.push(item);
                    }
                });
            });

            let fileExt = 'json';

            if($(this).hasClass('btn_kml')) {
                output = tokml(output);
                fileExt = 'kml'
            } else {
                output = JSON.stringify(output);
            }

            saveText(
                output,
                g_oLang.aoi['action_'+ _type].filename[g_sLangCode] + '_' + nowdate.format('yyyyMMdd_HHmm') + '.' + fileExt
            );
        }
    });
}

function toggleResultObject(_m, _v) {
    for(var i in g_oResultObjects) {
        if(g_oResultObjects[i].model == _m) {
            g_oResultObjects[i].setVisible(_v);
        }
    }

    if(g_oResultObjectsSub != null) {
        for(var i in g_oResultObjectsSub) {
            if(g_oResultObjectsSub[i].model == _m) {
                g_oResultObjectsSub[i].setVisible(_v);
            }
        }
    }

    if (_m == 'ROAD') {
        let lastStyle = g_oMap.data.getStyle();
        lastStyle.visible = _v;
        g_oMap.data.setStyle(lastStyle);
    }
}

function saveDetectionResult(_isbtn, _fn) {
    let d = $('#framebox .detailbar');

    if(typeof _isbtn != 'undefined' && typeof d.find('.btn_flexible').attr('data-save') != 'undefined' && d.find('.btn_flexible').attr('data-save') == '1') {
        d.find('.btn_back').trigger('click');
        return;
    }

    showLoading();
    $.ajax({
        type: 'post',
        url: '/eartheye/saveresult',
        data: {
            idx: g_oSelectedAoiData.data.idx,
            type: g_oSelectedAoiData.type,
            pid: g_oSelectedAoiData.pid,
            pid_name: g_oSelectedAoiData.pid,
            fid: g_oSelectedAoiData.tileid,
            dates: (g_oSelectedAoiData.type == 'C') ? g_oSelectedAoiData.date +','+ g_oSelectedAoiData.date2 : g_oSelectedAoiData.date,
            models: g_oSelectedAoiData.models,
            result: JSON.stringify(g_oSelectedAoiData)
        },
        //async: false,
        success: function(res) {
            hideLoading();

            if(res != null && res.result) {
                $('body').bToast({message: 'Saved'});

                if (typeof _isbtn == 'undefined') {
                    d.find('.btn_flexible').attr({'data-step': '1', 'data-save': '1'});
                    resetResultObjects();
                    g_oSelectedAoiData = null;
                } else {
                    d.find('.btn_flexible').attr('data-save', '1').html(g_oLang.common.button.close[g_sLangCode]);
                }
            }

            if(typeof _fn == 'function') {
                _fn.call();
            }
        }
    });
}

function resetResultObjects() {
    let len = g_oResultObjects.length;

    for(var i = 0; i < len; i++) {
        g_oResultObjects[i].setMap(null);
    }
    g_oResultObjects = [];

    len = g_oResultObjectsSub.length;
    if(len) {
        for(i = 0; i < len; i++) {
            g_oResultObjectsSub[i].setMap(null);
        }
        g_oResultObjectsSub = [];
    }

    g_oMap.data.forEach((feature) => {
        if (feature.getProperty('class_label') == 'ROAD') {
            g_oMap.data.remove(feature);
        }
    });
}

function closeActionDetail() {
    let d = $('#framebox .detailbar');
    let m = $('#mapview');

    if(d.hasClass('open') && !parseInt(d.css('left'))) {
        d.animate({ left: '-'+ d.width() + 'px' }, 150, function() {
            d.removeClass('open');
        });

        m.dequeue().stop();
    }
}

function setActionProgressMessage(_msg) {
    let d = $('#framebox .detailbar .progressbar');
    if(typeof _msg != 'undefined' && _msg.length > 0) {
        d.html(_msg);
    }
}

function openAoiBox() {
    let w = $('#framebox .aoiwrapper');
    let o = $('#framebox .aoibox');
    let a = $('#framebox .actionbar');
    let f = $('#framebox .aoiformbox');
    let m = $('#mapview');

    o.find('.listbox .msg').html(g_oLang.aoi.list.title[g_sLangCode]);
    loadAoiList();

    var s = parseInt(m.css('left')) + o.width() - parseInt(a.width());

    w.animate({ left: 0 }, 200);

    if(a.hasClass('open') && !parseInt(a.css('left'))) {
        a.animate({ left: o.width() + 'px' }, 150);
        var idx = a.find('.btn_actions.on').attr('data-idx');
        o.find('.aoilistbox[data-idx='+ idx +'] .aoiname').trigger('click');
        m.animate({ left: (s + a.width()) + 'px' }, 150);
    } else {
        m.animate({ left: s + 'px' }, 200);
    }

    o.find('.btn_close').unbind('click').on('click', function() {
        resetAoiForm(0);
        closeAoiBox();
        closeActionBar();
        refreshAoiDataOnMap();
        return false;
    });

    o.find('.btn_addarea')
        .html(g_oLang.aoi.button.addarea[g_sLangCode])
        .unbind('click').on('click', function() {
            let aoicnt = parseInt(o.find('.infobar .item-count').text());
            if(g_oMyInfo.limit_aoi > 0 && aoicnt >= g_oMyInfo.limit_aoi) {
                $('body').bAlert({
                    message: g_oLang.common.message.aoi_cannot_added[g_sLangCode] + '<div class="sub">'+ g_oLang.common.message.contact_admin[g_sLangCode] +'</div>'
                });

                return false;
            }

            resetAoiForm(0);
            removeAoiDataOnMap();
            g_oMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);

            f.animate({ left: 0 }, 200, function() {
                $('.maptypebar').show();
            });
            closeActionBar(1);
            return false;
        });

    let search = o.find('input[name=keyword]');

    o.find('.btn_cancelinput').unbind('click').on('click', function() {
        search.val('').blur();
        $(this).hide();
    });

    o.find('.btn_search').unbind('click').on('click', function() {
        search.focus();
    });

    search.unbind('focus blur keyup keydown keypress').on('focus blur keyup keydown keypress', function(e) {
        var word = $(this).val();
        var cnt = 0;

        if(word.length > 0) {
            o.find('.btn_cancelinput').show();
        } else {
            o.find('.btn_cancelinput').hide();
        }

        o.find('.aoilistbox label').each(function () {
            var text = $(this).text();
            if (text.indexOf(word) == -1) {
                $(this).closest('.aoilistbox').hide();
            } else {
                $(this).closest('.aoilistbox').show();
                cnt++;
            }
        });

        o.find('.infobar .item-count').html(cnt);
    });
}

function resetAoiForm(_idx) {
    let f = $('#framebox .aoiformbox');

    if(g_oPreviewObject != null) {
        g_oPreviewObject.setMap(null);
        g_oPreviewObject = null;

        g_oPreviewMarker.setMap(null);
        g_oPreviewMarker = null;
    }

    f.find('.title').each(function() {
        var me = $(this);
        var text = me.text();

        switch(text) {
            case 'Draw type':
                me.text(g_oLang.aoi.title.draw_type[g_sLangCode]);
                break;

            case 'Name':
                me.text(g_oLang.aoi.title.name[g_sLangCode]);
                break;

            case 'Description':
                me.text(g_oLang.aoi.title.description[g_sLangCode]);
                break;

            case 'Latitude':
                me.text(g_oLang.aoi.title.latitude[g_sLangCode]);
                break;

            case 'Longitude':
                me.text(g_oLang.aoi.title.longitude[g_sLangCode]);
                break;

            case 'Area':
                me.text(g_oLang.aoi.title.area[g_sLangCode]);
                break;
        }
    });

    f.find('.formrow.limit-arealist').remove();

    if(typeof _idx == 'undefined' || !_idx) {
        if(g_oMyInfo.use_unlimit_area == '0') {
            let areas = g_oMyInfo.areas;
            let arealen = areas.length;

            if(arealen == 1) {
                let bounds = JSON.parse(areas[0].coords);

                g_oMap.setRestriction({
                    latLngBounds: bounds
                });
                g_oMap.fitBounds(bounds);
                g_oMap.setZoom(14);
            } else if(arealen > 1) {
                let markup = [
                    '<div class="formrow limit-arealist">',
                    '   <div class="title">' + g_oLang.common.title.select_available_area[g_sLangCode] + '</div>',
                    '   <div class="content">',
                    '       <select name="limit-arealist" class="select-limit-arealist">'
                ].join('');

                areas.forEach(function (area) {
                    markup += '<option value=\'' + area.coords + '\'>' + area.country + ' ' + area.city + '</option>';
                });

                markup += [
                    '       </select>',
                    '   </div>',
                    '</div>'
                ].join('');

                f.find('.formbar').prepend(markup);
                f.find('.select-limit-arealist').selectric({
                    onChange: function () {
                        let bounds = JSON.parse($(this).val());

                        g_oMap.setRestriction({
                            latLngBounds: bounds
                        });

                        g_oMap.fitBounds(bounds);
                        g_oMap.setZoom(14);
                    }
                });

                setTimeout(function() {
                    if (!parseInt(f.css('left'))) {
                        let bounds = JSON.parse(areas[0].coords);

                        g_oMap.setRestriction({
                            latLngBounds: bounds
                        });
                        g_oMap.fitBounds(bounds);
                        g_oMap.setZoom(14);
                    }
                }, 250);
            }
        }

        f.find('.titlebar .title').html(g_oLang.aoi.titlebar.add[g_sLangCode]);
        f.find('.btn_draw').not('.btn_draw_j, .btn_draw_x').removeClass('on off');
        f.find('.btn_draw').prop('disabled', false);
        f.find('input[name=aoi_title]').val('').prop('readonly', false);
        f.find('textarea[name=aoi_desc]').val('').prop('readonly', false);
        f.find('.btn_draw, input[name=aoi_title], textarea[name=aoi_desc]').closest('.formrow2').removeClass('formrow2').addClass('formrow');
        f.find('.aoi_lat').html('0');
        f.find('.aoi_lng').html('0');
        f.find('.aoi_area').html('0');
        f.find('input[name=aoi_idx]').val('0');
        f.find('input[name=aoi_coord]').val('');
        f.find('input[name=aoi_sw_latlng]').val('');
        f.find('input[name=aoi_ne_latlng]').val('');
        f.find('.formbar .btn').hide();
        f.find('.formbar').css({ bottom: '52px' });
        f.find('.btmbox').css({ height: '52px' });
        f.find('.btmbox .btn_delete').hide();
        f.find('.btmbox .btn_save').removeClass('btn_common_r3').addClass('btn_common_r1').html(g_oLang.common.button.save[g_sLangCode]);
        g_sAoiMode = 'SAVE';
    } else {
        $.ajax({
            type: 'get',
            url: '/eartheye/aoidetail/'+ _idx,
            async: false,
            success: function(res) {
                if(res != null && res.result) {
                    var data = res.data[0];

                    f.find('.formrow').removeClass('formrow').addClass('formrow2');
                    f.find('.titlebar .title').html(g_oLang.aoi.titlebar.mod[g_sLangCode]);
                    f.find('.btn_draw').addClass('off');
                    f.find('.btn_draw[data-type='+ data.draw_type +']').removeClass('off').addClass('on');
                    f.find('.btn_draw').prop('disabled', true);
                    f.find('input[name=aoi_title]').val(data.title).prop('readonly', true);
                    f.find('textarea[name=aoi_desc]').val(data.description).prop('readonly', true);
                    f.find('.aoi_lat').html(data.lat);
                    f.find('.aoi_lng').html(data.lng);
                    f.find('.aoi_area').html(data.area);
                    f.find('input[name=aoi_idx]').val(data.idx);
                    f.find('input[name=aoi_coord]').val(data.coordinates);
                    f.find('input[name=aoi_sw_latlng]').val(data.sw_latlng);
                    f.find('input[name=aoi_ne_latlng]').val(data.ne_latlng);
                    f.find('.btn_aoihistory').removeClass('off').prop('disabled', false);
                    f.find('.formbar .btn button').html(g_oLang.aoi.button.history[g_sLangCode]);
                    f.find('.formbar .btn').show();
                    f.find('.formbar').css({ bottom: '104px' });
                    f.find('.btmbox').css({ height: '104px' });
                    f.find('.btmbox .btn_delete').html(g_oLang.common.button.delete[g_sLangCode]).show();
                    f.find('.btmbox .btn_save').removeClass('btn_common_r1').addClass('btn_common_r3').html(g_oLang.common.button.modify[g_sLangCode]);
                    drawFitBounds(g_oMap, data.coordinates, data.title);
                }
            }
        });
    }
}

function closeAoiBox(_status) {
    let w = $('#framebox .aoiwrapper');
    let o = $('#framebox .aoibox');
    let a = $('#framebox .actionbar');
    let m = $('#mapview');

    var s = parseInt(m.css('left')) + parseInt(a.width()) - o.width();

    w.animate({ left: '-'+ o.width() +'px' }, (g_bFastMode ? 10 : 200));
    m.animate({ left: s +'px' }, (g_bFastMode ? 10 : 200));

    if(typeof _status == 'undefined') {
        initAoiNotice();
        $('#framebox .slide-overlay').fadeIn(250).show();
    }

    $('#framebox .btn_aoi').removeClass('on');
}

function noticeAnimate() {
    $('#framebox .aoi-notice .hand').animate({ left: '-10px' }, 300)
        .animate({ left: '10px' }, 1)
        .animate({ left: '-10px' }, 300)
        .delay(1000)
        .fadeOut(500)
        .animate({ left: '20px' }, 1)
        .fadeIn(1, function() {
            noticeAnimate();
        });
}

function makeScale(_map) {
    let zoom = _map.getZoom();
    let scale = 156543.03392 * Math.cos(_map.getCenter().lat() * Math.PI / 180) / Math.pow(2, zoom);

    let minScale = Math.floor(scale * g_iMinScaleWidth);
    let maxScale = Math.ceil(scale * g_iMaxScaleWidth);

    let ratio = Math.round(591657550.500000 / Math.pow( 2, zoom - 1));

    for(var i = 0; i < g_oScaleValues.length; i++) {

        if(i !== g_oScaleValues.length - 1) {
            if(((minScale <= g_oScaleValues[i].val) && (g_oScaleValues[i].val <= maxScale)) || ((minScale > g_oScaleValues[i].val) && (maxScale) < g_oScaleValues[i + 1].val)) {
                setScaleValues(scale, g_oScaleValues[i], ratio);
                break;
            }
        } else {
            setScaleValues(scale, g_oScaleValues[i], ratio);
        }
    }
}

function setScaleValues(scale, values, ratio) {
    let scaleWidth = values.val / scale;
    let feet = Math.round(values.val * 3.28084);

    $('#mapview .mapinfobar .meter').html(values.dspVal);
    $('#mapview .mapinfobar .info-1, #mapview .mapinfobar .info-2').css({ width: scaleWidth +'px' });
    $('#mapview .mapinfobar .feet').html(feet +' ft');
    $('#mapview .mapinfobar .scale').html('1:'+ ratio);
}

function renderMapTypeBar(_map) {
    let container = $('<div />').addClass('maptypebar');
    let markup = [
        '<button class="btn_maptype" data-type="S">'+ g_oLang.common.title.roadmap[g_sLangCode] +'</button>'
    ].join('');

    container.html(markup);
    container.index = 1;

    container.find('.btn_maptype').on('click', function() {
        let me = $(this);
        let type = me.attr('data-type');

        if(type == 'S') {
            me.attr('data-type', 'R').html(g_oLang.common.title.satellite[g_sLangCode]);
            _map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        } else {
            me.attr('data-type', 'S').html(g_oLang.common.title.roadmap[g_sLangCode]);
            _map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
        }
    });

    _map.controls[google.maps.ControlPosition.TOP_RIGHT].push(container[0]);
}

function renderMapInfoBar(_map) {
    let container = $('<div />').addClass('mapinfobar');
    let markup = [
        '<ul>',
        '   <li class="info-1">',
        '       <span class="meter">0 m</span>',
        '       <div class="u-line"></div>',
        '   </li>',
        '   <li class="info-cap"></li>',
        '   <li class="info-2">',
        '       <span class="feet">0 ft</span>',
        '       <div class="u-line"></div>',
        '   </li>',
        '   <li class="info-cap2"></li>',
        '   <li class="info-3">',
        '       <span class="ee-icon ee-icon-location"></span>',
        '       <span class="latlng">0, 0</span>',
        '   </li>',
        '   <li class="info-cap2"></li>',
        '   <li class="info-4">',
        '       <span class="scale">1:0</span>',
        '   </li>',
        '</ul>'
    ].join('');

    container.html(markup);
    container.index = 1;

    _map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(container[0]);
}

function hideCustomOpacityControl() {
    $('.opacitycontrolbar').hide();
    $('.zoomcontrolbar').css({
        bottom: '30px'
    });

    g_oTileLayer.set('opacity', 1);
    if(g_oTileLayerSub != null) {
        g_oTileLayerSub.set('opacity', 1);
    }
}

function renderCustomOpacityControl(_map, _type, _models = '') {
    let id = 'opacitycontrolbar';
    let idparent = _map.getDiv().getAttribute('id');
    let chk = $('#'+ idparent +' .'+ id).length;
    let container = (chk) ? $('#'+ idparent +' .'+ id) : $('<div />').addClass(id);

    let value = 0, target = 'fillOpacity';

    switch(_type) {
        case 'C':
        case 'O':
            value = 100;
            target = 'strokeOpacity';
            break;

        case 'B':
            value = 30;
            target = 'fillOpacity';
            break;
    }

    let markup = [
        '<div class="titlebar">'+ g_oLang.common.title.opacity[g_sLangCode] +'</div>',
        '<div class="sliderarea '+ _type +'">',
        '   <div class="subtitle">'+ g_oLang.aoi['action_'+ _type].title[g_sLangCode] +'</div>',
        '   <div class="action_slider"></div>',
        '   <div class="percentage">'+ value +'%</div>',
        '</div>',
        '<div class="sliderarea">',
        '   <div class="subtitle">'+ g_oLang.aoi.title.imagery[g_sLangCode] +'</div>',
        '   <div class="imagery_slider"></div>',
        '   <div class="percentage">100%</div>',
        '</div>'
    ].join('');

    if(!chk) {
        container.html(markup);
        container.index = 1;

        _map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(container[0]);
    } else {
        container.html(markup).show();
        $('.zoomcontrolbar').css({
            bottom: '138px'
        });
    }

    container.find('.action_slider, .imagery_slider').slider({
        range: "min",
        min: 0,
        max: 100,
        value: 100,
        create: function( event, ui ) {
            if($(this).hasClass('action_slider')) {
                $('.'+ id +' .action_slider').slider('value', value);
            }
        },
        slide: function( event, ui ) {
            let v = ui.value;
            $(this).siblings('.percentage').html(v +'%');

            if($(this).hasClass('imagery_slider')) {
                g_oTileLayer.set('opacity', (v / 100));

                if(g_oTileLayerSub != null) {
                    g_oTileLayerSub.set('opacity', (v / 100));
                }

                if(idparent == 'mapview-main') {
                    $('#mapview-sub .'+ id +' .imagery_slider').slider('value', v);
                } else {
                    $('#mapview-main .'+ id +' .imagery_slider').slider('value', v);
                }
            } else {
                g_oResultObjects.forEach(function(item) {
                    item.set(target, (v / 100));
                });

                const modelRoad = $('input[name=model_ROAD]');

                g_oMap.data.setStyle({
                    fillColor: _models.indexOf('BUILDING') != -1 ? '#00ff00' : g_oTypeColors[_type],
                    fillOpacity: (v / 100),
                    strokeWeight: 1,
                    strokeColor: '#2a343e',
                    visible: (modelRoad.length && !modelRoad.is(':checked')) ? false : true
                });

                if(g_oResultObjectsSub.length) {
                    g_oResultObjectsSub.forEach(function(item) {
                        item.set(target, (v / 100));
                    });
                }

                if(idparent == 'mapview-main') {
                    $('#mapview-sub .'+ id +' .action_slider').slider('value', v);
                } else {
                    $('#mapview-main .'+ id +' .action_slider').slider('value', v);
                }
            }
        }
    });
}

function renderCustomZoomControl(_map) {
    let id = 'zoomcontrolbar';
    let idparent = _map.getDiv().getAttribute('id');

    if($('#'+ idparent +' .'+ id).length) {
        $('#'+ idparent +' .'+ id).remove();
    }

    let container = $('<div />').addClass(id);

    let markup = [
        '<div class="plus"><button class="btn_zoom_plus"></button></div>',
        '<div class="bar"><div class="zoom_slider"></div></div>',
        '<div class="minus"><button class="btn_zoom_minus"></button></div>'
    ].join('');

    container.html(markup);
    container.index = 1;

    _map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(container[0]);

    container.find('.zoom_slider').slider({
        orientation: "vertical",
        range: "min",
        min: g_iMinZoom,
        max: g_iMaxZoom,
        value: _map.getZoom(),
        slide: function( event, ui ) {
            let z = ui.value;
            _map.setZoom(z);

            if(z == g_iMinZoom) {
                container.find('.btn_zoom_minus').addClass('off');
            } else if(z == g_iMaxZoom) {
                container.find('.btn_zoom_plus').addClass('off');
            } else {
                container.find('.btn_zoom_minus').removeClass('off');
                container.find('.btn_zoom_plus').removeClass('off');
            }
        }
    });

    container.find('.zoom_slider .ui-slider-vertical').height((g_iMaxZoom - g_iMinZoom) * 10);
    container.find('.zoom_slider .ui-slider-handle').on('mousemove', function() {
        $(this).attr('data-btitle', _map.getZoom());
    }).bTooltip({
        textColor: '#eee',
        textSize: '12px',
        boxColor: '#283041',
        boxGap: 12,
        boxCorner: 1,
        boxPadding: '5px 12px',
        boxDirection: 'left'
    });

    container.find('.btn_zoom_minus')[0].addEventListener('click', function() {
        var currentZoomLevel = _map.getZoom();
        var minusZoomLevel = currentZoomLevel - 1;

        if(currentZoomLevel > g_iMinZoom) {
            _map.setZoom(minusZoomLevel);
            if(minusZoomLevel == g_iMinZoom) {
                container.find('.btn_zoom_minus').addClass('off');
            } else {
                container.find('.btn_zoom_minus').removeClass('off');
            }
        }

        if(minusZoomLevel < g_iMaxZoom) {
            container.find('.btn_zoom_plus').removeClass('off');
        } else {
            container.find('.btn_zoom_plus').addClass('off');
        }

        container.find('.zoom_slider').slider('value', minusZoomLevel);
    });

    container.find('.btn_zoom_plus')[0].addEventListener('click', function() {
        var currentZoomLevel = _map.getZoom();
        var plusZoomLevel = currentZoomLevel + 1;

        if(currentZoomLevel < g_iMaxZoom) {
            _map.setZoom(plusZoomLevel);
            if(plusZoomLevel == g_iMaxZoom) {
                container.find('.btn_zoom_plus').addClass('off');
            } else {
                container.find('.btn_zoom_plus').removeClass('off');
            }
        }

        if(plusZoomLevel > g_iMinZoom) {
            container.find('.btn_zoom_minus').removeClass('off');
        } else {
            container.find('.btn_zoom_minus').addClass('off');
        }

        container.find('.zoom_slider').slider('value', plusZoomLevel);
    });

    _map.setZoom((_map.getZoom() > g_iMaxZoom) ? g_iMaxZoom : _map.getZoom());
}
