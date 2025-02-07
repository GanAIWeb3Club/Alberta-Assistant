declare module 'network-diagnostics' {
    interface Diagnostics {
      getTestURL(): string;
      setTestURL(replacement: string): void;
      
      // Interface checks
      checkInterfaces(): number[];
      haveIPv4(): boolean;
      haveIPv6(): boolean;
      haveConnection(): boolean;
      
      // Async checks
      haveConnectionAsync(callback: (result: boolean) => void): void;
      haveIPv4Async(callback: (result: boolean) => void): void;
      haveIPv6Async(callback: (result: boolean) => void): void;
      haveDNS(callback: (result: boolean) => void): void;
      haveHTTP(callback: (result: boolean) => void): void;
      haveHTTPS(callback: (result: boolean) => void): void;
      havePing(callback: (result: boolean) => void): void;
      
      // Email checks
      haveInsecureImap(callback: (result: boolean) => void): void;
      haveSecureImap(callback: (result: boolean) => void): void;
      haveInsecurePop(callback: (result: boolean) => void): void;
      haveSecurePop(callback: (result: boolean) => void): void;
      
      // NTP check
      haveNTP(callback: (result: boolean) => void): void;
      
      // Error handling
      getError(id: number): string;
      diagnose(callback: (errors: number[]) => void): void;
    }
  
    const diagnostics: Diagnostics;
    export = diagnostics;
  }