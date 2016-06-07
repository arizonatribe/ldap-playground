import {ldapUserDetailsToOptions, userExists} from './utils';
import ldap from 'ldapjs';
import childProcess from 'child_process';

const spawn = childProcess.spawn;

function search(req, res, next) {
    Object.keys(req.users).forEach(key => {
        if (req.filter.matches(req.users[key].attributes))
            res.send(req.users[key]);
    });

    res.end();

    return next();
}

function add(req, res, next) {
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
            return next(new ldap.OperationsError(
                `${code}${messages.length ? `:${messages.join()}` : ''}`)
            );
        }

        res.end();

        return next();
    });
}

function modify(req, res, next) {
    var modType = '';

    if (!userExists(req.dn.rdns[0].attrs, req.users))
        return next(new ldap.NoSuchObjectError(req.dn.toString()));

    if (!req.changes.length)
        return next(new ldap.ProtocolError('changes required'));

    if (req.changes.some(change => (modType = change.modification) &&
        /^(add|delete)$/.test(change.operation))) {

        return next(new ldap.UnwillingToPerformError('only replace allowed'));
    }

    if (req.changes.some(change => (modType = change.modification) &&
        change.operation === 'replace' &&
        (change.modification.type !== 'userpassword' ||
        !change.modification.vals || !change.modification.vals.length))) {

        return next(
            new ldap.UnwillingToPerformError('only password updates allowed')
        );
    }
  
    let passwd = spawn('chpasswd', ['-c', 'MD5']);

    passwd.stdin.end(
        `${req.dn.rdns[0].attrs.cn.value}:${modType.vals[0]}`, 'utf8'
    );
    passwd.on('exit', code => {
        if (code !== 0)
            return next(new ldap.OperationsError(code));

        res.end();

        return next();
    });
}

function remove(req, res, next) {
    if (!userExists(req.dn.rdns[0].attrs, req.users))
        return next(new ldap.NoSuchObjectError(req.dn.toString()));

    let userdel = spawn('userdel', ['-f', req.dn.rdns[0].attrs.cn.value]),
        messages = [];

    userdel.stdout.on('data', data => messages.push(data.toString()));
    userdel.stderr.on('data', data => messages.push(data.toString()));
    userdel.on('exit', code => {
        if (code !== 0) {
            return next(new ldap.OperationsError(
                `${code}${messages.length ? `:${messages.join()}` : ''}`)
            );
        }

        res.end();

        return next();
    });
}

export {search, add, modify, remove};