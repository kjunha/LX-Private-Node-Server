require('dotenv').config();
const fs = require('fs');
const { env } = require('process');
var config = {
    "name"              : "lxp-node",
    "script"            : "app.js",
    "log_date_format"   : "YYYY-MM-DD HH:mm Z",
    "merge_logs"        : false,
    "watch"             : false,
    "max_restarts"      : 10,
    "exec_interpreter"  : "node",
    "exec_mode"         : "fork_mode",
    "env":
    {
        "NODE_ENV"        : "production",
        "RPC_HOST"        : process.env.BC_HOST,
        "RPC_PORT"        : process.env.BC_PORT,
        "LISTENING_PORT"  : "30303",
        "INSTANCE_NAME"   : "node01",
        "CONTACT_DETAILS" : "",
        "WS_SERVER"       : "http://0.0.0.0:3000",
        "WS_SECRET"       : "lx",
        "VERBOSITY"       : 2
    }
};

fs.writeFile('app.json', `${JSON.stringify([config], null, '\t')}`, ()=>{
    console.log(`config successfully generated`);
});
