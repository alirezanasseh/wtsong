# What The Song!
What The Song is a Telegram bot that helps you find a forgotten song name!
It's a Telegram bot that users can send a song by their voice, whistling or humming! The bot sends their voice to a Telegram channel, asking other members to determine the song.

Users can forward the song message from channel to the bot and answer. The bot sends answers to the user asked it and the user can choose this answer is right, wrong or junk! From this feedback users get scores.

If a user sends junks, he/she will be blocked by 24 hours to 1 year! depending on how many times he/she did it.


## Installation

[Node.js](https://nodejs.org/en/) and [MongoDB](https://docs.mongodb.com/manual/administration/install-community/) should be installed on your system. Clone the project and run:

```bash
npm install
```

## Usage
Go to the Telegram, find [BotFather](https://t.me/BotFather) and start it. Enter "/newbot", it asks you the name, give it a desired name. Then it asks you the username, enter a unique username, it should end with "bot". Then it give you a token to access the HTTP API, copy that for the next step.

Create a .env file in the project root with the following content:

```dotenv
BOT_TOKEN="the token you got from the BotFather"
``` 

Now run the app:

```bash
node app
```

## The Channel
You can change the Telegram channel ([@WTSong](https://t.me/wtsong)) from the code, but I suggest not to do that, because the more members the channel gets the more songs will be answered, so it's better to aggregate them in one channel.

## Contributing
Pull requests are welcome, especially as it's a multilingual project, you can add your language in locale.js and send a pull request. For major changes, please open an issue first to discuss what you would like to change.

If you find this project useful in anyway please give a star and share it.

## License
[MIT](https://choosealicense.com/licenses/mit/)