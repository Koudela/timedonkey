(function($){
    'use strict';

    let start = null;

    let target = 28800000; // 8h
    let targetOrange = 900000; // 15min
    let targetRed = 0;
    let targetRedAlert = -1800000; // -30min

    let interval7msec = null;
    let interval1sec = null;
    let interval5min = null;

    let floatToTimestring = function(time) {
        return (time < 0 ? (-1 * Math.ceil(time)) : Math.floor(time));
    }

    let getTimestringFromMilliseconds = function(milliseconds, showMillisec) {
        let hours = milliseconds >= 0 ? Math.floor(milliseconds/3600000) : Math.floor(milliseconds/-3600000);
        let minutes = milliseconds >= 0 ? Math.floor((milliseconds - hours * 3600000)/60000) : Math.floor((milliseconds + hours * 3600000)/-60000);
        let seconds = milliseconds >= 0 ? Math.floor((milliseconds - hours * 3600000 - minutes * 60000)/1000) : Math.floor((milliseconds + hours * 3600000 + minutes * 60000)/-1000);
        let millisec = milliseconds >= 0 ? (milliseconds - hours * 3600000 - minutes * 60000 - seconds * 1000) : - (milliseconds + hours * 3600000 + minutes * 60000 + seconds * 1000);
        return (milliseconds < 0 ? '-' : '') + hours.toString().padStart(2, '0') 
            + ':' + minutes.toString().padStart(2, '0')
            + ':' + seconds.toString().padStart(2, '0')
            + (showMillisec ? '.' + millisec.toString().padStart(3, '0') : '')
    }

    let millisecToday = function() {
        let now = new Date();
        return now.getTime() - new Date(
            now.getFullYear(), 
            now.getMonth(),
            now.getDate(),
            0,0,0
        ).getTime()
    }

    var getTimeRemaining = function() {
        return getTimestringFromMilliseconds(target - (Date.now() - start), true);
    }
    
    var getTimeEllapsed = function(start) {
        return getTimestringFromMilliseconds(Date.now() - start, true);
    }

    let restart = function() {
        start = Date.now();

        if (interval7msec !== null) clearInterval(interval7msec);
        interval7msec = setInterval(function() {
            $('title').text(getTimestringFromMilliseconds(millisecToday(), false).substr(0, 5) + ' - Timedonkey');
            $('span.timeRemaining').text(getTimeRemaining())
            $('span.timeEllapsed').text(getTimeEllapsed(start))
        }, 7)
    
        if (interval1sec !== null) clearInterval(interval1sec);
        interval1sec = setInterval(function() {
            let timeRemaining = target - (Date.now() - start);
            if (timeRemaining > targetOrange) return $('span.timeRemaining').removeClass('orange red redAlert');
            if (timeRemaining > targetRed) return $('span.timeRemaining').removeClass('red redAlert').addClass('orange');
            if (timeRemaining > targetRedAlert) return $('span.timeRemaining').removeClass('orange redAlert').addClass('red');
            return $('span.timeRemaining').removeClass('orange red').addClass('redAlert');
        }, 1000);
    
        if (interval5min !== null) clearInterval(interval5min);
        interval5min = setInterval(function() {
            let timeRemaining = target - (Date.now() - start);
            if (timeRemaining > targetOrange) return Push.create(getTimestringFromMilliseconds(timeRemaining, false) + ' left');
            if (timeRemaining > targetRed) return Push.create('Get ready to go...');
            if (timeRemaining > targetRedAlert) return Push.create('Why are you still here?');
            return Push.create('End of work is overdue... \nNerdy bastard, move now!');
        }, 300000);
    }
    
    let timestringToMilliseconds = function(str) {
        let arr = str.split(':');
        let milliseconds = 0;
        let i = arr.length;
        if (--i >= 0) milliseconds += parseInt(arr[i]) * 1000;
        if (--i >= 0) milliseconds += parseInt(arr[i]) * 60000;
        if (--i >= 0) milliseconds += parseInt(arr[i]) * 3600000;
        return milliseconds;
    }

    $('#restart').on('click', function() {
        target = timestringToMilliseconds($('#target').val());
        targetOrange = timestringToMilliseconds($('#targetOrange').val());
        targetRed = timestringToMilliseconds($('#targetRed').val());
        targetRedAlert = timestringToMilliseconds($('#targetRedAlert').val());
        $('#restart').text('restart');
        restart();
    });
 
    let init = function() {
        $('#target').val(getTimestringFromMilliseconds(target, false));
        $('#targetOrange').val(getTimestringFromMilliseconds(targetOrange, false));
        $('#targetRed').val(getTimestringFromMilliseconds(targetRed, false));
        $('#targetRedAlert').val(getTimestringFromMilliseconds(targetRedAlert, false));
    }
    init();

})(jQuery)
