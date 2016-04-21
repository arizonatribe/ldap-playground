var ldap = require('ldapjs'),
    fs = require('fs');

export function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals('cn=root'))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

export function loadPasswdFile(req, res, next) {
  fs.readFile('/etc/passwd', 'utf8', (err, data) => {
    if (err)
      return next(new ldap.OperationsError(err.message));

    req.users = {};
    data.split('\n')
      .filter(line => line && !/^#/.test(line) && line.split(':').length)
      .forEach(line => {
        let [cn,, uid, gid, description, homedirectory, shell] = line.split(':');

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