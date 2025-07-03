export interface EnvironmentConfig {
    region: string;
    environmentName: string;
    ttlDays: number;
    logLevel: string;
    port: string;
    resolvePath: string;
  }
  
  const config: Record<string, EnvironmentConfig> = {
    dev: {
      region: 'us-east-1',
      environmentName: 'dev',
      ttlDays: 7,
      logLevel: 'info',
      port: '80',
      resolvePath: '/shorten'
    }
  };
  
  export const getConfig = (): EnvironmentConfig => {
    const env = process.env.ENVIRONMENT || 'dev';
    return config[env];
  };