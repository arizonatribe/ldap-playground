var ldap = require('ldapjs'),
    fs = require('fs'),
    server = ldap.createServer();

server.listen(1389, () => console.log(`LDAP server listening at ${server.url}`));

server.bind('cn=root', (req, res, next) => {
  if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret')
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.search('o=myhost', [authorize, loadPasswdFile], (req, res, next) => {
  Object.keys(req.users).forEach(key => {
    if (req.filter.matches(req.users[key].attributes))
      res.send(req.users[key]);
  });

  res.end();
  return next();
});

function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals('cn=root'))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

function loadPasswdFile(req, res, next) {
  fs.readFile('/etc/passwd', 'utf8', (err, data) => {
    if (err)
      return next(new ldap.OperationsError(err.message));

    req.users = {};
    data.split('\n')
      .filter(line => line && !/^#/.test(line) && line.split(':').length)
      .forEach(line => {
        let [cn, , uid, gid, description, homedirectory, shell] = line.split(':');

        req.users[cn] = {
          dn: `cn=${cn}, ou=users, o=myhost`,
          attributes: {
            cn: cn,
            uid: uid,
            gid: gid,
            description: description,
            homedirectory: homedirectory,
            shell: shell || '',
            objectclass: 'unixUser'
          }
        };
      });

    return next();
  });
}