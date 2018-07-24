'use strict';

/* -------------------------------------------------------------------
Copyright (c) 2017-2017 Hexaware Technologies
This file is part of the Innovation LAB - Offline Bot.
------------------------------------------------------------------- */


requirejs.config({
    baseUrl: 'js',
    waitSeconds: 0,
    paths: {
        jquery: [
            'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min',
            'lib/jquery.min'
        ],
        bootstrap: [
            'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min',
            'lib/bootstrap.min'
        ],
        lpChat: [
            'https://lpcdn.lpsnmedia.net/api/chat/public/lpChat.min',
            'lib/lpChat.min'
        ],
        apiService: 'src/apiService',
        uuid: 'lib/uuidv1',
        propeller: 'lib/propeller.min',
        utils: 'src/utils',
        settings: 'settings',
        app: 'src/app',
        Cookies: 'lib/Cookies',
        messageTemplates: 'src/messageTemplates',
        cards: 'src/cards',
        navigation: 'src/navigation'
        // jq16: 'lib/jquery1.6.min',
        // facemicon:'lib/faceMocion'
    },
    shim: {
        bootstrap: {
            deps: ['jquery']
        },
        propeller: {
            deps: ['jquery', 'bootstrap']
        }
    }
});

requirejs(['src/app']);