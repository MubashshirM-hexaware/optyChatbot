/* -------------------------------------------------------------------
Copyright (c) 2017-2017 Hexaware Technologies
This file is part of the Innovation LAB - Offline Bot.
------------------------------------------------------------------- */


define(['jquery', 'settings', 'utils', 'messageTemplates', 'cards', 'uuid'],
    function ($, config, utils, messageTpl, cards, uuidv1) {
        var fallbackCount = 0;
        var oFallbackCount = 0;
        let conversation = [];
        let botHistory = [];
        let messageConversation = "";
        class ApiHandler {

            constructor() {
                let uuid = !localStorage.getItem('uuid') ? localStorage.setItem('uuid', uuidv1()) : localStorage.getItem('uuid');

                this.options = {
                    sessionId: uuid,
                    lang: "en"
                };

            }

            userSays(userInput, callback) {

                callback(null, messageTpl.userplaintext({
                    "payload": userInput,
                    "senderName": config.userTitle,
                    "senderAvatar": config.userAvatar,
                    "time": utils.currentTime(),
                    "className": 'pull-right'
                }));
            }
            askBot(userInput, userText, isContextReset, callback) {
                this.userSays(userText, callback);
                var msg_container = $("ul#msg_container");
                this.options.query = userInput;
                this.options.resetContexts = isContextReset;
                let history = {};
                history.userInput = userInput;
                messageConversation += `Charlotte: ${userInput}\n` 
                botHistory.push({uId: '', message: userInput, userName: 'Charlotte'});  

                $.ajax({
                    type: "POST",
                    url: "/webhook",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    headers: {
                        "Authorization": "Bearer " + config.accessToken
                    },
                    beforeSend: function () {
                        msg_container.parent().append(`<img class="loading-gif-typing"src="/images/ellipsis.gif"  style="text-align:left;"  />`)
                    },
                    data: JSON.stringify(this.options),
                    success: function (response) {
                        if (msg_container && msg_container.parent() && msg_container.parent().find("img.loading-gif-typing").html()) {
                            msg_container.parent().find("img.loading-gif-typing").remove();
                        }
                        msg_container.parent().find("img.loading-gif-typing").remove();
                        let isCardorCarousel = false;
                        let isImage = false;
                        let isQuickReply = false;
                        let isQuickReplyFromApiai = false;
                        //Media attachment
                        let isVideo = false;
                        let videoUrl = null;
                        let isAudio = false;
                        let audioUrl = null;
                        let isFile = false;
                        let fileUrl = null;
                        let isReceipt = false;
                        let receiptData = null;
                        let isList = false;
                        let imageUrl;
                        // airline onboarding
                        let isAirlineBoardingPass = false;
                        let isViewBoardingPassBarCode = false;
                        let isAirlineCheckin = false;
                        let isAirlingFlightUpdate = false;
                        //Generic Template
                        let genericTemplate = false;
                        let genericElement = null;
                        let genericBuy = false;
                        let genericCheckout = null;
                        //To find Card || Carousel
                        let count = 0;
                        let hasbutton;
                        console.log('result *** ', JSON.stringify(response.result));
                        var dataList = document.getElementById('msg_container').getElementsByTagName("li");
                        // if (config.incompleteTran.includes(response.result.action)) {
                        //     console.log('Inside incomplete');
                        //     return utils.writeIncompleteTran(response.result, "PostLogin", "BroadBand", function (err, res) {
                        //         console.log(res);
                        //     });
                        // }

                        if (response.result.fulfillment.speech) {
                            messageConversation += `Bot: ${response.result.fulfillment.speech}\n`;
                            botHistory.push({uId: '', message: response.result.fulfillment.speech, userName: 'Bot'});
                            console.log('Inside response.result.fulfillment.speech',botHistory);
                            //messageConversation.Bot = response.result.fulfillment.speech;
                        }
                        if (response.result.fulfillment.hasOwnProperty("displayText")) {
                          messageConversation += `Bot: ${response.result.fulfillment.displayText}\n`;
                          botHistory.push({uId: '', message: response.result.fulfillment.displayText, userName: 'Bot'});
                          console.log('Inside response.result.fulfillment.hasOwnProperty("displayText")',botHistory);
                            //messageConversation.Bot = response.result.fulfillment.displayText;
                        }
                        if (response.result.fulfillment.messages.length > 0) {
                            if (response.result.fulfillment.messages[0].hasOwnProperty("title")) {
                                history.botresponse = response.result.fulfillment.messages[0].title;
                                messageConversation += `Bot: ${response.result.fulfillment.messages[0].title}\n`;
                                botHistory.push({uId: '', message: response.result.fulfillment.messages[0].title, userName: 'Bot'});
                                console.log('Inside hasOwnProperty("title")',botHistory);
                                //messageConversation.Bot = response.result.fulfillment.messages[0].title;
                            }
                            if (response.result.fulfillment.messages[0].hasOwnProperty("payload") && response.result.fulfillment.messages[0].payload.hasOwnProperty("facebook") && response.result.fulfillment.messages[0].payload.facebook.hasOwnProperty("text")) {
                                history.botresponse = response.result.fulfillment.messages[0].payload.facebook.text;
                                messageConversation += `Bot: ${response.result.fulfillment.messages[0].payload.facebook.text}\n`;
                                botHistory.push({uId: '', message: response.result.fulfillment.messages[0].payload.facebook.text, userName: 'Bot'});
                                console.log('Inside hasOwnProperty("payload")',botHistory);
                                //messageConversation.Bot = response.result.fulfillment.messages[0].payload.facebook.text;
                            }
                        }
                        if (localStorage.getItem('clientid')) {
                            $.ajax({
                                type: "POST",
                                url: "/chathistory",
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                data: JSON.stringify({
                                    chattext: messageConversation,
                                    custid: localStorage.getItem('clientid')
                                }),
                                success: function (response) {
                                    console.log("success");
                                    messageConversation = '';
                                },
                                error: function () {

                                }
                            });


                        };
                        conversation.push(history);

                        if (response.result.action == "input.unknown") {
                            fallbackCount++;
                            oFallbackCount++;
                            //console.log('==== ',oFallbackCount);
                        } else {
                            fallbackCount = 0;
                        }

                        if (response.result.action == "Optus") {
                            // if (response.result.metadata.intentName == "CONNECT") {
                                localStorage.setItem("chatTranscript", JSON.stringify(botHistory));
                                console.log("Inside connect", JSON.stringify(response.result));
                                let sessionId = !localStorage.getItem('uuid') ? localStorage.setItem('uuid', uuidv1()) : localStorage.getItem('uuid');
                                utils.initiateAjax("/connectToAgent", "POST", {
                                    userName: "",
                                    userType: "Customer",
                                    sessionId: sessionId
                                }, function (data, err) {
                                    console.log("---------------Connection Established----------------------");
                                    if (err) {
                                        console.log("Error ", JSON.stringify(err));
                                    } else {
                                        console.log("Data", JSON.stringify(data));
                                        console.log("messageConversation", JSON.stringify(botHistory));
                                        let agenthtml = '';
                                        if (data.success) {
                                            console.log("connect true");
                                            localStorage.setItem("connect", true);
                                            console.log(JSON.parse(localStorage.getItem('chatTranscript')))
                                            console.log("messageConversation qewry");
                                            agenthtml = `<li class="animated fadeInLeft list-group-item background-color-custom">
                                                            <table border="0" cellpadding="0" cellspacing="0">
                                                            <tbody><tr>
                                                            <td style="vertical-align:top;">
                                                                <img width="35" height="35" class="bot-logo-image" style="border:none;"></td>
                                                                <td><div class="media-body bot-txt-space">
                                                                    <p class="list-group-item-text-bot">` + data.message + `</p>
                                                                    <p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" class="welcome-message" width="20" height="20">12:37 pm</small></p>
                                                    
                                                                </div></td>
                                                                </tr>
                                                            </tbody></table>                
                                                            </li>`;
                                            msg_container.append(agenthtml);
                                            utils.scrollSmoothToBottom($('div.chat-body'));
                                            setTimeout(() => {
                                                msg_container.find("li:nth-last-child(2)").find("button").prop("disabled", true);
                                                msg_container.find("li:nth-last-child(2)").find("a").prop("disabled", true);
                                            }, 2000)

                                        }
                                    }
                                })
                            // }
                            // utils.captureTranscript(dataList);
                            // fallbackCount, oFallbackCount = 0;
                            // callback(null, "Liveengage");
                        } else if (fallbackCount > 2 || oFallbackCount > 10) {
                            utils.captureTranscript(dataList);
                            fallbackCount, oFallbackCount = 0;
                            var html_div = `<li class="animated fadeInLeft list-group-item background-color-custom"><table border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;"><img width="35" height="35" src="avatar/logo-large.png"/></td><td><div class="media-body bot-txt-space"><p class="list-group-item-text-bot">I can't understand your queries, so am transferring you to a human agent. Please wait...</p><p class="bot-res-timestamp"><small> <img style="border-radius:50%;border:2px solid white;" width="20" height="20" src="./avatar/bot-logo-image.png"/>` + utils.currentTime() + `</small></p></div></td></tr></table></li>`;
                            if (msg_container.hasClass('hidden')) { // cans be optimimzed and removed from here
                                msg_container.siblings("h1").addClass('hidden');
                                msg_container.siblings("div.chat-text-para").addClass('hidden');
                                msg_container.siblings(".header-text-logo").removeClass('hidden');
                                msg_container.removeClass('hidden');
                            }
                            msg_container.append(html_div);
                            utils.scrollSmoothToBottom($('div.chat-body'));
                            callback(null, "Liveengage");
                        } else if (response.result.fulfillment.messages) {
                            console.log(response.result.fulfillment.messages);
                            for (let i in response.result.fulfillment.messages) {
                                if (response.result.fulfillment.messages[i] && response.result.fulfillment.messages[i].hasOwnProperty('type')) {
                                    if (response.result.fulfillment.messages[i].type == 0 && response.result.fulfillment.messages[i].speech != "") {

                                        let cardHTML = cards({
                                            "payload": response.result.fulfillment.messages[i].speech,
                                            "senderName": config.botTitle,
                                            "senderAvatar": config.botAvatar,
                                            "time": utils.currentTime(),
                                            "className": ''
                                        }, "plaintext");
                                        callback(null, cardHTML);
                                    }
                                    if (response.result.fulfillment.messages[i].type == 1) {
                                        count = count + 1;
                                        hasbutton = (response.result.fulfillment.messages[i].buttons.length > 0) ? true : false;
                                        isCardorCarousel = true;
                                    }
                                    if (response.result.fulfillment.messages[i].type == 2) {
                                        isQuickReplyFromApiai = true;
                                    }
                                    if (response.result.fulfillment.messages[i].type == 3) {
                                        isImage = true;
                                    }
                                    let msgfulfill = response.result.fulfillment.messages[i];

                                    if (msgfulfill && msgfulfill.type == 4 && msgfulfill.hasOwnProperty("payload") && msgfulfill.payload.hasOwnProperty("facebook")) {
                                        //Quick Replies
                                        if (msgfulfill.payload.facebook.hasOwnProperty("quick_replies")) {
                                            isQuickReply = (msgfulfill.payload.facebook.quick_replies.length > 0) ? true : false;

                                        }

                                        if (msgfulfill.payload.facebook.hasOwnProperty("attachment")) {
                                            count = count + 1;
                                            response.result.fulfillment.messages = response.result.fulfillment.messages[i]["payload"]["facebook"]["attachment"]["payload"]["elements"]

                                            for (let j in response.result.fulfillment.messages) {
                                                response.result.fulfillment.messages[j]["type"] = 1
                                                response.result.fulfillment.messages[j]["imageUrl"] = response.result.fulfillment.messages[j]["image_url"]
                                            }

                                            hasbutton = (response.result.fulfillment.messages[i] && response.result.fulfillment.messages[i].hasOwnProperty("buttons") && response.result.fulfillment.messages[i].buttons.length > 0) ? true : false;
                                            isCardorCarousel = true;
                                        }
                                    }
                                }
                            }
                        } else {
                            let cardHTML = cards({
                                "action": response.result.action,
                                "payload": response.result.fulfillment.speech,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "plaintext");
                            callback(null, cardHTML);
                        }


                        if (isCardorCarousel) {
                            if (count == 1) {
                                let cardHTML = cards({
                                    "action": response.result.action,
                                    "payload": response.result.fulfillment.messages,
                                    "senderName": config.botTitle,
                                    "senderAvatar": config.botAvatar,
                                    "time": utils.currentTime(),
                                    "buttons": hasbutton,
                                    "className": ''
                                }, "card");
                                callback(null, cardHTML);
                            } else {
                                let carouselHTML = cards({
                                    "action": response.result.action,
                                    "payload": response.result.fulfillment.messages,
                                    "senderName": config.botTitle,
                                    "senderAvatar": config.botAvatar,
                                    "time": utils.currentTime(),
                                    "buttons": hasbutton,
                                    "className": ''

                                }, "carousel");
                                callback(null, carouselHTML);
                            }
                        }
                        //Image Response
                        if (isImage) {
                            let cardHTML = cards(response.result.fulfillment.messages, "image");
                            callback(null, cardHTML);
                        }
                        //CustomPayload Quickreplies
                        if (isQuickReply) {
                            let cardHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "quickreplies");
                            callback(null, cardHTML);
                        }
                        //Apiai Quickreply
                        if (isQuickReplyFromApiai) {
                            let cardHTML = cards(response.result.fulfillment.messages, "quickreplyfromapiai");
                            callback(null, cardHTML);
                        }
                        //Video Attachment Payload callback
                        if (isVideo) {
                            let cardHTML = cards({
                                "payload": videoUrl,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "video");
                            callback(null, cardHTML);
                        }
                        //Audio Attachment Payload callback
                        if (isAudio) {
                            let cardHTML = cards({
                                "payload": audioUrl,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "audio");
                            callback(null, cardHTML);
                        }
                        //File Attachment Payload callback
                        if (isFile) {
                            let cardHTML = cards({
                                "payload": fileUrl,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "file");
                            callback(null, cardHTML);
                        }
                        // Receipt Attachment Payload callback
                        if (isReceipt) {
                            let cardHTML = cards({
                                "payload": receiptData,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "receipt");
                            callback(null, cardHTML);
                        }
                        // airline Boarding Pass
                        if (isAirlineBoardingPass) {
                            let boardingPassHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "buttons": hasbutton,
                                "className": ''
                            }, "airlineBoarding");
                            callback(null, boardingPassHTML);
                        }
                        // -----------------------------------

                        // airline Boarding Pass View bar code
                        if (isViewBoardingPassBarCode) {
                            let ViewBoardingPassBarCodeHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "buttons": hasbutton,
                                "className": ''
                            }, "ViewBoardingPassBarCode");
                            callback(null, ViewBoardingPassBarCodeHTML);
                        }
                        // airline Checkin
                        if (isAirlineCheckin) {
                            let CheckinHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "buttons": hasbutton,
                                "className": ''
                            }, "airlineCheckin");
                            callback(null, CheckinHTML);
                        }

                        // airline flight update
                        if (isAirlingFlightUpdate) {
                            let CheckinHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "buttons": hasbutton,
                                "className": ''
                            }, "airlineFlightUpdate");
                            callback(null, CheckinHTML);
                        }

                        // generic template
                        if (genericTemplate) {
                            let cardHTML = cards({
                                "payload": genericElement,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "generic");
                            callback(null, cardHTML);
                        }
                        // List template
                        if (isList) {
                            let cardHTML = cards({
                                "payload": response.result.fulfillment.messages,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "list");
                            callback(null, cardHTML);
                        }
                        // Buy
                        if (genericBuy) {
                            let cardHTML = cards({
                                "payload": genericCheckout,
                                "senderName": config.botTitle,
                                "senderAvatar": config.botAvatar,
                                "time": utils.currentTime(),
                                "className": ''
                            }, "buybutton");
                            callback(null, cardHTML);

                        }

                    },
                    error: function (err) {
                        alert(JSON.stringify(err));
                        callback("Internal Server Error", null);
                    }
                });
            }
        }

        return function (accessToken) {
            return new ApiHandler();
        }
    });