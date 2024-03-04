FROM node:18.19.1

ENV ENV_FLAG=--prod
ENV TZ=Europe/Rome

WORKDIR /rank

COPY . .

RUN npm i

RUN groupadd -r rank && useradd -rm -g rank rank

RUN echo "node rank.js \${ENV_FLAG}" > start.sh \ 
    && chown rank start.sh \
    && chmod u+x start.sh 

RUN apt-get update && apt-get install -y tzdata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

USER rank

CMD ["sh", "-c", "./start.sh" ]