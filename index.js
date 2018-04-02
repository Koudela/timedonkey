(function($){//TODO: feature: download JSON + feature: edit JSON
    'use strict';

    /**
     *  Timeformating + Timecalculation
     */

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
        if (!arguments[0]) return getTimestringFromMilliseconds(target - (Date.now() - start), true);
        return getTimestringFromMilliseconds(target - (Date.now() - start) + arguments[0], true);
    }
    
    var getTimeEllapsed = function(start) {
        return getTimestringFromMilliseconds(Date.now() - start, true);
    }

    /**
     * Init...
     */

    let target = 28800000; // 8h
    let targetOrange = 900000; // 15min
    let targetRed = 0;
    let targetRedAlert = -1800000; // -30min

    $('#target').val(getTimestringFromMilliseconds(target, false));
    $('#targetOrange').val(getTimestringFromMilliseconds(targetOrange, false));
    $('#targetRed').val(getTimestringFromMilliseconds(targetRed, false));
    $('#targetRedAlert').val(getTimestringFromMilliseconds(targetRedAlert, false));

    let start = null;
    let interval7msec = null;
    let interval1sec = null;
    let interval5min = null;

    let timedonkeyJSON = null;

    let nextFlag = Object.create(null);
    nextFlag.U = 'Ticket';
    nextFlag.T = 'Pause';
    nextFlag.P = 'Other';
    nextFlag.O = 'Unknown';

    let getDatestamp = function() {
        let Dat = new Date();
        return Dat.getFullYear() + '-' + (Dat.getMonth()+1).toString().padStart(2, '0') + '-' + Dat.getDate().toString().padStart(2, '0')
    }

    let saveDonkeyTable = function() {
        localStorage.setItem('donkeyTable', JSON.stringify(timedonkeyJSON));
    }

    let loadDonkeyTable = function() {
        try {
            timedonkeyJSON = JSON.parse(localStorage.getItem('donkeyTable'));
            if (!timedonkeyJSON[getDatestamp()]) timedonkeyJSON[getDatestamp()] = [];
            if (timedonkeyJSON[getDatestamp()].length === 0) {
                start = Date.now();
                newTimestamp();
            } else start = (new Date(getDatestamp() + 'T' + timedonkeyJSON[getDatestamp()][0].from)).getTime();
        } catch(e) {
            timedonkeyJSON = Object.create(null);
            timedonkeyJSON[getDatestamp()] = [];
            start = Date.now();
            newTimestamp();
        }
        rebuildDonkeyTable(timedonkeyJSON[getDatestamp()]);
    }

    /**
     * Timestamps...
     */
    
    let getTimestamp = function() {
        return getTimestringFromMilliseconds(millisecToday(), false).substr(0, 5);
    }

    let toProdTime = function(from, to) {
        let fromArr = from.split(':');
        let toArr = to.split(':');
        return (toArr[0] - fromArr[0] + (toArr[1] - fromArr[1])/60).toFixed(2);
    }

    let newTimestamp = function() {
        let table = timedonkeyJSON[getDatestamp()];
        let time = getTimestamp();
        let row = {'flag':'Unknown', 'from':time, 'to':null, 'activity':''}
        if (table.length > 0) table[table.length - 1].to = time;
        table.push(row);
        saveDonkeyTable();
        rebuildDonkeyTable(table);
    }

    $('h1').on('click', function() {
        newTimestamp();
    });

    let rebuildDonkeyTable = function(table) {
        $('table#donkeyTable tr.td').remove();
        let i = 0;
        table.forEach(row => {
            $('table#donkeyTable').append(
                '<tr class="td">'+
                    '<td class="flag" id="donkeyTableFlag'+i+'">'+row.flag+'</td>'+
                    '<td class="from">'+row.from+'</td>'+
                    '<td class="to">'+row.to+'</td>'+
                    '<td class="total" id="donkeyTableTotal'+i+'">'+(row.to !== null ? toProdTime(row.from, row.to) : '')+'</td>'+
                    '<td class="activity"><input id="donkeyTableActivity'+(i++)+'" type="text" class="form-control" placeholder="describe or name here..." value="'+row.activity+'" /></td>'+
                '</tr>'
            );
        });

        $('table#donkeyTable td.activity input').on('keyup', function() {
            table[this.id.substr(19)].activity = this.value;
            saveDonkeyTable();
        });

        $('table#donkeyTable td.flag').on('click', function(event) {
            $(this).text(nextFlag[$(this).text()[0]]);
            table[this.id.substr(15)].flag = $(this).text();
            saveDonkeyTable();
        })
    
    }

    /**
     * Restart... 
     */

    let timestringToMilliseconds = function(str) {
        let arr = str.split(':');
        let milliseconds = 0;
        if (arr.length >= 2) milliseconds += parseInt(arr[2]) * 1000;
        if (arr.length >= 1) milliseconds += parseInt(arr[1]) * 60000;
        if (arr.length >= 0) milliseconds += parseInt(arr[0]) * 3600000;
        return milliseconds;
    }

    let restart = function() {
        let pause = 0

        target = timestringToMilliseconds($('#target').val());
        targetOrange = timestringToMilliseconds($('#targetOrange').val());
        targetRed = timestringToMilliseconds($('#targetRed').val());
        targetRedAlert = timestringToMilliseconds($('#targetRedAlert').val());

        if (interval7msec !== null) clearInterval(interval7msec);
        interval7msec = setInterval(function() {
            $('title').text(getTimestringFromMilliseconds(millisecToday(), false).substr(0, 5) + ' - Timedonkey');
            $('span.timeRemaining').text(getTimeRemaining(pause))
            $('span.timeEllapsed').text(getTimeEllapsed(start))
        }, 7)
    
        if (interval1sec !== null) clearInterval(interval1sec);
        interval1sec = setInterval(function() {
            let table = timedonkeyJSON[getDatestamp()]
            if (table.length > 0) {
                $('table#donkeyTable td.to').last().text(getTimestamp());
                $('table#donkeyTable td.total').last().text(toProdTime(table[table.length - 1].from, getTimestamp()));    
            }
            pause = 0
            $('table#donkeyTable td.flag').each(function() {
                if ($(this).text() === 'Pause') pause += parseFloat($('#donkeyTableTotal'+this.id.substr(15)).text()) * 3600000
            });
            let timeRemaining = target - (Date.now() - start) + Math.floor(pause);
            if (timeRemaining > targetOrange) return $('span.timeRemaining').removeClass('orange red redAlert');
            if (timeRemaining > targetRed) return $('span.timeRemaining').removeClass('red redAlert').addClass('orange');
            if (timeRemaining > targetRedAlert) return $('span.timeRemaining').removeClass('orange redAlert').addClass('red');
            return $('span.timeRemaining').removeClass('orange red').addClass('redAlert');
        }, 1000);

        if (interval5min !== null) clearInterval(interval5min);
        interval5min = setInterval(function() {
            let timeRemaining = target - (Date.now() - start);
            if (timeRemaining > targetOrange) return;
            if (timeRemaining > targetRed) return Push.create('Get ready to go... \n' + getTimestringFromMilliseconds(timeRemaining, false) + ' left');
            if (timeRemaining > targetRedAlert) return Push.create('Why are you still here?');
            return Push.create('End of work is overdue... \nNerdy bastard, move now!');
        }, 300000);
    }

    $('#restart').on('click', function() {
        restart();
    });

    loadDonkeyTable();
    restart();

})(jQuery)
