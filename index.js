const Telegraf = require('telegraf');
const BotHash = "653850612:AAGRoODSPCSYUuzecuAQwzPpzx_Q6PYZjCM";
const db = require('./components/db');
const bot = new Telegraf(BotHash);
require('./locale');
lang = "fa";

// Checking blocked users function

function check_block(user_id, callback){
    let mydb = new db();

    // Is user in block collection

    mydb.getOne({
        collection: "block",
        query: {
            user_id: user_id,
        }
    }, (err, res) => {
        if(err){
            console.error(err);
        }else{
            if(res){

                // The user is in block collection

                // Checking block end date

                let d = new Date();
                if(res.end_date > d){

                    // Still blocked

                    // Making end date to show to the user

                    let show_end_time = " " + locale_message.date[lang] + res.end_date.getFullYear() +
                        "/" + res.end_date.getMonth() +
                        "/" + res.end_date.getDate() +
                        " " + locale_message.time[lang] + " " + res.end_date.getHours() +
                        ":" + res.end_date.getMonth();

                    callback({
                        block: true,
                        end_date: show_end_time
                    });
                }else{

                    // Block time has been expired

                    callback({block: false});
                }
            }else{

                // The user is not in the block collection

                callback({block: false});
            }
        }
    });
}

// The user runs start command

bot.start(ctx => {
    ctx.reply(locale_message.start_message[lang], {
        reply_markup: {
            keyboard: [
                [locale_message.keyboard[0][lang], locale_message.keyboard[1][lang], locale_message.keyboard[2][lang]],
            ],
            resize_keyboard: true
        }
    });

    // Checking whether the user is currently in database

    let mydb = new db();
    mydb.getOne({
        collection: "users",
        query: {id: ctx.message.from.id},
        params: {
            fields: ["id"]
        }
    }, (err, res) => {
        if(err){
            console.error(err);
        }else{
            if(!res || !res.id){

                // Saving user information in database

                let user = ctx.message.from;
                user.score = 1;
                mydb.insertOne({
                    collection: "users",
                    data: user
                }, (err, res) => {
                    if(err){
                        console.error(err);
                    }else{

                        // The user saved in database successfully

                    }
                });
            }
        }
    });
});

// The user runs help command

bot.help(ctx => ctx.reply(locale_message.help_message[lang]));

// The user sends voice

bot.on('voice', ctx => {
    try {

        // Checking for block users

        check_block(ctx.message.from.id, (res) => {
            if(res.block){
                ctx.reply(locale_message.block_message[lang] + " " + res.end_date);
            }else{
                // Is the voice forwarded from the channel or from the user

                if(ctx.message.forward_from_chat && ctx.message.forward_from_chat.username === "wtsong"){

                    // The voice is forwarded from the channel, so the user wants to answer it

                    // Getting the song information

                    let mydb = new db();
                    mydb.getOne({
                        collection: "songs",
                        query: {
                            message_id: ctx.message.forward_from_message_id,
                        }
                    }, (err, res) => {
                        if(err){
                            console.error(err);
                        }else{
                            if(res){

                                // Checking whether the song is from himself/herself

                                if(res.user_id === ctx.message.from.id){

                                    // The song is from himself/herself!

                                    ctx.reply(locale_message.self_song_message[lang]);
                                }else{

                                    // The song is not from himself/herself

                                    // Has the song been solved?

                                    if(res.solved){

                                        // The song has been solved

                                        ctx.reply(locale_message.solved_song[lang]);
                                    }else{

                                        // The song has not been solved

                                        bot.telegram.sendMessage(ctx.message.chat.id, locale_message.answer_first_message[lang]);
                                    }
                                }
                            }
                        }
                    });
                }else {

                    // The voice is from the user, Checking whether he/she has unanswered song

                    let mydb = new db();
                    mydb.getOne({
                        collection: "songs",
                        query: {
                            user_id: ctx.message.from.id,
                            solved: false
                        }
                    }, (err, res) => {
                        if(err){
                            console.error(err);
                        }else{
                            if(res){

                                // The user has unanswered song

                                ctx.reply(locale_message.having_unanswered_song[lang]);
                            }else{

                                // The user has no unanswered song, Sending song to the channel

                                bot.telegram.sendVoice("@wtsong", ctx.message.voice.file_id, {
                                    caption: locale_message.unanswered_song_caption[lang].replace("%user%", ctx.message.from.first_name),
                                }).then(res => {
                                    ctx.reply(locale_message.reply_to_voice[lang]);

                                    // Saving voice information in the database

                                    mydb.insertOne({
                                        collection: "songs",
                                        data: {
                                            user_id: ctx.message.from.id,
                                            file: ctx.message.voice.file_id,
                                            message_id: res.message_id,
                                            chat_id: ctx.message.chat.id,
                                            solved: false,
                                        }
                                    }, (err, res) => {
                                        if(err){
                                            console.error(err);
                                        }else{

                                            // Voice information saved

                                        }
                                    });
                                });
                            }
                        }
                    });
                }
            }
        });
    }catch (e) {
        console.error(e);
    }
});

