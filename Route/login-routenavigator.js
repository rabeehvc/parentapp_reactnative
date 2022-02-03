//it is used to navigate to the login screen as initial screen when district data is there

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DistrictCode from "../Screens/district-code";
import SearchDistrict from "../Screens/search-district";
import Login from "../Screens/login";
import NotificationSettings from "../Screens/notification-settings";
import LatestNotifications from "../Screens/latest-notifications";
import MoreSettings from "../Screens/more-settings"
import Announcements from "../Screens/announcements"
import StudentList from "../Screens/student-list"

const Stack = createStackNavigator();

const LoginNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SearchDistrict" component={SearchDistrict} />
      <Stack.Screen name="DistrictCode" component={DistrictCode} />
      <Stack.Screen name="MoreSettings" component={MoreSettings} />
      <Stack.Screen name="StudentList" component={StudentList} />
      <Stack.Screen name="Announcements" component={Announcements} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
      />
      <Stack.Screen
        name="LatestNotifications"
        component={LatestNotifications}
      />
    </Stack.Navigator>
  );
};
export default LoginNavigator;
