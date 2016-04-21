var ldap = require('ldapjs'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
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

server.add('ou=users, o=myhost', [authorize, loadPasswdFile], (req, res, next) => {
  var entry = req.toObject().attributes;

  if (!entry.cn || !entry.cn[0])
    return next(new ldap.ConstraintViolationError('cn required'));

  if (req.users[entry.cn[0]])
    return next(new ldap.EntryAlreadyExistsError(req.dn.toString()));

  if (!entry.objectclass || !/unixUser/.test(entry.objectclass[0]))
    return next(new ldap.ConstraintViolation('entry must be a unixUser'));

  let useradd = spawn('useradd', ldapUserDetailsToOptions(entry)),
      messages = [];

  useradd.stdout.on('data', data => messages.push(data.toString()));
  useradd.stderr.on('data', data => messages.push(data.toString()));
  useradd.on('exit', code => {
    if (code !== 0) {
      return next(new ldap.OperationsError(`${code}${messages.length ? `:${messages.join()}` : ''}`));
    }

    res.end();
    return next();
  });
});

server.modify('ou=users, o=myhost', [authorize, loadPasswdFile], (req, res, next) => {
  var user = req.dn.rdns[0].attrs,
      modType = '';

  if (!user.cn || !user.cn.value || !Object.keys(req.users).map(key => req.users[key].attributes.cn).includes(user.cn.value))
    return next(new ldap.NoSuchObjectError(req.dn.toString()));

  if (!req.changes.length)
    return next(new ldap.ProtocolError('changes required'));

  if (req.changes.some(change =>
    (modType = change.modification) &&
    /^(add|delete)$/.test(change.operation))
  ) {
    return next(new ldap.UnwillingToPerformError('only replace allowed'));    
  }

  if (req.changes.some(change => 
    (modType = change.modification) &&
    change.operation === 'replace' &&
    (change.modification.type !== 'userpassword' ||
    !change.modification.vals || !change.modification.vals.length))
  ) {
    return next(new ldap.UnwillingToPerformError('only password updates allowed'));
  }
  
  let passwd = spawn('chpasswd', ['-c', 'MD5']);

  passwd.stdin.end(`${user.cn.value}:${modType.vals[0]}`, 'utf8');
  passwd.on('exit', code => {
    if (code !== 0)
      return next(new ldap.OperationsError(code));

    res.end();
    return next();
  });
});

function ldapUserDetailsToOptions(user) {
  let opts = ['-m'];

  (new Map([
    ['-c', user.description], 
    ['-d', user.homedirectory],
    ['-g', user.gid],
    ['-s', user.shell],
    ['-u', user.uid]
  ]).forEach((val, key) => val && opts.push(key, val[0])));

  opts.push(user.cn[0]);

  return opts; 
}

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