import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Alert,
  Linking,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import jwt_decode from 'jwt-decode';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themes from '../Styles/themes';
import { useIsFocused } from '@react-navigation/native';

export default function MoreSettings({ navigation }) {
  //useStates
  const [distData, setDistData] = useState();
  const [sessionValue, setSessionValue] = useState('');
  const [switchStudentVisible, setSwitchStudentVisible] = useState();
  const [value, setValues] = useState();
  const [stdId, setStudentID] = useState();
  const isFocused = useIsFocused();
  const [indicator, setIndicator] = useState(false);

  useEffect(() => {
    retrieveData();
  }, [isFocused]);

  //retrive data from the async storage and display when the page loads
  useEffect(() => {
    AsyncStorage.getItem('@apidistData').then((distdata) => {
      setDistData(JSON.parse(distdata));
    });
  }, []);

  //retriving data which is save on phone db (async storage)
  const retrieveData = async () => {
    try {
      const valueApiLogData = await AsyncStorage.getItem('@apilogdata');
      if(valueApiLogData !== null){
        const token = JSON.parse(valueApiLogData).session;
        setSessionValue(token);
        const decoded = jwt_decode(token);
        let decodedData = decoded.students;
        let dataObjects = Object.values(decodedData);
        if (dataObjects.length > 1) {
          AsyncStorage.getItem('@StudentID').then((studentID) => {
            setStudentID(JSON.parse(studentID));
          });
          setSwitchStudentVisible(true);
        } else {
          dataObjects.map((postData) => {
            setValues(postData);
            setStudentID(JSON.stringify(postData.studentid));
          });
          setSwitchStudentVisible(false);
        }
      } 
    } catch (error) {}
  };
  //eventhandler for logout
  //it remove only '@apilogdata' session
  const onLogout = () =>
    Alert.alert('Alert', 'Are you sure want to log out?', [
      {
        text: 'CANCEL',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'LOG OUT',
        onPress: () => {
          AsyncStorage.getItem('@loginTimeOutNormal').then(async (Pass) => {
            if (Pass) {
              clearTimeout(parseInt(Pass));
            }
          });
          AsyncStorage.getItem('@loginTimeOutBio').then(async (Pass) => {
            if (Pass) {
              clearTimeout(parseInt(Pass));
            }
          });
          navigation.navigate('Login');
          AsyncStorage.setItem('@logout', 'LOGOUT');
        },
      },
    ]);

  const notificationSettings = () => {
    setIndicator(true);
    navigation.navigate('NotificationSettings');
  };
  return (
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
      <ActivityIndicator
        size="large"
        style={themes.loading}
        color='#84C441'
        animating={indicator}
      />
      <Text style={[themes.txth2, themes.txtview]}>More</Text>
      <View style={themes.idCard}>
        <View style={themes.viewMore}>
          {switchStudentVisible ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('StudentList')}
            >
              <View style={themes.fieldMore}>
                <Feather name='refresh-cw' style={themes.moreIcons} />
                <Text style={themes.txtMore}>Switch Student</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(
                  `https://www.fridayparentportal.com/autologParentJWT.cfm?jwt=${sessionValue}&districtid=${distData.districtid}&sel=${stdId}`
                );
              }}
            >
              <View style={themes.fieldMore}>
                <AntDesign name='adduser' style={themes.moreIcons} />
                <Text style={themes.txtMore}>Add Student</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('LatestNotifications')}
          >
            <View style={themes.fieldMore}>
              <Feather name='bell' style={themes.moreIcons} />
              <Text style={themes.txtMore}>Latest Notifications</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => notificationSettings()}>
            <View style={themes.fieldMore}>
              <Feather name='settings' style={themes.moreIcons} />
              <Text style={themes.txtMore}>Notification Settings</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                `https://www.fridayparentportal.com/autologParentJWT.cfm?districtid=${distData.districtid}&sel=${stdId}&JWT=${sessionValue}`
              );
            }}
          >
            <View style={themes.fieldMore}>
              <MaterialCommunityIcons
                name='wallet-outline'
                style={themes.moreIcons}
              />
              <Text style={themes.txtMore}>Open Parent Portal</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <View style={themes.fieldMore}>
              <Feather name='log-out' style={themes.moreIcons} />
              <Text style={themes.txtMore}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={themes.backgroudMenu}></View>
    </SafeAreaView>
  );
}
