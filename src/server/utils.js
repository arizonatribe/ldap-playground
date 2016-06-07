export function userExists(user, users) {
    return user.cn &&
        user.cn.value &&
        Object.keys(users)
            .map(key => users[key].attributes.cn)
            .includes(user.cn.value);
}

export function ldapUserDetailsToOptions(user) {
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