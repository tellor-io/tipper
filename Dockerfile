FROM node:14-buster
USER root
WORKDIR /usr/src/app
COPY ./ .
# RUN apt update && apt install -y git && apt clean autoclean && apt autoremove --yes
RUN npm install
CMD ["/bin/bash", "-c", "cd /usr/src/app && node AddTip.js"]
