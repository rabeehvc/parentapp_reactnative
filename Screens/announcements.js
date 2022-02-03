import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  StatusBar,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import jwt_decode from "jwt-decode";
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import {
  Placeholder,
  PlaceholderMedia,
  PlaceholderLine,
  Fade,
} from "rn-placeholder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import themes from "../Styles/themes";
import { StudentServices } from "../Services/student-services";
import { useIsFocused } from "@react-navigation/native";
import { checkURL } from "../Functions/functions";

const Announcements = ({ navigation, route }) => {
  //useStates
  const [value, setValues] = useState("");
  const [AnnouncementValues, setAnnouncements] = useState([]);
  const [distData, setDistData] = useState();
  const [isModalVisible, setisModalVisible] = useState(false);
  const [stdId, setStudentID] = useState();
  const [studentData, setStudentsData] = useState();
  const [tokenvalue, settokenValue] = useState();
  const isFocused = useIsFocused();

  useEffect(() => {    
    getDistData();
    retrieveData();
  }, [stdId]);

  const getDistData = async () => {
    try {
      const value = await AsyncStorage.getItem("@apidistData");
      if (value !== null) {
        setDistData(JSON.parse(value));
      }
    } catch (e) {
      // error reading value
    }
  };

  const retrieveData = async () => {
    try {
      let tokenValue = null;
      const valueApiLogData = await AsyncStorage.getItem("@apilogdata");
      if (valueApiLogData !== null) {        
        tokenValue = JSON.parse(valueApiLogData).session;
        settokenValue(tokenValue);
        const decoded = jwt_decode(tokenValue);
        let decodedData = decoded.students;
        let dataObjects = Object.values(decodedData);
        if (dataObjects.length > 1) {
          let res = dataObjects.filter((val) => {
            return val.studentid === stdId;
          });
          res.map((stdData) => {
            setStudentsData(stdData);
          });
        } else {
          dataObjects.map((stdData) => {
            setStudentsData(stdData);
          });
        }
      }
      const value = await AsyncStorage.getItem("@StudentID");
      if (value !== null) {
        setStudentID(JSON.parse(value));
        getAnnouncements(tokenvalue, distData.districtid, JSON.parse(value));
      }
    } catch (error) {}
  };

  const getAnnouncements = async (tokenvalue, distID, studentId) => {
    let response = await StudentServices(tokenvalue, distID, studentId);
    if (response.ok) {
      let announcementDatas = await response.json();
      setAnnouncements(announcementDatas);
    }
  };

  //event to close the modal
  const changeModelVisible = (bool) => {
    setisModalVisible(bool);
  };

  const getDirections = () => {
    if (Platform.OS === "android") {
      Linking.openURL(
        `google.navigation:q=${studentData && studentData.schooladdress}`
      );
    } else {
      Linking.openURL(
        `maps://app?saddr=100+101&daddr=${
          studentData && studentData.schooladdress
        }`
      );
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
            : "#ffffff",
        },
      ]}
    >
      <StatusBar
        animated={true}
        barStyle="light-content"
        backgroundColor={
          distData?.primarycolor ? distData?.primarycolor : "#ffffff"
        }
      />

      <Text style={[themes.txth2, themes.txtview]}>Announcements</Text>
      <View style={themes.settingsTab}>
        <View style={themes.announcementViewtop}>
          <Text style={themes.headtxt}>{distData?.districtdisplayname}</Text>
          <View style={themes.studDetails}>
            <Image
              style={themes.announcementImg}
              source={
                checkURL(value.studentimageurl)
                  ? { uri: value.studentimageurl }
                  : require("../assets/noimage.png")
              }
            ></Image>
            <View>
              <Text style={themes.studName}>
                {`${studentData && studentData.firstname} ${
                  studentData && studentData.middlename
                    ? studentData.middlename
                    : ""
                } ${studentData && studentData.lastname}`}
              </Text>

              <Text style={themes.studId}>
                Student Id : {studentData && studentData.studentid}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={themes.btnPhone}
            onPress={() => changeModelVisible(true)}
          >
            <FontAwesome
              name="phone"
              size={24}
              color="white"
              style={themes.phoneIcon}
            />
          </TouchableOpacity>
          {isModalVisible && (
            <Modal
              animationType="fade"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={() => changeModelVisible(false)}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => changeModelVisible(false)}
              ></TouchableOpacity>
              <View style={themes.modalviewPhone}>
                <View>
                  <Text style={themes.txtHead}>Phone :</Text>
                  <Text style={themes.txtPhoneresult}>
                    {studentData && studentData.schoolphone}
                  </Text>
                  <Text style={themes.txtHead}>Address :</Text>
                  <Text style={themes.txtPhoneresult}>
                    {studentData && studentData.schooladdress}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => getDirections()}
                  style={themes.btnDirections}
                >
                  <Text style={themes.btntxtDirection}>Directions</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
        </View>
        {AnnouncementValues.length > 0 ? (
          <FlatList
            data={AnnouncementValues}
            style={{
              flexGrow: 1,
              marginBottom: Platform.OS === "ios" ? "8%" : "10%",
            }}
            renderItem={({ item }) => (
              <View style={themes.announcementView}>
                <Text style={themes.headtxt}>{item.title}</Text>
                <Text style={themes.txtdetails}>{item.details}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          ></FlatList>
        ) : (
          <View style={themes.animationPlaceholder}>
            <PlaceholderLine width={80} />
            <PlaceholderLine />
            <PlaceholderLine width={30} />
          </View>
        )}
      </View>
      <View style={themes.tabStyle}>
        <TouchableOpacity
          onPress={() => navigation.navigate("MoreSettings")}
          style={themes.btnMoreTab}
        >
          <Text>
            <Feather name="more-horizontal" size={28} color={"#619B26"} />
          </Text>
          <Text style={themes.txtMoreStyle}>More</Text>
        </TouchableOpacity>
      </View>
      <View style={themes.backgroudMenu}></View>
    </SafeAreaView>
  );
};
export default Announcements;
