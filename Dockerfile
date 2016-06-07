FROM arizonatribe/centosnode
MAINTAINER David Nunez <arizonatribe@gmail.com>

ENV APP_NAME ldap-playground

EXPOSE 1389
WORKDIR /var/lib/${APP_NAME}
CMD ["/usr/bin/npm", "start"]

# Global npm CLI tools that are used in the scripts block of package.json
RUN npm install -g node-inspector 

# Copy NPM manifest here so that the `npm install` only happens when required dependencies change
COPY package.json /var/lib/${APP_NAME}/package.json
# Install node dependencies specific to this project
RUN cd /var/lib/${APP_NAME} && npm install --production

# Environment files, and linter/transpiler config files
COPY .e* .b* /var/lib/${APP_NAME}/
# Application-specific JavaScript files
COPY src /var/lib/${APP_NAME}/src
