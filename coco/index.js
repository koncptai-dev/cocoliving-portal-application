import { AppRegistry } from 'react-native';
import 'react-native-reanimated';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background message:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);