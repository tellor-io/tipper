FROM node:14-buster-slim
USER root
WORKDIR /usr/src/app
COPY ./ .
RUN pwd
RUN ls
RUN apt update && apt install -y git && apt clean autoclean && apt autoremove --yes
RUN npm install
# RUN ["chmod", "+x", "AddTip.js"]
CMD ["/bin/bash", "-c", "cd /usr/src/app && node AddTip.js"]
