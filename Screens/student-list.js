import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import themes from '../Styles/themes';

const StudentList = ({ navigation, route }) => {
  const [distData, setDistData] = useState();
  const [arrayObjects, setArrayObjects] = useState();

  useEffect(() => {
    retrieveData();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@apidistData').then((distdata) => {
      setDistData(JSON.parse(distdata));
    });
  }, []);
  
  const saveStudentID = async (item) => {
    let stdID = item.studentid;
    AsyncStorage.setItem('@StudentID', JSON.stringify(stdID));
    navigation.navigate('Announcements');
  };

  const retrieveData = async () => {
    try {
      const valueApiLogData = await AsyncStorage.getItem('@apilogdata');
      if(valueApiLogData !== null){
        const token = JSON.parse(valueApiLogData).session;
        const decoded = jwt_decode(token);
        let decodedData = decoded.students;
        let dataObjects = Object.values(decodedData);
        setArrayObjects(dataObjects);        
      }  
    } catch (error) {}
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
      <Text style={[themes.txth2, themes.txtview]}>Select Student</Text>
      <View style={themes.settingsTab}>
        <FlatList
          data={arrayObjects}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                onPress={() => saveStudentID(item)}
                style={themes.btnStudentList}
              >
                <Text style={themes.txtStudentList}>
                  {' '}
                  {`${item.firstname} ${
                    item.middlename ? item.middlename : ' '
                  } ${item ? item.lastname : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        ></FlatList>
      </View>
      <View style={themes.backgroudMenu}></View>
    </SafeAreaView>
  );
};
export default StudentList;
