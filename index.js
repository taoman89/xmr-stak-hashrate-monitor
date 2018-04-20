// import nodeCmd from 'node-cmd';
import rp from 'request-promise';

// Configs
//const machineIP = '127.0.0.1';
const machineIP = '192.168.1.90';
const machinePort = '9999';
const hashRateDrop = 250;
const exeFileForRestart = '';
// End Configs

let initialHashRate = 0;

setInterval(60000, ()=>{
	monitorHashRate();
});

async function monitorHashRate(){
	let currentHashRate = await rp(`${machineIP}:${machinePort}/api.json`);
	console.log(currentHashRate);
}