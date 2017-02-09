'use strict';

var afterClickPauseTime = 250;

var MapPage = function () {

    var mapElement = element(by.id("map-container"));

    this.clickMap = function(x, y) {
        // return browser.actions().mouseMove(mapElement, {x: x}, {y: y}).click().perform();
        return new Promise(function(resolve){
            browser.actions()
                .mouseMove(mapElement, {x: x, y: y})
                .click()
                .perform()
                .then(function(){
                    setTimeout(function(){resolve()},afterClickPauseTime)
                })
        });
    };

    // function clickMap(toRight, toBottom) {
    //
    // }

    this.setMarker = function (x, y) {
        return this.clickMap(x, y);
    };

    this.setPolygon = function (pointArray) {
        var _this = this;
        return function () {
            for(var i = 0; i < pointArray.length; ++i){
                _this.clickMap(pointArray[i][0], pointArray[i][1]);
            }
        }
    };

    this.clickMapOption = function(optionName) {
        return element(by.id('map-editor-button-'+optionName)).click();
    };
};

module.exports = new MapPage();