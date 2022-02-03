import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch,
  Platform,
  LogBox
} from 'react-native';
import CheckBox from 'expo-checkbox';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-tiny-toast';
import jwt_decode from 'jwt-decode';
import OneSignal from 'react-native-onesignal';
import DeviceInfo from 'react-native-device-info';
import { useIsFocused } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import themes from '../Styles/themes';
import { LoginServices } from '../Services/authentication-services';
import { invertColor } from '../Functions/functions';
import { decrypt } from '../Functions/functions';
import { encrypt } from '../Functions/functions';
import * as LocalAuthentication from 'expo-local-authentication';

LogBox.ignoreLogs(['Setting a timer'])

const Login = ({ navigation, route }) => {
  //useStates
  const [indicator, setIndicator] = useState(false);
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [isSelected, setSelection] = useState();
  //useRef to reference the text iput from username to password
  const ref_password = useRef();
  const [data, setDistData] = useState();
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const [isDisabled, setBtnDisabled] = useState();
  const [bioBtnDisabled, setBioBtnDisabled] = useState();
  const isFocused = useIsFocused();
  const [onesignalUserID, setOneSignalUserID] = useState();
  const [oneSignalPushToken, setOneSignalPushToken] = useState();
  const [deviceUniqueID, setDeviceid] = useState();
  const [portalCode, setPortalCode] = useState();
  const [deviceName, setDeviceName] = useState();
  const [devicePlatform, setDevicePlatform] = useState();
  const [nativeAppVersion, setNativeAppVersion] = useState();

  let timeOutIDNormalLogin = null;
  let timeOutIDBioLogin = null;

  useEffect(() => {
    setIndicator(false);
    setBtnDisabled(false);
    setBioBtnDisabled(false);
    getUserId();
    // let deviceId = Constants.deviceId;
    // setDeviceid(deviceId);
    setUniqueDeviceID();
    setDeviceName(Device.deviceName);
    setDevicePlatform(Platform.OS);
    if (Application.nativeAppVersion == undefined) {            
      setNativeAppVersion(DeviceInfo.getVersion());
    }else{
      setNativeAppVersion(Application.nativeAppVersion);
    }
    
  }, []);

  const setUniqueDeviceID = async () => {
    let fetchUUID = await SecureStore.getItemAsync('secure_deviceid');
    let deviceid = fetchUUID.slice(1);
    deviceid = deviceid.slice(0, deviceid.length - 1);
    setDeviceid(deviceid);
    retrieveData(deviceid);
  };

  useEffect(() => {
    if (isFocused) {
      getUserName();
      retrieveData();
      AsyncStorage.getItem('@logout').then((logout) => {
        if (logout) {
          setPassWord('');
          AsyncStorage.removeItem('@logout');
          if (!isSelected) {
            setUserName('');
          }
        }
      });
      AsyncStorage.removeItem('@apilogdata');
      AsyncStorage.getItem('@distCode').then((distCode) => {
        setPortalCode(distCode);
      });
      setBtnDisabled(false);
    }
  }, [isFocused]);

  const retrieveData = () => {
    if (route.params?.data) {
      setDistData(route.params.data);
      AsyncStorage.setItem('@apidistData', JSON.stringify(route.params.data));
    } else {
      AsyncStorage.getItem('@apidistData').then((distdata) => {
        setDistData(JSON.parse(distdata));
      });
    }
  };

  const getUserId = async () => {
    const deviceState = await OneSignal.getDeviceState();
    if (deviceState != null) {
      setOneSignalUserID(deviceState.userId);
      setOneSignalPushToken(deviceState.pushToken);
    }
  };

  // Check if hardware supports biometrics
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  });

  //geting saved username from async storage
  const getUserName = async () => {
    AsyncStorage.getItem('@username').then((name) => {
      if (name) {       
        setUserName(name);
        setSelection(true);
      } else {       
        setUserName('');
        setSelection(false);
      }
    });
  };

  const timeOutNormalFunc = () => {
    timeOutIDNormalLogin = setTimeout(() => {
      Alert.alert('Alert', 'Your session has expired, Please login again', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Login');
          },
        },
      ]);
    }, 900000);
  };

  const timeOutBioFunc = () => {
    timeOutIDBioLogin = setTimeout(() => {
      Alert.alert('Alert', 'Your session has expired, Please login again', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Login');
          },
        },
      ]);
    }, 900000);
  };

  //button event for login
  const studentLogin = async () => {
    setBtnDisabled(true);
    setIndicator(true);
    setBioBtnDisabled(true);
    if (errorCheck()) {
      let formdata = new FormData();
      //append username,password,districtid,portalcode to the url
      formdata.append('username', userName);
      formdata.append('password', passWord);
      formdata.append('districtID', data.districtid);
      formdata.append('vendorID', onesignalUserID);
      formdata.append('pushToken', oneSignalPushToken);
      formdata.append('deviceID', deviceUniqueID);
      formdata.append('portalcode', portalCode);
      formdata.append('deviceFriendlyName', deviceName);
      formdata.append('deviceType', devicePlatform);
      formdata.append('deviceAppVersion', nativeAppVersion);
      let response = await LoginServices(formdata);
      setIndicator(true);
      if (response.ok) {
        try {
          let logdata = await response.json();
          if (logdata.status == 'success') {
            //if check box selected data will be stored
            if (isSelected) {
              AsyncStorage.setItem('@username', userName);
            } else {
              AsyncStorage.removeItem('@username');
            }
            const token = logdata.session;
            const decoded = jwt_decode(token);
            let decodedData = decoded.students;
            let dataObjects = Object.values(decodedData);

            if (dataObjects.length > 1) {
              navigation.navigate('StudentList');
            } else {
              dataObjects.map((stdData) => {
                AsyncStorage.setItem(
                  '@StudentID',
                  JSON.stringify(stdData.studentid)
                );
              });
              navigation.navigate('Announcements');
            }
            const encrypted_text = encrypt('salt', passWord);
            AsyncStorage.setItem('@Password', encrypted_text);
            await AsyncStorage.setItem('@apilogdata', JSON.stringify(logdata));
            setIndicator(false);
            setBtnDisabled(false);
            setBioBtnDisabled(false);
            clearTimeout(timeOutIDBioLogin);
            timeOutNormalFunc();
            AsyncStorage.setItem(
              '@loginTimeOutNormal',
              JSON.stringify(timeOutIDNormalLogin)
            );

            AsyncStorage.getItem('@loginTimeOutBio').then(async (Pass) => {
              if (Pass) {
                clearTimeout(parseInt(Pass));
              }
            });
          } else {
            Alert.alert(
              'Invalid login',
              'Invalid login credentials provided.Please try again.'
            );
            setBtnDisabled(false);
            setIndicator(false);
            setBioBtnDisabled(false);
          }
        } catch (err) {
          alert(err);
        }
      } else {
        setBtnDisabled(false);
        setBioBtnDisabled(false);
        setIndicator(false);
        Alert.alert('Invalid Login',`Status Code: ${response.status}`)              
      }
    }
  };
  const errorCheck = () => {
    let valid = true;
    if (!userName.trim() || !passWord.trim()) {
      valid = false;
      setIndicator(false);
      Toast.show('Please make sure you have filled out all the fields.', {
        mask: true,
        shadow: true,
        containerStyle: {
          backgroundColor: '#D8000C',
          borderRadius: 999,
          width: "auto",
        },
        textStyle: { fontSize: 12 },
      });
      setBtnDisabled(false);
      setBioBtnDisabled(false);
    }
    return valid;
  };

  // BIO authentication
  const fallBackToDefaultAuth = () => {
    console.log('fall back to password authentication');
  };

  const alertComponent = (title, mess, btnTxt, btnFunc) => {
    return Alert.alert(title, mess, [
      {
        text: btnTxt,
        onPress: btnFunc,
      },
    ]);
  };

  const handleBiometricAuth = async () => {
    // Check if hardware supports biometrics
    const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
    // Fallback to default authentication method (password) if Fingerprint is not available
    if (!isBiometricAvailable)
      return alertComponent(
        'Please enter your password',
        'Biometric Authentication not supported',
        'OK',
        () => fallBackToDefaultAuth()
      );

    // Check Biometrics types available (Fingerprint, Facial recognition, Iris recognition)
    if (isBiometricAvailable)
      supportedBiometrics =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Check Biometrics are saved locally in user's device
    const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
    if (!savedBiometrics)
      return alertComponent(
        'Biometric record not found',
        'Please login with your password',
        'OK',
        () => fallBackToDefaultAuth()
      );

    // Authenticate use with Biometrics (Fingerprint, Facial recognition, Iris recognition)
    const biometricAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login with Biometrics',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });

    // Log the user in on success

    if (biometricAuth.success == true) {
      setBioBtnDisabled(true);
      setBtnDisabled(true);
      setIndicator(true);
      if (!userName.trim()) {
        setIndicator(false);
        Toast.show('Please fill the username.', {
          mask: true,
          shadow: true,
          containerStyle: {
            backgroundColor: '#D8000C',
            borderRadius: 999,
            width: "auto",
          },
          textStyle: { fontSize: 12 },
        });
        setBioBtnDisabled(false);
      } else {
        AsyncStorage.getItem('@Password').then(async (Pass) => {
          if (Pass) {
            const decrypted_string = decrypt('salt', Pass);
            let formdata = new FormData();
            //append username,password,districtid,portalcode to the url
            formdata.append('username', userName);
            formdata.append('password', decrypted_string);
            formdata.append('districtID', data.districtid);
            formdata.append('vendorID', onesignalUserID);
            formdata.append('pushToken', oneSignalPushToken);
            formdata.append('deviceID', deviceUniqueID);
            formdata.append('portalcode', portalCode);
            formdata.append('deviceFriendlyName', deviceName);
            formdata.append('deviceType', devicePlatform);
            formdata.append('deviceAppVersion', nativeAppVersion);
            let response = await LoginServices(formdata);
            if (response.ok) {
              try {
                let logdata = await response.json();
                if (logdata.status == 'success') {
                  //if check box selected data will be stored
                  if (isSelected) {
                    AsyncStorage.setItem('@username', userName);
                  } else {
                    AsyncStorage.removeItem('@username');
                  }
                  const token = logdata.session;
                  const decoded = jwt_decode(token);
                  let decodedData = decoded.students;
                  let dataObjects = Object.values(decodedData);
                  if (dataObjects.length > 1) {
                    navigation.navigate('StudentList');
                  } else {
                    dataObjects.map((stdData) => {
                      AsyncStorage.setItem(
                        '@StudentID',
                        JSON.stringify(stdData.studentid)
                      );
                    });
                    navigation.navigate('Announcements');
                  }
                  await AsyncStorage.setItem(
                    '@apilogdata',
                    JSON.stringify(logdata)
                  );
                  setBioBtnDisabled(false);

                  setIndicator(false);
                  AsyncStorage.getItem('@loginTimeOutNormal').then(
                    async (Pass) => {
                      if (Pass) {
                        clearTimeout(parseInt(Pass));
                      }
                    }
                  );

                  timeOutBioFunc();
                  AsyncStorage.setItem(
                    '@loginTimeOutBio',
                    JSON.stringify(timeOutIDBioLogin)
                  );
                } else {
                  Alert.alert(
                    'Invalid login',
                    'Invalid login credentials provided.Please try again.'
                  );
                  setBioBtnDisabled(false);
                  setBtnDisabled(false);
                  setIndicator(false);
                }
              } catch (err) {
                alert(err);
              }
            } else {
              setBtnDisabled(false);
              setBioBtnDisabled(false);
              setIndicator(false);
              Alert.alert('Invalid Login','Status Code: '+response.status)              
            }
          } else {
            alert('Use password to login for first time');
            setBioBtnDisabled(false);
            setBtnDisabled(false);
            setIndicator(false);
          }
        });
      }
    } else {
      setBtnDisabled(false);
      setBioBtnDisabled(false);
    }
  };
  return (
    <SafeAreaView
      style={[
        themes.container,
        {
          backgroundColor: data?.primarycolor ? data?.primarycolor : '#ffffff',
        },
      ]}
    >
      <StatusBar
        animated={true}
        barStyle="light-content"
        backgroundColor={data?.primarycolor ? data?.primarycolor : '#ffffff'}
      />
      <View style={themes.containerPadding}>
        <ActivityIndicator
          size="large"
          style={themes.loading}
          color={invertColor(
            data?.primarycolor ? data?.primarycolor : '#ffffff',
            true
          )}
          animating={indicator}
        />
        <KeyboardAwareScrollView>
          <View style={themes.txtview}>
            <Text
              style={[
                themes.txth1,
                {
                  color: invertColor(
                    data?.primarycolor ? data?.primarycolor : '#ffffff',
                    true
                  ),
                },
              ]}
            >
              Realtime
            </Text>
            <Text
              style={[
                themes.txth2,
                {
                  color: invertColor(
                    data?.primarycolor ? data?.primarycolor : '#ffffff',
                    true
                  ),
                },
              ]}
            >
              Link for Parents
            </Text>
          </View>
          <View style={themes.image}>
            <Image source={require('../assets/loginimage.png')}></Image>
          </View>
          {/* bottombox starts here */}
          <View style={themes.loginViewBox}>
            <Text
              style={[
                themes.txth3,
                {
                  color: invertColor(
                    data?.primarycolor ? data?.primarycolor : '#ffffff',
                    true
                  ),
                },
              ]}
            >
              {data?.districtdisplayname}
            </Text>
            {/* text field for username and password*/}
            <View style={themes.field}>
              <TextInput
                style={[
                  themes.txtInput,
                  {
                    color: invertColor(
                      data?.primarycolor ? data?.primarycolor : '#ffffff',
                      true
                    ),
                    borderBottomColor: data?.secondarycolor
                      ? data?.secondarycolor
                      : '#000000',
                  },
                ]}
                value={userName}
                maxLength={25}
                onChangeText={(username) => setUserName(username)}
                onSubmitEditing={() => ref_password.current.focus()}
                placeholder='Username'
                placeholderTextColor={invertColor(
                  data?.primarycolor ? data?.primarycolor : '#ffffff',
                  true
                )}
              ></TextInput>
              <Feather name='user' style={themes.icon} />
            </View>
            <View style={themes.fieldPass}>
              <TextInput
                style={[
                  themes.txtInput,
                  {
                    color: invertColor(
                      data?.primarycolor ? data?.primarycolor : '#ffffff',
                      true
                    ),
                    borderBottomColor: data?.secondarycolor
                      ? data?.secondarycolor
                      : '#000000',
                  },
                ]}
                value={passWord}
                maxLength={25}
                ref={ref_password}
                onChangeText={(password) => setPassWord(password)}
                placeholder='Password'
                placeholderTextColor={invertColor(
                  data?.primarycolor ? data?.primarycolor : '#ffffff',
                  true
                )}
                autoCapitalize="none"
                secureTextEntry={true}
              ></TextInput>
              <Feather name='lock' style={themes.icon} />
            </View>

            {/* checkbox fo remember me */}
            <View style={themes.checkboxContainer}>
              <View style={{ flexDirection: "row", display: "flex" }}>
                {Platform.OS === "android" ? (
                  <CheckBox
                    color={
                      isSelected
                        ? data?.secondarycolor
                          ? data?.secondarycolor
                          : '#000000'
                        : undefined
                    }
                    style={themes.CheckBox}
                    value={isSelected}
                    onValueChange={setSelection}
                    onPress={() => {
                      storeUser;
                    }}
                  />
                ) : (
                  <Switch
                    style={themes.remembermeSwitch}
                    trackColor={{
                      true: data?.secondarycolor
                        ? data?.secondarycolor
                        : '#000000',
                      false: data?.primarycolor
                        ? data?.primarycolor
                        : '#ffffff',
                    }}
                    thumbColor={
                      isSelected
                        ? invertColor(
                            data?.primarycolor ? data?.primarycolor : '#ffffff',
                            true
                          )
                        : '#fffff'
                    }
                    value={isSelected}
                    onValueChange={setSelection}
                  ></Switch>
                )}
                <Text
                  style={[
                    themes.txtCheck,
                    {
                      color: invertColor(
                        data?.primarycolor ? data?.primarycolor : '#ffffff',
                        true
                      ),
                    },
                  ]}
                >
                  Remember Me
                </Text>
              </View>
              <Text
                disabled={bioBtnDisabled}
                style={[
                  themes.btnBiokit,
                  {
                    color: invertColor(
                      data?.primarycolor ? data?.primarycolor : '#ffffff',
                      true
                    ),
                  },
                ]}
                onPress={handleBiometricAuth}
              >
                {' '}
                {isBiometricSupported ? 'Login with Face/Touch ID' : ''}
              </Text>
            </View>

            {/*Login button */}
            <TouchableOpacity
              disabled={isDisabled}
              activeOpacity={0.3}
              style={[
                themes.btn,
                {
                  backgroundColor: data?.secondarycolor
                    ? data?.secondarycolor
                    : '#000000',
                },
              ]}
              onPress={() => studentLogin()}
            >
              <Text
                style={{
                  color: invertColor(
                    data?.secondarycolor ? data?.secondarycolor : '#000000',
                    true
                  ),
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
            <View style={themes.distStyle}>
              {/* change district code */}
              <TouchableOpacity
                activeOpacity={0.6}
                style={[
                  themes.btnChangedist,
                  {
                    borderBottomColor: data?.secondarycolor
                      ? data?.secondarycolor
                      : '#000000',
                  },
                ]}
                onPress={() => navigation.navigate('DistrictCode')}
              >
                <Text
                  style={{
                    color: invertColor(
                      data?.primarycolor ? data?.primarycolor : '#ffffff',
                      true
                    ),
                  }}
                >
                  Change District
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};
export default Login;
