import React, { useEffect, useState } from 'react';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RouteNavigator from './Route/rout-navigator';
import LoginNavigator from './Route/login-routenavigator';
import OneSignal from 'react-native-onesignal';
import { StatusBar } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
const Stack = createStackNavigator();

export default function App() {
  const [isLogedin, setIsLogedin] = useState(false);
  const [isChecked, setChecked] = useState(false);

  useEffect(() => {
    setUniqueID();
    oneSignalPushnotifications();
    getDistData();
  }, []);

  const getDistData = async () => {
    try {
      const value = await AsyncStorage.getItem('@apidistData');
      if (value !== null) {
        setIsLogedin(true);
        setChecked(true);
      } else {
        setIsLogedin(false);
        setChecked(true);
      }
    } catch (e) {
      // error reading value
    }
  };

  const setUniqueID = async () => {
    let fetchUUID = await SecureStore.getItemAsync('secure_deviceid');
    if (fetchUUID == null) {
      let uuid = uuidv4();
      await SecureStore.setItemAsync('secure_deviceid', JSON.stringify(uuid));
    }
  };

  const oneSignalPushnotifications = () => {
    //OneSignal Init Code
    OneSignal.setLogLevel(6, 0);
    OneSignal.setAppId('dc21f0f2-a6c1-437d-b14f-4faec3b7c41c');
    //END OneSignal Init Code

    //Prompt for push on iOS
    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
      console.log('Prompt response:', response);
    });

    //Method for handling notifications received while app in foreground
    OneSignal.setNotificationWillShowInForegroundHandler(
      (notificationReceivedEvent) => {
        console.log(
          'OneSignal: notification will show in foreground:',
          notificationReceivedEvent
        );
        let notification = notificationReceivedEvent.getNotification();
        console.log('notification: ', notification);
        const data = notification.additionalData;
        console.log('additionalData: ', data);
        // Complete with null means don't show a notification.
        notificationReceivedEvent.complete(notification);
      }
    );

    //Method for handling notifications opened
    OneSignal.setNotificationOpenedHandler((notification) => {
      console.log('OneSignal: notification opened:', notification);
    });
  };
  return (
    <NavigationContainer>
      <StatusBar backgroundColor='#082754' barStyle="light-content" />

      {isChecked && (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLogedin ? (
            <Stack.Screen name='loginNavigator' component={LoginNavigator} />
          ) : (
            <Stack.Screen name='routeStack' component={RouteNavigator} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
