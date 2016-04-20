# LDAP Playground
This is simply a way to roadtest Node-based LDAP solutions. So far, it involves just [LdapJS](http://ldapjs.org/guide.html), but may integrate more tools for a particular implementation (active directory).

## Installation
This project has the following dependencies (which may already be installed on your system), please follow the instructions at their respective websites for installation: 

* [NodeJS](https://nodejs.org/en/)
* [OpenLDAP](http://www.openldap.org/software/download/)

After installation of those tools, open a shell and navigate to the directory where you've cloned this repository:

    cd <path-to-ldap-playground>

Then, install specific node tools listed in the project's manifest:

    npm install

## Running the Project

From the directory where this repository is cloned locally, execute the following command:

    npm start

From another terminal on the same machine, you can execute queries against the LDAP server you started with the previous command, such as:

    ldapsearch -H ldap://localhost:1389 -x -D cn=root -w secret -LLL -b "o=myhost" objectclass=*

For a full list of the `ldapsearch` query syntax see [this link](http://ldapjs.org/filters.html)

