// import nodeCmd from 'node-cmd';
import rp from 'request-promise';

// Configs
//const machineIP = '127.0.0.1';
const machineIP = 'http://192.168.1.90';
const machinePort = '9999';
const hashRateDrop = 250;
const exeFileForRestart = '';
const monitorIntervalSeconds = 1;
const timeoutAllowance = 5;
const gmtOffset = 8; // Set for Singapore timezone
// End Configs

let initialHashRate = 0;
let rebootHashRate = 0;
let awaitingResponse = false;

setInterval(monitorHashRate, monitorIntervalSeconds * 1000);

async function monitorHashRate(){
  if(!awaitingResponse){
    awaitingResponse = true;


    let apiURL = `${machineIP}:${machinePort}/api.json`;
    log(`Calling ${apiURL}`);
    try{
      let minerDetails = JSON.parse(await rp({
        url: apiURL,
        timeout: timeoutAllowance * 1000
      }));

      log(minerDetails);

      if(!minerDetails.hashrate
        || !minerDetails.hashrate.total
        || isNaN(minerDetails.hashrate.total[0])
        || !minerDetails.connection
        || isNaN(minerDetails.connection.uptime)
      ) throw new Error(`Invalid JSON: ${JSON.stringify(minerDetails)}`);


      const currentHashRate = minerDetails.hashrate.total[0];
      const totalUpTime = minerDetails.connection.uptime / 60 > 60? Math.floor(minerDetails.connection.uptime/ 3600) + ' hrs': Math.floor(minerDetails.connection.uptime / 60) + ' mins';

      if(initialHashRate === 0){
        initialHashRate = currentHashRate;
        rebootHashRate = initialHashRate - hashRateDrop;
      }


      log(`initialHashRate: ${initialHashRate}`);
      log(`rebootHashRate: ${rebootHashRate}`);
      log(`currentHashRate: ${currentHashRate}`);
      log(`totalUpTime: ${totalUpTime}`);

    }catch(err){
      log(err);
      log('Do something here');
    }

    awaitingResponse = false;
  }
}


export function getDateTime() {
  return new Date(new Date().getTime() + gmtOffset * 3600 * 1000).toUTCString().replace(/ GMT$/, '');
}

function log(rawMessage) {
  let message = typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : rawMessage;
  console.log(`${getDateTime()}: ${message}`);
}