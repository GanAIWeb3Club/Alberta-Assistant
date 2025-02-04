const Nmap = require('node-nmap');
const fs = require('fs');

// List of target IP addresses
const targetIPs = ['158.220.105.69', '37.60.245.70', '31.220.82.230'];

// Function to scan a single IP and return a Promise
function scanIP(targetIP) {
  return new Promise((resolve, reject) => {
    let scan = new Nmap.NmapScan(targetIP, '-p 1-65535 -A');
    // let scan = new Nmap.NmapScan(targetIP, '-p 1-65535 -sV -O');


    scan.on('complete', function(data) {
      const outputFile = `./scanner/nmap_results/${targetIP}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`Scan results for ${targetIP} saved to ${outputFile}`);
      resolve();
    });

    scan.on('error', function(error) {
      console.error(`Error scanning ${targetIP}: ${error}`);
      reject(error);
    });

    scan.start();
  });
}

// Function to scan all IPs sequentially
async function scanAllIPs() {
  for (const ip of targetIPs) {
    try {
      await scanIP(ip);
    } catch (error) {
      console.error(`Skipping ${ip} due to error.`);
    }
  }
  console.log('All scans complete.');
}

// Start scanning
scanAllIPs();
