# LDAP Playground
This is simply a way to roadtest Node-based LDAP solutions. So far, it involves just [LdapJS](http://ldapjs.org/guide.html), but may integrate more tools for a particular implementation (active directory).

## Installation
This project has the following dependencies (which may already be installed on your system), please follow the instructions at their respective websites for installation: 

* [NodeJS](https://nodejs.org/en/)
* [OpenLDAP](http://www.openldap.org/software/download/)

Although this application can be run outside a docker container, a `Dockerfile` spells out the configuration for a CentOS container with NodeJS installed. The container exposes port `1389`, which the node application itself is listening on (spelled out in the usage examples below are some examples showing the `ldapsearch`/`ldapadd`/`ldapmodify` commands mapping to port 1389, so take note). So you would need to [install Docker](https://docs.docker.com/engine/installation) and also [install Docker-Compose](https://docs.docker.com/compose/install/) to simulate a production environment for this application. 

After installation of those tools, open a shell and navigate to the directory where you've cloned this repository:

    cd <path-to-ldap-playground>

Then, install specific node tools listed in the project's manifest:

    npm install

Optionally, if you are running it inside a Docker container, you would instead issue the `make docker` command from the project root folder.

## Running the Project

From the directory where this repository is cloned locally, login as the "root" user and then execute the following command:

    npm start

Optionally, if you are running it inside a Docker container, you would instead issue the `docker-compose up` command from the project root folder.

From another terminal on the same machine, you can execute queries against the LDAP server you started with the previous command, such as:

    ldapsearch -H ldap://localhost:1389 -x -D cn=root -w secret -LLL -b "o=myhost" objectclass=*

## Creating, Modifying and Removing an LDAP User

### Add

Create a file containing the details for a new LDAP users, called `user.ldif`:

    dn: cn=ldapjs, ou=users, o=myhost
    objectClass: unixUser
    cn: ldapjs
    shell: /bin/bash
    description: Created via ldapadd

Now, execute the following command to create the user from that file's details:

    ldapadd -H ldap://localhost:1389 -x -D cn=root -w secret -f ./user.ldif
    
Confirm the user was created successfully:

    ldapsearch -H ldap://localhost:1389 -LLL -x -D cn=root -w secret -b "ou=users, o=myhost" cn=ldapjs

### Modify

Create another local file containing details for changes to the password for the LDAP user you just created:

    dn: cn=ldapjs, ou=users, o=myhost
    changetype: modify
    replace: userPassword
    userPassword: secret
    -

Now, execute those changes:

    ldapmodify -H ldap://localhost:1389 -x -D cn=root -w secret -f ./passwd.ldif
    
To confirm, you should be able to login (even SSH) under those credentials

### Remove

And finally, you can clean up this experiment by removing this user you created:

    ldapdelete -H ldap://localhost:1389 -x -D cn=root -w secret "cn=ldapjs, ou=users, o=myhost"

For a full list of the `ldapsearch` query syntax see [this link](http://ldapjs.org/filters.html)

