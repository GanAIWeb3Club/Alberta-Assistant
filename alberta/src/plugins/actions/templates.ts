export const extractDomainNameTemplate = `Given the text, extract IP addresses, domain names, and hostnames, 
just the ones specified in the text without any combination.
Return them in a JSON object with a "targets" array containing the extracted values.
If no valid targets are found, return an empty array.

Example output format:
{
  "targets": ["192.168.1.1", "example.com", "server-host"]
}

Text to analyze:
{{lastMessage}}
`; 

export const summarizeAvailabilityReportTemplate = `Create a brief network diagnostics summary using Telegram markdown formatting (*bold* or **bold**). Make the message friendly with appropriate emojis.

Template structure:
*Checked:* [host/IP] 🔍
*Status:* [One-line overview] [relevant emoji: ✅ for good, ⚠️ for issues]

[2-3 sentences explaining the state, with emojis for key points]

[If issues found] *Recommendation:* [Brief advice] 🔧


Notes:
http and https are not must have services. 
Use everyday language, avoid technical terms where possible but don't oversimplify important details

Use Telegram-compatible markdown:
- Use single *asterisks* for bold text
- Add relevant emojis for visual clarity
- Keep spacing consistent
- Avoid using underscores or backticks

Tested host:
{{targetHost}}

Diagnostic Results:
{{availabilityResult}}`;

export const summarizePortsScanReportTemplate = `Please provide a brief, user-friendly summary of the port scan results in a format suitable for Telegram. Use **bold text**, emojis, and bullet points for clarity. Follow this structure:
1. **Start with the target** (IP/hostname) in bold.  
2. **OS & Uptime**: Include the likely operating system and uptime in bold.  
3. **Open Ports**: List each open port with a short description and status. Use bold for port numbers and statuses.  
4. **Key Issues**: Highlight 1-2 sentences explaining any issues in simple terms. Use bold for emphasis.  
5. **Recommendations**: Provide actionable recommendations (if needed). Use bullet points and bold for key actions.  
6. **Add a light-hearted note or emoji** at the end to keep the tone friendly.  

Avoid technical jargon where possible, but don’t oversimplify important details.  

The scan result has the following structure:  
interface NmapResult {  
    target: string;  
    output: string;  
    error?: string;  
    timestamp: Date;  
    duration: number;  // scan duration in milliseconds  
}  

Scan Results:  
{{scanResult}}`;

export const summarizePhishingReportTemplate = `Create a brief phishing check summary using Telegram markdown formatting (*bold* or **bold**). Make the message friendly with appropriate emojis.

Template structure:
*Checked:* [Domain/URL/host/IP] 🔍
*Status:* [One-line overview] [relevant emoji: ✅ for good, ⚠️ for issues]

[2-3 sentences explaining the state, with emojis for key points]

[If issues found] *Recommendation:* [Brief advice] 🔧


Notes:
Use everyday language, avoid technical terms

Use Telegram-compatible markdown:
- Use single *asterisks* for bold text
- Add relevant emojis for visual clarity
- Keep spacing consistent
- Avoid using underscores or backticks

The check result has the following structure;
type CheckResult = {
    [key: string]: boolean | { url: boolean, domain: boolean };
  };

If the phishing url, domain, ip has been detected then it has status - True otherwise False
If the URL hasn't been detected as a phishing link but its domain is in the phishing list then it has DOMAIN word in front of the URL in the phishingCheckResult

Phishing Check Results:
{{phishingCheckResult}}`;
