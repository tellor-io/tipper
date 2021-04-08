FROM node:14-buster-slim
USER root
# WORKDIR /usr/src/app
WORKDIR /github/workspace
COPY ./ .
RUN apt update && apt install -y git && apt clean autoclean && apt autoremove --yes
RUN npm install
CMD ["node","tipper", "AddTip.js"]
