import ldap from 'ldapjs';
import bunyan from 'bunyan';

import {authorize, loadPasswdFile} from './pre';
import {search, add, modify, remove} from './crud';

const port = process.env.PORT || 1389,
    log = bunyan.createLogger({name: 'server'}),
    server = ldap.createServer(),
    pre = [authorize, loadPasswdFile];

server.listen(port, () =>
    log.info(`LDAP server listening at ${server.url}:${port}`)
);

server
    .bind('cn=root', (req, res, next) => {
        if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret')
            return next(new ldap.InvalidCredentialsError());
  
        res.end();

        return next();
    })
    .search('o=myhost', pre, search)
    .add('ou=users, o=myhost', pre, add)
    .modify('ou=users, o=myhost', pre, modify)
    .del('ou=users, o=myhost', pre, remove);