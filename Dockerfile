FROM node:20.11.0-alpine
ARG mode
RUN if [ "$mode" = "dev" ] ; then apk --no-cache add curl ; fi
# RUN apk --no-cache add curl

RUN apk add --no-cache fuse go git build-base \
  && git clone https://github.com/GoogleCloudPlatform/gcsfuse /tmp/gcsfuse \
  && cd /tmp/gcsfuse \
  && go mod tidy \
  && go build . \
  && cp gcsfuse /usr/local/bin/gcsfuse \
  && chmod +x /usr/local/bin/gcsfuse \
  && rm -rf /tmp/gcsfuse

WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3002
CMD [ "node", "./dist/main.js" ]