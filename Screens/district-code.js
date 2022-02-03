import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import Toast from 'react-native-tiny-toast';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import themes from '../Styles/themes';
import { DistrictCodeServices } from '../Services/authentication-services';


const DistrictCode = ({ navigation, route }) => {
  //useStates
  const [portalCode, setPortalCode] = useState('');
  const [indicator, setIndicator] = useState(false);
  const [isDisabled, setBtnDisabled] = useState(false);

  //code field parameters
  const CELL_COUNT = 4;
  const ref = useBlurOnFulfill({ portalCode, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    portalCode,
    setPortalCode,
  });

  //appending the ditric code to the url and fetching data
  const getDistrciCode = async () => {
    if (!isDisabled) {
      setIndicator(true);
      if (!portalCode || portalCode.length < 4) {
        setIndicator(false);
        Toast.show('Please make sure you have entered 4 digits.', {
          mask: true,
          shadow: true,
          containerStyle: {
            backgroundColor: '#D8000C',
            borderRadius: 999,
            width: 300,
          },
          textStyle: { fontSize: 11 },
        });
      } else {
        setBtnDisabled(true);
        setIndicator(true);
        let response = await DistrictCodeServices(portalCode);
        if (response.ok) {
          try {
            let distData = await response.json();
            AsyncStorage.setItem('@distCode', portalCode);
            setIndicator(false);
            setBtnDisabled(false);
            navigation.navigate('Login', {
              data: distData,
            });
            
          } catch {
            Alert.alert(
              'Invalid District Code',
              'Please check that you have entered a valid district code and that you are connected to the network.'
            );
            setIndicator(false);
            setBtnDisabled(false);
          }
        }else {
          setIndicator(false);
          setBtnDisabled(false);
          Alert.alert('Unable to Retrieve District Data',`Status Code: ${response.status}`)          
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
      <StatusBar animated={true} Color='#ffffff' backgroundColor='#082754' />
      <View style={themes.containerPadding}>
        <KeyboardAwareScrollView>
          <View style={themes.txtview}>
            <Text style={themes.txth1}>Realtime</Text>
            <Text style={themes.txth2}>Link for Parents</Text>
          </View>
          <View style={themes.image}>
            <Image source={require('../assets/districtcodeimg.png')}></Image>
          </View>
          {/* bottom box starts here */}
          <View style={themes.viewBox}>
            <Text style={themes.txth3}>Enter School District Code</Text>
            <View style={themes.codeField}>
              <CodeField
                ref={ref}
                {...props}
                value={portalCode}
                onChangeText={(portalcode) => {
                  setPortalCode(portalcode);
                }}
                cellCount={CELL_COUNT}
                keyboardType='number-pad'
                textContentType='oneTimeCode'
                renderCell={({ index, symbol, isFocused }) => (
                  <View
                    key={index}
                    style={[themes.cellroot, isFocused && themes.focusCellroot]}
                  >
                    <Text
                      key={index}
                      style={themes.cell}
                      onLayout={getCellOnLayoutHandler(index)}
                    >
                      {symbol || (isFocused ? <Cursor /> : null)}
                    </Text>
                  </View>
                )}
              />
            </View>
            {/* buttons for enter dist and search dist */}
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={isDisabled}
              style={themes.btn}
              onPress={() => getDistrciCode()}
            >
              <Text style={themes.btnText}>Enter District</Text>
            </TouchableOpacity>
            <Text style={themes.txtQuestian}>
              Don't know your district code?
            </Text>

            {/* button navigate to search dist screen */}
            <TouchableOpacity
              activeOpacity={0.3}
              style={themes.btnBorder}
              onPress={() => navigation.navigate('SearchDistrict')}
            >
              <Text style={themes.btntxtSearch}>Search District Name</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};
export default DistrictCode;
