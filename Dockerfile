FROM centos:centos7
MAINTAINER David Nunez <arizonatribe@gmail.com>

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
ENV TERM xterm

# Install general dependencies
RUN yum install -y \
    curl \
    epel-release \
    gcc-c++ \
    git \
    jq \
    make \
    man \
    vim \
    wget

# Default locations for Node Version Manager and version of Node to be installed
ENV NODE_VERSION 5.10.1
ENV NVM_DIR /.nvm
 
# Default version of Node to be installed; can be overridden
RUN git clone https://github.com/creationix/nvm.git $NVM_DIR
RUN echo ". $NVM_DIR/nvm.sh" >> /etc/bash.bashrc

# Install node.js
RUN source $NVM_DIR/nvm.sh \
    && nvm install v$NODE_VERSION \
    && nvm use v$NODE_VERSION \
    && nvm alias default v$NODE_VERSION \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/node /usr/bin/node \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/npm /usr/bin/npm

EXPOSE 1389
VOLUME ["/app"]

# Web application files (server and client)
ADD ./src /app/src
# Only file outside the app/ and docker/ directories needing to be copied over
COPY package.json /app
WORKDIR /app/src

# Global npm CLI tools that are used in the scripts block of package.json
RUN npm install -g node-inspector 

# Execute the chain of build steps outlined in the scripts block of package.json
RUN cd /app && npm install

CMD npm start