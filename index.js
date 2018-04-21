import nodeCmd from 'node-cmd';
import rp from 'request-promise';
import sleep from 'sleep-promise';


// Configs
const machineIP = 'http://localhost';
const machinePort = '9999';
const hashRateDrop = 250;
const minGoodSharePercentage = 97;
const exeFileForRestart = '';
const monitorIntervalSeconds = 60;
const timeoutAllowance = 3;
const gmtOffset = 8; // Set for Singapore timezone
// End Configs

let initialHashRate = 0;
let rebootHashRate = 0;
let awaitingResponse = false;

setInterval(monitorHashRate, monitorIntervalSeconds * 1000);

async function monitorHashRate(){
  if(!awaitingResponse){
    awaitingResponse = true;

    console.log('\n\n\n\n\n');

    let apiURL = `${machineIP}:${machinePort}/api.json`;
    log(`Calling ${apiURL}`);
    try{
      let minerDetails = JSON.parse(await rp({
        url: apiURL,
        timeout: timeoutAllowance * 1000
      }));

      log(minerDetails);
      console.log('\n\n\n');

      if(!minerDetails.hashrate
        || !minerDetails.hashrate.total
        || isNaN(minerDetails.hashrate.total[0])
        || !minerDetails.connection
        || isNaN(minerDetails.connection.uptime)
      ) throw new Error(`Invalid JSON: ${JSON.stringify(minerDetails)}`);


      const currentHashRate = minerDetails.hashrate.total[0];
      const totalUpTimeHrs =  Math.floor(minerDetails.connection.uptime/ 3600);
      const totalUpTimeMins = Math.floor(minerDetails.connection.uptime / 60) - totalUpTimeHrs * 60;
      const totalGoodShares = minerDetails.results.shares_good;
      const totalShares = minerDetails.results.shares_total;
      const goodSharePercentage = Math.floor(totalGoodShares/totalShares * 100);


      if(initialHashRate === 0){
        initialHashRate = currentHashRate;
        rebootHashRate = initialHashRate - hashRateDrop;
      }


      log(`initialHashRate: ${initialHashRate}\n`);
      log(`rebootHashRate: ${rebootHashRate}\n`);
      log(`currentHashRate: ${currentHashRate}\n`);
      log(`totalUpTime: ${totalUpTimeHrs} hrs ${totalUpTimeMins} mins\n`);

      log(`totalGoodShares: ${totalGoodShares}\n`);
      log(`totalShares: ${totalShares}\n`);
      log(`goodSharePercentage: ${goodSharePercentage}%\n`);

      if(currentHashRate < rebootHashRate) throw new Error(`Needs to reboot... ${currentHashRate} lower than ${rebootHashRate}`);
      if(goodSharePercentage < minGoodSharePercentage) throw new Error(`Needs to reboot... ${goodSharePercentage} lower than ${minGoodSharePercentage}`);

    }catch(err){
      console.log(err);
      log('Restarting in 3 seconds');
      sleep(3000).then(()=>{
        nodeCmd.run(exeFileForRestart);
        initialHashRate = 0;
        rebootHashRate = 0;
      });
    }finally{
      log(`unlocking awaitResponse Bool`)
      awaitingResponse = false;
    }

  }
}


export function getDateTime() {
  return new Date(new Date().getTime() + gmtOffset * 3600 * 1000).toUTCString().replace(/ GMT$/, '');
}

function log(rawMessage) {
  let message = typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : rawMessage;
  console.log(`${getDateTime()}: ${message}`);
}