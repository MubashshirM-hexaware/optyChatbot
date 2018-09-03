'use strict';

/* -------------------------------------------------------------------
Copyright (c) 2017-2017 Hexaware Technologies
This file is part of the Innovation LAB - Offline Bot.
------------------------------------------------------------------- */


define(["utils", "settings", "handlebars", 'jquery'], function (utils, settings, handlebars, $) {
    var methods = {};
    handlebars.getTemplate = function (name) {
        if (handlebars.templates === undefined || handlebars.templates[name] === undefined) {
            $.ajax({
                url: 'templates/' + name + '.hbs',
                success: function (data) {
                    if (handlebars.templates === undefined) {
                        handlebars.templates = {};
                    }
                    handlebars.templates[name] = handlebars.compile(data);
                },
                async: false
            });
        }
        return handlebars.templates[name];
    };
    handlebars.registerHelper('if_eq', function (a, b, opts) {
        if (a == b) // Or === depending on your needs
            return opts.fn(this);
        else
            return opts.inverse(this);
    });
    handlebars.registerHelper('consol', function (context) {
        console.log(context);
    });
    handlebars.registerHelper('json', function (context) {
        return JSON.stringify(context);
    });
    handlebars.registerHelper('toString', function (context) {
        return context.toString();
    });
    handlebars.registerHelper("key_value", function (obj, opts) {
        var soFar = "";
        var key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                return opts.fn(this);
            }
            else {
                return opts.inverse(this);
            }
        }

    });
    handlebars.registerHelper('each_hash', function (context, options) {
        var fn = options.fn, inverse = options.inverse;
        var ret = "";

        if (typeof context === "object") {
            for (var key in context) {
                if (context.hasOwnProperty(key)) {
                    // clone the context so it's not
                    // modified by the template-engine when
                    // setting "_key"
                    var ctx = jQuery.extend(
                        { "_key": key },
                        context[key]);

                    ret = ret + fn(ctx);
                }
            }
        } else {
            ret = inverse(this);
        }
        return ret;
    });
    //User Plain Text
    methods.userplaintext = (data) => {
        var compiledTemplate = handlebars.getTemplate('userplaintext');
        let html = compiledTemplate(data);
        return html;
    }

    //Plain Text Template
    methods.plaintext = (data) => {
        var compiledTemplate = handlebars.getTemplate('plaintext');
        let html = compiledTemplate(data);
        return html;
    }
    //Card Template
    methods.card = (data) => {
        var compiledTemplate = handlebars.getTemplate('card');
        let html = compiledTemplate(data);
        return html;
    }
    methods.quickreplies = (data) => {
        var compiledTemplate = handlebars.getTemplate('quickreply');
        let html = compiledTemplate(data);
        return html;
    }

    methods.carousel = (data, uniqueId) => {
        var compiledTemplate = handlebars.getTemplate('carousel');
        data["uniqueId"] = uniqueId;
        let html = compiledTemplate(data);
        return html;
    }
    return methods;
});
