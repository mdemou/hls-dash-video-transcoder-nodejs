FROM node:20.11.0-alpine
ARG mode
RUN if [ "$mode" = "dev" ] ; then apk --no-cache add curl ; fi
# RUN apk --no-cache add curl

RUN apk add --no-cache fuse bash curl git build-base \
  && curl -LO https://go.dev/dl/go1.23.2.linux-amd64.tar.gz \
  && tar -C /usr/local -xzf go1.23.2.linux-amd64.tar.gz \
  && export PATH=$PATH:/usr/local/go/bin \
  && go version \
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