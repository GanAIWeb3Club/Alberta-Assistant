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

export const summarizeAvailabilityReportTemplate = `Please provide a brief, user-friendly summary of these network diagnostics results:
- Start with a one-line status overview
- Follow with 1-2 sentences explaining any issues in simple terms
- http and https are not must have services
- provide recommendations (if needed)
- Use everyday language, avoid technical terms where possible but don't oversimplify important details

Diagnostic Results:
{{availabilityResult}}`;