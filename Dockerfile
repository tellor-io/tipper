FROM node:14-buster-slim
COPY ./ .
RUN node addTip.js