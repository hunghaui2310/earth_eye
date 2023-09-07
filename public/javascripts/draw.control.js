// The Draw controls for the Google map

let g_oDrawingManager = null;
let g_oDrawObject = null;
let g_oDrawListener = null;
let g_oDrawCoordInfo = null;

let g_oPreviewObject = null,
    g_oPreviewObjectSub = null;
let g_oPreviewMarker = null,
    g_oPreviewMarkerSub = null;

function drawObject(_map, _mode) {
    resetAoiData();
    resetDraw(_map);
    drawingMode(_map, _mode);
}

function drawingRect(_map, _fn, _resetfn) {
    let options = {
        fillColor: '#4eb8ff',
        fillOpacity: 0.2,
        strokeWeight: 3,
        strokeColor: '#00cbff',
        clickable: false,
        editable: false
    };

    g_oDrawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
        drawingControl: true,
        drawingControlOptions: {
            drawingModes: ['rectangle']
        },
        rectangleOptions: options,
        map: _map
    });

    g_oDrawListener = google.maps.event.addListener(g_oDrawingManager, 'rectanglecomplete', function(rectangle) {
        g_oDrawingManager.setDrawingMode(null);

        _map.fitBounds(rectangle.getBounds());
        if(typeof _fn === 'function') {
            _fn.call(this, rectangle);
        }

        google.maps.event.addListener(rectangle, 'bounds_changed', function() {
            if(typeof _fn === 'function') {
                _fn.call(this, rectangle);
            }
        });

        g_oDrawObject = rectangle;
    });

    google.maps.event.addListener(g_oDrawingManager, "drawingmode_changed", function() {
        let mode = g_oDrawingManager.getDrawingMode();

        if(g_oDrawObject != null && mode == 'rectangle') {
            g_oDrawObject.setMap(null);
            g_oDrawObject = null;

            if(typeof _resetfn === 'function') {
                _resetfn.call();
            }
        }
    });
}

function drawingMode(_map, _mode) {
    let options = {
        fillColor: '#4eb8ff',
        fillOpacity: 0.2,
        strokeWeight: 3,
        strokeColor: '#00cbff',
        clickable: false,
        editable: true
    };

    switch(_mode) {
        case 'C':
            g_oDrawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.CIRCLE,
                drawingControl: false,
                circleOptions: options,
                map: _map
            });

            g_oDrawListener = google.maps.event.addListener(g_oDrawingManager, 'circlecomplete', function(circle) {
                g_oDrawObject = circle;
                circle.setEditable(true);
                g_oDrawingManager.setDrawingMode(null);

                _map.fitBounds(circle.getBounds());
                updateInfo(circle, _mode);

                google.maps.event.addListener(circle, 'radius_changed', function() {
                    updateInfo(circle, _mode);
                });

                google.maps.event.addListener(circle, 'center_changed', function() {
                    updateInfo(circle, _mode);
                });

                resetDraw(_map);
            });

            break;

        case 'R':
            g_oDrawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
                drawingControl: false,
                rectangleOptions: options,
                map: _map
            });

            g_oDrawListener = google.maps.event.addListener(g_oDrawingManager, 'rectanglecomplete', function(rectangle) {
                g_oDrawObject = rectangle;
                rectangle.setEditable(true);
                g_oDrawingManager.setDrawingMode(null);

                _map.fitBounds(rectangle.getBounds());
                updateInfo(rectangle, _mode);

                google.maps.event.addListener(rectangle, 'bounds_changed', function() {
                    updateInfo(rectangle, _mode);
                });

                resetDraw(_map);
            });

            break;

        case 'P':
            g_oDrawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: false,
                polygonOptions: options,
                map: _map
            });

            g_oDrawListener = google.maps.event.addListener(g_oDrawingManager, 'polygoncomplete', function(polygon) {
                g_oDrawObject = polygon;
                polygon.setEditable(true);
                g_oDrawingManager.setDrawingMode(null);

                _map.fitBounds(getPolygonBounds(polygon));
                updateInfo(polygon, _mode);

                polygon.getPaths().forEach(function(path, index) {
                    google.maps.event.addListener(path, 'insert_at', function() {
                        updateInfo(polygon, _mode);
                    });

                    google.maps.event.addListener(path, 'set_at', function() {
                        updateInfo(polygon, _mode);
                    });
                });

                resetDraw(_map);
            });

            break;
    }
}

function updateInfo(_o, _mode) {
    let f = $('#framebox .aoiformbox');
    var center = null, radius = 0, area = 0, coord = null, sw = null, ne = null;

    var bounds = (_mode == 'P') ? getPolygonBounds(_o) : _o.getBounds();
    center = bounds.getCenter();
    coord = bounds.toJSON();
    sw = bounds.getSouthWest().lat() + ',' + bounds.getSouthWest().lng();
    ne = bounds.getNorthEast().lat() + ',' + bounds.getNorthEast().lng();

    if (_mode == 'C') {
        radius = _o.getRadius();
        area = (radius * radius * Math.PI) / 1000000;
    } else if (_mode == 'R') {
        area = computeRectangleArea(bounds);
    } else if (_mode == 'P') {
        area = google.maps.geometry.spherical.computeArea(_o.getPath()) / 1000000;
        coord = getPolygonPoints(_o);
    }

    g_oDrawCoordInfo = {
        'type': _mode,
        'center': {
            'lat': center.lat(),
            'lng': center.lng()
        },
        'radius': radius,
        'coordinates': [coord]
    };

    f.find('.aoi_lat').html(center.lat().toFixed(6));
    f.find('.aoi_lng').html(center.lng().toFixed(6));
    f.find('.aoi_area').html(area.toFixed(5));
    f.find('input[name=aoi_coord]').val(JSON.stringify(g_oDrawCoordInfo));
    f.find('input[name=aoi_sw_latlng]').val(sw);
    f.find('input[name=aoi_ne_latlng]').val(ne);
}

