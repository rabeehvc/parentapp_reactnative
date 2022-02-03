import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Platform,
  LogBox
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import jwt_decode from 'jwt-decode';
import Toast from 'react-native-tiny-toast';
import OneSignal from 'react-native-onesignal';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { invertColor } from '../Functions/functions';
import groupArray from 'group-array';
import themes from '../Styles/themes';
import {
  NotificationSet,
  NotificationUpdates,
} from '../Services/notification-services';
import {
  Placeholder,
  PlaceholderMedia,
  PlaceholderLine,
  Fade,
} from 'rn-placeholder';

LogBox.ignoreLogs(['VirtualizedList'],['Warning: Each child'])

const NotificationSettings = ({ navigation }) => {
  //useStates
  const [notifications, setNotifications] = useState([]);
  const [distData, setDistData] = useState();
  const [districtID, setDistrictID] = useState();
  const [grpArray, setGroupedArray] = useState();
  const [thresholdModalVisible, setThresholdModalVsibile] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('');
  const [deviceUniqueID, setDeviceid] = useState();
  const [sessionvalue, setSessionValue] = useState();
  const [stdId, setStudentID] = useState();
  const [onesignalUserID, setOneSignalUserID] = useState();
  const [oneSignalPushToken, setOneSignalPushToken] = useState();
  const [isVisiblePlaceholder, setPlaceholderVisible] = useState(true);
  const [devicePlatform, setDevicePlatform] = useState();

  useEffect(() => {
    setUniqueDeviceID();
    AsyncStorage.getItem('@apidistData').then((distdata) => {
      setDistData(JSON.parse(distdata));
    });
    getUserId();
    let devicePlatform = Platform.OS;
    if (devicePlatform === "ios") {
      setDevicePlatform('IOS');
    } else {
      setDevicePlatform('AND');
    }
  }, []);

  const setUniqueDeviceID = async () => {
    let fetchUUID = await SecureStore.getItemAsync('secure_deviceid');
    let deviceid = fetchUUID.slice(1);
    deviceid = deviceid.slice(0, deviceid.length - 1);
    setDeviceid(deviceid);
    retrieveData(deviceid);
  };

  const getUserId = async () => {
    const deviceState = await OneSignal.getDeviceState();
    if (deviceState != null) {
      setOneSignalUserID(deviceState.userId);
      setOneSignalPushToken(deviceState.pushToken);
    }
  };

  useEffect(() => {
    const grouped = groupArray(notifications, 'categorydescription');
    const groupedArray = Object.values(grouped);
    setGroupedArray(groupedArray);
  }, [notifications]);

  //retriving data which is save on phone db (async storage)
  const retrieveData = async (deviceid) => {
    try {
      const valueApiLogData = await AsyncStorage.getItem('@apilogdata');
      if(valueApiLogData !== null){
        const sessionvalue = JSON.parse(valueApiLogData).session;
        setSessionValue(sessionvalue);
        const decoded = jwt_decode(sessionvalue);
        let districtid = decoded.districtid;
        setDistrictID(districtid);
        AsyncStorage.getItem('@StudentID').then((studentID) => {
          setStudentID(JSON.parse(studentID));
          setPlaceholderVisible(true);
          getNotificationSetting(
            sessionvalue,
            districtid,
            JSON.parse(studentID),
            deviceid
          );
        });
      }    
    } catch (error) {}
  };

  //appending session and fetch notification setting data from api
  const getNotificationSetting = async (
    sessionValue,
    distID,
    studentid,
    deviceid
  ) => {
    let response = await NotificationSet(
      sessionValue,
      distID,
      studentid,
      deviceid
    );
    if (response.ok) {
      let notification = await response.json();
      let notificationSettings = notification.notificationtypes;
      setNotifications(notificationSettings);
      setPlaceholderVisible(false);
    }
  };
  // // for notification updates to api
  const setswitches = (val, pushnotificationtypeid) => {
    let notificationArray = notifications;
    const selectedSettings = notificationArray.findIndex(
      (noti) => noti.pushnotificationtypeid === pushnotificationtypeid
    );
    if (selectedSettings >= 0) {
      notificationArray[selectedSettings].pushnotificationallowed = val ? 1 : 0;
      setNotifications(notificationArray);
      const grouped = groupArray(notificationArray, 'categorydescription');
      const groupedArray = Object.values(grouped);
      setGroupedArray(groupedArray);
      let formdata = new FormData();
      formdata.append('studentid', stdId);
      formdata.append('deviceID', deviceUniqueID);
      formdata.append('vendorID', onesignalUserID);
      formdata.append('pushToken', oneSignalPushToken);
      formdata.append('pushnotificationtypeid', pushnotificationtypeid);
      formdata.append('pushnotificationallowed', val ? 1 : 0);
      formdata.append(
        'notificationServiceObjectName',
        Platform.OS === "ios"
          ? 'externalApi.lib.IOS.OneSignalNotificationV2'
          : 'externalApi.lib.Android.OneSignalNotificationV2'
      );
      formdata.append('deviceType', devicePlatform);
      let response = NotificationUpdates(sessionvalue, districtID, formdata);
      if (response.ok) {
        let notification = response.json();
        setNotificationUpdates(notification.data);
      }
    }
  };

  //request for threshold
  const setThresholdValue = () => {
    let notificationArray = notifications;
    const selectedSettings = notificationArray.findIndex(
      (noti) => noti.pushnotificationtypeid === 1
    );
    if (selectedSettings >= 0) {
      setNotifications(notificationArray);
      const grouped = groupArray(notificationArray, 'categorydescription');
      const groupedArray = Object.values(grouped);
      setGroupedArray(groupedArray);
      let formdata = new FormData();
      formdata.append('studentid', stdId);
      formdata.append('deviceID', deviceUniqueID);
      formdata.append('vendorID', onesignalUserID);
      formdata.append('pushToken', oneSignalPushToken);
      formdata.append('pushnotificationtypeid', 1);
      formdata.append(
        'pushnotificationallowed',
        notificationArray[selectedSettings].pushnotificationallowed
      );
      formdata.append('settingvalue1', thresholdInput);
      formdata.append(
        'notificationServiceObjectName',
        Platform.OS === "ios"
          ? 'externalApi.lib.IOS.OneSignalNotificationV2'
          : `externalApi.lib.Android.OneSignalNotificationV2`
      );
      formdata.append('deviceType', devicePlatform);
      let response = NotificationUpdates(sessionvalue, districtID, formdata);
      if (response.ok) {
        let notification = response.json();
        setNotificationUpdates(notification.data);
      }
    }
  };

  //button event for threshold update
  const btnThresholdOK = () => {
    const numbers = '0123456789';
    let numberOnly = true;

    for (let i = 0; i < thresholdInput.length; i++) {
      if (numbers.indexOf(thresholdInput[i]) > -1) {
      } else {
        numberOnly = false;
      }
    }

    if (!numberOnly) {
      Alert.alert(
        'Unexpected Value',
        'Please enter an integer value within the range of 1-100. All other values are considered invalid.'
      );
      return;
    }
    if (!thresholdInput) {
      Alert.alert(
        'Unexpected Value',
        'Please enter an integer value within the range of 1-100. All other values are considered invalid.'
      );
    } else {
      if (thresholdInput < 1 || thresholdInput > 100) {
        Alert.alert(
          'Unexpected Value',
          'Please enter an integer value within the range of 1-100. All other values are considered invalid.'
        );
      } else {
        Toast.show(`Grade threshold updated to:${thresholdInput}`, {
          mask: true,
          position: Toast.position.center,
          shadow: true,
          containerStyle: {
            backgroundColor: '#4F8A10',
            borderRadius: 999,
            width: "auto",
          },
          textStyle: { fontSize: 12 },
        });
        setThresholdValue();
        changeModelVisible(false);
      }
    }
  };

  //close event for threshold modal
  const changeModelVisible = (bool) => {
    setThresholdModalVsibile(bool);
  };

  const setThresholdModalVisible_setThresholdValue = (settingValue) => {
    if (thresholdInput == '') {
      setThresholdInput(settingValue);
    }
    setThresholdModalVsibile(true);
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

      <View
        style={Platform.OS === "android" ? themes.txtview : themes.txtviewIOS}
      >
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
      </View>
      <Text style={themes.txth2}>Notification Settings</Text>

      <View style={themes.settingsTab}>
        {isVisiblePlaceholder && (
          <View style={themes.animationPlaceholder}>
            <PlaceholderLine width={80} />
            <PlaceholderLine />
            <PlaceholderLine width={30} />
          </View>
        )}
        <FlatList
          style={themes.flatlistSettingStyle}
          data={grpArray}
          renderItem={({ item }) => (
            <View style={themes.notificationSettings}>
              <Text style={themes.hNotification}>
                {item[0].categorydescription}
              </Text>

              {item.map((notification) => {
                return (
                  <>
                    <View style={themes.fieldNotification}>
                      <Text style={themes.txtMore}>
                        {notification.description}
                      </Text>
                      <Switch
                        style={themes.toggleSwitch}
                        trackColor={{ false: '#767577', true: '#082754' }}
                        thumbColor={
                          notification.pushnotificationallowed === 1
                            ? '#84C441'
                            : '#f4f3f4'
                        }
                        onValueChange={(val) =>
                          setswitches(val, notification.pushnotificationtypeid)
                        }
                        keyExtractor={(_notification, index) =>
                          index.toString()
                        }
                        value={notification.pushnotificationallowed === 1}
                      />
                    </View>

                    {notification.pushnotificationtypeid === 1 && (
                      <>
                        <View style={themes.fieldNotification}>
                          <TouchableOpacity
                            onPress={() =>
                              setThresholdModalVisible_setThresholdValue(
                                notification.settingvalue1
                              )
                            }
                          >
                            <Text style={themes.txtMore}>Grade threshold</Text>
                            <Text style={themes.txtThreshold}>
                              Click to enter grade threshold
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {/* threshold model view starts here  */}

                        {thresholdModalVisible && (
                          <Modal
                            animationType="fade"
                            transparent={true}
                            visible={thresholdModalVisible}
                            onRequestClose={() => changeModelVisible(false)}
                          >
                            <View style={themes.overlaycontainer}>
                              <View style={themes.centeredView}>
                                <View style={themes.modalViewThreshold}>
                                  <TextInput
                                    style={themes.txtinputThreshold}
                                    maxLength={3}
                                    keyboardType="numeric"
                                    value={thresholdInput}
                                    onChangeText={(value) => {
                                      setThresholdInput(
                                        value.replace(
                                          /[- #*;,.<>\{\}\(\)\[\]\\\/]/gi,
                                          ''
                                        )
                                      );
                                    }}
                                  ></TextInput>
                                  {/* <MaskedTextInput
                                    style={themes.txtinputThreshold}
                                    mask='999'
                                    onChangeText={(text, rawText) => {
                                      console.log(text);
                                      setThresholdInput(text);
                                      //console.log(rawText);
                                    }}
                                  /> */}
                                  <View style={themes.btnView}>
                                    <TouchableOpacity
                                      onPress={() => changeModelVisible(false)}
                                    >
                                      <Text
                                        style={[
                                          themes.thresholbBtnStyle,
                                          { marginRight: 20 },
                                        ]}
                                      >
                                        CANCEL
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => btnThresholdOK()}
                                    >
                                      <Text style={themes.thresholbBtnStyle}>
                                        OK
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </Modal>
                        )}
                      </>
                    )}
                  </>
                );
              })}
            </View>
          )}
        ></FlatList>
      </View>

      <View style={themes.backgroudMenu}></View>
    </SafeAreaView>
  );
};
export default NotificationSettings;
