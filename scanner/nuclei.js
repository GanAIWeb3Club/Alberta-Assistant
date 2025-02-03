const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of IPs to scan
// const ips = ['158.220.105.69', '37.60.245.70', '31.220.82.230'];
const ips = ['158.220.105.69'];

const outputDir = './scanner/nuclei_results';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Function to run Nuclei scan on an IP
const scanIP = (ip) => {
    return new Promise((resolve, reject) => {
        const outputFile = path.join(outputDir, `${ip}.json`);
        const command = `nuclei -target ${ip} -j -o ${outputFile}`;
        console.log('Running command:', command);
        const startTime = Date.now();
        
        exec(command, (error, stdout, stderr) => {
            const endTime = Date.now();
            const scanDuration = (endTime - startTime) / 1000;

            if (error) {
                console.error(`Error scanning ${ip}:`, stderr);
                reject(error);
            } else {
                console.log(`Scan completed for ${ip} in ${scanDuration} seconds, /n results saved to ${outputFile}`);
                resolve(outputFile);
            }
        });
    });
};

// Run scans for all IPs sequentially
const runScans = async () => {
    for (const ip of ips) {
        try {
            await scanIP(ip);
        } catch (error) {
            console.error(`Failed to scan ${ip}`);
        }
    }
    console.log('All scans completed.');
};

runScans();