// The user sends text

bot.on('text', ctx => {
    try{

        // Checking for block users

        check_block(ctx.message.from.id, (res) => {
            if(res.block){
                ctx.reply(locale_message.block_message[lang] + " " + res.end_date);
            }else{
                let mydb = new db();
                if(ctx.message.reply_to_message && ctx.message.reply_to_message.forward_from_chat && ctx.message.reply_to_message.forward_from_chat.username === "wtsong"){

                    // The user has replied on a forwarded message from the channel
                    // Whether he/she wants to answer it, or it is his/her song and wants to remove it

                    // Getting id of the message

                    let message_id = ctx.message.reply_to_message.forward_from_message_id;

                    // Getting information of the song

                    mydb.getOne({
                        collection: "songs",
                        query: {
                            message_id: message_id,
                        }
                    }, (err, res) => {
                        if(err){
                            console.error(err);
                        }else{
                            if(!res){

                                // The song does not exist in the database

                                ctx.reply(locale_message.song_removed[lang]);
                            }else{

                                // The song is in the database

                                // Checking whether the song is his/hers or not

                                if(res.user_id === ctx.message.from.id) {

                                    // It's his/hers

                                    // If the user has sent 1 wants to remove it

                                    if(ctx.message.text === "1" || ctx.message.text === "۱"){

                                        // Remove the song from the channel

                                        bot.telegram.deleteMessage("@wtsong", message_id);

                                        // Remove the song from the database

                                        mydb.deleteOne({
                                            collection: "songs",
                                            query: {message_id: message_id}
                                        }, (err, res) => {
                                            if(err){
                                                console.error(err);
                                            }else{

                                                // The song has been deleted

                                                ctx.reply(locale_message.song_deleted[lang]);
                                            }
                                        });
                                    }else{

                                        // The user wants to answer his/her own song!

                                        ctx.reply(locale_message.self_song_message[lang]);
                                    }
                                }else{

                                    // It's not his/her song

                                    // Checking the song has not been solved

                                    if(res.solved){

                                        // It has been solved

                                        ctx.reply(locale_message.solved_song[lang]);
                                    }else{

                                        // The song has not been solved

                                        // Checking the user has not answered this song before

                                        mydb.getOne({
                                            collection: "answers",
                                            query: {
                                                user_id: ctx.message.from.id,
                                                message_id: message_id
                                            }
                                        }, (err, res) => {
                                            if(err){
                                                console.error(err);
                                            }else{
                                                if(res){

                                                    // The user has answered this song before

                                                    ctx.reply(locale_message.answered_before[lang]);
                                                }else{

                                                    // The user has not answered this song yet

                                                    // Loading sender's id to send the answer

                                                    mydb.getOne({
                                                        collection: "songs",
                                                        query: {message_id: message_id},
                                                        params: {
                                                            fields: ["chat_id"]
                                                        }
                                                    }, (err, res) => {
                                                        if(err){
                                                            console.error(err);
                                                        }else{

                                                            // Saving the answer to the database

                                                            mydb.insertOne({
                                                                collection: "answers",
                                                                data: {
                                                                    user_id: ctx.message.from.id,
                                                                    chat_id: ctx.message.chat.id,
                                                                    message_id: message_id,
                                                                    answer: ctx.message.text
                                                                }
                                                            }, (err, ans_res) => {
                                                                if(err){
                                                                    console.error(err);
                                                                }else{
                                                                    // The answer has been saved
                                                                }
                                                            });

                                                            // Sending the answer to the sender

                                                            let message = locale_message.user_has_answered_you[lang]
                                                                .replace("%user%", ctx.message.from.first_name)
                                                                .replace("%answer%", ctx.message.text);
                                                            bot.telegram.sendMessage(res.chat_id, message, {
                                                                reply_markup: {
                                                                    inline_keyboard: [
                                                                        [
                                                                            {
                                                                                text: locale_message.junk[lang],
                                                                                callback_data: ctx.message.from.id + "|" + ctx.message.chat.id + "|" + message_id + "|" + "junk"
                                                                            },
                                                                            {
                                                                                text: locale_message.wrong[lang],
                                                                                callback_data: ctx.message.from.id + "|" + ctx.message.chat.id + "|" + message_id + "|" + "wrong"
                                                                            },
                                                                            {
                                                                                text: locale_message.correct[lang],
                                                                                callback_data: ctx.message.from.id + "|" + ctx.message.chat.id + "|" + message_id + "|" + "correct"
                                                                            },
                                                                        ]
                                                                    ]
                                                                }
                                                            }).then(res => {
                                                                // console.log(res);
                                                            });

                                                            // Send an appropriate message to the user answered

                                                            ctx.reply(locale_message.message_to_who_answered[lang]);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    });
                }else{
                    switch (ctx.message.text) {
                        case locale_message.sending_song[lang]:
                            ctx.reply(locale_message.hold_the_mic_and_record[lang]);
                            break;
                        case locale_message.help[lang]:
                            ctx.reply(locale_message.help_message[lang]);
                            break;
                        case locale_message.remove_song[lang]:

                            // Getting user's songs from database

                            mydb.getMany({
                                collection: "songs",
                                query: {user_id: ctx.message.from.id}
                            }, (err, res) => {
                                if(err){
                                    console.error(err);
                                }else{
                                    if(res && res.length > 0){
                                        for(let i = 0; i < res.length; i++){
                                            let song_message_id = res[i].message_id;
                                            bot.telegram.forwardMessage(ctx.message.chat.id, "@wtsong", song_message_id)
                                        }
                                        ctx.reply(locale_message.remove_song_message[lang]);
                                    }else{

                                        // Has no song

                                        ctx.reply(locale_message.has_no_song[lang]);
                                    }
                                }
                            });
                            break;
                        default:
                            break;
                    }
                }
            }
        });
    }catch (e) {
        console.error(e);
    }
});

// The user has clicked on the buttons under the answer

bot.on('callback_query', ctx => {
    let data = ctx.update.callback_query.data;
    let data_array = data.split("|");
    let user_id = parseInt(data_array[0]);
    let chat_id = parseInt(data_array[1]);
    let msg_id = parseInt(data_array[2]);
    let ans = data_array[3];
    let mydb = new db();

    // Checking for previous feedback

    mydb.getOne({
        collection: "answers",
        query: {
            user_id: user_id,
            message_id: msg_id,
        }
    }, (err, res) => {
        if(err){
            console.error(err);
        }else{
            if(res){
                if(res.feedback){

                    // Has given feedback before

                    ctx.answerCbQuery(locale_message.one_time_feedback[lang]);
                }else{

                    // Has not given feedback

                    // The answer given

                    let answer = res.answer;

                    // Saving the feedback in the database

                    mydb.updateOne({
                        collection: "answers",
                        query: {
                            user_id: user_id,
                            message_id: msg_id,
                        },
                        values: {feedback: ans}
                    }, (err, res) => {
                        if(err){
                            console.error(err);
                        }else{

                            // The feedback has been saved in database

                        }
                    });

                    // Getting current score of the answerer user

                    mydb.getOne({
                        collection: "users",
                        query: {id: user_id},
                    }, (err, res) => {
                        if(err){
                            console.error(err);
                        }else{

                            // current score of the answerer user

                            let score = res.score;
                            let responder_name = res.first_name;

                            switch (ans) {
                                case "correct":

                                    // The answer was correct

                                    ctx.answerCbQuery(locale_message.correct_answer_message[lang]);

                                    // Increasing the answerer score

                                    score++;

                                    // Send a message to the answerer

                                    bot.telegram.sendMessage(chat_id, locale_message.correct_answer_message_to_answerer[lang] + score);

                                    // Saving the answerer score in database

                                    mydb.updateOne({
                                        collection: "users",
                                        query: {
                                            id: user_id,
                                        },
                                        values: {
                                            score: score
                                        }
                                    }, (err, res) => {
                                        if(err){
                                            console.error(err);
                                        }else{

                                            // The score saved

                                        }
                                    });

                                    // Updating the song message as solved

                                    mydb.updateOne({
                                        collection: "songs",
                                        query: {message_id: msg_id},
                                        values: {solved: true}
                                    }, (err, res) => {
                                        if(err){
                                            console.error(err);
                                        }else{

                                            // The song has updated as solved in database

                                            // Updating the song caption in channel as solved

                                            bot.telegram.editMessageCaption("@wtsong", msg_id, msg_id, locale_message.solved_song_caption[lang]);
                                        }
                                    });

                                    break;
                                case "wrong":

                                    // The answer is wrong

                                    ctx.answerCbQuery(locale_message.wrong_answer_message[lang]);

                                    // Send a message to the answerer

                                    bot.telegram.sendMessage(chat_id, locale_message.wrong_answer_message_to_answerer[lang]);
                                    break;
                                case "junk":

                                    // The answer is junk

                                    ctx.answerCbQuery(locale_message.junk_answer_message[lang]);

                                    // Decreasing answerer's score

                                    score--;

                                    // Send a message to the answerer

                                    bot.telegram.sendMessage(chat_id, locale_message.junk_answer_message_to_answerer[lang]);

                                    // Saving new score in database

                                    mydb.updateOne({
                                        collection: "users",
                                        query: {
                                            id: user_id,
                                        },
                                        values: {
                                            score: score
                                        }
                                    }, (err, res) => {
                                        if(err){
                                            console.error(err);
                                        }else{

                                            // New score saved

                                        }
                                    });

                                    // If the score is negative the user should be blocked

                                    if(score < 0){

                                        // Calculating block duration and block end date

                                        let end_date = new Date();
                                        let block_duration = 0;
                                        let block_message = "";
                                        switch(true){
                                            case score === -1:
                                                block_duration = 1;
                                                block_message = locale_message.block24h[lang];
                                                break;
                                            case score === -2:
                                                block_duration = 7;
                                                block_message = locale_message.block1w[lang];
                                                break;
                                            case score === -3:
                                                block_duration = 30;
                                                block_message = locale_message.block1m[lang];
                                                break;
                                            case score <= -4:
                                                block_duration = 365;
                                                block_message = locale_message.block1y[lang];
                                                break;
                                        }
                                        end_date.setDate(end_date.getDate() + block_duration);

                                        // Saving the user in block collection

                                        // Is he/she already in block collection?

                                        mydb.getOne({
                                            collection: "block",
                                            query: {user_id: user_id}
                                        }, (err, res) => {
                                            if(err){
                                                console.error(err);
                                            }else{
                                                if(res){

                                                    // He/She is already in block collection, updating it

                                                    mydb.updateOne({
                                                        collection: "block",
                                                        query: {user_id: user_id},
                                                        values: {end_date: end_date}
                                                    }, (err, res) => {});
                                                }else{

                                                    // He/She is not in block collection, inserting it

                                                    mydb.insertOne({
                                                        collection: "block",
                                                        data: {
                                                            user_id: user_id,
                                                            end_date: end_date
                                                        }
                                                    }, (err, res) => {});
                                                }

                                                // Tell the user about being block

                                                bot.telegram.sendMessage(chat_id, block_message);
                                            }
                                        });
                                    }
                                    break;
                            }
                        }
                    });
                }
            }
        }
    });
});

// Running the bot

bot.launch();
