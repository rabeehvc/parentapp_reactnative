import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-tiny-toast';
import themes from '../Styles/themes';
import { SearchDistrictServices } from '../Services/authentication-services';
import { DistrictCodeServices } from '../Services/authentication-services';

const SearchDistrict = ({ navigation }) => {
  const [districtList, setDistrictList] = useState([]);
  // For Filtered Data
  const [suggestions, setSuggestions] = useState([]);
  // For Selected Data
  const [selectedValue, setSelectedValue] = useState({});
  // For search filed value
  const [searchKey, setSearchKey] = useState('');
  const isFocused = useIsFocused();
  const [indicator, setIndicator] = useState(false);
  const [isDisabled, setBtnDisabled] = useState(false);

  //useEffect
  useEffect(() => {
    getDistrictName();
    filterDistrict();
  }, [isFocused]);

  const getDistrictName = async () => {
    setBtnDisabled(true);
    setIndicator(true);
    let response = await SearchDistrictServices();    
    if (response.ok) {      
      setBtnDisabled(false);
      setIndicator(false);      
      let DistrictName = await response.json();
      setDistrictList(DistrictName.data);
    }else{
      setBtnDisabled(false);
      setIndicator(false);
      Alert.alert('Unable to Retrieve District Data',`Status Code: ${response.status}`)
    }
  };

  const filterDistrict = (query) => {
    setSearchKey(query);
    setSelectedValue('');
    // Method called every time when we change the value of the input
    if (query?.length > 3) {
      const newArray = districtList.filter((item) => {
        return (
          item.searchfield.toLowerCase().indexOf(query.toLowerCase()) === 0
        );
      });
      setSuggestions(newArray);
    } else {
      // If the query is null then return blank
      setSuggestions([]);
    }
  };

  const onSelectDistrict = (district) => {
    setSelectedValue(district);
    setSearchKey(district.searchfield);
    setSuggestions([]);
  };

  const passDistData = async () => {
    setBtnDisabled(true);
    setIndicator(true);
    if (!searchKey) {
      setIndicator(false);
      Toast.show('Please enter something...', {
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
    } else {
      let portalCode = selectedValue.districtcode;
      let response = await DistrictCodeServices(portalCode);
      if (response.ok) {
        try {
          let distData = await response.json();
          //passing parameter to the login page include the input value also
          navigation.navigate('Login', {
            data: distData,
            paramKey: portalCode,
            logout: 'logout',
          });
          AsyncStorage.setItem('@distCode', portalCode);
          setBtnDisabled(false);
          setIndicator(false);
        } catch {
          Alert.alert(
            'Invalid District Name',
            'Please check that you have entered a valid district Name and that you are connected to the network.'
          );
          setBtnDisabled(false);
          setIndicator(false);
        }
      }
    }
  };

  return (
    <SafeAreaView style={themes.container}>
      <ActivityIndicator
        size="large"
        style={themes.loading}
        color='#84C441'
        animating={indicator}
      />
      <KeyboardAwareScrollView>
        <View style={themes.containerPadding}>
          <View style={themes.txtview}>
            <TouchableOpacity
              activeOpacity={1}
              style={themes.backButton}
              onPress={() => navigation.navigate('DistrictCode')}
            >
              <Ionicons name='chevron-back' style={themes.backIcon} />
            </TouchableOpacity>
            <Text style={themes.txth1}>Realtime</Text>
            <Text style={themes.txth2}>Link for Parents</Text>
          </View>
          <View style={themes.image}>
            <Image source={require('../assets/searchdistrictimg.png')}></Image>
          </View>
          {/* Bottom field start here */}
          <View style={themes.viewBox}>
            <Text style={themes.txth3}>Search for District</Text>
          </View>
          <View style={themes.field}>
            <TextInput
              style={themes.txtInput}
              placeholder='Enter District Name'
              placeholderTextColor='#ffffff'
              returnKeyType='next'
              returnKeyLabel='next'
              onChangeText={(distName) => filterDistrict(distName)}
              value={searchKey}
            />
            <Feather name='map-pin' style={themes.icon} />
          </View>
          <View>
            {suggestions && suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                renderItem={({ item, index }) => {
                  return (
                    <TouchableOpacity onPress={() => onSelectDistrict(item)}>
                      <Text variant='bodyText' style={themes.btntxtSerchDist}>
                        {item.searchfield}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item.districtcode}
                style={themes.searchResultsContainer}
                extraData={searchKey}
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='on-drag'
              />
            )}
          </View>
          <TouchableOpacity
            style={themes.btn}
            disabled={isDisabled}
            onPress={() => passDistData()}
          >
            <Text style={themes.btnText}>Search</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};
export default SearchDistrict;
