FROM node:16-alpine

WORKDIR /app/cli

COPY ./db /app/db/
COPY ./cli /app/cli/
COPY ./utils /app/utils/

RUN cd /app/db && npm install
RUN cd /app/utils && npm install
RUN cd /app/cli && npm install

USER node

CMD ["node", "index.js"]
