/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

z = {};

log = function(disp) {
    $('#console').html(disp);
};

$(document).hammer().on("pinchin", function(ev) {
    ev.gesture.preventDefault();
    var center = {pageX: z.center.pageX - (z.center.pageX - ev.gesture.startEvent.center.pageX) / z.origZoom * 100,
        pageY: z.center.pageY - (z.center.pageY - ev.gesture.startEvent.center.pageY) / z.origZoom * 100};
    z.zoomDoc(ev.gesture.scale, center);
});

$(document).hammer().on("pinchout", function(ev) {
    ev.gesture.preventDefault();
    var center = {pageX: z.center.pageX - (z.center.pageX - ev.gesture.startEvent.center.pageX) / z.origZoom * 100,
        pageY: z.center.pageY - (z.center.pageY - ev.gesture.startEvent.center.pageY) / z.origZoom * 100};
    log(z.center.pageX + " " + ev.gesture.startEvent.center.pageX / z.origZoom * 100 + " " + z.center.pageY + " " + ev.gesture.startEvent.center.pageY / z.origZoom * 100);
    z.zoomDoc(ev.gesture.scale, center);
});

$(document).hammer().on("release", function(ev) {
    z.makeImage();
    z.center = {pageX: z.center.pageX - (z.center.pageX - ev.gesture.startEvent.center.pageX) / z.origZoom * 100,
        pageY: z.center.pageY - (z.center.pageY - ev.gesture.startEvent.center.pageY) / z.origZoom * 100};
    z.origZoom = z.zoomPC;
});


z.zoomDoc = function(scale, center) {
    z.zoomPC = z.origZoom * scale;
    log(center.pageX + " " + center.pageY + " " + z.zoomX + " " + z.zoomY);
    if (z.zoomPC <= z.minZoom)
        z.zoomPC = z.minZoom;
    if (z.zoomPC >= z.maxZoom)
        z.zoomPC = z.maxZoom;
    z.zoomX = -center.pageX / z.docWidth * (z.zoomPC - 100);
    z.zoomY = -center.pageY / z.docHeight * (z.zoomPC - 100);
    $('#viewer').css('width', z.zoomPC + '%');
    $('#viewer').css('padding-bottom', z.aspect * z.zoomPC + '%');
    $('#viewer').css('left', z.zoomX + "%");
    $('#viewer').css('top', z.zoomY + "%");
    z.viewWidth = z.docWidth * z.zoomPC / 100;
    z.viewHeight = z.docHeight * z.zoomPC / 100;
    z.setZoom();
};

$(document).hammer().on("touch", function(ev) {
    ev.gesture.preventDefault();
});

$(document).ready(function() {
    z.pixelRatio = !!window.devicePixelRatio ? window.devicePixelRatio : 1;
    z.pixelRatio = 1;
    z.initialize("images/zoom0");
});
z.initialize = function(path) {
    z.docHeight = $(window).height();
    z.docWidth = $(window).width();
    z.zoomY = 0;
    z.zoomX = 0;
    z.zoomLevel = -1;
    z.setImgProp(path);
    z.setZoom();
    z.makeImage();
};

z.setImgProp = function(path) {
    z.imgRoot = path;
    getXMLProperties(path);
    z.zoomWidths = [];
    z.zoomHeights = [];
    var k = z.imgWidth * 2, j = z.imgHeight * 2, i = -1, tempW = [], tempH = [];
    do {
        k /= 2;
        j /= 2;
        i++;
        tempW[i] = Math.floor(k);
        tempH[i] = Math.floor(j);
    } while (k > z.tileSize || j > z.tileSize);
    k = tempH.length;
    for (i = 0; i < tempH.length; i++) {
        k--;
        z.zoomWidths[i] = tempW[k];
        z.zoomHeights[i] = tempH[k];
    }
    z.maxZoom = z.imgWidth / z.viewWidth * 99 / z.pixelRatio;
};
function getXMLProperties(path) {
    XMLDoc = loadXMLDoc(path + "/ImageProperties.xml");
    z.imgWidth = parseInt(XMLDoc.documentElement.getAttribute("WIDTH"), 10);
    z.imgHeight = parseInt(XMLDoc.documentElement.getAttribute("HEIGHT"), 10);
    z.tileSize = parseInt(XMLDoc.documentElement.getAttribute("TILESIZE"), 10) / z.pixelRatio;
    z.aspect = z.imgHeight / z.imgWidth;
    z.zoomPC = 100;
    z.origZoom = 100;
    z.minZoom = 100;
    z.center = {};
    z.viewWidth = z.docWidth;
    z.viewHeight = z.docWidth * z.aspect;
    z.zoomAspect = z.docHeight / z.viewHeight * 100;
    z.center.pageX = z.viewWidth / 2;
    z.center.pageY = z.viewHeight / 2;
    log(z.center.pageX + " " + z.center.pageY);
    $('#viewer').css('padding-bottom', z.aspect * z.zoomPC + '%');
}
;
function loadXMLDoc(XMLname) {
    var xmlDoc;
    if (window.XMLHttpRequest)
    {
        xmlDoc = new window.XMLHttpRequest();
        xmlDoc.open("GET", XMLname, false);
        xmlDoc.send("");
        return xmlDoc.responseXML;
    }
    console.log("Error loading document!");
    return null;
}
;
z.setZoom = function() {
    var newZoom;
    for (newZoom = 0; newZoom < z.zoomWidths.length; newZoom++) {
        if (z.zoomWidths[newZoom] > z.viewWidth)
            break;
    }

    z.zoomLevel = newZoom;
};

z.makeImage = function() {
    z.numWPx = z.zoomWidths[z.zoomLevel];
    z.numHPx = z.zoomHeights[z.zoomLevel];

    var numWBlocks = Math.ceil(z.numWPx / z.tileSize);
    var numHBlocks = Math.ceil(z.numHPx / z.tileSize);
    var Wsize = z.tileSize / z.numWPx * 100;
    var Wend = (z.numWPx % z.tileSize) / z.numWPx * 100;
    var Hsize = z.tileSize / z.numHPx * 100;
    var Hend = (z.numHPx % z.tileSize) / z.numHPx * 100;
    var posW = 0;
    var posH = 0;
    $('#viewer').empty();
    for (var k = 0; k < numHBlocks && posH <= (-z.zoomY + 100) / z.zoomPC * z.zoomAspect; k++) {
        if (posH + Hsize <= -z.zoomY / z.zoomPC * z.zoomAspect) {
            posH += Hsize;
            continue;
        }
        posW = 0;
        for (var j = 0; j < numWBlocks && posW <= (-z.zoomX + 100) / z.zoomPC * 100; j++) {
            if (posW + Wsize <= -z.zoomX / z.zoomPC * 100) {
                posW += Wsize;
                continue;
            }
            $('#viewer').append('<img id = "' + 1000 * k + j + '" src="' + z.imgRoot + '/' + z.zoomLevel + '-' + j + '-' + k + '.jpg' + '" />');
            $('#' + 1000 * k + j).css({"position": "absolute", "left": posW + '%', "top": posH + '%'});

            posW += Wsize;
            if (posW > 100) {
                $('#' + 1000 * k + j).css('width', Wend + 0.04 + '%');
            } else {
                $('#' + 1000 * k + j).css('width', Wsize + 0.02 + '%');
            }
        }
        posH += Hsize;
    }
    $('#viewer').css('left', z.zoomX + "%");
    $('#viewer').css('top', z.zoomY + "%");
};

$(window).resize(function() {
    z.initialize(z.imgRoot);
});