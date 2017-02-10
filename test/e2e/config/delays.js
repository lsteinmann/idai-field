/*
 * In order to prevent errors caused by e2e tests running too fast you can slow them down by calling the following
 * function. Use higher values for slower tests.
 *
 * utils.delayPromises(30);
 *
 */
var promisesDelay = 10;


function delayPromises(milliseconds) {
    var executeFunction = browser.driver.controlFlow().execute;

    browser.driver.controlFlow().execute = function() {
        var args = arguments;

        executeFunction.call(browser.driver.controlFlow(), function() {
            return protractor.promise.delayed(milliseconds);
        });

        return executeFunction.apply(browser.driver.controlFlow(), args);
    };
}

console.log("Set promises delay to " + promisesDelay + " ms.");
delayPromises(promisesDelay);


var ECWaitTime = 2000;
var afterClickPauseTime = 200;


module.exports = {
    ECWaitTime: ECWaitTime,
    afterClickPauseTime: afterClickPauseTime
};
    