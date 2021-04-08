FROM node:14-buster-slim
USER root
WORKDIR /usr/src/app
COPY ./ .
RUN pwd
RUN ls
RUN apt update && apt install -y git && apt clean autoclean && apt autoremove --yes
RUN npm install
ENTRYPOINT ["node", "usr/src/app/AddTip.js"]
