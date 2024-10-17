# Transcoder

Transcode videos to HLS and / or DASH adaptative bitrate streaming protocols. Also includes optional notifications for status updates

Some post-events could be configured. Take a look at [environment variables](#environment-variables)

![Architechture](./assets/arch.png)

* [Requirements](#requirements)
* [Install and run](#install-and-run)
    * [Locally](#locally)
    * [Docker Compose](#docker-compose)
* [Documentation](#documentation)
    * [API Swagger](#api-swagger)
    * [Environment variables](#environment-variables)
* [How to use](#how-to-use)
    * [HTTP](#http)
    * [REDIS](#redis)
* [FAQ](#faq)
* [LICENSE](#license)
* [Support and PR](#support-and-pr)

## Requirements
| Tech       	| Version  	   | Mandatory  
|------------	|--------------|--------------|
| NodeJS     	| v20.11.0 	   | YES
| NPM        	| 10.5.2   	   | YES
| Redis         | 7.4.0-alpine | NO but strongly recommended

## Install and run
### Locally
```sh
# install dependencies
npm i

# create a .env file
# there is a .env.sample file in root

# run it
npm run dev
```
> .vscode folder is attached to the project in case debuging is needed

### Docker Compose
```sh
# build and run
docker compose -f docker-compose.yml up -d

# REDIS ONLY
docker compose -f docker-compose-redis.yml up -d
```

## Documentation
### API Swagger
It could be checked here: http://localhost:3002/documentation

## Environment Variables
Due to a correct local functioning, add a .env file to the root with the following values filled.

> A `.env.sample` is in the repo as example

```sh
# MANDATORY
APP_NAME=TRANSCODER
HOST=0.0.0.0
LOG_LEVEL=debug
PORT=3002
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0

# OPTIONAL
NOTIFICATION_STATUS_TRANSCODED_URL= # POST request is sent to this URL for transcoding status updates
NOTIFICATION_AUTHORIZATION_HEADER= # Authorization header could be added to notification requests
NOTIFICATION_WEBHOOK_ON_START= # default false
NOTIFICATION_WEBHOOK_ON_FINISHED= # default false
NOTIFICATION_WEBHOOK_ON_FAILED= # default false
REDIS_TRANSCODER_MAIN_QUEUE= # default transcoder_jobs_queue
REDIS_TRANSCODER_DEAD_LETTER_QUEUE= # default transcoder_jobs_dead_letter_queue
```

## How to use

### HTTP
| METHOD      | PATH 	        
|-------------|---------------
| __POST__      	| _/transcoder_ 


| PAYLOAD        | DEFAULT          | REQUIRED
|----------------|------------------|---------------|
| inputFilePath  |./volumes/cbd.mp4 | true
| hlsOutputPath  |./volumes/hls/cbd | false*
| dashOutputPath |./volumes/dash/cbd| false*

* _hlsOutputPath_ and _dashOutputPath_ are optional, but at least one is mandatory

> For more info, once the app is running, check documentation: http://localhost:3002/documentation

Example: 
```sh
# replace inputFilePath, hlsOutputPath and dashOutputPath variables
curl --location 'localhost:3002/transcoder' \
--header 'Content-Type: application/json' \
--data '{
    "inputFilePath": "./volumes/cbd.mp4",
    "hlsOutputPath": "./volumes/hls/cbd"
    "dashOutputPath": "./volumes/dash/cbd"
}'
```

### REDIS
A Redis consumer is listening to published jobs in _transcoder_jobs_queue_ queue, the defined in the environment variable __REDIS_TRANSCODER_MAIN_QUEUE__.

The job MUST have the same structure as the HTTP payload, and stringified.

There is a dead letter queue named _transcoder_jobs_dead_letter_queue_ or if overwritten with __REDIS_TRANSCODER_DEAD_LETTER_QUEUE__ environment variable, for all those jobs that can't be processed for any reason. They are pushed to the queue with the following format:
```sh
{
    datePushed: '2024-10-07T09:02:14.179Z',
    job: {},
    message: \"Unexpected token 'h', \"whatever\" is not valid JSON",
}
```

## FAQ
__Q: Is it ready for scaling?__

__A:__ Yes. However, it is strongly recommended to use the Redis approach.

__Q: Is it possible to run just one job for HLS or DASH and not both together?__

__A:__ Yes. In the payload, include the key you want to trigger, _hlsOutputPath_ or _dashOutputPath_. Including both keys in the same payload is also allowed.

__Q: Is it possible to use Redis queues for status changes instead of HTTP(S)?__

__A:__ No. Currently, HTTP(S) notifications are the only way for updating status.

__Q: Can I decide which change events I want to send a HTTP(S) notification?__

__A:__ Yes. Take a look at the _NOTIFICATION_WEBHOOK_ON_ [environment variables](#environment-variables).


## LICENSE
Check [License](./LICENSE.md) file


## Support and PR
Feel free to ask for support, or pull requests with improvements this repository. I will be very happy to hear from you, and make this as useful as possible