function resetDraw(_map) {
    if(g_oDrawListener) {
        google.maps.event.removeListener(g_oDrawListener);
        g_oDrawListener = null;
    }
}

function resetAoiData() {
    let f = $('#framebox .aoiformbox');

    if(g_oDrawObject != null) {
        g_oDrawObject.setMap(null);
        g_oDrawObject = null;
    }

    if(g_oDrawingManager != null) {
        g_oDrawingManager.setMap(null);
        g_oDrawingManager = null;
    }

    if(g_oDrawCoordInfo != null) {
        g_oDrawCoordInfo = null;
        f.find('.aoi_lat').html('0');
        f.find('.aoi_lng').html('0');
        f.find('.aoi_area').html('0');
        f.find('input[name=aoi_coord]').val('');
        f.find('input[name=aoi_sw_latlng]').val('');
        f.find('input[name=aoi_ne_latlng]').val('');
    }
}

function drawFitBounds(_map, _coord, _title, _fit) {
    let id = _map.getDiv().getAttribute('id');
    let object = (id == 'mapview-main') ? g_oPreviewObject : g_oPreviewObjectSub;
    let marker = (id == 'mapview-main') ? g_oPreviewMarker : g_oPreviewMarkerSub;
    let coord = JSON.parse(_coord);
    let fit = (typeof _fit == 'undefined') ? true : false;
    let options = {
        fillColor: '#000',
        fillOpacity: 0.2,
        strokeWeight: 4,
        strokeColor: '#fff',
        clickable: false,
        editable: false
    };

    if(object != null) {
        object.setMap(null);
        object = null;
    }

    if(marker != null) {
        marker.setMap(null);
        marker = null;
    }

    switch(coord.type) {
        case 'C':
            options.center = new google.maps.LatLng(coord.center.lat, coord.center.lng);
            options.radius = coord.radius;
            options.map = _map;
            object = new google.maps.Circle(options);
            if(fit) {
                _map.fitBounds(object.getBounds());
            }
            break;

        case 'R':
            var sw = new google.maps.LatLng(coord.coordinates[0].south, coord.coordinates[0].west);
            var ne = new google.maps.LatLng(coord.coordinates[0].north, coord.coordinates[0].east);
            options.bounds = new google.maps.LatLngBounds(sw, ne);
            options.map = _map;
            object = new google.maps.Rectangle(options);
            if(fit) {
                _map.fitBounds(object.getBounds());
            }
            break;

        case 'P':
            options.paths = coord.coordinates[0];
            options.map = _map;
            object = new google.maps.Polygon(options);
            if(fit) {
                _map.fitBounds(getPolygonBounds(object));
            }
            break;
    }

    marker = new HTMLMarker(coord.center.lat, coord.center.lng, '<div class="aoi-title-marker">'+ _title +'</div>');
    marker.setMap(_map);
    object.set('zIndex', 10);

    if(id == 'mapview-main') {
        g_oPreviewObject = object;
        g_oPreviewMarker = marker;
    } else {
        g_oPreviewObjectSub = object;
        g_oPreviewMarkerSub = marker;
    }
}

function getPolygonBounds(_polygon) {
    let paths = _polygon.getPaths();
    let bounds = new google.maps.LatLngBounds();

    paths.forEach(function(path) {
        var ar = path.getArray();
        for(var i = 0, l = ar.length; i < l; i++) {
            bounds.extend(ar[i]);
        }
    });

    return bounds;
}

function getPolygonPoints(_polygon) {
    let paths = _polygon.getPaths();
    let points = [];

    paths.forEach(function(path) {
        let ar = path.getArray();
        for(let i = 0, l = ar.length; i < l; i++) {
            points.push(ar[i]);
        }
    });

    return points;
}

function computeRectangleArea(bounds) {
    if(!bounds) {
        return 0;
    }

    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    var southWest = new google.maps.LatLng(sw.lat(), sw.lng());
    var northEast = new google.maps.LatLng(ne.lat(), ne.lng());
    var southEast = new google.maps.LatLng(sw.lat(), ne.lng());
    var northWest = new google.maps.LatLng(ne.lat(), sw.lng());

    return google.maps.geometry.spherical.computeArea([northEast, northWest, southWest, southEast]) / (1000000);
}

function distanceBetweenPoints(_p1, _p2) {
    if (!_p1 || !_p2) {
        return 0;
    }
    var R = 6371;
    var dLat = (_p2.lat() - _p1.lat()) * Math.PI / 180;
    var dLon = (_p2.lng() - _p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(_p1.lat() * Math.PI / 180) * Math.cos(_p2.lat() * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
}