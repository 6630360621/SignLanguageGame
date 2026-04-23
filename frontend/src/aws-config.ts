import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_APP_CLIENT_ID as string,
      loginWith: {
        username: true,
        email: true,
      },
    }
  }
});