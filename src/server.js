import {authorize, loadPasswdFile} from './pre';
import {search, add, modify, remove} from './crud';

var pre = [authorize, loadPasswdFile],
    ldap = require('ldapjs'),
    server = ldap.createServer();

server.listen(1389, () => console.log(`LDAP server listening at ${server.url}`));
server.bind('cn=root', (req, res, next) => {
    if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret')
      return next(new ldap.InvalidCredentialsError());
  
    res.end();
    return next();
  })
  .search('o=myhost', pre, search)
  .add('ou=users, o=myhost', pre, add)
  .modify('ou=users, o=myhost', pre, modify)
  .del('ou=users, o=myhost', pre, remove);