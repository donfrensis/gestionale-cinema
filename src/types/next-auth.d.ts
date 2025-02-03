import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: number;
    username: string;
    isAdmin: boolean;
    firstAccess: boolean;
  }
  
  interface Session {
    user: User;
  }
}