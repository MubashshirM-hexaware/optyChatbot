'use strict';

/* -------------------------------------------------------------------
Copyright (c) 2017-2017 Hexaware Technologies
This file is part of the Innovation LAB - Offline Bot.
------------------------------------------------------------------- */

define(['jquery', 'settings', 'apiService', 'utils'], function ($, config, apiService, utils) {
    $(function () {
        var globalLpChat;
        /* Web Popup Adjustment header hiding */
        function adjustPopups() {
            let msgboxh = $("div.header-popup").next().height();
            let chath = $("div.header-popup").next().next().height();
            let typetext = $("div.header-popup").next().next().next().height();
            let bodyh = $("body").height();

            let finalcalc = bodyh - (chath + typetext);
            let finalcss = 'calc(100%-' + finalcalc + 'px)';
            $("div.chat-body").css('height', 'calc(' + finalcalc + 'px)');
        }
        //
        /*Query of when Web Popup=1 opens popup  window, hiding web headers*/
        let popup = window.location.search.substring(1).split("=");
        if (popup[1] == 1) {
            $("div.header-popup").addClass("hidden").slideUp("slow");
            adjustPopups();

        }
        else {
            $("div.header-popup").removeClass("hidden")
        }
        //Check if text contains emoji
        function checkEmoji(emo) {
            let emojientity = ['😄', '😉', '😋', '😍', '😢', '😠'];
            var strip_text = '';
            for (var emoj in emojientity) {

                if (emo.indexOf(emojientity[emoj]) !== -1 && emoj == 0) {
                    strip_text = emo.replace(emojientity[emoj], '');

                }
                else if (strip_text.indexOf(emojientity[emoj]) !== -1) {
                    strip_text = strip_text.replace(emojientity[emoj], '');

                }
            }
            return strip_text;
        }


        function sendMessage(refr, ev, textsm) {

            var text = refr.val() || textsm;
            if (text !== "") {
                refr.val('');
                refr.text('');
                //Calling ApiaiService call
                console.log('globalLpChat', globalLpChat);
                if (globalLpChat) {
                    initDemo();
                } else {
                    processor.askBot(checkEmoji(text) ? checkEmoji(text) : text, text, function (error, html, Liveengage) {
                        if (error) {
                            alert(error); //change into some inline fancy display, show error in chat window.
                        }
                        if (html) {
                            console.log('html LE check -- ', Liveengage);
                            if (Liveengage == true) {
                                globalLpChat = true;
                                initDemo();
                            } else {
                                if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                                    msg_container.siblings("h1").addClass('hidden');
                                    msg_container.siblings("div.chat-text-para").addClass('hidden');
                                    msg_container.siblings(".header-text-logo").removeClass('hidden');
                                    msg_container.removeClass('hidden');

                                }
                                msg_container.append(html);
                                utils.scrollSmoothToBottom($('div.chat-body'));
                                msg_container.find("button").prop("disabled", true);
                                msg_container.find("a").prop("disabled", true);
                            }
                        }
                    });
                }
                ev.preventDefault();
            }
        }
        var chatKeyPressCount = 0;
        //Checking Source
        var isWeb = $('#webchat').context.URL;



        if (config.accessToken && config.chatServerURL) {
            var processor = apiService();
        }

        if (!processor) {
            throw new Error("Message processing manager is not defined!");
        }

        var msg_container = $("ul#msg_container");
        if (msg_container.find('li').length == 0) {
            msg_container.siblings("h1").removeClass('hidden');
            msg_container.siblings("div.chat-text-para").removeClass('hidden');
            msg_container.siblings(".header-text-logo").addClass('hidden');
        } else {
            msg_container.siblings("h1").addClass('hidden');
            msg_container.siblings(".chat-text-para").addClass('hidden');
            msg_container.siblings(".header-text-logo").removeClass('hidden');

        }
        $("a#btn-send-message").click(function (e) {
            sendMessage($("#btn-input"), e);
        });
        //Chatbox Send message
        $("textarea#btn-input").keypress(function (e) {
            if (e.which == 13) {
                if ($.trim($(this).val()) != "") {
                    sendMessage($(this), e);
                }
            }

        });
        let urlIframe = new URL(document.location.href);
        let searchAlgorithym = urlIframe.searchParams.get('search');


        if (searchAlgorithym) {

            let htmlc = 0;
            processor.askBot(searchAlgorithym, searchAlgorithym, function (error, html, Liveengage) {

                if (error) {
                    alert(error); //change into some inline fancy display, show error in chat window.
                }
                if (html && htmlc == 1) {

                    if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                        msg_container.siblings("h1").addClass('hidden');
                        msg_container.siblings("div.chat-text-para").addClass('hidden');
                        msg_container.siblings(".header-text-logo").removeClass('hidden');
                        msg_container.removeClass('hidden');
                    }
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
                htmlc++;
            })
        }
        //Quick Replies payload button Click
        $(document).on('click', '.QuickreplybtnPayload', function (e) {
            var textInput = $(this).text();
            var payloadInput = $(this).data().quickrepliespayload;
            $(this).parent().find("button").prop("disabled", true)
            $(this).parent().find("a").prop("disabled", true)
            if (!payloadInput.match(/http/g)) {
                processor.askBot(payloadInput, textInput, function (error, html, Liveengage) {
                    if (error) {
                        console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                    }
                    if (html) {
                        msg_container.append(html);
                        utils.scrollSmoothToBottom($('div.chat-body'));

                    }
                });
            }
            else {
                window.open(payloadInput, '_blank');
            }
            e.preventDefault();
        });
        //Card Response Postback button
        $(document).on('click', '.cardresponsepayload', function (e) {
            var textInput = $(this).text();
            var payloadInput = $(this).data().cardpayloadbutton;
            console.log('Button Payload' + payloadInput);
            $(this).parent().find("button").prop("disabled", true)
            $(this).parent().find("a").prop("disabled", true)
            processor.askBot(payloadInput, textInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });
        //List Response Postback button
        $(document).on('click', '.listresponsepayload', function (e) {
            var payloadInput = $(this).attr('data');
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });
        //Carousel Response Postback button
        $(document).on('click', '.caroselresponsepayload', function (e) {
            var payloadInput = $(this).data().carouselpayloadbutton;
            $(this).parent().find("a").prop("disabled", true)
            $(this).parent().find("button").prop("disabled", true)
            if (!payloadInput.match(/http/g)) {
                processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                    if (error) {
                        console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                    }
                    if (html) {
                        msg_container.append(html);
                        utils.scrollSmoothToBottom($('div.chat-body'));
                    }
                });
            }
            else {
                window.open(payloadInput, '_blank');
            }
            e.preventDefault();
        });

        // airling boarding pass Postback button
        $(document).on('click', '.airlineBoardingViewButton', function (e) {
            //var payloadInput = $(this).data().airlineBoardingButton;
            var payloadInput = "AirlineBoarding_BarCode";
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });

        // generic Template
        $(document).on('click', '.genericTemplateClick', function (e) {
            var payloadInput = $(this).attr("data");
            console.log('Button Payload' + payloadInput);
            window.open(payloadInput, "__blank", 'width=1024,height=700,resizable=no');
            e.preventDefault();
        });
        $(document).on('click', '.genericTemplate', function (e) {
            var payloadInput = $(this).attr("data");;
            console.log('Button Payload' + payloadInput);
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });
        $(document).on('click', '.buyClick', function (e) {
            var payloadInput = $(this).attr("data");;
            console.log('Button Payload' + payloadInput);
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });
        // Quick Reply Postback button
        $(document).on('click', '.apiQuickreplybtnPayload', function (e) {
            var payloadInput = $(this).data().apiquickrepliespayload;
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });
        // Airline Checkin Postback button
        $(document).on('click', '.airlineCheckinButton', function (e) {
            //var payloadInput = $(this).data().airlineBoardingButton;
            var payloadInput = "Checkin";
            console.log('Button Payload' + payloadInput);
            processor.askBot(payloadInput, payloadInput, function (error, html, Liveengage) {
                if (error) {
                    console.log("error occured while processing your Request") //change into some inline fancy display, show error in chat window.
                }
                if (html) {
                    msg_container.append(html);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                }
            });
            e.preventDefault();
        });

        $("#btndownload").on('click', function (e) {
            e.preventDefault();
            var url = $('.img-circle').data().src;
            window.location = (url, 'Download');
        });

        //Disabling Header,Right Click and Developer windows Functionality for Web
        if (isWeb != null || isWeb != undefined) {
            $('.showheader').hide();
            $("chat-body").on("contextmenu", function (e) {
                return false;
            });

            $(document).keydown(function (event) {
                if (event.keyCode == 123) {
                    return false;
                }
                else if (event.ctrlKey && event.shiftKey && event.keyCode == 73) {
                    return false;  //Prevent from ctrl+shift+i
                }
            });
        }



        var appKey = '721c180b09eb463d9f3191c41762bb68',
            logsStarted = false,
            engagementData = {},
            getEngagementMaxRetries = 25,
            chatWindow,
            chatContainer,
            chat,
            chatState,
            chatArea,
            logsLastChild;



        function initDemo() {
            initChat(getEngagement);
        }

        function createWindow() {
            chatContainer = $('#chatWindow');
            startChat();
        }

        function initChat(onInit) {
            var help;
            var chatConfig = {
                lpNumber: 57340919,
                appKey: appKey,
                onInit: [onInit, function (data) {
                    console.log('onInit', data);
                }],
                onInfo: function (data) {
                    console.log('onInfo', data);
                },
                onLine: [addLines, function (data) {
                    console.log('onLine', data);
                }],
                onState: [updateChatState, function (data) {
                    console.log('onState', data);
                }],
                onStart: [updateChatState, bindEvents, bindInputForChat, function (data) {
                    console.log('onStart', data);
                }],
                onStop: [updateChatState, unBindInputForChat],
                onAddLine: function (data) {
                    console.log('onAddLine', data);
                },
                onAgentTyping: [agentTyping, function (data) {
                    console.log('onAgentTyping', data);
                }],
                onRequestChat: function (data) {
                    console.log('onRequestChat', data);
                },
                onEngagement: function (data) {
                    if ('Available' === data.status) {
                        createEngagement(data);
                        console.log('onEngagement', data);
                    }
                    else if ('NotAvailable' === data.status) {

                        offline();
                        console.log('onEngagement', data);
                    }
                    else {
                        if (getEngagementMaxRetries > 0) {
                            console.log('Failed to get engagement. Retry number ' + getEngagementMaxRetries, data);
                            window.setTimeout(getEngagement, 100);
                            getEngagementMaxRetries--;
                        }
                    }
                }
            };
            chat = new lpTag.taglets.ChatOverRestAPI(chatConfig);


        }

        function getEngagement() {
            chat.getEngagement();
        }

        function createEngagement(data) {
            // var $engagement = $('<button id="engagement" class="btn-lg">Start Chat</button>');
            // $engagement.click(function(){
            engagementData = data;
            createWindow();
            // });
            // $engagement.appendTo($('#engagementPlaceholder'));
        }

        function startChat() {
            engagementData = engagementData || {};
            engagementData.engagementDetails = engagementData.engagementDetails || {};
            var chatRequest = {
                LETagVisitorId: engagementData.visitorId || engagementData.svid,
                LETagSessionId: engagementData.sessionId || engagementData.ssid,
                LETagContextId: engagementData.engagementDetails.contextId || engagementData.scid,
                skill: engagementData.engagementDetails.skillName,
                engagementId: engagementData.engagementDetails.engagementId || engagementData.eid,
                campaignId: engagementData.engagementDetails.campaignId || engagementData.cid,
                language: engagementData.engagementDetails.language || engagementData.lang
            };
            console.log('startChat', chatRequest);
            chat.requestChat(chatRequest);
        }

        //Add lines to the chat from events
        function addLines(data) {
            console.log('data added --- ', data);
            var linesAdded = false;
            for (var i = 0; i < data.lines.length; i++) {
                var line = data.lines[i];
                if (line.source !== 'visitor' || chatState != chat.chatStates.CHATTING) {
                    var msg_container = $("ul#msg_container");
                    var html_div = '<li class="animated fadeInLeft list-group-item background-color-custom"><table border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;"><img width="35" height="35" src="avatar/logo-large.png"/></td><td><div class="media-body bot-txt-space"><p class="list-group-item-text-bot">' + line.text + '</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="./avatar/bot-logo-image.png"/>' + utils.currentTime() + '</small></p></div></td></tr></table></li>';
                    if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                        msg_container.siblings("h1").addClass('hidden');
                        msg_container.siblings("div.chat-text-para").addClass('hidden');
                        msg_container.siblings(".header-text-logo").removeClass('hidden');
                        msg_container.removeClass('hidden');
                    }
                    msg_container.append(html_div);
                    utils.scrollSmoothToBottom($('div.chat-body'));
                    // var chatLine = createLine(line);
                    // addLineToDom(chatLine);
                    linesAdded = true;
                }
            }
            if (linesAdded) {
                scrollToBottom();
            }
        }

        //Create a chat line
        function createLine(line) {
            var div = document.createElement('P');
            div.innerHTML = '<b>' + line.by + '</b>: ';
            var msg_container = $("ul#msg_container");
            if (line.source === 'visitor') {
                //div.appendChild(document.createTextNode(line.text));
                var html_div = '<li class="animated fadeInLeft list-group-item background-color-custom"><table border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;"><img width="35" height="35" src="avatar/logo-large.png"/></td><td><div class="media-body bot-txt-space"><p class="list-group-item-text-bot">' + line.text + '</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="./avatar/bot-logo-image.png"/>' + utils.currentTime() + '</small></p></div></td></tr></table></li>';
                if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                    msg_container.siblings("h1").addClass('hidden');
                    msg_container.siblings("div.chat-text-para").addClass('hidden');
                    msg_container.siblings(".header-text-logo").removeClass('hidden');
                    msg_container.removeClass('hidden');
                }
                msg_container.append(html_div);
                utils.scrollSmoothToBottom($('div.chat-body'));
            } else {
                //div.innerHTML += line.text;
                var html_div = '<li class="animated fadeInLeft list-group-item background-color-custom"><table border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;"><img width="35" height="35" src="avatar/logo-large.png"/></td><td><div class="media-body bot-txt-space"><p class="list-group-item-text-bot">' + line.text + '</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="./avatar/bot-logo-image.png"/>' + utils.currentTime() + '</small></p></div></td></tr></table></li>';
                if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                    msg_container.siblings("h1").addClass('hidden');
                    msg_container.siblings("div.chat-text-para").addClass('hidden');
                    msg_container.siblings(".header-text-logo").removeClass('hidden');
                    msg_container.removeClass('hidden');
                }
                msg_container.append(html_div);
                utils.scrollSmoothToBottom($('div.chat-body'));
            }
            return div;
        }

        //Add a line to the chat view DOM
        function addLineToDom(line) {
            if (!chatArea) {
                chatArea = chatContainer.find('#chatLines');
                chatArea = chatArea && chatArea[0];
            }
            chatArea.append(line);
        }

        //Scroll to the bottom of the chat view
        function scrollToBottom() {
            if (!chatArea) {
                chatArea = chatContainer.find('#chatLines');
                chatArea = chatArea && chatArea[0];
            }
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        //Sends a chat line
        function sendLine() {
            var $textline = chatContainer.find('#textline');
            var text = $textline.val();
            if (text && chat) {
                // var line = createLine({
                //     by: chat.getVisitorName(),
                //     text: text,
                //     source: 'visitor'
                // });

                chat.addLine({
                    text: text,
                    error: function () {
                        line.className = 'error';
                    }
                });
                // addLineToDom(line);
                var msg_container = $("ul#msg_container");
                var html_div = '<li class="animated fadeInLeft list-group-item background-color-custom"><table border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;"><img width="35" height="35" src="avatar/logo-large.png"/></td><td><div class="media-body bot-txt-space"><p class="list-group-item-text-bot">' + text + '</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="./avatar/bot-logo-image.png"/>' + utils.currentTime() + '</small></p></div></td></tr></table></li>';
                if (msg_container.hasClass('hidden')) { // can be optimimzed and removed from here
                    msg_container.siblings("h1").addClass('hidden');
                    msg_container.siblings("div.chat-text-para").addClass('hidden');
                    msg_container.siblings(".header-text-logo").removeClass('hidden');
                    msg_container.removeClass('hidden');
                }
                msg_container.append(html_div);
                utils.scrollSmoothToBottom($('div.chat-body'));

                // $textline.val('');
                // scrollToBottom();
            }
        }

        //Listener for enter events in the text area
        function keyChanges(e) {
            e = e || window.event;
            var key = e.keyCode || e.which;
            if (key == 13) {
                if (e.type == 'keyup') {
                    sendLine();
                    setVisitorTyping(false);
                }
                return false;
            } else {
                setVisitorTyping(true);
            }
        }

        //Set the visitor typing state
        function setVisitorTyping(typing) {
            if (chat) {
                chat.setVisitorTyping({ typing: typing });
            }
        }

        //Set the visitor name
        function setVisitorName() {
            var name = chatContainer.find('#visitorName').val();
            if (chat && name) {
                chat.setVisitorName({ visitorName: name });
            }
        }

        //Ends the chat
        function endChat() {
            if (chat) {
                chat.endChat({
                    disposeVisitor: true,
                    success: function () {
                        chatWindow.close();
                    }
                });
            }
        }

        //Sends an email of the transcript when the chat has ended
        function sendEmail() {
            var email = chatContainer.find('#emailAddress').val();
            if (chat && email) {
                chat.requestTranscript({ email: email });
            }
        }

        //Sets the local chat state
        function updateChatState(data) {
            if (data.state === 'ended' && chatState !== 'ended') {
                chat.disposeVisitor();
            }
            chatState = data.state;
        }

        function agentTyping(data) {
            if (data.agentTyping) {
                chatWindow.setFooterContent('Agent is typing...');
            } else {
                chatWindow.setFooterContent('');
            }
        }

        function bindInputForChat() {
            chatContainer.find('#sendButton').removeAttr('disabled').click(sendLine);
            chatContainer.find('#chatInput').keyup(keyChanges).keydown(keyChanges);
        }

        function unBindInputForChat() {
            chatContainer.find('#sendButton').off();
            chatContainer.find('#chatInput').off();
        }

        function bindEvents() {
            chatContainer.find('#closeChat').click(endChat);
            chatContainer.find('#setvisitorName').click(setVisitorName);
            chatContainer.find('#sendTranscript').click(sendEmail);
        }

        // function console.log(logName, data) {
        //     var log = document.createElement('DIV');
        //     try {
        //         data = typeof data === 'string' ? data : JSON.stringify(data);
        //     } catch (exc) {
        //         return;
        //     }
        //     var time = new Date().toTimeString().slice(0, 8);
        //     log.innerHTML = time + ' ' + logName + (data ? ' : ' + data : '');
        //     if (!logsStarted) {
        //         document.getElementById('logs').appendChild(log);
        //         logsStarted = true;
        //     } else {
        //         document.getElementById('logs').insertBefore(log, logsLastChild);
        //     }
        //     logsLastChild = log;

        // }

        function offline() {
            var line = createLine({
                by: "Optus",
                text: "There are no live agents available at this time. Would you like to leave a message and have a Optus support representative contact you?",
                source: 'visitor'
            });
            chat.addLine({
                text: "There are no live agents available at this time. Would you like to leave a message and have a Optus support representative contact you?",
                error: function () {
                    line.className = 'error';
                }
            });
            chatContainer = $('#chatWindow');
            chatArea = chatContainer.find('#chatLines');
            chatArea.append(line);
        }



    });
});
