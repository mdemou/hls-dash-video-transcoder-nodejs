FROM node:20.11.0-alpine
ARG mode
RUN if [ "$mode" = "dev" ] ; then apk --no-cache add curl ; fi
# RUN apk --no-cache add curl
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3002
CMD [ "node", "./dist/main.js" ]