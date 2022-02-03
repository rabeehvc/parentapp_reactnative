import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import OneSignal from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themes from '../Styles/themes';
import { latestNotification } from '../Services/notification-services';
import { invertColor } from '../Functions/functions';

const LatestNotifications = ({ navigation }) => {
  //useStates
  const [notifications, setNotifications] = useState([]);
  const [distData, setDistData] = useState();
  const [isModalVisible, setisModalVisible] = useState(false);
  const [deviceUniqueID, setDeviceid] = useState();
  const [oneSignalPushToken, setOneSignalPushToken] = useState();

  useEffect(() => {
    if (notifications == 0) {
      setisModalVisible(true);
    } else {
      setisModalVisible(false);
    }
  }, [notifications]);

  useEffect(() => {
    // let deviceid = Constants.deviceId;
    // setDeviceid(deviceid);
    setUniqueDeviceID();
    AsyncStorage.getItem('@apidistData').then((distdata) => {
      setDistData(JSON.parse(distdata));
      retrieveData(JSON.parse(distdata));
    });
    getUserId();
  }, []);

  const setUniqueDeviceID = async () => {
    let fetchUUID = await SecureStore.getItemAsync('secure_deviceid');
    let deviceid = fetchUUID.slice(1);
    deviceid = deviceid.slice(0, deviceid.length - 1);
    setDeviceid(deviceid);
    retrieveData(deviceid);
  };

  const getUserId = async () => {
    if (Platform.OS === "android") {
      const deviceState = await OneSignal.getDeviceState();
      if (deviceState != null) {
        setOneSignalPushToken(deviceState.pushToken);
      }
    } else {
      let status = (OSPermissionSubscriptionState =
        OneSignal.getPermissionSubscriptionState());
      let tokenPush = status.subscriptionStatus.pushToken;
      setOneSignalPushToken(tokenPush);
      console.log(Userid);
      console.log(tokenPush);
    }
  };

  //retriving data which is save on phone db (async storage)
  const retrieveData = async (distValue) => {
    try {
      const valueApiLogData = await AsyncStorage.getItem('@apilogdata');
      if (valueApiLogData !== null) {
        const sessionvalue = JSON.parse(valueApiLogData).session;
        AsyncStorage.getItem('@StudentID').then((studentID) => {
          getNotifications(
            sessionvalue,
            JSON.parse(studentID),
            distValue.districtid
          );
        });
      } 
    } catch (error) {}
  };

  //appending session and fetch announcements data from api
  const getNotifications = async (SessionValue, studentid, distID) => {
    console.log(distID);
    let formdata = new FormData();
    formdata.append('studentid', studentid);
    formdata.append('deviceID', deviceUniqueID);
    formdata.append('pushToken', oneSignalPushToken);
    console.log(formdata);
    let response = await latestNotification(SessionValue, distID, formdata);
    if (response.ok) {
      let notification = await response.json();
      setNotifications(notification.data);
    }
  };
  return (
    //   view starts here
    <SafeAreaView
      style={[
        themes.menuContainer,
        {
          backgroundColor: distData?.primarycolor
            ? distData?.primarycolor
            : '#ffffff',
        },
      ]}
    >
      <StatusBar
        animated={true}
        barStyle="light-content"
        backgroundColor={
          distData?.primarycolor ? distData?.primarycolor : '#ffffff'
        }
      />
      <View style={themes.txtview}>
        <TouchableOpacity
          activeOpacity={1}
          style={themes.backbtn}
          onPress={() => navigation.goBack(null)}
        >
          <Ionicons
            name='chevron-back'
            color={invertColor(
              distData?.primarycolor ? distData?.primarycolor : '#ffffff',
              true
            )}
            style={themes.backIcon}
          />
        </TouchableOpacity>
        <Text style={themes.txth2}>Latest Notifications</Text>
        <View style={themes.backgroudMenu}>
          <View style={themes.boxScroll}></View>
          {
            // Announcement notification start here
          }
          <FlatList
            data={notifications}
            style={{
              flexGrow: 1,
            }}
            renderItem={({ item }) => (
              <View style={themes.announcementView}>
                <Text style={themes.headtxt}>{item.messagetitle}</Text>
                <Text style={themes.txtdetails}>{item.messagetext}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          ></FlatList>
        </View>
      </View>

      {isModalVisible && (
        <View style={themes.idCard}>
          <View style={themes.notificationMOdel}>
            <Image source={require('../assets/notificationscreen.png')}></Image>
            <Text>You do not have any notifications</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
export default LatestNotifications;
