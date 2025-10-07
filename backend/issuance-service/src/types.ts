export type Credential = {
id: string; 
holder: string;
metadata?: Record<string, any>;
};


export type IssuedCredential = Credential & {
issuedAt: string; 
workerId: string;
};