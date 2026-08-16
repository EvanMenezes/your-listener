const { safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function storePath(){return path.join(app.getPath('userData'),'secrets.json')}
function readAll(){try{return JSON.parse(fs.readFileSync(storePath(),'utf8'))}catch{return {}}}
function writeAll(data){fs.mkdirSync(path.dirname(storePath()),{recursive:true});fs.writeFileSync(storePath(),JSON.stringify(data),{encoding:'utf8',mode:0o600})}
function setSecret(name,value){if(typeof name!=='string'||!/^[a-z0-9_.-]{1,80}$/i.test(name))throw new Error('Invalid secret name.');if(typeof value!=='string'||value.length>10000)throw new Error('Invalid secret value.');if(!safeStorage.isEncryptionAvailable())throw new Error('Windows protected storage is unavailable.');const data=readAll();data[name]=safeStorage.encryptString(value).toString('base64');writeAll(data);return {ok:true}}
function getSecret(name){const data=readAll();if(!data[name])return {ok:true,value:null};if(!safeStorage.isEncryptionAvailable())return {ok:false,error:'Windows protected storage is unavailable.'};return {ok:true,value:safeStorage.decryptString(Buffer.from(data[name],'base64'))}}
function deleteSecret(name){const data=readAll();delete data[name];writeAll(data);return {ok:true}}
module.exports={setSecret,getSecret,deleteSecret};
