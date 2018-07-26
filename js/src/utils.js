'use strict';

/* -------------------------------------------------------------------
Copyright (c) 2017-2017 Hexaware Technologies
This file is part of the Innovation LAB - Offline Bot.
------------------------------------------------------------------- */
function showmesgtext(msg) {
    document.getElementById("btn-input").focus();
    document.getElementById("btn-input").value += msg.childNodes[0].data;
}

define(['navigation', 'jquery', 'moment', 'momenttimzone'], function (navigation, $, moment, momenttimzone) {

    var methods = {};
    methods.currentTime = () => {

        var currentDate = new Date();
        var hours = (currentDate.getHours() < 10) ? '0' + currentDate.getHours() : currentDate.getHours();
        var minutes = (currentDate.getMinutes() < 10) ? '0' + currentDate.getMinutes() : currentDate.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';

        return `${hours}:${minutes} ${ampm}`;
    };

    methods.airlineTime = (x) => {
        var timechange = new Date(x);
        var hours = (timechange.getHours() < 10) ? '0' + timechange.getHours() : timechange.getHours();
        var minutes = (timechange.getMinutes() < 10) ? '0' + timechange.getMinutes() : timechange.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        var hoursnew = +hours % 12 || 12;
        return `${hoursnew}:${minutes} ${ampm}`;
    };
    methods.airlineTimeboarding = (x) => {
        var timechange = new Date(x);
        var hours = (timechange.getHours() < 10) ? '0' + timechange.getHours() : timechange.getHours();
        var min = x.split(':');
        var ampm = min[0] >= 12 ? 'pm' : 'am';
        var hoursnew = +hours % 12 || 12;
        return `${hoursnew}:${min[1]} ${ampm}`;
    };

    methods.scrollSmoothToBottom = (element) => {
        setTimeout(() => {
            var height = element[0].scrollHeight;
            element.scrollTop(height);
        }, 500);
    };
    methods.searchPage = (element) => {

        return navigation.data[element];
    };
    methods.getWelcomeMessage = () => {
        let curHr = moment().tz("Australia/Sydney").format("HH");

        if (curHr < 12) {
            return 'Good Morning';
        } else if (curHr < 18) {
            return 'Good Afternoon'
        } else {
            return 'Good Evening'
        }
    };
    methods.initiateAjax = (url, type, data, callback) => {

        $.ajax({
            url: url,
            type: type,
            dataType: "json",
            data: { type: data },
            success: function (result) {
                return callback(result, null);
            }, error: function (err) {
                return callback(null, err);
            }
        });
    }
    methods.getURLParameter = (name) => {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }


    return methods;
});
